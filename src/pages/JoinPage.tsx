import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { api } from '../api/client'
import Avatar from '../components/Avatar'
import { clearPendingJoin, setPendingJoin } from '../lib/pendingJoin'
import { useMe } from '../lib/useMe'

/** /join/:code — confirma con qué cuenta unirse y se une al grupo. */
export default function JoinPage() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const me = useMe()

  const join = useMutation({
    mutationFn: async () => {
      const { data, response } = await api.POST('/invites/{code}/join', { params: { path: { code } } })
      return { group: data, status: response.status }
    },
    onSuccess: ({ group, status }) => {
      clearPendingJoin()
      if (group) {
        qc.invalidateQueries({ queryKey: ['me', 'groups'] })
        navigate(`/g/${group.id}`, { replace: true })
      } else if (status === 409) {
        navigate('/', { replace: true, state: { notice: 'Ya sos parte de ese grupo.' } })
      }
    },
  })

  /** Cierra sesión pero conserva la invitación: después del login vuelve acá. */
  const switchAccount = () => {
    setPendingJoin(code)
    window.dispatchEvent(new Event('boxplan:logout'))
  }

  const status = join.data?.status
  if (status && status !== 409 && !join.data?.group) {
    return (
      <div className="card mx-auto max-w-sm space-y-3 text-center">
        <p>{status === 410 ? 'La invitación venció.' : 'La invitación no es válida.'}</p>
        <p className="text-sm text-zinc-400">Pedile a tu coach un código nuevo.</p>
        <Link to="/" className="btn-ghost w-full">Ir a mis grupos</Link>
      </div>
    )
  }

  return (
    <div className="card mx-auto max-w-sm space-y-4 text-center">
      <h2 className="text-lg font-bold">Invitación a un grupo</h2>
      {me.data && (
        <div className="flex items-center justify-center gap-3">
          <Avatar url={me.data.avatarUrl} name={me.data.name} size={40} />
          <div className="text-left">
            <p className="font-semibold">{me.data.name}</p>
            <p className="text-xs text-zinc-400">{me.data.email}</p>
          </div>
        </div>
      )}
      <p className="text-sm text-zinc-400">Te vas a unir como alumno con esta cuenta.</p>
      <button className="btn-primary w-full" onClick={() => join.mutate()} disabled={join.isPending || !me.data}>
        {join.isPending ? 'Uniéndote…' : 'Unirme'}
      </button>
      <button className="btn-ghost w-full" onClick={switchAccount}>Usar otra cuenta</button>
    </div>
  )
}

/** Sin sesión: guarda el código y manda al login. */
export function JoinRedirect() {
  const { code = '' } = useParams()
  setPendingJoin(code)
  return <Navigate to="/login" replace state={{ notice: 'Iniciá sesión o creá tu cuenta para unirte al grupo.' }} />
}
