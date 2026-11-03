import type { Division, ScoreType } from '../api/client'
import { formatLoad, type Unit } from './units'

export const DIVISIONS: { value: Division; label: string }[] = [
  { value: 'NA', label: 'No aplica' },
  { value: 'ELITE', label: 'Elite' },
  { value: 'RX', label: 'RX' },
  { value: 'ADVANCED', label: 'Adv' },
  { value: 'SCALED', label: 'Scaled' },
]

export const divisionLabel = (d: Division) => DIVISIONS.find((x) => x.value === d)?.label ?? d

export const SCORE_LABEL: Record<ScoreType, string> = {
  TIME: 'Tiempo',
  REPS: 'Reps',
  ROUNDS_REPS: 'Reps totales',
  LOAD: 'Carga',
  TEXT: 'Texto',
}

/** 'mm:ss' o 'h:mm:ss' → segundos. */
export function parseTime(v: string): number | null {
  const parts = v.trim().split(':').map(Number)
  if (!parts.length || parts.some((n) => !Number.isFinite(n) || n < 0)) return null
  return parts.reduce((acc, n) => acc * 60 + n, 0) || null
}

export function formatScore(type: ScoreType, value: number | null | undefined, unit: Unit = 'kg'): string {
  if (value == null) return ''
  if (type === 'TIME') {
    const h = Math.floor(value / 3600)
    const m = Math.floor((value % 3600) / 60)
    const s = Math.round(value % 60)
    const mm = h ? String(m).padStart(2, '0') : String(m)
    return `${h ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`
  }
  if (type === 'LOAD') return formatLoad(value, unit)
  return `${value} reps`
}
