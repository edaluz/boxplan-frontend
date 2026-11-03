import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useFieldArray, useForm, useWatch, type Control, type UseFormRegister } from 'react-hook-form'
import { z } from 'zod'
import { api, unwrap, type Workout } from '../api/client'
import { formatDay } from '../lib/dates'
import { SCORE_LABEL } from '../lib/scores'
import { workoutsKey } from '../lib/useWorkouts'
import ErrorText from './ErrorText'

const BLOCK_TYPES = ['FREE', 'STRENGTH', 'AMRAP', 'EMOM', 'FOR_TIME'] as const
const SCORE_TYPES = ['TIME', 'REPS', 'ROUNDS_REPS', 'LOAD', 'TEXT'] as const

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().trim().min(1, 'Poné un título'),
  blocks: z.array(z.object({
    id: z.string().optional(),
    type: z.enum(BLOCK_TYPES),
    title: z.string().optional(),
    content: z.string(),
    movement: z.string(),
    sets: z.array(z.object({ sets: z.string(), reps: z.string(), percent: z.string() })),
    scoreType: z.enum(SCORE_TYPES).or(z.literal('')),
  }).refine((b) => b.content.trim() || b.sets.some((s) => s.reps.trim()), {
    message: 'Escribí el contenido o cargá series', path: ['content'],
  })),
})
type Form = z.infer<typeof schema>

const emptyBlock = (): Form['blocks'][number] => ({ type: 'FREE', title: '', content: '', movement: '', sets: [], scoreType: '' })
const emptySet = () => ({ sets: '1', reps: '', percent: '' })

const MOVEMENTS = [
  'Snatch', 'Power snatch', 'Hang snatch', 'Snatch pull', 'Overhead squat',
  'Clean', 'Power clean', 'Hang clean', 'Clean & Jerk', 'Jerk', 'Push jerk', 'Split jerk', 'Clean pull',
  'Back squat', 'Front squat', 'Deadlift', 'Bench press', 'Strict press', 'Push press',
]

export default function WorkoutEditor({ groupId, date, workout, onClose }: {
  groupId: string
  date: string
  workout?: Workout
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { register, control, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: workout
      ? {
          date: workout.date,
          title: workout.title,
          blocks: workout.blocks.map((b) => ({
            id: b.id, type: b.type, title: b.title ?? '', content: b.content, movement: b.movement ?? '',
            sets: (b.sets ?? []).map((s) => ({ sets: String(s.sets), reps: s.reps, percent: s.percent?.toString() ?? '' })),
            scoreType: b.scoreType ?? '',
          })),
        }
      : { date, title: '', blocks: [{ ...emptyBlock(), title: 'Warm-up' }, { ...emptyBlock(), type: 'FOR_TIME', title: 'WOD', scoreType: 'TIME' }] },
  })
  const blocks = useFieldArray({ control, name: 'blocks' })

  const save = useMutation({
    mutationFn: (f: Form) => {
      const body = {
        date: f.date,
        title: f.title,
        blocks: f.blocks.map((b) => ({
          ...(b.id ? { id: b.id } : {}),
          type: b.type,
          title: b.title || undefined,
          content: b.content,
          movement: b.type === 'STRENGTH' ? b.movement || undefined : undefined,
          sets: b.type === 'STRENGTH'
            ? b.sets.filter((s) => s.reps.trim()).map((s) => ({
                sets: Number(s.sets) || 1,
                reps: s.reps.trim(),
                percent: s.percent ? Number(s.percent.replace(',', '.')) : undefined,
              }))
            : undefined,
          scoreType: b.scoreType || undefined,
        })),
      }
      return workout
        ? unwrap(api.PUT('/workouts/{id}', { params: { path: { id: workout.id } }, body }))
        : unwrap(api.POST('/groups/{id}/workouts', { params: { path: { id: groupId } }, body }))
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: workoutsKey(groupId) }); onClose() },
  })

  const remove = useMutation({
    mutationFn: () => unwrap(api.DELETE('/workouts/{id}', { params: { path: { id: workout!.id } } })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: workoutsKey(groupId) }); onClose() },
  })

  return (
    <div className="fixed inset-0 z-10 flex justify-center overflow-y-auto bg-black/70 p-4" onClick={onClose}>
      <form className="card my-8 h-fit w-full max-w-2xl space-y-4 bg-zinc-900" onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit((f) => save.mutate(f))}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold capitalize">{workout ? 'Editar' : 'Nuevo'} · {formatDay(date)}</h3>
          <button type="button" className="text-zinc-400 hover:text-zinc-100" onClick={onClose}>✕</button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label>Título</label>
            <input {...register('title')} placeholder="Lunes pesado" />
            <ErrorText error={formState.errors.title?.message} />
          </div>
          <div><label>Fecha</label><input type="date" {...register('date')} /></div>
        </div>

        <div className="space-y-3">
          {blocks.fields.map((field, i) => (
            <div key={field.id} className="space-y-2 rounded-md border border-zinc-800 p-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="col-span-2 sm:col-span-2">
                  <label>Bloque {i + 1}</label>
                  <input {...register(`blocks.${i}.title`)} placeholder="Warm-up, Strength, WOD…" />
                </div>
                <div>
                  <label>Tipo</label>
                  <select {...register(`blocks.${i}.type`)}>
                    {BLOCK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label>Score</label>
                  <select {...register(`blocks.${i}.scoreType`)}>
                    <option value="">Sin score</option>
                    {SCORE_TYPES.map((t) => <option key={t} value={t}>{SCORE_LABEL[t]}</option>)}
                  </select>
                </div>
              </div>
              <StrengthFields control={control} register={register} index={i} />
              <textarea rows={3} {...register(`blocks.${i}.content`)} placeholder={'21-15-9\nThrusters 43/30kg\nPull-ups'} />
              <ErrorText error={formState.errors.blocks?.[i]?.content?.message} />
              <div className="flex gap-2 text-xs">
                <button type="button" className="btn-ghost px-2 py-1" disabled={i === 0} onClick={() => blocks.move(i, i - 1)}>↑</button>
                <button type="button" className="btn-ghost px-2 py-1" disabled={i === blocks.fields.length - 1} onClick={() => blocks.move(i, i + 1)}>↓</button>
                <button type="button" className="btn-danger ml-auto px-2 py-1" onClick={() => blocks.remove(i)}>Quitar</button>
              </div>
            </div>
          ))}
          <button type="button" className="btn-ghost w-full" onClick={() => blocks.append(emptyBlock())}>+ Agregar bloque</button>
        </div>

        <ErrorText error={save.error ?? remove.error} />
        <div className="flex gap-2">
          {workout && (
            <button type="button" className="btn-danger" disabled={remove.isPending}
              onClick={() => confirm('¿Borrar este workout y sus scores?') && remove.mutate()}>
              Borrar
            </button>
          )}
          <button className="btn-primary ml-auto" disabled={save.isPending}>Guardar</button>
        </div>
      </form>
    </div>
  )
}

