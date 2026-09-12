import { ChevronDown, Pause, Play, RotateCcw, SkipForward } from "lucide-react"
import { Button } from "@/components/ui/button"

type PlaybackControlsProps = {
  canPlay: boolean
  isPlaying: boolean
  speed: number
  onPlay: () => void
  onPause: () => void
  onStep: () => void
  onReset: () => void
  onSpeedChange: (speed: number) => void
}

export function PlaybackControls(props: PlaybackControlsProps) {
  return (
    <div className="playback-controls" aria-label="أدوات تشغيل المحاكاة">
      <Button variant="ghost" size="icon" onClick={props.onReset} disabled={!props.canPlay} aria-label="إعادة ضبط"><RotateCcw /></Button>
      <Button variant="ghost" size="icon" onClick={props.onStep} disabled={!props.canPlay} aria-label="خطوة واحدة"><SkipForward /></Button>
      <Button className="play-toggle" size="icon" disabled={!props.canPlay} onClick={props.isPlaying ? props.onPause : props.onPlay} aria-label={props.isPlaying ? "إيقاف مؤقت" : "تشغيل"}>{props.isPlaying ? <Pause /> : <Play />}</Button>
      <label className="speed-control" dir="ltr">
        <span className="sr-only">سرعة التشغيل</span>
        <select value={props.speed} onChange={(event) => props.onSpeedChange(Number(event.target.value))}>
          <option value="0.5">0.5x</option><option value="1">1x</option><option value="1.5">1.5x</option><option value="2">2x</option>
        </select>
        <ChevronDown />
      </label>
    </div>
  )
}
