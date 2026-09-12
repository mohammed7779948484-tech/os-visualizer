import { useEffect, useState } from "react"
import { demoFrames } from "./demo-data"

export function useDemoPlayback() {
  const [frameIndex, setFrameIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  useEffect(() => {
    if (!isPlaying) return
    const timer = window.setTimeout(() => {
      const nextFrame = Math.min(frameIndex + 1, demoFrames.length - 1)
      setFrameIndex(nextFrame)
      if (nextFrame === demoFrames.length - 1) setIsPlaying(false)
    }, 1450 / speed)
    return () => window.clearTimeout(timer)
  }, [frameIndex, isPlaying, speed])

  const reset = () => {
    setIsPlaying(false)
    setFrameIndex(0)
  }

  const run = () => {
    if (frameIndex === demoFrames.length - 1) setFrameIndex(0)
    setIsPlaying(true)
  }

  return {
    frame: demoFrames[frameIndex],
    frameIndex,
    isPlaying,
    speed,
    setSpeed,
    run,
    pause: () => setIsPlaying(false),
    step: () => {
      setIsPlaying(false)
      setFrameIndex((current) => Math.min(current + 1, demoFrames.length - 1))
    },
    reset,
  }
}
