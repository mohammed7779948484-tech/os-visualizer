import { getProcessColor } from "../lib/process-identity"
import type { SimulationResult } from "../types"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type ProcessResultsProps = {
  result: SimulationResult | null
  completed: string[]
  highlightedProcess: string | null
  onFocus: (id: string | null) => void
}

export function ProcessResults({ result, completed, highlightedProcess, onFocus }: ProcessResultsProps) {
  if (!result) return null

  return (
    <section className="results-panel surface" aria-labelledby="results-heading">
      <div className="surface-heading">
        <div><span>مخرجات بايثون</span><h2 id="results-heading">دفتر نتائج العمليات</h2></div>
        <p>القيم التالية محسوبة في <code>python/cpu/fcfs.py</code></p>
      </div>
      <Table aria-labelledby="results-heading" dir="rtl">
        <TableCaption className="sr-only">نتائج جدولة FCFS المحسوبة بواسطة بايثون.</TableCaption>
        <TableHeader><TableRow><TableHead>العملية</TableHead><TableHead dir="ltr">AT</TableHead><TableHead dir="ltr">BT</TableHead><TableHead dir="ltr">FT</TableHead><TableHead dir="ltr">TAT</TableHead><TableHead dir="ltr">WT</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
        <TableBody>
          {result.processes.map((process) => {
            const isComplete = completed.includes(process.id)
            return (
              <TableRow key={process.id} data-highlighted={highlightedProcess === process.id} onMouseEnter={() => onFocus(process.id)} onMouseLeave={() => onFocus(null)}>
                <TableCell><span className="table-process" dir="ltr" style={{ "--process-color": getProcessColor(process.id) } as React.CSSProperties}><i />{process.id}</span></TableCell>
                <TableCell dir="ltr">{process.arrival}</TableCell><TableCell dir="ltr">{process.burst}</TableCell><TableCell dir="ltr">{process.finish}</TableCell><TableCell dir="ltr">{process.turnaround}</TableCell><TableCell dir="ltr">{process.waiting}</TableCell>
                <TableCell><span className="status-complete" data-complete={isComplete}>{isComplete ? "مكتملة" : "مجدولة"}</span></TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </section>
  )
}
