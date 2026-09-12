import { useEffect, useRef, useState } from "react"
import { Braces, Cpu, MemoryStick } from "lucide-react"
import { CpuWorkspace } from "./components/cpu-workspace"
import { ProcessResults } from "./components/process-results"
import { SchedulerLog } from "./components/scheduler-log"
import { SimulationConfig } from "./components/simulation-config"
import { useSimulationPlayback } from "./hooks/use-simulation-playback"
import { SimulationRequestError, requestSimulation } from "./lib/simulation-client"
import { translatePythonError } from "./lib/simulation-copy"
import { validateProcessInputs } from "./lib/validate-processes"
import type { Algorithm, ProcessInput, SimulationError, SimulationResult } from "./types"

const initialProcesses: ProcessInput[] = [
  { id: "P1", arrival: 0, burst: 4 },
  { id: "P2", arrival: 1, burst: 3 },
  { id: "P3", arrival: 10, burst: 2 },
]

export function CpuSchedulingPage() {
  const [algorithm, setAlgorithm] = useState<Algorithm>("FCFS")
  const [processes, setProcesses] = useState<ProcessInput[]>(initialProcesses)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [error, setError] = useState<SimulationError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasConnected, setHasConnected] = useState(false)
  const [focusedProcess, setFocusedProcess] = useState<string | null>(null)
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null)
  const requestControllerRef = useRef<AbortController | null>(null)
  const playback = useSimulationPlayback()
  const highlightedProcess = focusedProcess ?? selectedProcess

  useEffect(() => () => {
    requestControllerRef.current?.abort()
    requestControllerRef.current = null
  }, [])

  const abortPendingRequest = () => {
    requestControllerRef.current?.abort()
    requestControllerRef.current = null
    setIsLoading(false)
  }

  const clearSimulation = () => {
    abortPendingRequest()
    setResult(null)
    setError(null)
    setSelectedProcess(null)
    playback.clear()
  }

  const updateProcess = (index: number, field: "arrival" | "burst", value: number) => {
    setProcesses((current) => current.map((process, processIndex) => processIndex === index ? { ...process, [field]: value } : process))
    clearSimulation()
  }

  const addProcess = () => {
    setProcesses((current) => {
      let number = 1
      while (current.some((process) => process.id === `P${number}`)) number += 1
      return [...current, { id: `P${number}`, arrival: 0, burst: 1 }]
    })
    clearSimulation()
  }

  const removeProcess = (id: string) => {
    setProcesses((current) => current.filter((process) => process.id !== id))
    clearSimulation()
  }

  const changeAlgorithm = (nextAlgorithm: Algorithm) => {
    setAlgorithm(nextAlgorithm)
    clearSimulation()
  }

  const runSimulation = async () => {
    abortPendingRequest()
    const inputError = validateProcessInputs(processes)
    if (inputError) {
      setError(inputError)
      setResult(null)
      playback.clear()
      return
    }

    const controller = new AbortController()
    requestControllerRef.current = controller
    setIsLoading(true)
    setError(null)
    try {
      const simulation = await requestSimulation(algorithm, processes, controller.signal)
      if (controller.signal.aborted || requestControllerRef.current !== controller) return
      setResult(simulation)
      setHasConnected(true)
      playback.load(simulation.events)
    } catch (requestError) {
      if (controller.signal.aborted || requestControllerRef.current !== controller) return
      if (requestError instanceof SimulationRequestError) {
        setError({
          code: requestError.code,
          message: translatePythonError(requestError.code, requestError.message),
          details: requestError.details,
        })
      } else {
        setError({ code: "UNKNOWN_ERROR", message: "حدث خطأ غير متوقع أثناء تشغيل المحاكاة." })
      }
      setResult(null)
      playback.clear()
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null
        setIsLoading(false)
      }
    }
  }

  const selectProcess = (id: string) => setSelectedProcess((current) => current === id ? null : id)

  return (
    <main className="app-shell" dir="rtl">
      <div className="ambient-grid" aria-hidden="true" />
      <header className="topbar">
        <a href="#workspace" className="brand" aria-label="العودة إلى مساحة المحاكاة">
          <span className="brand__sigil"><Braces /></span>
          <span><strong dir="ltr">Kernel Trace</strong><small>مختبر خوارزميات نظم التشغيل</small></span>
        </a>
        <nav className="module-switcher" aria-label="وحدات المحاكي">
          <button type="button" data-active="true"><Cpu />جدولة المعالج</button>
          <button type="button" disabled><MemoryStick />تخصيص الذاكرة <span>قريبًا</span></button>
        </nav>
        <div className="system-status" data-connected={hasConnected}><span className="status-pulse" /><span>{hasConnected ? "تم التحقق من" : "مهيّأ لـ"} <b dir="ltr">FCFS / Python</b></span></div>
      </header>

      <section className="page-intro">
        <div>
          <p className="kicker"><span dir="ltr">LAB 01</span> جدولة المعالج</p>
          <h1>راقب قرار المجدول، لا نتيجته فقط.</h1>
        </div>
        <p className="intro-copy">تدخل العمليات من هنا، يحسبها بايثون فورًا، ثم تحول الواجهة جدول التنفيذ الناتج إلى وصول وإرسال وخمول واكتمال قابل للفحص بصريًا.</p>
      </section>

      <div className="workspace" id="workspace">
        <SimulationConfig algorithm={algorithm} processes={processes} isLoading={isLoading} error={error} onAlgorithmChange={changeAlgorithm} onProcessChange={updateProcess} onAddProcess={addProcess} onRemoveProcess={removeProcess} onRun={runSimulation} />
        <CpuWorkspace algorithm={algorithm} processes={processes} result={result} event={playback.event} progressTarget={playback.progressTarget} isPlaying={playback.isPlaying} isComplete={playback.isComplete} speed={playback.speed} highlightedProcess={highlightedProcess} selectedProcess={selectedProcess} onFocus={setFocusedProcess} onSelect={selectProcess} onPlay={playback.play} onPause={playback.pause} onStep={playback.step} onReset={playback.reset} onSpeedChange={playback.setSpeed} />
        <SchedulerLog events={playback.events} frameIndex={playback.frameIndex} isPlaying={playback.isPlaying} />
      </div>

      <ProcessResults result={result} completed={playback.event?.state.completed ?? []} highlightedProcess={highlightedProcess} onFocus={setFocusedProcess} />
      <footer><span dir="ltr">Kernel Trace / CPU Lab</span><span>الخوارزمية: بايثون · التشغيل البصري: React</span><span dir="ltr">FCFS · Build 0.3</span></footer>
    </main>
  )
}
