import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { api, currentUserId, unwrap, type Division, type ScoreType } from '../api/client'
import { DIVISIONS, formatScore, parseTime, SCORE_LABEL } from '../lib/scores'
import { kgTo, roundLoad, toKg, useUnit } from '../lib/units'
import ErrorText from './ErrorText'
import { rankingKey } from './Ranking'

export default function ScoreForm({ blockId, scoreType }: { blockId: string; scoreType: ScoreType }) {
  const qc = useQueryClient()
  const me = currentUserId()
  const unit = useUnit()
  const ranking = useQuery({
    queryKey: rankingKey(blockId),
    queryFn: () => unwrap(api.GET('/blocks/{id}/scores', { params: { path: { id: blockId } } })),
  })
  const mine = ranking.data?.scores.find((s) => s.userId === me)

  const [value, setValue] = useState('')
  const [division, setDivision] = useState<Division>('NA')
  const [description, setDescription] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!mine) return
    setValue(
      scoreType === 'TIME' ? formatScore('TIME', mine.numericValue)
      : scoreType === 'LOAD' && mine.numericValue != null ? String(roundLoad(kgTo(mine.numericValue, unit), unit))
      : mine.numericValue?.toString() ?? '',
    )
    setDivision(mine.division)
    setDescription(mine.description ?? '')
  }, [mine, scoreType, unit])

  const m = useMutation({
    mutationFn: (numericValue: number | undefined) =>
      unwrap(api.POST('/blocks/{id}/scores', {
        params: { path: { id: blockId } },
        body: { numericValue, division, description: description || undefined },
      })),
    onSuccess: () => qc.invalidateQueries({ queryKey: rankingKey(blockId) }),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    let numericValue: number | undefined
    if (scoreType === 'TIME') {
      const secs = parseTime(value)
      if (!secs) return setLocalError('Tiempo como mm:ss')
      numericValue = secs
    } else if (scoreType !== 'TEXT') {
      numericValue = Number(value.replace(',', '.'))
      if (!value || !Number.isFinite(numericValue)) return setLocalError('Ingresá un número')
      if (scoreType === 'LOAD') numericValue = Math.round(toKg(numericValue, unit) * 1000) / 1000
    }
    m.mutate(numericValue)
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2 rounded-md bg-zinc-900 p-3">
      <div className="flex gap-2">
        {scoreType !== 'TEXT' && (
          <div className="flex-1">
            <label>{SCORE_LABEL[scoreType]}{scoreType === 'LOAD' ? ` (${unit})` : ''}</label>
            <input
              inputMode={scoreType === 'TIME' ? 'text' : 'decimal'}
              placeholder={scoreType === 'TIME' ? '5:12' : scoreType === 'LOAD' ? '80' : '150'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        )}
        <div className={scoreType === 'TEXT' ? 'flex-1' : 'w-36'}>
          <label>Modalidad</label>
          <select value={division} onChange={(e) => setDivision(e.target.value as Division)}>
            {DIVISIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label>Descripción{scoreType === 'TEXT' ? '' : ' (opcional)'}</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Cómo te fue, escalas, etc." />
      </div>
      <ErrorText error={localError ?? m.error} />
      <button className="btn-primary w-full" disabled={m.isPending}>
        {mine ? 'Actualizar mi score' : 'Cargar score'}
      </button>
    </form>
  )
}