/** Movimiento + ruta de series; solo en bloques de Fuerza. */
function StrengthFields({ control, register, index }: {
  control: Control<Form>
  register: UseFormRegister<Form>
  index: number
}) {
  const type = useWatch({ control, name: `blocks.${index}.type` })
  const rows = useFieldArray({ control, name: `blocks.${index}.sets` })
  const current = useWatch({ control, name: `blocks.${index}.sets` })
  if (type !== 'STRENGTH') return null

  /** Nueva fila = copia de la anterior con +10% (50 → 60). */
  const addRow = () => {
    const last = current?.at(-1)
    if (!last) return rows.append(emptySet())
    const pct = Number(last.percent.replace(',', '.'))
    rows.append({ ...last, percent: last.percent && Number.isFinite(pct) ? String(Math.min(pct + 10, 150)) : last.percent })
  }

  return (
    <div className="space-y-2 rounded-md bg-zinc-950/60 p-2">
      <div>
        <label>Movimiento</label>
        <input list="movements" placeholder="Snatch, Clean & Jerk…" {...register(`blocks.${index}.movement`)} />
        <datalist id="movements">{MOVEMENTS.map((m) => <option key={m} value={m} />)}</datalist>
      </div>
      {rows.fields.length > 0 && (
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs text-zinc-400">
          <span>Series</span><span>Reps</span><span>% 1RM</span><span />
        </div>
      )}
      {rows.fields.map((f, j) => (
        <div key={f.id} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
          <input inputMode="numeric" {...register(`blocks.${index}.sets.${j}.sets`)} />
          <input placeholder="2 o 1+1" {...register(`blocks.${index}.sets.${j}.reps`)} />
          <input inputMode="decimal" placeholder="60" {...register(`blocks.${index}.sets.${j}.percent`)} />
          <button type="button" className="px-2 text-zinc-500 hover:text-red-300" onClick={() => rows.remove(j)}>✕</button>
        </div>
      ))}
      <button type="button" className="btn-ghost w-full px-2 py-1 text-xs" onClick={addRow}>+ Serie</button>
    </div>
  )
}
