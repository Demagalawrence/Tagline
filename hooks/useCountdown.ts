import { useEffect, useRef, useState } from 'react'

export function useCountdown(initialSeconds: number, paused = false): number {
  const [remaining, setRemaining] = useState(initialSeconds)
  const [prevInitial, setPrevInitial] = useState(initialSeconds)
  const pausedRef = useRef(paused)

  if (prevInitial !== initialSeconds) {
    setPrevInitial(initialSeconds)
    setRemaining(initialSeconds)
  }

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => (pausedRef.current ? prev : Math.max(0, prev - 1)))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return remaining
}

export function useCountdownState() {
  const [secondsLeft, setSecondsLeft] = useState(0)
  const ref = useRef(0)

  const start = (seconds: number) => {
    ref.current = seconds
    setSecondsLeft(seconds)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      ref.current = Math.max(0, ref.current - 1)
      setSecondsLeft(ref.current)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return { secondsLeft, start }
}
