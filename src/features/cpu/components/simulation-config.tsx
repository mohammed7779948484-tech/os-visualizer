import { LoaderCircle, ShieldCheck, Sparkles, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AlgorithmSelector } from "./algorithm-selector"
import { ProcessEditor } from "./process-editor"
import type { Algorithm, ProcessInput, SimulationError } from "../types"

type SimulationConfigProps = {
  algorithm: Algorithm
  processes: ProcessInput[]
  isLoading: boolean
  error: SimulationError | null
  onAlgorithmChange: (algorithm: Algorithm) => void
  onProcessChange: (index: number, field: "arrival" | "burst", value: number) => void
  onAddProcess: () => void
  onRemoveProcess: (id: string) => void
  onRun: () => void
}

export function SimulationConfig(props: SimulationConfigProps) {
  const canRun = props.algorithm === "FCFS" && !props.isLoading

  return (
    <aside className="configuration surface" aria-labelledby="workload-heading">
      <div className="surface-heading">
        <div><span>مخزن الإدخال</span><h2 id="workload-heading">عبء العمل</h2></div>
        <span className="count-badge" dir="ltr">{props.processes.length}/6</span>
      </div>
      <AlgorithmSelector value={props.algorithm} onChange={props.onAlgorithmChange} />
      <ProcessEditor processes={props.processes} onChange={props.onProcessChange} onAdd={props.onAddProcess} onRemove={props.onRemoveProcess} />
      <Button className="run-button" size="lg" disabled={!canRun} onClick={props.onRun}>
        {props.isLoading ? <LoaderCircle className="loading-icon" data-icon="inline-start" /> : <Zap data-icon="inline-start" />}
        {props.isLoading ? "جارٍ تشغيل بايثون" : "تشغيل المحاكاة"}
      </Button>
      <div className="integration-note" data-ready={props.algorithm === "FCFS"}>
        {props.algorithm === "FCFS" ? <ShieldCheck /> : <Sparkles />}
        <span>{props.algorithm === "FCFS" ? "إدخال حقيقي ← بايثون ← أحداث تشغيل حقيقية" : "وضع غير منفذ؛ لن تُستخدم نتائج تجريبية على أنها حقيقية."}</span>
      </div>
      {props.error && (
        <div className="simulation-error" role="alert">
          <strong>تعذر تشغيل المحاكاة</strong>
          <span>{props.error.message}</span>
          <code dir="ltr">{props.error.code}</code>
        </div>
      )}
    </aside>
  )
}
