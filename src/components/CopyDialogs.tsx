import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api, unwrap, type Workout } from '../api/client'
import { addDays, formatDay, startOfWeek } from '../lib/dates'
import { workoutsKey } from '../lib/useWorkouts'
import { useMyGroups } from '../pages/GroupsPage'
import ErrorText from './ErrorText'

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="card w-full max-w-sm space-y-4 bg-zinc-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button className="text-zinc-400 hover:text-zinc-100" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

/** Duplica un día en otra fecha (y opcionalmente otro grupo donde sos coach). */
export function DuplicateDayDialog({ workout, onClose }: { workout: Workout; onClose: () => void }) {
  const qc = useQueryClient()
  const groups = useMyGroups()
  const coachGroups = groups.data?.filter((g) => g.role === 'COACH') ?? []
  const [date, setDate] = useState(addDays(workout.date, 7))
  const [groupId, setGroupId] = useState(workout.groupId)

  const m = useMutation({
    mutationFn: () => unwrap(api.POST('/workouts/{id}/copy', {
      params: { path: { id: workout.id } },
      body: { date, groupId: groupId === workout.groupId ? undefined : groupId },
    })),
    onSuccess: () => qc.invalidateQueries({ queryKey: workoutsKey(groupId) }),
  })

  return (
    <Modal title="Duplicar día" onClose={onClose}>
      {m.isSuccess ? (
        <>
          <p>Copiado al {formatDay(date)}{groupId !== workout.groupId && ` en ${coachGroups.find((g) => g.id === groupId)?.name}`} ✓</p>
          <button className="btn-primary w-full" onClick={onClose}>Listo</button>
        </>
      ) : (
        <>
          <p className="text-sm capitalize text-zinc-400">Desde el {formatDay(workout.date)} · sin scores</p>
          <div>
            <label>Fecha destino</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          {coachGroups.length > 1 && (
            <div>
              <label>Grupo</label>
              <select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                {coachGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          )}
          <ErrorText error={m.error && /already has a workout/i.test(m.error.message) ? 'Ese día ya tiene planificación' : m.error} />
          <button className="btn-primary w-full" disabled={!date || m.isPending} onClick={() => m.mutate()}>Duplicar</button>
        </>
      )}
    </Modal>
  )
}

/** Copia toda la semana a otra; los días ya planificados se saltean. */
export function CopyWeekDialog({ groupId, weekStart, onClose, onGoToWeek }: {
  groupId: string; weekStart: string; onClose: () => void; onGoToWeek: (weekStart: string) => void
}) {
  const qc = useQueryClient()
  const [target, setTarget] = useState(addDays(weekStart, 7))
  const targetStart = target ? startOfWeek(target) : ''

  const m = useMutation({
    mutationFn: () => unwrap(api.POST('/groups/{id}/workouts/copy-week', {
      params: { path: { id: groupId } },
      body: { fromWeekStart: weekStart, toWeekStart: targetStart },
    })),
    onSuccess: () => qc.invalidateQueries({ queryKey: workoutsKey(groupId) }),
  })
  const range = (start: string) =>
    `${formatDay(start, { day: 'numeric', month: 'short' })} – ${formatDay(addDays(start, 6), { day: 'numeric', month: 'short' })}`

  return (
    <Modal title="Copiar semana" onClose={onClose}>
      {m.data ? (
        <>
          <p>
            {m.data.created.length
              ? `Se copiaron ${m.data.created.length} día${m.data.created.length === 1 ? '' : 's'} a la semana ${range(targetStart)}.`
              : 'No se copió ningún día.'}
          </p>
          {m.data.skipped.length > 0 && (
            <p className="text-sm text-amber-300">
              Salteados porque ya tenían planificación: {m.data.skipped.map((d) => formatDay(d, { weekday: 'short', day: 'numeric' })).join(', ')}
            </p>
          )}
          <div className="flex gap-2">
            <button className="btn-primary flex-1" onClick={() => { onGoToWeek(targetStart); onClose() }}>Ver esa semana</button>
            <button className="btn-ghost" onClick={onClose}>Cerrar</button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-zinc-400">Desde la semana {range(weekStart)} · sin scores</p>
          <div>
            <label>Semana destino (elegí cualquier día)</label>
            <input type="date" value={target} onChange={(e) => setTarget(e.target.value)} />
            {targetStart && <p className="mt-1 text-xs text-zinc-500">Semana {range(targetStart)}</p>}
          </div>
          <p className="text-xs text-zinc-500">Los días que ya tengan planificación se saltean, no se pisa nada.</p>
          <ErrorText error={m.error} />
          <button className="btn-primary w-full" disabled={!targetStart || targetStart === weekStart || m.isPending} onClick={() => m.mutate()}>
            Copiar semana
          </button>
        </>
      )}
    </Modal>
  )
}
