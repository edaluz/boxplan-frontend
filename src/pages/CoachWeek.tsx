import { useState } from 'react'
import type { Workout } from '../api/client'
import BlockView from '../components/BlockView'
import { CopyWeekDialog, DuplicateDayDialog } from '../components/CopyDialogs'
import ErrorText from '../components/ErrorText'
import Ranking from '../components/Ranking'
import WorkoutEditor from '../components/WorkoutEditor'
import { addDays, formatDay, startOfWeek, today } from '../lib/dates'
import { useWorkouts } from '../lib/useWorkouts'

export default function CoachWeek({ groupId }: { groupId: string }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today()))
  const weekEnd = addDays(weekStart, 6)
  const q = useWorkouts(groupId, weekStart, weekEnd)
  const [editing, setEditing] = useState<{ date: string; workout?: Workout } | null>(null)
  const [openRanking, setOpenRanking] = useState<string | null>(null)
  const [duplicating, setDuplicating] = useState<Workout | null>(null)
  const [copyingWeek, setCopyingWeek] = useState(false)

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  // La API devuelve array: puede haber más de uno por día en el futuro (RFC §9)
  const byDate = new Map<string, Workout[]>()
  q.data?.forEach((w) => byDate.set(w.date, [...(byDate.get(w.date) ?? []), w]))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-ghost" onClick={() => setWeekStart(addDays(weekStart, -7))}>←</button>
        <button className="btn-ghost" onClick={() => setWeekStart(startOfWeek(today()))}>Esta semana</button>
        <button className="btn-ghost" onClick={() => setWeekStart(addDays(weekStart, 7))}>→</button>
        <span className="ml-2 text-sm text-zinc-400">
          {formatDay(weekStart, { day: 'numeric', month: 'short' })} – {formatDay(weekEnd, { day: 'numeric', month: 'short' })}
        </span>
        <button className="btn-ghost ml-auto" disabled={!q.data?.length} onClick={() => setCopyingWeek(true)}>⧉ Copiar semana</button>
      </div>
      <ErrorText error={q.error} />

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {days.map((d) => {
          const workouts = byDate.get(d) ?? []
          return (
            <section key={d} className={`card space-y-3 ${d === today() ? 'border-lime-400/50' : ''}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold capitalize">{formatDay(d, { weekday: 'long', day: 'numeric' })}</h3>
                {workouts.length === 0 && (
                  <button className="btn-ghost px-2 py-1 text-xs" onClick={() => setEditing({ date: d })}>+ Planificar</button>
                )}
              </div>
              {q.isLoading && <p className="text-sm text-zinc-500">…</p>}
              {workouts.map((w) => (
                <div key={w.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-lime-300">{w.title || <span className="font-normal text-zinc-500">Planificación</span>}</p>
                    <div className="flex gap-1">
                      <button className="btn-ghost px-2 py-1 text-xs" onClick={() => setDuplicating(w)}>Duplicar</button>
                      <button className="btn-ghost px-2 py-1 text-xs" onClick={() => setEditing({ date: d, workout: w })}>Editar</button>
                    </div>
                  </div>
                  {w.blocks.map((b) => (
                    <BlockView key={b.id} block={b}>
                      {b.scoreType && (
                        <button className="mt-1 text-xs text-zinc-400 underline hover:text-zinc-200"
                          onClick={() => setOpenRanking(openRanking === b.id ? null : b.id)}>
                          {openRanking === b.id ? 'Ocultar scores' : 'Ver scores'}
                        </button>
                      )}
                      {openRanking === b.id && <div className="mt-2"><Ranking blockId={b.id} /></div>}
                    </BlockView>
                  ))}
                </div>
              ))}
            </section>
          )
        })}
      </div>

      {duplicating && <DuplicateDayDialog workout={duplicating} onClose={() => setDuplicating(null)} />}
      {copyingWeek && (
        <CopyWeekDialog groupId={groupId} weekStart={weekStart} onClose={() => setCopyingWeek(false)} onGoToWeek={setWeekStart} />
      )}
      {editing && (
        <WorkoutEditor groupId={groupId} date={editing.date} workout={editing.workout} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}
