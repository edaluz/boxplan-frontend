import { useState } from 'react'
import BlockView from '../components/BlockView'
import ErrorText from '../components/ErrorText'
import BlockScores from '../components/BlockScores'
import { addDays, formatDay, startOfWeek, today } from '../lib/dates'
import { useWorkouts } from '../lib/useWorkouts'

type Mode = 'day' | 'week'
const MODE_KEY = 'boxplan.athleteView'
const readMode = (): Mode => {
  try { return localStorage.getItem(MODE_KEY) === 'week' ? 'week' : 'day' } catch { return 'day' }
}

/** Vista del alumno: Día (cargar score) o Semana (ver la planificación). */
export default function AthleteDay({ groupId }: { groupId: string }) {
  const [mode, setModeState] = useState<Mode>(readMode)
  const [day, setDay] = useState(today)
  const setMode = (m: Mode) => {
    setModeState(m)
    try { localStorage.setItem(MODE_KEY, m) } catch { /* noop */ }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex rounded-lg border border-zinc-800 p-1">
        {(['day', 'week'] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 rounded-md py-1.5 text-sm font-semibold transition ${mode === m ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}>
            {m === 'day' ? 'Día' : 'Semana'}
          </button>
        ))}
      </div>
      {mode === 'day'
        ? <DayView groupId={groupId} day={day} setDay={setDay} />
        : <WeekView groupId={groupId} initialDay={day} onPickDay={(d) => { setDay(d); setMode('day') }} />}
    </div>
  )
}

function DayView({ groupId, day, setDay }: { groupId: string; day: string; setDay: (d: string) => void }) {
  const q = useWorkouts(groupId, day, day)

  return (
    <>
      <div className="flex items-center justify-between">
        <button className="btn-ghost" onClick={() => setDay(addDays(day, -1))}>←</button>
        <div className="text-center">
          <p className="font-bold capitalize">{day === today() ? 'Hoy' : formatDay(day)}</p>
          {day === today() && <p className="text-xs capitalize text-zinc-400">{formatDay(day)}</p>}
        </div>
        <button className="btn-ghost" onClick={() => setDay(addDays(day, 1))}>→</button>
      </div>

      {q.isLoading && <p className="text-zinc-400">Cargando…</p>}
      <ErrorText error={q.error} />
      {q.data?.length === 0 && <p className="card text-center text-zinc-400">No hay planificación para este día.</p>}

      {q.data?.map((w) => (
        <article key={w.id} className="card space-y-5">
          {w.title && <h3 className="text-lg font-bold">{w.title}</h3>}
          {w.blocks.map((b) => (
            <BlockView key={b.id} block={b} calculator>
              {b.scoreType && <BlockScores blockId={b.id} scoreType={b.scoreType} />}
            </BlockView>
          ))}
        </article>
      ))}
    </>
  )
}

function WeekView({ groupId, initialDay, onPickDay }: {
  groupId: string
  initialDay: string
  onPickDay: (day: string) => void
}) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(initialDay))
  const weekEnd = addDays(weekStart, 6)
  const q = useWorkouts(groupId, weekStart, weekEnd)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <>
      <div className="flex items-center justify-between">
        <button className="btn-ghost" onClick={() => setWeekStart(addDays(weekStart, -7))}>←</button>
        <button className="text-center" onClick={() => setWeekStart(startOfWeek(today()))}>
          <p className="font-bold">{weekStart === startOfWeek(today()) ? 'Esta semana' : 'Semana'}</p>
          <p className="text-xs text-zinc-400">
            {formatDay(weekStart, { day: 'numeric', month: 'short' })} – {formatDay(weekEnd, { day: 'numeric', month: 'short' })}
          </p>
        </button>
        <button className="btn-ghost" onClick={() => setWeekStart(addDays(weekStart, 7))}>→</button>
      </div>

      {q.isLoading && <p className="text-zinc-400">Cargando…</p>}
      <ErrorText error={q.error} />

      {q.data && days.map((d) => {
        const workouts = q.data.filter((w) => w.date === d)
        const isToday = d === today()
        if (!workouts.length) {
          return (
            <div key={d} className="flex items-center justify-between rounded-lg border border-zinc-900 px-4 py-2 text-sm text-zinc-500">
              <span className="capitalize">{formatDay(d, { weekday: 'long', day: 'numeric' })}</span>
              <span>Sin planificación</span>
            </div>
          )
        }
        return (
          <section key={d} className={`card space-y-4 ${isToday ? 'border-lime-400/50' : ''}`}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold capitalize">
                {formatDay(d, { weekday: 'long', day: 'numeric' })}
                {isToday && <span className="ml-2 text-xs font-semibold text-lime-400">HOY</span>}
              </h3>
              <button className="btn-ghost px-2 py-1 text-xs" onClick={() => onPickDay(d)}>Ver día →</button>
            </div>
            {workouts.map((w) => (
              <div key={w.id} className="space-y-3">
                {w.title && <p className="font-semibold text-lime-300">{w.title}</p>}
                {w.blocks.map((b) => <BlockView key={b.id} block={b} />)}
              </div>
            ))}
          </section>
        )
      })}
    </>
  )
}
