import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, currentUserId, unwrap } from '../api/client'
import Avatar from './Avatar'
import ErrorText from './ErrorText'

export const membersKey = (groupId: string) => ['members', groupId]

/** Lista de miembros; el coach puede cambiar roles y quitar (salvo al creador y a sí mismo). */
export default function MembersPanel({ groupId }: { groupId: string }) {
  const qc = useQueryClient()
  const me = currentUserId()
  const q = useQuery({
    queryKey: membersKey(groupId),
    queryFn: () => unwrap(api.GET('/groups/{id}/members', { params: { path: { id: groupId } } })),
  })
  const onDone = (data: NonNullable<typeof q.data>) => qc.setQueryData(membersKey(groupId), data)

  const setRole = useMutation({
    mutationFn: (v: { userId: string; role: 'COACH' | 'ATHLETE' }) =>
      unwrap(api.PATCH('/groups/{id}/members/{userId}', {
        params: { path: { id: groupId, userId: v.userId } }, body: { role: v.role },
      })),
    onSuccess: onDone,
  })
  const remove = useMutation({
    mutationFn: (userId: string) =>
      unwrap(api.DELETE('/groups/{id}/members/{userId}', { params: { path: { id: groupId, userId } } })),
    onSuccess: onDone,
  })

  const coaches = q.data?.filter((m) => m.role === 'COACH').length ?? 0
  return (
    <section className="card space-y-3">
      <h3 className="font-semibold">
        Miembros {q.data && <span className="text-sm font-normal text-zinc-400">· {coaches} coach{coaches === 1 ? '' : 'es'}, {q.data.length - coaches} alumno{q.data.length - coaches === 1 ? '' : 's'}</span>}
      </h3>
      {q.isLoading && <p className="text-sm text-zinc-400">Cargando…</p>}
      <ErrorText error={q.error ?? setRole.error ?? remove.error} />
      <ul className="divide-y divide-zinc-800">
        {q.data?.map((m) => {
          const locked = m.isOwner || m.userId === me
          return (
            <li key={m.userId} className="flex flex-wrap items-center gap-3 py-2">
              <Avatar url={m.avatarUrl} name={m.name} size={32} />
              <span className="min-w-0 flex-1 truncate">
                {m.name}
                {m.userId === me && <span className="text-zinc-500"> (vos)</span>}
              </span>
              <span className={`rounded px-2 py-0.5 text-xs font-bold ${m.role === 'COACH' ? 'bg-lime-400 text-zinc-950' : 'bg-zinc-700'}`}>
                {m.isOwner ? 'CREADOR' : m.role === 'COACH' ? 'COACH' : 'ALUMNO'}
              </span>
              {!locked && (
                <span className="flex gap-1">
                  <button className="btn-ghost px-2 py-1 text-xs" disabled={setRole.isPending}
                    onClick={() => setRole.mutate({ userId: m.userId, role: m.role === 'COACH' ? 'ATHLETE' : 'COACH' })}>
                    {m.role === 'COACH' ? 'Pasar a alumno' : 'Hacer coach'}
                  </button>
                  <button className="btn-danger px-2 py-1 text-xs" disabled={remove.isPending}
                    onClick={() => confirm(`¿Quitar a ${m.name} del grupo?`) && remove.mutate(m.userId)}>
                    Quitar
                  </button>
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
