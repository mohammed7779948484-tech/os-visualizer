import { motion, useReducedMotion } from "motion/react"
import { describeEvent } from "../lib/simulation-copy"
import type { SimulationEvent } from "../types"

export function SchedulerLog({ events, frameIndex, isPlaying }: { events: SimulationEvent[]; frameIndex: number; isPlaying: boolean }) {
  const reduceMotion = useReducedMotion()
  const visibleEvents = events.slice(0, frameIndex + 1).toReversed()

  return (
    <aside className="trace surface" aria-label="سجل أحداث المجدول">
      <div className="surface-heading">
        <div><span>الأحداث الدلالية</span><h2>سجل المجدول</h2></div>
        <span className="live-label" data-live={isPlaying}><i />{isPlaying ? "يسجّل" : "استعداد"}</span>
      </div>
      {visibleEvents[0] && <p className="sr-only" aria-live="polite">{describeEvent(visibleEvents[0]).title}: {describeEvent(visibleEvents[0]).detail}</p>}
      <div className="trace-list">
        {visibleEvents.length > 0 ? visibleEvents.map((event, index) => {
          const copy = describeEvent(event)
          return (
            <motion.article
              key={event.sequence}
              className="trace-entry"
              data-current={index === 0}
              data-type={event.type}
              initial={index === 0 && !reduceMotion ? { opacity: 0, transform: "translateY(-8px)" } : false}
              animate={{ opacity: index === 0 ? 1 : 0.58, transform: "translateY(0px)" }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            >
              <div><strong>{copy.title}</strong><p>{copy.detail}</p></div>
              <span className="trace-time" dir="ltr">t={String(event.time).padStart(2, "0")}</span>
            </motion.article>
          )
        }) : <div className="trace-empty">ستظهر قرارات بايثون هنا أثناء التشغيل.</div>}
      </div>
    </aside>
  )
}
