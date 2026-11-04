import { useEffect, useMemo, useState } from 'react'
import { buildPlan, describe, fmtClock, TIMER_META, totalMs, type TimerConfig } from './plan'
import { unlockAudio } from './sound'
import { useTimer } from './useTimer'

const SOUND_KEY = 'boxplan.timer.sound'

/** Rutina de referencia que se muestra debajo del reloj (cuando viene de un bloque). */
export interface Routine {
  title?: string | null
  text?: string | null
}

/** Pantalla completa del timer en curso. */
export default function TimerRun({ config, routine, onExit }: { config: TimerConfig; routine?: Routine; onExit: () => void }) {
  const plan = useMemo(() => buildPlan(config), [config])
  const meta = TIMER_META[config.kind]
  const [soundOn, setSoundOn] = useState(() => {
    try { return localStorage.getItem(SOUND_KEY) !== 'off' } catch { return true }
  })
  const { state, start, pause, resume, finish, reset, workElapsedNow } = useTimer(plan, soundOn)
  const { status, phase, phaseIndex, phaseElapsedMs, phaseRemainingMs } = state
  const [splits, setSplits] = useState<number[]>([]) // tiempo acumulado al cerrar cada ronda
  const countsRounds = config.kind === 'AMRAP' || config.kind === 'FOR_TIME'
  const working = status !== 'idle' && phase.type !== 'prep'

  useWakeLock(status === 'running')

  // Mientras el timer está abierto, la página de atrás no scrollea
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const toggleSound = () => {
    const v = !soundOn
    setSoundOn(v)
    try { localStorage.setItem(SOUND_KEY, v ? 'on' : 'off') } catch { /* noop */ }
  }

  const onRingTap = () => {
    if (status === 'idle') { unlockAudio(); setSplits([]); start() }
    else if (status === 'running') pause()
    else if (status === 'paused') resume()
  }

  const exit = () => {
    if ((status === 'running' || status === 'paused') && !confirm('¿Detener el entrenamiento?')) return
    onExit()
  }

  const addRound = () => {
    if (!working || status === 'done') return
    setSplits((s) => [...s, workElapsedNow()])
  }

  const lastRoundMs = splits.length ? splits[splits.length - 1] - (splits[splits.length - 2] ?? 0) : null
  const progress = phase.durationMs ? phaseElapsedMs / phase.durationMs : 0
  const ringColor = phase.type === 'rest' ? '#71717a' : phase.type === 'prep' ? '#e4e4e7' : meta.ring

  let big: React.ReactNode
  if (status === 'idle') {
    big = (
      <>
        <svg viewBox="0 0 24 24" className="h-20 w-20" style={{ fill: meta.ring }}><path d="M7 4.5v15l13-7.5z" /></svg>
        <span className="mt-2 text-sm text-zinc-300">Tocá para empezar</span>
      </>
    )
  } else if (phase.type === 'prep') {
    big = <span className="text-8xl font-black tabular-nums">{Math.ceil(phaseRemainingMs / 1000)}</span>
  } else {
    big = (
      <span className="text-6xl font-black tabular-nums sm:text-7xl" style={{ color: ringColor }}>
        {phase.countUp ? fmtClock(phaseElapsedMs) : fmtClock(phaseRemainingMs, true)}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-zinc-950 text-zinc-100">
      <header className="flex items-center justify-between px-4 py-3">
        <button className="btn-ghost px-3" onClick={exit} aria-label="Salir">←</button>
        <h2 className="font-bold">{meta.name}</h2>
        <button className="btn-ghost px-3" onClick={toggleSound} aria-label="Sonido">{soundOn ? '🔊' : '🔇'}</button>
      </header>

      {status === 'done' ? (
        <Summary config={config} splits={splits} plan={plan} onRepeat={() => { setSplits([]); reset() }} onExit={onExit} />
      ) : (
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{status === 'idle' ? describe(config) : phase.label}</p>
            {lastRoundMs != null && <p className="text-sm text-zinc-400">Última ronda: {fmtClock(lastRoundMs)}</p>}
          </div>

          <button onClick={onRingTap} className="relative aspect-square w-full max-w-xs" aria-label="Iniciar o pausar">
            <Ring progress={status === 'idle' ? 0 : progress} color={ringColor} />
            <span className="absolute inset-0 flex flex-col items-center justify-center">
              {big}
              {status === 'paused' && <span className="mt-1 text-sm font-semibold text-zinc-400">EN PAUSA · tocá para seguir</span>}
            </span>
          </button>

          {(config.kind === 'EMOM' || config.kind === 'TABATA') && (
            <p className="text-sm text-zinc-400">
              {status === 'idle' ? 'Tiempo total' : `Fase ${Math.max(1, phaseIndex)} de ${plan.length - 1} · Total`}: {fmtClock(totalMs(plan))}
            </p>
          )}

          <div className="flex min-h-20 items-center gap-6">
            {countsRounds && (
              <div className="flex flex-col items-center gap-1">
                <button onClick={addRound} disabled={!working}
                  className="flex h-16 w-16 items-center justify-center rounded-full border-2 text-2xl font-bold disabled:opacity-40"
                  style={{ borderColor: meta.ring, color: meta.ring }}>
                  {splits.length || '+'}
                </button>
                <span className="text-xs text-zinc-500">Rondas</span>
              </div>
            )}
            {config.kind === 'FOR_TIME' && working && (
              <button className="btn-primary h-12 px-6" onClick={finish}>Terminé</button>
            )}
            {status !== 'idle' && (
              <button className="btn-ghost h-12 px-6" onClick={status === 'running' ? pause : resume}>
                {status === 'running' ? 'Pausa' : 'Seguir'}
              </button>
            )}
          </div>
        </main>
      )}
      {routine?.text?.trim() && <RoutinePanel routine={routine} />}
    </div>
  )
}

function RoutinePanel({ routine }: { routine: Routine }) {
  const [open, setOpen] = useState(true)
  return (
    <section className="border-t border-zinc-800 bg-zinc-900/80 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
      <button className="flex w-full items-center justify-center gap-1 py-1 text-sm font-semibold text-zinc-300"
        onClick={() => setOpen(!open)}>
        {routine.title?.trim() || 'Rutina'} {open ? '▾' : '▴'}
      </button>
      {open && (
        <p className="mx-auto max-h-[30vh] max-w-md overflow-y-auto whitespace-pre-wrap pb-1 text-center text-lg leading-snug text-zinc-100">
          {routine.text}
        </p>
      )}
    </section>
  )
}

function Ring({ progress, color }: { progress: number; color: string }) {
  const r = 88
  const c = 2 * Math.PI * r
  const p = Math.min(1, Math.max(0, progress))
  const angle = p * 2 * Math.PI - Math.PI / 2
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full">
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i / 60) * 2 * Math.PI
        const long = i % 5 === 0
        return (
          <line key={i}
            x1={100 + Math.cos(a) * (long ? 92 : 94)} y1={100 + Math.sin(a) * (long ? 92 : 94)}
            x2={100 + Math.cos(a) * 98} y2={100 + Math.sin(a) * 98}
            stroke="#3f3f46" strokeWidth={long ? 1.6 : 1} />
        )
      })}
      <circle cx="100" cy="100" r={r} fill="none" stroke="#27272a" strokeWidth="3" />
      <circle cx="100" cy="100" r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
        strokeDasharray={`${c * p} ${c}`} transform="rotate(-90 100 100)" />
      {p > 0 && <circle cx={100 + Math.cos(angle) * r} cy={100 + Math.sin(angle) * r} r="5" fill={color} />}
    </svg>
  )
}

