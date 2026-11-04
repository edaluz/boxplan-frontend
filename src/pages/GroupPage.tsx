import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { api, unwrap } from '../api/client'
import ErrorText from '../components/ErrorText'
import MembersPanel from '../components/MembersPanel'
import AthleteDay from './AthleteDay'
import CoachWeek from './CoachWeek'
import { RoleBadge, useMyGroups } from './GroupsPage'

export default function GroupPage() {
  const { groupId = '' } = useParams()
  const groups = useMyGroups()
  const group = groups.data?.find((g) => g.id === groupId)
  const [showMembers, setShowMembers] = useState(false)

  if (groups.isLoading) return <p className="text-zinc-400">Cargando…</p>
  if (!group) return <p>Grupo no encontrado. <Link className="underline" to="/">Volver</Link></p>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/" className="text-zinc-400 hover:text-zinc-200">←</Link>
        <h2 className="text-xl font-bold">{group.name}</h2>
        <RoleBadge role={group.role} />
        {group.role === 'COACH' && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button className={showMembers ? 'btn-primary' : 'btn-ghost'} onClick={() => setShowMembers(!showMembers)}>
              Miembros
            </button>
            <InviteButton groupId={groupId} groupName={group.name} />
          </div>
        )}
      </div>
      {group.role === 'COACH' && showMembers && <MembersPanel groupId={groupId} />}
      {group.role === 'COACH' ? <CoachWeek groupId={groupId} /> : <AthleteDay groupId={groupId} />}
    </div>
  )
}

function InviteButton({ groupId, groupName }: { groupId: string; groupName: string }) {
  const m = useMutation({
    mutationFn: (role: 'ATHLETE' | 'COACH') =>
      unwrap(api.POST('/groups/{id}/invites', { params: { path: { id: groupId } }, body: { role } })),
  })
  return (
    <div className="flex items-center gap-2">
      {m.data ? (
        <>
          <span className="text-xs text-zinc-400">{m.data.role === 'COACH' ? 'Link de coach:' : 'Link de alumno:'}</span>
          <InviteChip code={m.data.code} groupName={groupName} expiresAt={m.data.expiresAt} asCoach={m.data.role === 'COACH'} />
          <button className="px-1 text-zinc-500 hover:text-zinc-200" title="Generar otro" onClick={() => m.reset()}>✕</button>
        </>
      ) : (
        <>
          <button className="btn-ghost" onClick={() => m.mutate('ATHLETE')} disabled={m.isPending}>Invitar alumnos</button>
          <button className="btn-ghost" onClick={() => m.mutate('COACH')} disabled={m.isPending}>Invitar coach</button>
        </>
      )}
      <ErrorText error={m.error} />
    </div>
  )
}

/** Código como botón: en celular abre "Compartir"; en desktop copia el link. */
function InviteChip({ code, groupName, expiresAt, asCoach }: { code: string; groupName: string; expiresAt: string; asCoach: boolean }) {
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}/join/${code}`
  const text = asCoach
    ? `Sumate como coach de ${groupName} en Boxplan: ${link}`
    : `Sumate a ${groupName} en Boxplan: ${link}`
  const isTouch = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches

  const onClick = async () => {
    if (isTouch && navigator.share) {
      try { await navigator.share({ title: 'Boxplan', text }); return } catch (e) {
        if ((e as Error).name === 'AbortError') return
      }
    }
    await copyText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button onClick={onClick} title={`Vence ${new Date(expiresAt).toLocaleDateString('es-AR')}`}
      className="btn border border-lime-400/50 bg-lime-400/10 font-mono text-lime-200 hover:bg-lime-400/20">
      {copied ? '¡Link copiado!' : code}
      <span aria-hidden className="ml-2 font-sans">{isTouch ? '↗' : '⧉'}</span>
    </button>
  )
}

/** Portapapeles con fallback para http sin HTTPS (ej. celular por IP local). */
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
}
