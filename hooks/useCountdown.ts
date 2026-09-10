import { useEffect, useRef, useState } from 'react';

export function useCountdown(initialSeconds: number, paused = false): number {
  const [remaining, setRemaining] = useState(initialSeconds);
  const remainingRef = useRef(initialSeconds);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    setRemaining(initialSeconds);
    remainingRef.current = initialSeconds;
  }, [initialSeconds]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (pausedRef.current) return;
      remainingRef.current = Math.max(0, remainingRef.current - 1);
      setRemaining(remainingRef.current);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return remaining;
}

export function useCountdownState() {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const ref = useRef(0);

  const start = (seconds: number) => {
    ref.current = seconds;
    setSecondsLeft(seconds);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      ref.current = Math.max(0, ref.current - 1);
      setSecondsLeft(ref.current);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return { secondsLeft, start };
}
