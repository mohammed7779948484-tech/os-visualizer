import type { Algorithm, ProcessInput, SimulationEventType, SimulationResult } from "../types"

const eventTypes = new Set<SimulationEventType>([
  "simulation_start", "arrival", "idle_start", "idle_end", "dispatch", "execute", "complete", "simulation_complete",
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function isSimulationResult(value: unknown): value is SimulationResult {
  if (!isRecord(value) || value.algorithm !== "FCFS" || !Array.isArray(value.processes) || !Array.isArray(value.timeline) || !Array.isArray(value.events) || !isRecord(value.metrics)) return false
  const metrics = value.metrics
  if (!["averageWaiting", "averageTurnaround", "cpuIdleTime", "totalTime"].every((key) => isFiniteNumber(metrics[key]))) return false

  const processesAreValid = value.processes.every((process) =>
    isRecord(process)
    && typeof process.id === "string"
    && ["arrival", "burst", "finish", "turnaround", "waiting"].every((key) => isFiniteNumber(process[key])),
  )
  const timelineIsValid = value.timeline.every((segment) =>
    isRecord(segment)
    && (segment.kind === "run" || segment.kind === "idle")
    && (typeof segment.processId === "string" || segment.processId === null)
    && isFiniteNumber(segment.start)
    && isFiniteNumber(segment.end),
  )
  const eventsAreValid = value.events.every((event) => {
    if (!isRecord(event) || typeof event.type !== "string" || !eventTypes.has(event.type as SimulationEventType) || !isFiniteNumber(event.sequence) || !isFiniteNumber(event.time) || !isRecord(event.state)) return false
    const state = event.state
    const running = state.running
    return (typeof state.cpu === "string" || state.cpu === null)
      && Array.isArray(state.readyQueue) && state.readyQueue.every((id) => typeof id === "string")
      && Array.isArray(state.completed) && state.completed.every((id) => typeof id === "string")
      && (running === null || (
        isRecord(running)
        && typeof running.processId === "string"
        && ["executed", "remaining", "burst"].every((key) => isFiniteNumber(running[key]))
      ))
  })
  return processesAreValid && timelineIsValid && eventsAreValid
}

export class SimulationRequestError extends Error {
  code: string
  details?: Array<{ path: string; message: string }>

  constructor(code: string, message: string, details?: Array<{ path: string; message: string }>) {
    super(message)
    this.name = "SimulationRequestError"
    this.code = code
    this.details = details
  }
}

export async function requestSimulation(algorithm: Algorithm, processes: ProcessInput[], signal?: AbortSignal): Promise<SimulationResult> {
  let response: Response
  try {
    response = await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        algorithm,
        processes: processes.map(({ id, arrival, burst }) => ({ id, arrival, burst })),
      }),
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new SimulationRequestError(
      "BRIDGE_UNAVAILABLE",
      "تعذر الوصول إلى جسر بايثون المحلي. شغّل التطبيق عبر pnpm dev.",
    )
  }

  let payload: unknown
  try {
    payload = await response.json() as unknown
  } catch {
    throw new SimulationRequestError("INVALID_RESPONSE", "أعاد جسر بايثون استجابة غير صالحة.")
  }

  if (!isRecord(payload)) {
    throw new SimulationRequestError("INVALID_RESPONSE", "أعاد جسر بايثون عقد JSON غير صالح.")
  }
  if (payload.ok === false && isRecord(payload.error) && typeof payload.error.code === "string" && typeof payload.error.message === "string") {
    const details = Array.isArray(payload.error.details)
      ? payload.error.details.filter((detail): detail is { path: string; message: string } => isRecord(detail) && typeof detail.path === "string" && typeof detail.message === "string")
      : undefined
    throw new SimulationRequestError(payload.error.code, payload.error.message, details)
  }
  if (payload.ok === true && isSimulationResult(payload.result)) return payload.result
  throw new SimulationRequestError("INVALID_RESPONSE", "أعاد جسر بايثون عقد محاكاة غير مكتمل.")
}
