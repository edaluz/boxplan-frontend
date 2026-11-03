import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { api, unwrap } from '../api/client'
import Avatar from '../components/Avatar'
import ErrorText from '../components/ErrorText'
import { resizeToSquare } from '../lib/resizeImage'
import { meKey, useMe } from '../lib/useMe'
import UnitSettings from './SettingsPage'

export default function ProfilePage() {
  const qc = useQueryClient()
  const me = useMe()
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [fileError, setFileError] = useState<string | null>(null)

  useEffect(() => { if (me.data) setName(me.data.name) }, [me.data])

  const onSaved = (data: NonNullable<typeof me.data>) => {
    qc.setQueryData(meKey, data)
    qc.invalidateQueries({ queryKey: ['ranking'] })
  }

  const saveName = useMutation({
    mutationFn: () => unwrap(api.PATCH('/me', { body: { name: name.trim() } })),
    onSuccess: onSaved,
  })
  const upload = useMutation({
    mutationFn: (image: string) => unwrap(api.PUT('/me/avatar', { body: { image } })),
    onSuccess: onSaved,
  })
  const remove = useMutation({
    mutationFn: () => unwrap(api.DELETE('/me/avatar')),
    onSuccess: onSaved,
  })

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setFileError(null)
    try {
      upload.mutate(await resizeToSquare(file))
    } catch {
      setFileError('No se pudo leer la imagen. Probá con otra (JPG o PNG).')
    }
  }

  if (me.isLoading) return <p className="text-zinc-400">Cargando…</p>
  if (!me.data) return <ErrorText error={me.error} />
  const u = me.data

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h2 className="text-xl font-bold">Perfil</h2>

      <section className="card flex flex-col items-center gap-3">
        <Avatar url={u.avatarUrl} name={u.name} size={96} />
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
            {upload.isPending ? 'Subiendo…' : 'Cambiar foto'}
          </button>
          {u.hasUploadedAvatar && (
            <button className="btn-ghost" onClick={() => remove.mutate()} disabled={remove.isPending}>
              {u.hasGoogle ? 'Usar foto de Google' : 'Quitar foto'}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        <ErrorText error={fileError ?? upload.error ?? remove.error} />
      </section>

      <form className="card space-y-3" onSubmit={(e) => { e.preventDefault(); saveName.mutate() }}>
        <div>
          <label>Nombre visible</label>
          <input value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre o un alias" />
          <p className="mt-1 text-xs text-zinc-500">Es como te ven los demás en grupos y rankings.</p>
        </div>
        <div>
          <label>Email</label>
          <input value={u.email} disabled className="opacity-60" />
        </div>
        <p className="text-xs text-zinc-500">
          {u.hasGoogle ? 'Cuenta vinculada con Google' : 'Cuenta con email y contraseña'}
          {u.hasGoogle && u.hasPassword ? ' · también con contraseña' : ''}
        </p>
        <ErrorText error={saveName.error} />
        <button className="btn-primary w-full" disabled={!name.trim() || name.trim() === u.name || saveName.isPending}>
          {saveName.isSuccess && name.trim() === u.name ? 'Guardado ✓' : 'Guardar'}
        </button>
      </form>

      <UnitSettings />
    </div>
  )
}
