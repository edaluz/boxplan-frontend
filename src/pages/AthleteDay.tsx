import { useState } from 'react'
import { currentUserId } from '../api/client'
import BlockView from '../components/BlockView'
import ErrorText from '../components/ErrorText'
import Ranking from '../components/Ranking'
import ScoreForm from '../components/ScoreForm'
import { addDays, formatDay, today } from '../lib/dates'
import { useWorkouts } from '../lib/useWorkouts'

export default function AthleteDay({ groupId }: { groupId: string }) {
  const [day, setDay] = useState(today)
  const q = useWorkouts(groupId, day, day)
  const me = currentUserId()

  return (
    <div className="mx-auto max-w-xl space-y-4">
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
          <h3 className="text-lg font-bold">{w.title}</h3>
          {w.blocks.map((b) => (
            <BlockView key={b.id} block={b} calculator>
              {b.scoreType && (
                <>
                  <ScoreForm blockId={b.id} scoreType={b.scoreType} />
                  <div className="mt-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Ranking</p>
                    <Ranking blockId={b.id} highlightUserId={me} />
                  </div>
                </>
              )}
            </BlockView>
          ))}
        </article>
      ))}
    </div>
  )
}
