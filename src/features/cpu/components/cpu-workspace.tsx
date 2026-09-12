import { lazy, Suspense } from "react"
import NumberFlow from "@number-flow/react"
import { Binary, Cable, CircleOff } from "lucide-react"
import type { Algorithm, ProcessInput, SimulationEvent, SimulationResult } from "../types"
import { ExecutionTimeline } from "./execution-timeline"
import { MetricsStrip } from "./metrics-strip"
import { PlaybackControls } from "./playback-controls"
import { SchedulerStage } from "./scheduler-stage"

const PreemptionStudy = lazy(() => import("./preemption-study").then((module) => ({ default: module.PreemptionStudy })))

type CpuWorkspaceProps = {
  algorithm: Algorithm
  processes: ProcessInput[]
  result: SimulationResult | null
  event: SimulationEvent | null
  progressTarget: number
  isPlaying: boolean
  isComplete: boolean
  speed: number
  highlightedProcess: string | null
  selectedProcess: string | null
  onFocus: (id: string | null) => void
  onSelect: (id: string) => void
  onPlay: () => void
  onPause: () => void
  onStep: () => void
  onReset: () => void
  onSpeedChange: (speed: number) => void
}

export function CpuWorkspace(props: CpuWorkspaceProps) {
  if (props.algorithm === "SRTF") return <section className="execution surface"><Suspense fallback={<div className="study-loading">جارٍ تحميل المشهد التعليمي...</div>}><PreemptionStudy /></Suspense></section>

  if (props.algorithm !== "FCFS") {
    return (
      <section className="execution surface unsupported-mode">
        <CircleOff />
        <span>وحدة بايثون غير متاحة بعد</span>
        <h2 dir="ltr">{props.algorithm}</h2>
        <p>لن يحاكي المتصفح هذه الخوارزمية. ستُفعّل عند إضافة ملف بايثون واختباره.</p>
      </section>
    )
  }

  return (
    <section className="execution surface" aria-label="مساحة تنفيذ المعالج">
      <div className="execution-topline">
        <div>
          <span>مستوى التنفيذ</span>
          <strong>الساعة <b dir="ltr"><NumberFlow value={props.event?.time ?? 0} />t</b></strong>
        </div>
        <div className="execution-source"><Cable /><span>المصدر</span><b dir="ltr">python/cpu/fcfs.py</b></div>
        <PlaybackControls canPlay={Boolean(props.result)} isPlaying={props.isPlaying} speed={props.speed} onPlay={props.onPlay} onPause={props.onPause} onStep={props.onStep} onReset={props.onReset} onSpeedChange={props.onSpeedChange} />
      </div>
      <SchedulerStage processes={props.processes} event={props.event} progressTarget={props.progressTarget} highlightedProcess={props.highlightedProcess} selectedProcess={props.selectedProcess} onFocus={props.onFocus} onSelect={props.onSelect} />
      <ExecutionTimeline schedule={props.result?.schedule ?? []} event={props.event} highlightedProcess={props.highlightedProcess} selectedProcess={props.selectedProcess} isPlaying={props.isPlaying} isComplete={props.isComplete} onFocus={props.onFocus} onSelect={props.onSelect} />
      <MetricsStrip result={props.result} />
      {!props.result && <div className="workspace-standby"><Binary /><span>أدخل العمليات ثم شغّل FCFS لبناء مسار التنفيذ.</span></div>}
    </section>
  )
}
