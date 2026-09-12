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

export type TimelineSegment = {
  kind: "run" | "idle"
  processId: string | null
  start: number
  end: number
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

export type SimulationEventType =
  | "simulation_start"
  | "arrival"
  | "idle_start"
  | "idle_end"
  | "dispatch"
  | "execute"
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
  reason?: string
  finish?: number
  turnaround?: number
  waiting?: number
  executed?: number
  remaining?: number
  processCount?: number
}

export type SimulationResult = {
  algorithm: "FCFS"
  processes: ProcessResult[]
  metrics: {
    averageWaiting: number
    averageTurnaround: number
    cpuIdleTime: number
    totalTime: number
  }
  timeline: TimelineSegment[]
  events: SimulationEvent[]
}

export type SimulationError = {
  code: string
  message: string
  details?: Array<{ path: string; message: string }>
}

export type SimulationResponse =
  | { ok: true; result: SimulationResult }
  | { ok: false; error: SimulationError }
