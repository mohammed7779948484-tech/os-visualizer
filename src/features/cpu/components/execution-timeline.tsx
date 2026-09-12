import { CircleGauge } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { getProcessColor } from "../lib/process-identity"
import type { SimulationEvent, TimelineSegment } from "../types"

type ExecutionTimelineProps = {
  timeline: TimelineSegment[]
  event: SimulationEvent | null
  highlightedProcess: string | null
  selectedProcess: string | null
  isPlaying: boolean
  isComplete: boolean
  onFocus: (id: string | null) => void
  onSelect: (id: string) => void
}

export function ExecutionTimeline(props: ExecutionTimelineProps) {
  const reduceMotion = useReducedMotion()
  const totalTime = props.timeline.at(-1)?.end ?? 0
  const clock = props.event?.time ?? 0
  const startsNow = props.event?.type === "dispatch" || props.event?.type === "idle_start"

  return (
    <section className="timeline-panel" aria-labelledby="timeline-heading">
      <div className="panel-title">
        <div><CircleGauge /><span><strong id="timeline-heading">الخط الزمني للتنفيذ</strong><small dir="ltr">GANTT / {totalTime}t</small></span></div>
        <span className="live-label" data-live={props.isPlaying}><i />{props.isPlaying ? "بث حي" : props.isComplete ? "مكتمل" : "متوقف"}</span>
      </div>
      {props.timeline.length > 0 ? (
        <>
          <div className="gantt" dir="ltr" aria-label="مخطط جانت لتنفيذ العمليات وفترات الخمول">
            {props.timeline.map((segment, index) => {
              const visible = segment.start < clock || (segment.start === clock && startsNow)
              const processId = segment.processId
              const isIdle = segment.kind === "idle"
              const active = processId
                ? props.highlightedProcess === processId || props.event?.state.cpu === processId
                : props.event?.type === "idle_start" && segment.start === clock
              const color = processId ? getProcessColor(processId) : "var(--idle)"
              return (
                <motion.button
                  type="button"
                  key={`${segment.kind}-${segment.start}-${index}`}
                  className="gantt-segment"
                  data-active={active}
                  data-idle={isIdle}
                  disabled={isIdle || !visible}
                  tabIndex={visible && !isIdle ? 0 : -1}
                  aria-hidden={!visible}
                  style={{ flex: segment.end - segment.start, "--process-color": color } as React.CSSProperties}
                  initial={false}
                  animate={{ opacity: visible ? 1 : 0.1, transform: visible ? "scaleY(1)" : "scaleY(0.72)" }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
                  onMouseEnter={() => processId && props.onFocus(processId)}
                  onMouseLeave={() => props.onFocus(null)}
                  onFocus={() => processId && props.onFocus(processId)}
                  onBlur={() => props.onFocus(null)}
                  onClick={() => processId && props.onSelect(processId)}
                  aria-pressed={processId ? props.selectedProcess === processId : undefined}
                >
                  <span>{processId ?? "IDLE"}</span><small>{segment.start}→{segment.end}</small>
                </motion.button>
              )
            })}
          </div>
          <div className="time-ruler" dir="ltr"><span>0t</span><span>{Math.round(totalTime / 2)}t</span><span>{totalTime}t</span></div>
        </>
      ) : (
        <div className="timeline-empty">شغّل FCFS لبناء الخط الزمني من ناتج بايثون.</div>
      )}
    </section>
  )
}
