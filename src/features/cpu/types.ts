export type Algorithm = "FCFS" | "SJF" | "SRTF" | "RR"

export type ProcessInput = {
  id: string
  arrival: number
  burst: number
}

export type ProcessResult = ProcessInput & {
  finish: number
  turnaround: number
  waiting: number
}

export type ScheduleSegment = {
  kind: "run" | "idle"
  processId: string | null
  start: number
  end: number
}

/** Direct facts returned by Python. No playback/UI state belongs here. */
export type AlgorithmResult = {
  algorithm: "FCFS"
  processes: ProcessResult[]
  metrics: {
    averageWaiting: number
    averageTurnaround: number
    cpuIdleTime: number
    totalTime: number
  }
  schedule: ScheduleSegment[]
}

export type RunningState = {
  processId: string
  executed: number
  remaining: number
  burst: number
}

export type SimulationState = {
  cpu: string | null
  readyQueue: string[]
  completed: string[]
  running: RunningState | null
}

/** Frontend-only playback events derived from Python's already-decided schedule. */
export type SimulationEventType =
  | "simulation_start"
  | "arrival"
  | "idle_start"
  | "idle_end"
  | "dispatch"
  | "complete"
  | "simulation_complete"

export type SimulationEvent = {
  sequence: number
  type: SimulationEventType
  time: number
  state: SimulationState
  processId?: string
  burst?: number
  until?: number
  reason?: "python_schedule"
  finish?: number
  turnaround?: number
  waiting?: number
  processCount?: number
}

/** Frontend view model: direct Python facts plus frontend-derived playback events. */
export type SimulationResult = AlgorithmResult & {
  events: SimulationEvent[]
}

export type SimulationError = {
  code: string
  message: string
  details?: Array<{ path: string; message: string }>
}

export type SimulationResponse =
  | { ok: true; result: AlgorithmResult }
  | { ok: false; error: SimulationError }