function Summary({ config, splits, plan, onRepeat, onExit }: {
  config: TimerConfig; splits: number[]; plan: ReturnType<typeof buildPlan>; onRepeat: () => void; onExit: () => void
}) {
  const finalMs = splits.length && config.kind === 'FOR_TIME' ? splits[splits.length - 1] : null
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 px-4 text-center">
      <p className="text-4xl font-black">¡Terminado! 💪</p>
      <p className="text-zinc-400">{describe(config)}</p>
      {config.kind === 'AMRAP' && <p className="text-2xl font-bold">{splits.length} ronda{splits.length === 1 ? '' : 's'}</p>}
      {config.kind === 'FOR_TIME' && finalMs != null && <p className="text-2xl font-bold">Última ronda marcada: {fmtClock(finalMs)}</p>}
      {(config.kind === 'EMOM' || config.kind === 'TABATA') && <p className="text-2xl font-bold">{fmtClock(totalMs(plan))}</p>}
      {splits.length > 0 && (
        <ol className="max-h-48 w-full max-w-xs space-y-1 overflow-y-auto text-sm">
          {splits.map((t, i) => (
            <li key={i} className="flex justify-between border-b border-zinc-800 py-1 font-mono">
              <span className="text-zinc-400">Ronda {i + 1}</span>
              <span>{fmtClock(t - (splits[i - 1] ?? 0))}</span>
              <span className="text-zinc-500">{fmtClock(t)}</span>
            </li>
          ))}
        </ol>
      )}
      <div className="flex gap-3">
        <button className="btn-primary px-6" onClick={onRepeat}>Repetir</button>
        <button className="btn-ghost px-6" onClick={onExit}>Volver</button>
      </div>
    </main>
  )
}

/** Mantiene la pantalla encendida mientras corre (si el navegador lo soporta). */
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false
    navigator.wakeLock.request('screen').then((l) => {
      if (cancelled) void l.release()
      else lock = l
    }).catch(() => { /* sin permiso */ })
    return () => { cancelled = true; void lock?.release() }
  }, [active])
}
