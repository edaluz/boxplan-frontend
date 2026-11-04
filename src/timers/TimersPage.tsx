import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import TimerRun, { type Routine } from './TimerRun'
import {
  buildPlan, DEFAULTS, describe, fmtClock, fmtDuration, TIMER_META, totalMs,
  type TimerConfig, type TimerKind,
} from './plan'

const KINDS: TimerKind[] = ['AMRAP', 'FOR_TIME', 'EMOM', 'TABATA']
const cfgKey = (k: TimerKind) => `boxplan.timer.${k}`

function loadConfig<K extends TimerKind>(k: K): Extract<TimerConfig, { kind: K }> {
  try {
    const raw = localStorage.getItem(cfgKey(k))
    if (raw) return { ...DEFAULTS[k], ...JSON.parse(raw), kind: k }
  } catch { /* noop */ }
  return DEFAULTS[k]
}

const range = (from: number, to: number, step = 1) =>
  Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step)

const MINUTES = range(1, 60)
const EMOM_EVERY = [15, 20, 30, 40, 45, 60, 75, 90, 120, 150, 180, 240, 300]
const SECONDS = range(5, 300, 5)

export default function TimersPage() {
  // Si viene desde un bloque ("Iniciar timer"), arranca directo con esa config
  const navState = useLocation().state as { config?: TimerConfig; routine?: Routine } | null
  const fromBlock = navState?.config ?? null
  const navigate = useNavigate()
  const [kind, setKind] = useState<TimerKind | null>(fromBlock?.kind ?? null)
  const [config, setConfig] = useState<TimerConfig | null>(fromBlock)
  const [running, setRunning] = useState(!!fromBlock)

  const pick = (k: TimerKind) => { setKind(k); setConfig(loadConfig(k)) }
  const update = (c: TimerConfig) => {
    setConfig(c)
    try { localStorage.setItem(cfgKey(c.kind), JSON.stringify(c)) } catch { /* noop */ }
  }

  if (running && config) {
    return <TimerRun config={config} routine={fromBlock ? navState?.routine : undefined} onExit={() => (fromBlock ? navigate(-1) : setRunning(false))} />
  }

  if (!kind || !config) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <h2 className="text-xl font-bold">Timers</h2>
        <div className="space-y-3">
          {KINDS.map((k) => (
            <button key={k} onClick={() => pick(k)}
              className={`flex w-full items-center justify-between rounded-xl px-5 py-4 text-left transition hover:brightness-110 ${TIMER_META[k].color}`}>
              <span className="text-lg font-black uppercase tracking-wide">{TIMER_META[k].name}</span>
              <span className="text-xs font-medium opacity-80">{TIMER_META[k].tagline}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const meta = TIMER_META[kind]
  return (
    <div className="mx-auto max-w-md space-y-5">
      <button className="text-sm text-zinc-400 hover:text-zinc-200" onClick={() => { setKind(null); setConfig(null) }}>← Timers</button>
      <div className="text-center">
        <h2 className="text-3xl font-black uppercase">{meta.name}</h2>
        <p className="text-zinc-400">{describe(config)}</p>
      </div>

      <section className="card space-y-4">
        {config.kind === 'AMRAP' && (
          <Field label="Duración">
            <Picker value={config.minutes} options={MINUTES} format={(m) => `${m} min`} onChange={(minutes) => update({ ...config, minutes })} />
          </Field>
        )}
        {config.kind === 'FOR_TIME' && (
          <Field label="Límite de tiempo">
            <Picker value={config.capMinutes} options={MINUTES} format={(m) => `${m} min`} onChange={(capMinutes) => update({ ...config, capMinutes })} />
          </Field>
        )}
        {config.kind === 'EMOM' && (
          <>
            <Field label="Cada">
              <Picker value={config.everySec} options={EMOM_EVERY} format={(s) => (s < 60 ? `${s} seg` : `${fmtDuration(s)} min`)} onChange={(everySec) => update({ ...config, everySec })} />
            </Field>
            <Field label="Durante">
              <Picker value={config.totalMin} options={MINUTES} format={(m) => `${m} min`} onChange={(totalMin) => update({ ...config, totalMin })} />
            </Field>
          </>
        )}
        {config.kind === 'TABATA' && (
          <>
            <Field label="Rondas">
              <Picker value={config.rounds} options={range(1, 30)} format={String} onChange={(rounds) => update({ ...config, rounds })} />
            </Field>
            <Field label="Trabajo">
              <Picker value={config.workSec} options={SECONDS} format={fmtDuration} onChange={(workSec) => update({ ...config, workSec })} />
            </Field>
            <Field label="Descanso">
              <Picker value={config.restSec} options={[0, ...SECONDS]} format={fmtDuration} onChange={(restSec) => update({ ...config, restSec })} />
            </Field>
          </>
        )}
        <p className="text-center text-sm text-zinc-400">Tiempo total: {fmtClock(totalMs(buildPlan(config)))}</p>
      </section>

      <button className={`w-full rounded-xl py-4 text-lg font-black uppercase tracking-wide transition hover:brightness-110 ${meta.color}`}
        onClick={() => setRunning(true)}>
        Comenzar
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-lg font-semibold">{label}</span>
      <div className="w-40">{children}</div>
    </div>
  )
}

/** Select nativo: en el celular se ve como la ruedita del sistema. */
function Picker({ value, options, format, onChange }: {
  value: number; options: number[]; format: (v: number) => string; onChange: (v: number) => void
}) {
  return (
    <select value={value} onChange={(e) => onChange(Number(e.target.value))} className="text-center text-lg font-bold">
      {options.map((o) => <option key={o} value={o}>{format(o)}</option>)}
    </select>
  )
}
