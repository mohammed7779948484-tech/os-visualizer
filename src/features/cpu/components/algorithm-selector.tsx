import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Algorithm } from "../types"

const algorithms: Algorithm[] = ["FCFS", "SJF", "SRTF", "RR"]
const descriptions: Record<Algorithm, string> = {
  FCFS: "الأسبق وصولًا يُنفذ أولًا، دون استباق.",
  SJF: "أقصر زمن تنفيذ أولًا، قيد الربط ببايثون.",
  SRTF: "أقصر زمن متبقٍ مع الاستباق، مشهد تعليمي متاح.",
  RR: "قائمة دورية بزمن كمي ثابت، قيد الربط ببايثون.",
}

export function AlgorithmSelector({ value, onChange }: { value: Algorithm; onChange: (value: Algorithm) => void }) {
  return (
    <div className="field-group">
      <div className="field-label-row">
        <label id="algorithm-label">سياسة الجدولة</label>
        <span className="source-chip" data-live={value === "FCFS"}>{value === "FCFS" ? "Python · فعلي" : "غير متصل"}</span>
      </div>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(next) => next && onChange(next as Algorithm)}
        aria-labelledby="algorithm-label"
        className="algorithm-tabs"
        dir="ltr"
        spacing={0}
      >
        {algorithms.map((algorithm) => (
          <ToggleGroupItem key={algorithm} value={algorithm} aria-label={algorithm}>{algorithm}</ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p className="field-note">{descriptions[value]}</p>
    </div>
  )
}
