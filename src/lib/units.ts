import { useSyncExternalStore } from 'react'

export type Unit = 'kg' | 'lb'
const KEY = 'boxplan.unit'
const EVENT = 'boxplan:unit'
const LB_IN_KG = 0.45359237

function read(): Unit {
  try { return localStorage.getItem(KEY) === 'lb' ? 'lb' : 'kg' } catch { return 'kg' }
}

export function setUnit(u: Unit) {
  try { localStorage.setItem(KEY, u) } catch { /* noop */ }
  window.dispatchEvent(new Event(EVENT))
}

/** Unidad elegida en Ajustes (por dispositivo). Los datos siempre se guardan en kg. */
export function useUnit(): Unit {
  return useSyncExternalStore(
    (cb) => { window.addEventListener(EVENT, cb); return () => window.removeEventListener(EVENT, cb) },
    read,
  )
}

export const kgTo = (kg: number, u: Unit) => (u === 'kg' ? kg : kg / LB_IN_KG)
export const toKg = (v: number, u: Unit) => (u === 'kg' ? v : v * LB_IN_KG)

/** Redondeo a discos: 0,5 kg o 1 lb. */
export function roundLoad(v: number, u: Unit) {
  const step = u === 'kg' ? 0.5 : 1
  return Math.round(v / step) * step
}

export const formatLoad = (kg: number, u: Unit) =>
  `${roundLoad(kgTo(kg, u), u).toLocaleString('es-AR')} ${u}`
