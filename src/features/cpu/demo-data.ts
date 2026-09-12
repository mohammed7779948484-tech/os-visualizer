import type { DemoFrame, ProcessInput, ProcessResult, TimelineSegment } from "./types"

export const initialProcesses: ProcessInput[] = [
  { id: "P1", arrival: 0, burst: 7, color: "var(--process-1)" },
  { id: "P2", arrival: 2, burst: 6, color: "var(--process-2)" },
  { id: "P3", arrival: 4, burst: 2, color: "var(--process-3)" },
  { id: "P4", arrival: 7, burst: 3, color: "var(--process-4)" },
]

export const demoFrames: DemoFrame[] = [
  { clock: 0, kind: "idle", title: "Scheduler armed", detail: "The trace is reset and waiting for the first admission event.", cpu: null, queue: [], progress: 0, visibleSegments: 0, metrics: { averageWaiting: 0, averageTurnaround: 0, idle: 0 } },
  { clock: 0, kind: "arrival", title: "P1 admitted", detail: "P1 arrives with 7 ticks of burst time and enters READY.", cpu: null, queue: ["P1"], progress: 0, visibleSegments: 0, metrics: { averageWaiting: 0, averageTurnaround: 0, idle: 0 } },
  { clock: 0, kind: "dispatch", title: "P1 dispatched", detail: "The dispatcher moves P1 into the CPU execution register.", cpu: "P1", queue: [], progress: 0, visibleSegments: 1, metrics: { averageWaiting: 0, averageTurnaround: 0, idle: 0 } },
  { clock: 1, kind: "execute", title: "P1 executes", detail: "One of P1's 7 required ticks has elapsed.", cpu: "P1", queue: [], progress: 14, visibleSegments: 1, metrics: { averageWaiting: 0, averageTurnaround: 0.3, idle: 0 } },
  { clock: 2, kind: "arrival", title: "P2 joins the queue", detail: "P1 has 5 ticks remaining, so P2 waits with its longer burst of 6.", cpu: "P1", queue: ["P2"], progress: 29, visibleSegments: 1, metrics: { averageWaiting: 0.3, averageTurnaround: 0.8, idle: 0 } },
  { clock: 4, kind: "arrival", title: "P3 raises an interrupt", detail: "P3 arrives with 2 ticks while P1 has 3 remaining. Comparison begins.", cpu: "P1", queue: ["P3", "P2"], progress: 57, visibleSegments: 1, metrics: { averageWaiting: 0.8, averageTurnaround: 1.4, idle: 0 } },
  { clock: 4, kind: "preempt", title: "P1 preempted", detail: "P3 has the shortest remaining time. P1 returns to READY with 3 ticks.", cpu: null, queue: ["P3", "P1", "P2"], progress: 0, visibleSegments: 1, metrics: { averageWaiting: 1.1, averageTurnaround: 1.9, idle: 0 } },
  { clock: 4, kind: "dispatch", title: "P3 takes the core", detail: "Context switch complete. P3 enters RUNNING ahead of P1 and P2.", cpu: "P3", queue: ["P1", "P2"], progress: 0, visibleSegments: 2, metrics: { averageWaiting: 1.1, averageTurnaround: 1.9, idle: 0 } },
  { clock: 5, kind: "execute", title: "P3 executes", detail: "P3 completes the first half of its 2-tick burst.", cpu: "P3", queue: ["P1", "P2"], progress: 50, visibleSegments: 2, metrics: { averageWaiting: 1.3, averageTurnaround: 2.2, idle: 0 } },
  { clock: 6, kind: "complete", title: "P3 completes", detail: "P3 exits at t=6. Turnaround 2, waiting 0.", cpu: null, queue: ["P1", "P2"], progress: 100, visibleSegments: 2, metrics: { averageWaiting: 1.3, averageTurnaround: 2.7, idle: 0 } },
  { clock: 6, kind: "dispatch", title: "P1 resumes", detail: "P1 is restored from READY with 3 ticks remaining.", cpu: "P1", queue: ["P2"], progress: 57, visibleSegments: 3, metrics: { averageWaiting: 1.5, averageTurnaround: 3.1, idle: 0 } },
  { clock: 7, kind: "arrival", title: "P4 joins the queue", detail: "P1 has 2 ticks remaining, so the new 3-tick process waits.", cpu: "P1", queue: ["P4", "P2"], progress: 71, visibleSegments: 3, metrics: { averageWaiting: 1.8, averageTurnaround: 3.5, idle: 0 } },
  { clock: 9, kind: "complete", title: "P1 completes", detail: "P1 exits at t=9. P4 now has the shortest remaining time.", cpu: null, queue: ["P4", "P2"], progress: 100, visibleSegments: 3, metrics: { averageWaiting: 2.2, averageTurnaround: 4.3, idle: 0 } },
  { clock: 9, kind: "dispatch", title: "P4 takes the core", detail: "P4 leaves READY for its uninterrupted 3-tick burst.", cpu: "P4", queue: ["P2"], progress: 0, visibleSegments: 4, metrics: { averageWaiting: 2.5, averageTurnaround: 5.1, idle: 0 } },
  { clock: 12, kind: "complete", title: "P4 completes", detail: "P4 exits at t=12. P2 is the only remaining process.", cpu: null, queue: ["P2"], progress: 100, visibleSegments: 4, metrics: { averageWaiting: 2.8, averageTurnaround: 6.2, idle: 0 } },
  { clock: 12, kind: "dispatch", title: "P2 takes the core", detail: "P2 enters RUNNING and consumes its final 6-tick burst.", cpu: "P2", queue: [], progress: 0, visibleSegments: 5, metrics: { averageWaiting: 3.1, averageTurnaround: 7.1, idle: 0 } },
  { clock: 18, kind: "complete", title: "Trace resolved", detail: "P1 finishes at 9, P4 at 12, and P2 at 18. All processes complete.", cpu: null, queue: [], progress: 100, visibleSegments: 5, metrics: { averageWaiting: 3.5, averageTurnaround: 8, idle: 0 } },
]

export const timeline: TimelineSegment[] = [
  { id: "p1-a", processId: "P1", start: 0, end: 4 },
  { id: "p3", processId: "P3", start: 4, end: 6 },
  { id: "p1-b", processId: "P1", start: 6, end: 9 },
  { id: "p4", processId: "P4", start: 9, end: 12 },
  { id: "p2", processId: "P2", start: 12, end: 18 },
]

export const results: ProcessResult[] = [
  { ...initialProcesses[0], finish: 9, turnaround: 9, waiting: 2 },
  { ...initialProcesses[1], finish: 18, turnaround: 16, waiting: 10 },
  { ...initialProcesses[2], finish: 6, turnaround: 2, waiting: 0 },
  { ...initialProcesses[3], finish: 12, turnaround: 5, waiting: 2 },
]
