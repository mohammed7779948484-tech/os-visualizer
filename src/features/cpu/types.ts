export type Algorithm = "FCFS" | "SJF" | "SRTF" | "RR"

export type ProcessId = "P1" | "P2" | "P3" | "P4"

export type ProcessInput = {
  id: ProcessId
  arrival: number
  burst: number
  color: string
}

export type ProcessResult = ProcessInput & {
  finish: number
  turnaround: number
  waiting: number
}

export type TimelineSegment = {
  id: string
  processId: ProcessId | "IDLE"
  start: number
  end: number
}

export type DemoFrame = {
  clock: number
  kind: "idle" | "arrival" | "dispatch" | "execute" | "preempt" | "complete"
  title: string
  detail: string
  cpu: ProcessId | null
  queue: ProcessId[]
  progress: number
  visibleSegments: number
  metrics: {
    averageWaiting: number
    averageTurnaround: number
    idle: number
  }
}
