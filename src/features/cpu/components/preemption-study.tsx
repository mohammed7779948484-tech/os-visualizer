import { useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ArrowLeft, BookOpenCheck, Play, RotateCcw } from "lucide-react"
import { useReducedMotion } from "motion/react"
import { Button } from "@/components/ui/button"

gsap.registerPlugin(useGSAP)

export function PreemptionStudy() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [runId, setRunId] = useState(0)
  const reduceMotion = Boolean(useReducedMotion())

  useGSAP(() => {
    if (runId === 0) return
    const targets = gsap.utils.selector(rootRef)
    const incoming = targets(".preemption-new")
    const operator = targets(".preemption-operator")
    const decision = targets(".preemption-decision")
    const outgoing = targets(".preemption-outgoing")
    const handoff = targets(".preemption-handoff")

    gsap.set([incoming, operator, decision, handoff], { autoAlpha: 0 })
    gsap.set(outgoing, { x: -46, autoAlpha: 0 })

    if (reduceMotion) {
      gsap.set([incoming, operator, decision, handoff], { autoAlpha: 1 })
      gsap.set(outgoing, { x: 0, autoAlpha: 1 })
      return
    }

    const timeline = gsap.timeline({ defaults: { ease: "power3.out" } })
    timeline
      .fromTo(incoming, { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 0.22 })
      .fromTo(operator, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.18 }, ">-0.04")
      .fromTo(decision, { autoAlpha: 0, scaleX: 0.72 }, { autoAlpha: 1, scaleX: 1, duration: 0.2 }, ">-0.02")
      .fromTo(outgoing, { x: -46, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.28, ease: "power3.inOut" }, "+=0.16")
      .fromTo(handoff, { autoAlpha: 0, x: -46 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: "power3.inOut" }, "<0.08")
  }, { dependencies: [runId, reduceMotion], scope: rootRef, revertOnUpdate: true })

  return (
    <section className="preemption-study" ref={rootRef} aria-labelledby="preemption-heading">
      <div className="preemption-heading">
        <div><span>مشهد تعليمي مسجّل</span><h2 id="preemption-heading">لحظة الاستباق في <b dir="ltr">SRTF</b></h2></div>
        <Button variant="outline" onClick={() => setRunId((current) => current + 1)}>{runId ? <RotateCcw /> : <Play />}تشغيل التسلسل</Button>
      </div>
      <p className="preemption-intro">هذا العرض يشرح القرار بصريًا فقط؛ خوارزمية SRTF ليست موصولة ببايثون بعد.</p>

      <div className="preemption-comparison" dir="ltr">
        <div className="comparison-process current">
          <small>CURRENT</small><strong>P1</strong><span>Remaining <b>3t</b></span>
        </div>
        <div className="preemption-operator"><b>2 &lt; 3</b><span>أقصر</span></div>
        <div className="comparison-process candidate preemption-new">
          <small>ARRIVED</small><strong>P3</strong><span>Remaining <b>2t</b></span>
        </div>
      </div>

      <div className="preemption-decision" role="status">
        <span>قرار المجدول</span><strong dir="ltr">PREEMPT</strong><small>إيقاف P1 مؤقتًا وإرسال P3</small>
      </div>

      <div className="preemption-transfer" dir="rtl">
        <div className="transfer-target"><span>READY QUEUE</span><b className="preemption-outgoing">P1 · 3t</b></div>
        <div className="transfer-path"><ArrowLeft /><small>ownership</small></div>
        <div className="transfer-target core"><span>CPU CORE</span><b className="preemption-handoff">P3 · 2t</b></div>
      </div>
      <div className="study-footnote"><BookOpenCheck />المقارنة ثم القرار ثم انتقال الملكية؛ لا توجد قيم عتادية مصطنعة.</div>
    </section>
  )
}
