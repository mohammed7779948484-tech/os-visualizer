import { useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import NumberFlow from "@number-flow/react"
import gsap from "gsap"
import {
  Activity,
  Braces,
  ChevronDown,
  CircleGauge,
  Clock3,
  Cpu,
  Gauge,
  MemoryStick,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SkipForward,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react"
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { demoFrames, initialProcesses, results, timeline } from "./demo-data"
import type { Algorithm, ProcessId, ProcessInput } from "./types"
import { useDemoPlayback } from "./use-demo-playback"

gsap.registerPlugin(useGSAP)

const processMap = Object.fromEntries(initialProcesses.map((process) => [process.id, process])) as Record<ProcessId, ProcessInput>
const algorithmNotes: Record<Algorithm, string> = {
  FCFS: "Arrival order, non-preemptive",
  SJF: "Shortest burst first",
  SRTF: "Shortest remaining time, preemptive",
  RR: "Rotating queue with fixed quantum",
}

function ProcessToken({ id, location, active, selected, reduceMotion, onFocus, onSelect }: { id: ProcessId; location: string; active: boolean; selected: boolean; reduceMotion: boolean; onFocus: (id: ProcessId | null) => void; onSelect: (id: ProcessId) => void }) {
  const process = processMap[id]
  return (
    <motion.button
      layoutId={`process-${id}`}
      layout
      type="button"
      className="process-token"
      data-active={active}
      style={{ "--process-color": process.color } as React.CSSProperties}
      aria-label={`${id}, ${location}, arrival ${process.arrival}, burst ${process.burst}`}
      onMouseEnter={() => onFocus(id)}
      onMouseLeave={() => onFocus(null)}
      onFocus={() => onFocus(id)}
      onBlur={() => onFocus(null)}
      onClick={() => onSelect(id)}
      aria-pressed={selected}
      transition={reduceMotion ? { duration: 0 } : { type: "spring", duration: 0.5, bounce: 0.15 }}
    >
      <span className="process-token__marker" />
      <span className="process-token__id">{id}</span>
      <span className="process-token__meta">BT {process.burst}</span>
    </motion.button>
  )
}

function Metric({ label, value, suffix, icon: Icon }: { label: string; value: number; suffix: string; icon: typeof Clock3 }) {
  return (
    <div className="metric">
      <Icon aria-hidden="true" />
      <span>{label}</span>
      <strong><NumberFlow value={value} format={{ maximumFractionDigits: 2 }} />{suffix}</strong>
    </div>
  )
}

export function CpuSchedulingPage() {
  const [algorithm, setAlgorithm] = useState<Algorithm>("SRTF")
  const [processes, setProcesses] = useState(initialProcesses)
  const [focusedProcess, setFocusedProcess] = useState<ProcessId | null>(null)
  const [selectedProcess, setSelectedProcess] = useState<ProcessId | null>(null)
  const playback = useDemoPlayback()
  const reduceMotion = useReducedMotion()
  const stageRef = useRef<HTMLDivElement>(null)
  const interruptRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (playback.frame.kind !== "preempt" || reduceMotion) return
    const timeline = gsap.timeline({ defaults: { ease: "power3.out" } })
    timeline
      .fromTo(interruptRef.current, { autoAlpha: 0, scaleX: 0.2 }, { autoAlpha: 1, scaleX: 1, duration: 0.18 })
      .to(interruptRef.current, { autoAlpha: 0, scaleX: 1.08, duration: 0.24 }, "+=0.12")
  }, { dependencies: [playback.frame.kind, reduceMotion], scope: stageRef, revertOnUpdate: true })

  const updateProcess = (index: number, field: "arrival" | "burst", value: string) => {
    const numericValue = Math.max(field === "arrival" ? 0 : 1, Number(value))
    setProcesses((current) => current.map((process, processIndex) => processIndex === index ? { ...process, [field]: numericValue } : process))
    playback.reset()
  }

  const addProcess = () => {
    if (processes.length >= initialProcesses.length) return
    setProcesses((current) => {
      const missing = initialProcesses.find((candidate) => !current.some((process) => process.id === candidate.id))
      return missing ? [...current, missing].toSorted((a, b) => initialProcesses.findIndex((process) => process.id === a.id) - initialProcesses.findIndex((process) => process.id === b.id)) : current
    })
    playback.reset()
  }

  const workloadMatchesDemo = processes.length === initialProcesses.length && processes.every((process, index) => process.arrival === initialProcesses[index].arrival && process.burst === initialProcesses[index].burst)
  const canRunDemo = algorithm === "SRTF" && workloadMatchesDemo
  const highlightedProcess = focusedProcess ?? selectedProcess
  const selectProcess = (id: ProcessId) => setSelectedProcess((current) => current === id ? null : id)
  const isComplete = playback.frameIndex === demoFrames.length - 1

  return (
    <main className="app-shell" ref={stageRef}>
      <div className="ambient-grid" aria-hidden="true" />
      <header className="topbar">
        <a href="#workspace" className="brand" aria-label="Kernel Trace home">
          <span className="brand__sigil"><Braces /></span>
          <span><strong>Kernel Trace</strong><small>Algorithm laboratory</small></span>
        </a>
        <nav className="module-switcher" aria-label="Simulator modules">
          <button type="button" data-active="true"><Cpu />CPU scheduling</button>
          <button type="button" disabled><MemoryStick />Memory allocation <span>Soon</span></button>
        </nav>
        <div className="system-status"><span className="status-pulse" />Demo source connected</div>
      </header>

      <section className="page-intro">
        <div>
          <p className="kicker"><span>Lab 01</span> CPU scheduling</p>
          <h1>Watch the scheduler<br />change its mind.</h1>
        </div>
        <p className="intro-copy">A deterministic SRTF teaching trace exposes every arrival, comparison, context switch, and completed timeslice. Calculation will remain owned by Python.</p>
      </section>

      <div className="workspace" id="workspace">
        <aside className="configuration surface">
          <div className="surface-heading">
            <div><span>Input buffer</span><h2>Workload</h2></div>
            <span className="count-badge">{processes.length}/4</span>
          </div>

          <div className="field-group">
            <label>Scheduling policy</label>
            <div className="algorithm-tabs" role="radiogroup" aria-label="Scheduling algorithm">
              {(["FCFS", "SJF", "SRTF", "RR"] as Algorithm[]).map((item) => (
                <label key={item} data-active={algorithm === item}>
                  <input type="radio" name="algorithm" value={item} checked={algorithm === item} onChange={() => { setAlgorithm(item); playback.reset() }} />
                  <span>{item}</span>
                </label>
              ))}
            </div>
            <p className="field-note">{algorithmNotes[algorithm]}</p>
          </div>

          <div className="process-editor">
            <div className="editor-labels"><span>Process</span><span>Arrival</span><span>Burst</span><span /></div>
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
                  <div className="process-name" style={{ "--process-color": process.color } as React.CSSProperties}><span />{process.id}</div>
                  <label><span className="sr-only">{process.id} arrival time</span><Input type="number" min="0" value={process.arrival} onFocus={(event) => event.currentTarget.select()} onChange={(event) => updateProcess(index, "arrival", event.target.value)} /></label>
                  <label><span className="sr-only">{process.id} burst time</span><Input type="number" min="1" value={process.burst} onFocus={(event) => event.currentTarget.select()} onChange={(event) => updateProcess(index, "burst", event.target.value)} /></label>
                  <Button variant="ghost" size="icon" aria-label={`Remove ${process.id}`} disabled={processes.length === 1} onClick={() => { setProcesses((current) => current.filter((item) => item.id !== process.id)); playback.reset() }}><Trash2 /></Button>
                </motion.div>
              ))}
            </AnimatePresence>
            <Button variant="outline" className="add-process" disabled={processes.length >= initialProcesses.length} onClick={addProcess}><Plus />Add process</Button>
          </div>

          <AnimatePresence initial={false}>
            {algorithm === "RR" && (
              <motion.label className="quantum-field" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <span>Time quantum</span><Input type="number" min="1" defaultValue="2" />
              </motion.label>
            )}
          </AnimatePresence>

          <Button className="run-button" size="lg" disabled={!canRunDemo} onClick={playback.run}><Zap />Run teaching trace</Button>
          <p className="demo-disclaimer"><Sparkles />{canRunDemo ? "Playback uses prerecorded events, not a TypeScript scheduler." : "The prototype trace requires SRTF and the supplied demo workload."}</p>
        </aside>

        <section className="execution surface" aria-label="CPU execution workspace">
          <div className="execution-topline">
            <div><span>Execution plane</span><strong>Clock <NumberFlow value={playback.frame.clock} />t</strong></div>
            <div className="playback-controls" aria-label="Simulation playback controls">
              <Button variant="ghost" size="icon" onClick={playback.reset} aria-label="Reset trace"><RotateCcw /></Button>
              <Button variant="ghost" size="icon" disabled={!canRunDemo} onClick={playback.step} aria-label="Step forward"><SkipForward /></Button>
              <Button className="play-toggle" size="icon" disabled={!canRunDemo} onClick={playback.isPlaying ? playback.pause : playback.run} aria-label={playback.isPlaying ? "Pause trace" : "Play trace"}>{playback.isPlaying ? <Pause /> : <Play />}</Button>
              <label className="speed-control"><span className="sr-only">Playback speed</span><select value={playback.speed} onChange={(event) => playback.setSpeed(Number(event.target.value))}><option value="0.5">0.5x</option><option value="1">1x</option><option value="1.5">1.5x</option><option value="2">2x</option></select><ChevronDown /></label>
            </div>
          </div>

          <LayoutGroup>
            <div className="scheduler-stage">
              <section className="queue-lane" aria-labelledby="queue-heading">
                <div className="lane-label"><span id="queue-heading">Ready queue</span><small>{playback.frame.queue.length} waiting</small></div>
                <div className="queue-slots">
                  <AnimatePresence mode="popLayout">
                    {playback.frame.queue.map((id) => <ProcessToken key={id} id={id} location="ready queue" active={highlightedProcess === id} selected={selectedProcess === id} reduceMotion={Boolean(reduceMotion)} onFocus={setFocusedProcess} onSelect={selectProcess} />)}
                  </AnimatePresence>
                  {playback.frame.queue.length === 0 && <span className="empty-queue">Awaiting runnable process</span>}
                </div>
              </section>

              <div className="dispatch-bus" aria-hidden="true"><span /><i>dispatch bus</i><span /></div>

              <section className="cpu-chamber" data-state={playback.frame.cpu ? "running" : "idle"}>
                <div className="cpu-chamber__header"><span><Activity />Core 0</span><small>{playback.frame.cpu ? "RUNNING" : "IDLE"}</small></div>
                <div className="cpu-core">
                  <div className="core-rings" aria-hidden="true"><i /><i /><i /></div>
                  <AnimatePresence mode="popLayout">
                    {playback.frame.cpu ? <ProcessToken key={playback.frame.cpu} id={playback.frame.cpu} location="CPU core" active={highlightedProcess === playback.frame.cpu} selected={selectedProcess === playback.frame.cpu} reduceMotion={Boolean(reduceMotion)} onFocus={setFocusedProcess} onSelect={selectProcess} /> : <div className="idle-glyph"><Cpu /><span>NO OP</span></div>}
                  </AnimatePresence>
                </div>
                <div className="execution-progress"><span style={{ transform: `scaleX(${playback.frame.progress / 100})` }} /></div>
                <div className="cpu-registers"><span>PC <b>0x{(4096 + playback.frame.clock * 16).toString(16).toUpperCase()}</b></span><span>LOAD <b>{playback.frame.progress}%</b></span></div>
              </section>
              <div ref={interruptRef} className="interrupt-flare" aria-hidden="true"><span>PREEMPT</span></div>
            </div>
          </LayoutGroup>

          <section className="timeline-panel" aria-labelledby="timeline-heading">
            <div className="panel-title"><div><CircleGauge /><span><strong id="timeline-heading">Execution timeline</strong><small>Gantt trace / 18 ticks</small></span></div><span className="live-label"><i />{playback.isPlaying ? "Live" : isComplete ? "Resolved" : "Paused"}</span></div>
            <div className="gantt" aria-label="Gantt timeline showing P1, P3, P1, P4, and P2 segments">
              {timeline.map((segment, index) => {
                const process = segment.processId === "IDLE" ? null : processMap[segment.processId]
                const visible = index < playback.frame.visibleSegments
                const active = highlightedProcess === segment.processId
                return (
                  <motion.button
                    type="button"
                    key={segment.id}
                    className="gantt-segment"
                    data-visible={visible}
                    data-active={active}
                    disabled={!process || !visible}
                    tabIndex={visible ? 0 : -1}
                    aria-hidden={!visible}
                    style={{ flex: segment.end - segment.start, "--process-color": process?.color ?? "var(--idle)" } as React.CSSProperties}
                    initial={false}
                    animate={{ opacity: visible ? 1 : 0.12, transform: visible ? "scaleY(1)" : "scaleY(0.72)" }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
                    onMouseEnter={() => process && setFocusedProcess(process.id)}
                    onMouseLeave={() => setFocusedProcess(null)}
                    onFocus={() => process && setFocusedProcess(process.id)}
                    onBlur={() => setFocusedProcess(null)}
                    onClick={() => process && selectProcess(process.id)}
                    aria-pressed={process ? selectedProcess === process.id : undefined}
                  >
                    <span>{segment.processId}</span><small>{segment.start}–{segment.end}</small>
                  </motion.button>
                )
              })}
            </div>
            <div className="time-ruler">{[0, 4, 8, 12, 18].map((time) => <span key={time}>{time}t</span>)}</div>
          </section>

          <div className="metrics-row">
            <Metric label="Average wait" value={playback.frame.metrics.averageWaiting} suffix="t" icon={Clock3} />
            <Metric label="Average turnaround" value={playback.frame.metrics.averageTurnaround} suffix="t" icon={Gauge} />
            <Metric label="CPU idle" value={playback.frame.metrics.idle} suffix="t" icon={Activity} />
          </div>
        </section>

        <aside className="trace surface" aria-label="Scheduler activity log">
          <div className="surface-heading"><div><span>Interrupt stream</span><h2>Trace log</h2></div><span className="live-label"><i />{playback.isPlaying ? "Recording" : "Standby"}</span></div>
          <p className="sr-only" aria-live="polite">{playback.frame.title}: {playback.frame.detail}</p>
          <div className="trace-list">
            {demoFrames.slice(0, playback.frameIndex + 1).toReversed().map((frame, index) => (
              <motion.article
                key={`${frame.clock}-${frame.title}`}
                className="trace-entry"
                data-current={index === 0}
                initial={index === 0 && !reduceMotion ? { opacity: 0, transform: "translateY(-8px)" } : false}
                animate={{ opacity: index === 0 ? 1 : 0.56, transform: "translateY(0px)" }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              >
                <span className="trace-time">{String(frame.clock).padStart(2, "0")}:00</span>
                <div><strong>{frame.title}</strong><p>{frame.detail}</p></div>
              </motion.article>
            ))}
          </div>
        </aside>
      </div>

      <section className="results-panel surface">
        <div className="surface-heading"><div><span>Resolved output</span><h2 id="results-heading">Process ledger</h2></div><p>Predetermined values for the teaching trace</p></div>
        <Table aria-labelledby="results-heading">
          <TableCaption className="sr-only">Predetermined process results for the SRTF teaching trace.</TableCaption>
          <TableHeader><TableRow><TableHead>Process</TableHead><TableHead>Arrival</TableHead><TableHead>Burst</TableHead><TableHead>Finish</TableHead><TableHead>Turnaround</TableHead><TableHead>Waiting</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {results.map((process) => (
              <TableRow key={process.id} data-highlighted={highlightedProcess === process.id} onMouseEnter={() => setFocusedProcess(process.id)} onMouseLeave={() => setFocusedProcess(null)}>
                <TableCell><span className="table-process" style={{ "--process-color": process.color } as React.CSSProperties}><i />{process.id}</span></TableCell>
                <TableCell>{process.arrival}</TableCell><TableCell>{process.burst}</TableCell><TableCell>{process.finish}</TableCell><TableCell>{process.turnaround}</TableCell><TableCell>{process.waiting}</TableCell>
                <TableCell><span className="status-complete" data-complete={isComplete}>{isComplete ? "Completed" : "Preview"}</span></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
      <footer><span>Kernel Trace / CPU Lab</span><span>Deterministic playback architecture</span><span>Build 0.1</span></footer>
    </main>
  )
}
