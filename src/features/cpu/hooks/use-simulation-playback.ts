import { useEffect, useState } from "react"
import type { SimulationEvent } from "../types"

const baseFrameDuration = 720

export function useSimulationPlayback() {
  const [events, setEvents] = useState<SimulationEvent[]>([])
  const [frameIndex, setFrameIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const event = events[frameIndex] ?? null
  const nextEvent = events[frameIndex + 1] ?? null
  const rawTimeDelta = event && nextEvent ? nextEvent.time - event.time : 1
  const timeDelta = Math.max(0, rawTimeDelta)
  const sameTimeDuration = 360
  const frameDuration = (timeDelta === 0 ? sameTimeDuration : Math.min(3200, baseFrameDuration * timeDelta)) / speed
  const running = event?.state.running
  const progressTarget = running
    ? Math.min(100, (running.executed / running.burst) * 100)
    : 0

  useEffect(() => {
    if (!isPlaying || events.length === 0) return
    const isLastFrame = frameIndex >= events.length - 1
    if (isLastFrame) return

    const timer = window.setTimeout(() => {
      const nextIndex = frameIndex + 1
      setFrameIndex(nextIndex)
      if (nextIndex === events.length - 1) setIsPlaying(false)
    }, frameDuration)

    return () => window.clearTimeout(timer)
  }, [events.length, frameDuration, frameIndex, isPlaying])

  const load = (nextEvents: SimulationEvent[]) => {
    setEvents(nextEvents)
    setFrameIndex(0)
    setIsPlaying(nextEvents.length > 0)
  }

  const clear = () => {
    setEvents([])
    setFrameIndex(0)
    setIsPlaying(false)
  }

  const reset = () => {
    setFrameIndex(0)
    setIsPlaying(false)
  }

  const play = () => {
    if (events.length === 0) return
    if (frameIndex === events.length - 1) setFrameIndex(0)
    setIsPlaying(true)
  }

  return {
    event,
    events,
    frameIndex,
    frameDuration,
    progressTarget,
    isPlaying,
    speed,
    isComplete: events.length > 0 && frameIndex === events.length - 1,
    setSpeed,
    load,
    clear,
    play,
    pause: () => setIsPlaying(false),
    step: () => {
      setIsPlaying(false)
      setFrameIndex((current) => Math.min(current + 1, Math.max(0, events.length - 1)))
    },
    reset,
  }
}
