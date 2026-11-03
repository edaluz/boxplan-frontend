import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { api, unwrap } from '../api/client'
import ErrorText from '../components/ErrorText'

export const useMyGroups = () =>
  useQuery({ queryKey: ['me', 'groups'], queryFn: () => unwrap(api.GET('/me/groups')) })

export default function GroupsPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const groups = useMyGroups()
  const notice = (useLocation().state as { notice?: string } | null)?.notice
  const [name, setName] = useState('')
  const [code, setCode] = useState('')

  const create = useMutation({
    mutationFn: () => unwrap(api.POST('/groups', { body: { name } })),
    onSuccess: (g) => { qc.invalidateQueries({ queryKey: ['me', 'groups'] }); navigate(`/g/${g.id}`) },
  })
  const join = useMutation({
    mutationFn: () => unwrap(api.POST('/invites/{code}/join', { params: { path: { code: code.trim().split('/join/').pop()!.replace(/\/$/, '') } } })),
    onSuccess: (g) => { qc.invalidateQueries({ queryKey: ['me', 'groups'] }); navigate(`/g/${g.id}`) },
  })

  return (
    <div className="space-y-6">
      {notice && <p className="rounded-md border border-lime-400/40 bg-lime-400/10 p-3 text-sm text-lime-200">{notice}</p>}
      <section>
        <h2 className="mb-3 text-xl font-bold">Mis grupos</h2>
        {groups.isLoading && <p className="text-zinc-400">Cargando…</p>}
        <ErrorText error={groups.error} />
        {groups.data?.length === 0 && <p className="text-zinc-400">Todavía no estás en ningún grupo.</p>}
        <ul className="grid gap-3 sm:grid-cols-2">
          {groups.data?.map((g) => (
            <li key={g.id}>
              <Link to={`/g/${g.id}`} className="card flex items-center justify-between hover:border-zinc-600">
                <span className="font-semibold">{g.name}</span>
                <RoleBadge role={g.role} />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <form className="card space-y-3" onSubmit={(e) => { e.preventDefault(); create.mutate() }}>
          <h3 className="font-semibold">Crear grupo (como coach)</h3>
          <input placeholder="Box Palermo · 7am" value={name} onChange={(e) => setName(e.target.value)} />
          <ErrorText error={create.error} />
          <button className="btn-primary" disabled={!name.trim() || create.isPending}>Crear</button>
        </form>
        <form className="card space-y-3" onSubmit={(e) => { e.preventDefault(); join.mutate() }}>
          <h3 className="font-semibold">Unirme con un código</h3>
          <input placeholder="Código o link de invitación" value={code} onChange={(e) => setCode(e.target.value)} />
          <ErrorText error={join.error} />
          <button className="btn-ghost" disabled={!code.trim() || join.isPending}>Unirme</button>
        </form>
      </div>
    </div>
  )
}

export function RoleBadge({ role }: { role: 'COACH' | 'ATHLETE' }) {
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-bold ${role === 'COACH' ? 'bg-lime-400 text-zinc-950' : 'bg-zinc-700'}`}>
      {role === 'COACH' ? 'COACH' : 'ALUMNO'}
    </span>
  )
}
