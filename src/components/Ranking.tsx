import { useQuery } from '@tanstack/react-query'
import { api, unwrap } from '../api/client'
import { divisionLabel, formatScore } from '../lib/scores'
import { useUnit } from '../lib/units'
import Avatar from './Avatar'
import ErrorText from './ErrorText'

export const rankingKey = (blockId: string) => ['ranking', blockId]

export default function Ranking({ blockId, highlightUserId }: { blockId: string; highlightUserId?: string }) {
  const unit = useUnit()
  const q = useQuery({
    queryKey: rankingKey(blockId),
    queryFn: () => unwrap(api.GET('/blocks/{id}/scores', { params: { path: { id: blockId } } })),
  })
  if (q.isLoading) return <p className="text-sm text-zinc-400">Cargando ranking…</p>
  if (q.error) return <ErrorText error={q.error} />
  const r = q.data!
  if (!r.scores.length) return <p className="text-sm text-zinc-500">Todavía nadie cargó score.</p>

  return (
    <ol className="divide-y divide-zinc-800 text-sm">
      {r.scores.map((s) => (
        <li key={s.id} className={`flex gap-3 py-1.5 ${s.userId === highlightUserId ? 'text-lime-300' : ''}`}>
          <span className="w-6 text-right text-zinc-500">{s.position ?? '·'}</span>
          <Avatar url={s.userAvatarUrl} name={s.userName} size={24} />
          <span className="flex-1">
            <span className="font-medium">{s.userName}</span>
            {s.description && <span className="block text-xs text-zinc-400">{s.description}</span>}
          </span>
          {r.scoreType !== 'TEXT' && <span className="font-mono">{formatScore(r.scoreType, s.numericValue, unit)}</span>}
          {s.division !== 'NA' && <span className="text-xs font-bold text-lime-400">{divisionLabel(s.division)}</span>}
        </li>
      ))}
    </ol>
  )
}
