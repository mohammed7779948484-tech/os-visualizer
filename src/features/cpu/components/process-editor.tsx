import { Plus, Trash2 } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getProcessColor } from "../lib/process-identity"
import type { ProcessInput } from "../types"

type ProcessEditorProps = {
  processes: ProcessInput[]
  onChange: (index: number, field: "arrival" | "burst", value: number) => void
  onAdd: () => void
  onRemove: (id: string) => void
}

export function ProcessEditor({ processes, onChange, onAdd, onRemove }: ProcessEditorProps) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="process-editor">
      <div className="editor-labels">
        <span>العملية</span><span dir="ltr">AT</span><span dir="ltr">BT</span><span />
      </div>
      <AnimatePresence initial={false}>
        {processes.map((process, index) => (
          <motion.div
            layout={!reduceMotion}
            key={process.id}
            className="process-row"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(-8px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(-8px)" }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="process-name" dir="ltr" style={{ "--process-color": getProcessColor(process.id) } as React.CSSProperties}>
              <span />{process.id}
            </div>
            <label>
              <span className="sr-only">زمن وصول {process.id}</span>
              <Input dir="ltr" inputMode="numeric" type="number" min="0" step="1" value={process.arrival} aria-invalid={process.arrival < 0} onFocus={(event) => event.currentTarget.select()} onChange={(event) => onChange(index, "arrival", Number(event.target.value))} />
            </label>
            <label>
              <span className="sr-only">زمن تنفيذ {process.id}</span>
              <Input dir="ltr" inputMode="numeric" type="number" min="1" step="1" value={process.burst} aria-invalid={process.burst <= 0} onFocus={(event) => event.currentTarget.select()} onChange={(event) => onChange(index, "burst", Number(event.target.value))} />
            </label>
            <Button variant="ghost" size="icon" aria-label={`حذف ${process.id}`} disabled={processes.length === 1} onClick={() => onRemove(process.id)}><Trash2 /></Button>
          </motion.div>
        ))}
      </AnimatePresence>
      <Button variant="outline" className="add-process" disabled={processes.length >= 6} onClick={onAdd}><Plus data-icon="inline-start" />إضافة عملية</Button>
    </div>
  )
}
