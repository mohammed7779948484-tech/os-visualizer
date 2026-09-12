import type {
  AlgorithmResult,
  ScheduleSegment,
  SimulationEvent,
  SimulationEventType,
  SimulationState,
} from "../types"

type EventSeed = Omit<SimulationEvent, "sequence" | "state"> & { order: number }

const priority: Record<SimulationEventType, number> = {
  simulation_start: 0,
  complete: 10,
  arrival: 20,
  idle_end: 30,
  idle_start: 40,
  dispatch: 50,
  simulation_complete: 100,
}

function runningState(segment: ScheduleSegment | null, time: number) {
  if (!segment || segment.kind !== "run" || !segment.processId) return null
  const burst = segment.end - segment.start
  return {
    processId: segment.processId,
    executed: Math.max(0, Math.min(burst, time - segment.start)),
    remaining: Math.max(0, segment.end - time),
    burst,
  }
}

/**
 * Build presentation events from direct Python scheduling facts.
 *
 * This function never chooses the next process. Dispatch targets and run
 * intervals come exclusively from Python's schedule; TypeScript only turns
 * those facts into a state sequence that the UI can animate.
 */
export function buildPlaybackEvents(result: AlgorithmResult): SimulationEvent[] {
  const seeds: EventSeed[] = []
  const processById = new Map(result.processes.map((process) => [process.id, process]))
  let order = 0

  const addSeed = (seed: Omit<EventSeed, "order">) => {
    seeds.push({ ...seed, order: order++ })
  }

  addSeed({ type: "simulation_start", time: 0 })

  for (const process of result.processes) {
    addSeed({
      type: "arrival",
      time: process.arrival,
      processId: process.id,
      burst: process.burst,
    })
  }

  for (const segment of result.schedule) {
    if (segment.kind === "idle") {
      addSeed({ type: "idle_start", time: segment.start, until: segment.end })
      addSeed({ type: "idle_end", time: segment.end })
      continue
    }

    if (!segment.processId) continue
    const process = processById.get(segment.processId)
    addSeed({
      type: "dispatch",
      time: segment.start,
      processId: segment.processId,
      reason: "python_schedule",
    })
    addSeed({
      type: "complete",
      time: segment.end,
      processId: segment.processId,
      finish: process?.finish,
      turnaround: process?.turnaround,
      waiting: process?.waiting,
    })
  }

  addSeed({
    type: "simulation_complete",
    time: result.metrics.totalTime,
    processCount: result.processes.length,
  })

  seeds.sort((left, right) =>
    left.time - right.time
    || priority[left.type] - priority[right.type]
    || left.order - right.order,
  )

  const readyQueue: string[] = []
  const completed: string[] = []
  let cpu: string | null = null
  let activeSegment: ScheduleSegment | null = null

  const snapshot = (time: number): SimulationState => ({
    cpu,
    readyQueue: [...readyQueue],
    completed: [...completed],
    running: runningState(activeSegment, time),
  })

  return seeds.map((seed, sequence) => {
    switch (seed.type) {
      case "arrival": {
        const id = seed.processId
        if (id && id !== cpu && !completed.includes(id) && !readyQueue.includes(id)) {
          readyQueue.push(id)
        }
        break
      }
      case "complete": {
        const id = seed.processId
        if (id && !completed.includes(id)) completed.push(id)
        if (cpu === id) {
          cpu = null
          activeSegment = null
        }
        break
      }
      case "idle_start":
        cpu = null
        activeSegment = null
        break
      case "dispatch": {
        const id = seed.processId
        if (id) {
          const queueIndex = readyQueue.indexOf(id)
          if (queueIndex >= 0) readyQueue.splice(queueIndex, 1)
          cpu = id
          activeSegment = result.schedule.find((segment) =>
            segment.kind === "run"
            && segment.processId === id
            && segment.start === seed.time,
          ) ?? null
        }
        break
      }
      case "simulation_complete":
        cpu = null
        activeSegment = null
        break
      case "simulation_start":
      case "idle_end":
        break
    }

    const { order: _order, ...facts } = seed
    return {
      ...facts,
      sequence,
      state: snapshot(seed.time),
    }
  })
}
