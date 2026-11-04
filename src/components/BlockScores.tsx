import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api, currentUserId, unwrap, type ScoreType } from '../api/client'
import { divisionLabel, formatScore } from '../lib/scores'
import { useUnit } from '../lib/units'
import Ranking, { rankingKey } from './Ranking'
import ScoreForm from './ScoreForm'

/** Score del alumno y ranking del bloque, plegados para no ocupar lugar. */
export default function BlockScores({ blockId, scoreType }: { blockId: string; scoreType: ScoreType }) {
  const me = currentUserId()
  const unit = useUnit()
  const [formOpen, setFormOpen] = useState(false)
  const [rankingOpen, setRankingOpen] = useState(false)
  const q = useQuery({
    queryKey: rankingKey(blockId),
    queryFn: () => unwrap(api.GET('/blocks/{id}/scores', { params: { path: { id: blockId } } })),
  })
  const mine = q.data?.scores.find((s) => s.userId === me)
  const count = q.data?.scores.length ?? 0

  return (
    <div className="mt-3 space-y-2">
      {!formOpen && (
        <div className="flex flex-wrap items-center gap-2 rounded-md bg-zinc-900 px-3 py-2">
          {mine ? (
            <>
              <span className="text-sm">
                <span className="text-zinc-400">Tu score: </span>
                <span className="font-semibold">
                  {scoreType === 'TEXT' ? mine.description : formatScore(scoreType, mine.numericValue, unit)}
                </span>
                {mine.division !== 'NA' && <span className="text-lime-400"> · {divisionLabel(mine.division)}</span>}
                {mine.position != null && <span className="text-zinc-500"> · #{mine.position}</span>}
              </span>
              <button className="ml-auto text-sm font-semibold text-lime-300 hover:text-lime-200" onClick={() => setFormOpen(true)}>
                Editar
              </button>
            </>
          ) : (
            <button className="btn-primary w-full py-1.5" onClick={() => setFormOpen(true)} disabled={q.isLoading}>
              + Cargar score
            </button>
          )}
        </div>
      )}

      {formOpen && (
        <div>
          <ScoreForm blockId={blockId} scoreType={scoreType} onSaved={() => setFormOpen(false)} />
          <button className="mt-1 w-full text-center text-xs text-zinc-500 hover:text-zinc-300" onClick={() => setFormOpen(false)}>
            Cancelar
          </button>
        </div>
      )}

      {count > 0 && (
        <div>
          <button className="text-sm text-zinc-400 hover:text-zinc-200" onClick={() => setRankingOpen(!rankingOpen)}>
            {rankingOpen ? 'Ocultar ranking ▴' : `Ver ranking (${count}) ▾`}
          </button>
          {rankingOpen && <div className="mt-1"><Ranking blockId={blockId} highlightUserId={me} /></div>}
        </div>
      )}
    </div>
  )
}
