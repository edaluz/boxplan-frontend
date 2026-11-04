/** Configuración y "plan" (lista de fases) de cada tipo de timer. */

export type TimerKind = 'AMRAP' | 'FOR_TIME' | 'EMOM' | 'TABATA'

export type TimerConfig =
  | { kind: 'AMRAP'; minutes: number }
  | { kind: 'FOR_TIME'; capMinutes: number }
  | { kind: 'EMOM'; everySec: number; totalMin: number }
  | { kind: 'TABATA'; rounds: number; workSec: number; restSec: number }

export interface Phase {
  /** 'prep' = cuenta regresiva inicial */
  type: 'prep' | 'work' | 'rest'
  durationMs: number
  /** Texto arriba del reloj, ej. "3/15" o "1/8 · Trabajo" */
  label: string
  /** Muestra el tiempo transcurrido en vez del restante (For Time) */
  countUp?: boolean
}

export const PREP_MS = 10_000

export const TIMER_META: Record<TimerKind, { name: string; color: string; ring: string; tagline: string }> = {
  AMRAP: { name: 'AMRAP', color: 'bg-lime-400 text-zinc-950', ring: '#a3e635', tagline: 'Máximas rondas en un tiempo' },
  FOR_TIME: { name: 'For Time', color: 'bg-sky-400 text-zinc-950', ring: '#38bdf8', tagline: 'Lo más rápido posible, con límite' },
  EMOM: { name: 'EMOM', color: 'bg-amber-400 text-zinc-950', ring: '#fbbf24', tagline: 'Cada X tiempo, durante Y minutos' },
  TABATA: { name: 'Tabata', color: 'bg-rose-400 text-zinc-950', ring: '#fb7185', tagline: 'Rondas de trabajo y descanso' },
}

export const DEFAULTS: { [K in TimerKind]: Extract<TimerConfig, { kind: K }> } = {
  AMRAP: { kind: 'AMRAP', minutes: 10 },
  FOR_TIME: { kind: 'FOR_TIME', capMinutes: 20 },
  EMOM: { kind: 'EMOM', everySec: 60, totalMin: 10 },
  TABATA: { kind: 'TABATA', rounds: 8, workSec: 20, restSec: 10 },
}

export function buildPlan(c: TimerConfig): Phase[] {
  const prep: Phase = { type: 'prep', durationMs: PREP_MS, label: 'Preparate' }
  switch (c.kind) {
    case 'AMRAP':
      return [prep, { type: 'work', durationMs: c.minutes * 60_000, label: `${c.minutes} minuto${c.minutes === 1 ? "" : "s"}` }]
    case 'FOR_TIME':
      return [prep, { type: 'work', durationMs: c.capMinutes * 60_000, label: `Límite ${c.capMinutes} min`, countUp: true }]
    case 'EMOM': {
      const n = emomRounds(c)
      return [prep, ...Array.from({ length: n }, (_, i): Phase => ({
        type: 'work', durationMs: c.everySec * 1000, label: `${i + 1}/${n}`,
      }))]
    }
    case 'TABATA': {
      const phases: Phase[] = [prep]
      for (let i = 1; i <= c.rounds; i++) {
        phases.push({ type: 'work', durationMs: c.workSec * 1000, label: `${i}/${c.rounds} · Trabajo` })
        if (i < c.rounds && c.restSec > 0) {
          phases.push({ type: 'rest', durationMs: c.restSec * 1000, label: `${i}/${c.rounds} · Descanso` })
        }
      }
      return phases
    }
  }
}

export const emomRounds = (c: { everySec: number; totalMin: number }) =>
  Math.max(1, Math.floor((c.totalMin * 60) / c.everySec))

/** Duración total sin la preparación. */
export const totalMs = (plan: Phase[]) =>
  plan.filter((p) => p.type !== 'prep').reduce((acc, p) => acc + p.durationMs, 0)

export function describe(c: TimerConfig): string {
  switch (c.kind) {
    case 'AMRAP': return `Máximas rondas en ${c.minutes} min`
    case 'FOR_TIME': return `Lo más rápido posible · límite ${c.capMinutes} min`
    case 'EMOM': return `Cada ${fmtDuration(c.everySec)} por ${c.totalMin} min (${emomRounds(c)} rondas)`
    case 'TABATA': return `${c.rounds} rondas · ${fmtDuration(c.workSec)} trabajo / ${fmtDuration(c.restSec)} descanso`
  }
}

/** 90 → "1:30", 45 → "0:45" */
export function fmtDuration(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}

/** ms → "09:59" (redondeando hacia arriba en cuenta regresiva) */
export function fmtClock(ms: number, roundUp = false): string {
  const total = Math.max(0, roundUp ? Math.ceil(ms / 1000) : Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}
