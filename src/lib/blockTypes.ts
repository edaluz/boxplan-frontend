import type { Block } from '../api/client'
import { fmtDuration, type TimerConfig } from '../timers/plan'

export const BLOCK_TYPE_LABEL: Record<Block['type'], string> = {
  FREE: 'Libre',
  STRENGTH: 'Fuerza / LPO',
  AMRAP: 'AMRAP',
  FOR_TIME: 'For Time',
  EMOM: 'EMOM',
  VIDEO: 'Video',
}

/** Opciones de "cada" para EMOM (segundos). */
export const EMOM_EVERY = [15, 20, 30, 40, 45, 60, 75, 90, 120, 150, 180, 240, 300]
export const MINUTES = Array.from({ length: 60 }, (_, i) => i + 1)

/** "12 min", "Time cap 15 min", "Cada 1:00 · 10 min" */
export function timingLabel(b: Pick<Block, 'type' | 'durationSec' | 'intervalSec'>): string | null {
  if (!b.durationSec) return null
  const min = Math.round(b.durationSec / 60)
  if (b.type === 'AMRAP') return `${min} min`
  if (b.type === 'FOR_TIME') return `Time cap ${min} min`
  if (b.type === 'EMOM' && b.intervalSec) return `Cada ${fmtDuration(b.intervalSec)} · ${min} min`
  return null
}

/** Config del timer a partir del bloque (si tiene tiempo cargado). */
export function timerConfigFor(b: Pick<Block, 'type' | 'durationSec' | 'intervalSec'>): TimerConfig | null {
  if (!b.durationSec) return null
  const min = Math.max(1, Math.round(b.durationSec / 60))
  if (b.type === 'AMRAP') return { kind: 'AMRAP', minutes: min }
  if (b.type === 'FOR_TIME') return { kind: 'FOR_TIME', capMinutes: min }
  if (b.type === 'EMOM' && b.intervalSec) return { kind: 'EMOM', everySec: b.intervalSec, totalMin: min }
  return null
}
