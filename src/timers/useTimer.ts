import { useCallback, useEffect, useRef, useState } from 'react'
import type { Phase } from './plan'
import { beep } from './sound'

export type Status = 'idle' | 'running' | 'paused' | 'done'

export interface TimerState {
  status: Status
  /** Tiempo transcurrido total (incluye preparación), ms */
  elapsedMs: number
  phaseIndex: number
  phase: Phase
  /** Transcurrido y restante dentro de la fase actual */
  phaseElapsedMs: number
  phaseRemainingMs: number
}

/**
 * Motor del timer: el tiempo se calcula contra el reloj real (performance.now),
 * así no se desfasa aunque el navegador frene los intervalos.
 */
export function useTimer(plan: Phase[], soundOn: boolean) {
  const [status, setStatus] = useState<Status>('idle')
  const [now, setNow] = useState(0)
  const startRef = useRef(0) // performance.now() del inicio, corrido por las pausas
  const pausedAtRef = useRef(0)
  const lastBeepRef = useRef<string>('')
  const endedRef = useRef(false)
  const soundRef = useRef(soundOn)
  soundRef.current = soundOn

  const elapsedMs =
    status === 'idle' ? 0
      : status === 'paused' ? pausedAtRef.current - startRef.current
        : status === 'done' ? sum(plan)
          : now - startRef.current

  // Fase actual
  let acc = 0
  let phaseIndex = -1
  for (let i = 0; i < plan.length; i++) {
    if (elapsedMs < acc + plan[i].durationMs) { phaseIndex = i; break }
    acc += plan[i].durationMs
  }
  if (phaseIndex === -1) {
    // Ya pasó el final: queda en la última fase, completa
    phaseIndex = plan.length - 1
    acc = sum(plan) - plan[phaseIndex].durationMs
  }
  const phase = plan[phaseIndex]
  const phaseElapsedMs = Math.min(phase.durationMs, Math.max(0, elapsedMs - acc))
  const phaseRemainingMs = phase.durationMs - phaseElapsedMs

  // Tick
  useEffect(() => {
    if (status !== 'running') return
    const id = window.setInterval(() => setNow(performance.now()), 100)
    return () => window.clearInterval(id)
  }, [status])

  // Fin
  useEffect(() => {
    if (status === 'running' && elapsedMs >= sum(plan) && !endedRef.current) {
      endedRef.current = true
      setStatus('done')
      if (soundRef.current) beep('end')
    }
  }, [status, elapsedMs, plan])

  // Pitidos: cuenta regresiva de 10 s en la preparación y al final del
  // entrenamiento (suave 10..4, fuerte 3-2-1); 3-2-1 en cambios intermedios;
  // pitido largo al empezar cada fase.
  useEffect(() => {
    if (status !== 'running' || !soundRef.current) return
    const secLeft = Math.ceil(phaseRemainingMs / 1000)
    const key = `${phaseIndex}:${secLeft}`
    if (key === lastBeepRef.current) return
    const isLast = phaseIndex === plan.length - 1
    const longCountdown = phaseIndex === 0 || isLast
    if (secLeft >= 1 && secLeft <= 3) {
      lastBeepRef.current = key
      beep('short')
    } else if (longCountdown && secLeft >= 4 && secLeft <= 10 && phase.durationMs >= 10_000) {
      lastBeepRef.current = key
      beep('tick')
    } else if (phaseElapsedMs < 300 && phaseIndex > 0) {
      lastBeepRef.current = key
      beep('long')
    }
  }, [status, phaseIndex, phaseRemainingMs, phaseElapsedMs, plan.length, phase.durationMs])

  const start = useCallback(() => {
    const t = performance.now()
    startRef.current = t
    lastBeepRef.current = ''
    endedRef.current = false
    setNow(t)
    setStatus('running')
  }, [])

  const pause = useCallback(() => {
    pausedAtRef.current = performance.now()
    setStatus('paused')
  }, [])

  const resume = useCallback(() => {
    const t = performance.now()
    startRef.current += t - pausedAtRef.current
    setNow(t)
    setStatus('running')
  }, [])

  /** Termina antes de tiempo (For Time: "terminé"). */
  const finish = useCallback(() => {
    pausedAtRef.current = performance.now()
    endedRef.current = true
    setStatus('done')
    if (soundRef.current) beep('end')
  }, [])

  const reset = useCallback(() => setStatus('idle'), [])

  /** Transcurrido de trabajo real (sin la preparación) al momento de llamarlo. */
  const workElapsedNow = useCallback(() => {
    const t = status === 'running' ? performance.now() : pausedAtRef.current
    return Math.max(0, t - startRef.current - plan[0].durationMs)
  }, [status, plan])

  const state: TimerState = { status, elapsedMs, phaseIndex, phase, phaseElapsedMs, phaseRemainingMs }
  return { state, start, pause, resume, finish, reset, workElapsedNow }
}

const sum = (plan: Phase[]) => plan.reduce((a, p) => a + p.durationMs, 0)
