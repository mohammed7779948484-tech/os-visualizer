import NumberFlow from "@number-flow/react"
import { Activity, Clock3, Gauge, TimerReset } from "lucide-react"
import type { SimulationResult } from "../types"

const metricItems = [
  { key: "averageWaiting", label: "متوسط الانتظار", short: "AVG WT", icon: Clock3 },
  { key: "averageTurnaround", label: "متوسط الدوران", short: "AVG TAT", icon: Gauge },
  { key: "cpuIdleTime", label: "خمول المعالج", short: "IDLE", icon: Activity },
  { key: "totalTime", label: "الزمن الكلي", short: "TOTAL", icon: TimerReset },
] as const

export function MetricsStrip({ result }: { result: SimulationResult | null }) {
  return (
    <div className="metrics-row">
      {metricItems.map(({ key, label, short, icon: Icon }) => (
        <div className="metric" key={key}>
          <Icon aria-hidden="true" />
          <span>{label}<small dir="ltr">{short}</small></span>
          <strong dir="ltr">{result ? <><NumberFlow value={result.metrics[key]} format={{ maximumFractionDigits: 2 }} />t</> : "--"}</strong>
        </div>
      ))}
    </div>
  )
}
