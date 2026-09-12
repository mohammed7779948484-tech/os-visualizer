import { motion } from "motion/react"
import type { ProcessInput } from "../types"

type ProcessTokenProps = {
  process: ProcessInput
  color: string
  location: string
  active: boolean
  selected: boolean
  reduceMotion: boolean
  remaining?: number
  onFocus: (id: string | null) => void
  onSelect: (id: string) => void
}

export function ProcessToken({ process, color, location, active, selected, reduceMotion, remaining, onFocus, onSelect }: ProcessTokenProps) {
  return (
    <motion.button
      layoutId={`process-${process.id}`}
      layout="position"
      type="button"
      className="process-token"
      data-active={active}
      style={{ "--process-color": color } as React.CSSProperties}
      aria-label={`${process.id}، ${location}، الوصول ${process.arrival}، التنفيذ ${process.burst}`}
      onMouseEnter={() => onFocus(process.id)}
      onMouseLeave={() => onFocus(null)}
      onFocus={() => onFocus(process.id)}
      onBlur={() => onFocus(null)}
      onClick={() => onSelect(process.id)}
      aria-pressed={selected}
      transition={reduceMotion ? { duration: 0 } : { type: "spring", visualDuration: 0.42, bounce: 0.12 }}
    >
      <span className="process-token__marker" />
      <span className="process-token__id" dir="ltr">{process.id}</span>
      <span className="process-token__meta" dir="ltr">{remaining === undefined ? `BT ${process.burst}` : `REM ${remaining}t`}</span>
    </motion.button>
  )
}
