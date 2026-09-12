import { Activity, ArrowLeft, Cpu } from "lucide-react"
import { AnimatePresence, LayoutGroup, useReducedMotion } from "motion/react"
import { Progress } from "@/components/ui/progress"
import { getProcessColor } from "../lib/process-identity"
import type { ProcessInput, SimulationEvent } from "../types"
import { ProcessToken } from "./process-token"

type SchedulerStageProps = {
  processes: ProcessInput[]
  event: SimulationEvent | null
  highlightedProcess: string | null
  selectedProcess: string | null
  progressTarget: number
  onFocus: (id: string | null) => void
  onSelect: (id: string) => void
}

export function SchedulerStage({ processes, event, highlightedProcess, selectedProcess, progressTarget, onFocus, onSelect }: SchedulerStageProps) {
  const reduceMotion = Boolean(useReducedMotion())
  const processMap = new Map(processes.map((process) => [process.id, process]))
  const cpuProcess = event?.state.cpu ? processMap.get(event.state.cpu) : null
  const running = event?.state.running ?? null
  const isIdleInterval = event?.type === "idle_start"

  return (
    <LayoutGroup id="scheduler-flow">
      <div className="scheduler-stage" data-running={Boolean(cpuProcess)} data-idle={isIdleInterval}>
        <section className="queue-lane" aria-labelledby="queue-heading">
          <div className="lane-label">
            <span id="queue-heading">قائمة الانتظار الجاهزة</span>
            <small><b dir="ltr">{event?.state.readyQueue.length ?? 0}</b> في الانتظار</small>
          </div>
          <div className="queue-slots">
            <AnimatePresence initial={false}>
              {(event?.state.readyQueue ?? []).map((id) => {
                const process = processMap.get(id)
                return process ? (
                  <ProcessToken
                    key={id}
                    process={process}
                    color={getProcessColor(id)}
                    location="قائمة الجاهزين"
                    active={highlightedProcess === id}
                    selected={selectedProcess === id}
                    reduceMotion={reduceMotion}
                    onFocus={onFocus}
                    onSelect={onSelect}
                  />
                ) : null
              })}
            </AnimatePresence>
            {(event?.state.readyQueue.length ?? 0) === 0 && <span className="empty-queue">لا توجد عملية تنتظر التنفيذ</span>}
          </div>
        </section>

        <div className="dispatch-bus" data-active={event?.type === "dispatch"} aria-hidden="true">
          <span className="dispatch-line"><i /></span>
          <ArrowLeft />
          <small>إرسال</small>
        </div>

        <section className="cpu-chamber" data-state={cpuProcess ? "running" : isIdleInterval ? "idle" : "standby"} aria-labelledby="core-heading">
          <div className="cpu-chamber__header">
            <span id="core-heading"><Activity />نواة المعالج <b dir="ltr">0</b></span>
            <small>{cpuProcess ? "قيد التنفيذ" : isIdleInterval ? "خمول" : "استعداد"}</small>
          </div>
          <div className="cpu-core">
            <div className="core-rings" aria-hidden="true"><i /><i /><i /></div>
            <div className="runtime-scan" aria-hidden="true" />
            <AnimatePresence initial={false}>
              {cpuProcess ? (
                <ProcessToken
                  key={cpuProcess.id}
                  process={cpuProcess}
                  color={getProcessColor(cpuProcess.id)}
                  location="نواة المعالج"
                  active={highlightedProcess === cpuProcess.id}
                  selected={selectedProcess === cpuProcess.id}
                  reduceMotion={reduceMotion}
                  remaining={running?.remaining}
                  onFocus={onFocus}
                  onSelect={onSelect}
                />
              ) : (
                <div className="idle-glyph" key="idle">
                  <Cpu />
                  <span>{isIdleInterval ? "CPU IDLE" : "READY"}</span>
                </div>
              )}
            </AnimatePresence>
          </div>
          <Progress className="execution-progress" dir="ltr" value={progressTarget} aria-label="تقدم تنفيذ العملية الحالية" />
          <div className="cpu-facts" dir="ltr">
            <span>EXEC <b>{running?.executed ?? 0}t</b></span>
            <span>REM <b>{running?.remaining ?? 0}t</b></span>
            <span>Q <b>{event?.state.readyQueue.length ?? 0}</b></span>
          </div>
        </section>
      </div>
    </LayoutGroup>
  )
}
