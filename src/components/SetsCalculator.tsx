import { useState } from 'react'
import type { Block } from '../api/client'
import { formatLoad, kgTo, roundLoad, toKg, useUnit } from '../lib/units'
import { formatSet } from './BlockView'

const rmKey = (movement: string) => `boxplan.rm.${movement.trim().toLowerCase()}`

function readRm(movement: string): number | null {
  try { const v = Number(localStorage.getItem(rmKey(movement))); return v > 0 ? v : null } catch { return null }
}

/** Ruta de series con el peso de cada una según el 1RM del alumno (guardado por movimiento). */
export default function SetsCalculator({ block }: { block: Block }) {
  const unit = useUnit()
  const movement = block.movement || block.title || 'general'
  const [rmKg, setRmKg] = useState<number | null>(() => readRm(movement))
  const [input, setInput] = useState(() => (rmKg ? String(roundLoad(kgTo(rmKg, unit), unit)) : ''))

  const onChange = (v: string) => {
    setInput(v)
    const n = Number(v.replace(',', '.'))
    const kg = n > 0 ? toKg(n, unit) : null
    setRmKg(kg)
    try { if (kg) localStorage.setItem(rmKey(movement), String(kg)); else localStorage.removeItem(rmKey(movement)) } catch { /* noop */ }
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <label className="mb-0 whitespace-nowrap">Tu 1RM{block.movement ? ` de ${block.movement}` : ''}</label>
        <input className="w-28" inputMode="decimal" placeholder={unit === 'kg' ? '80' : '175'}
          value={input} onChange={(e) => onChange(e.target.value)} />
        <span className="text-sm text-zinc-400">{unit}</span>
      </div>
      <ul className="divide-y divide-zinc-800 rounded-md border border-zinc-800 font-mono text-sm">
        {block.sets!.map((s, i) => (
          <li key={i} className="flex justify-between px-3 py-1.5">
            <span className="text-lime-200">{formatSet(s)}</span>
            <span className="font-semibold">
              {rmKg && s.percent != null ? formatLoad((rmKg * s.percent) / 100, unit) : '—'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
