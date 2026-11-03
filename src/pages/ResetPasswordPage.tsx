import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { api, unwrap } from '../api/client'
import ErrorText from '../components/ErrorText'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const m = useMutation({
    mutationFn: () => unwrap(api.POST('/auth/reset-password', { body: { token, password } })),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    if (password.length < 8) return setLocalError('Mínimo 8 caracteres')
    if (password !== confirm) return setLocalError('Las contraseñas no coinciden')
    m.mutate()
  }

  return (
    <div className="mx-auto mt-24 max-w-sm px-4">
      <h1 className="mb-6 text-center text-2xl font-bold">Contraseña nueva</h1>
      {!token ? (
        <p className="card text-center">Link inválido. <Link className="underline" to="/forgot-password">Pedí uno nuevo</Link>.</p>
      ) : m.isSuccess ? (
        <div className="card space-y-4 text-center">
          <p>¡Listo! Ya podés entrar con tu contraseña nueva.</p>
          <Link to="/login" className="btn-primary w-full">Ir al login</Link>
        </div>
      ) : (
        <form className="card space-y-4" onSubmit={submit}>
          <div>
            <label>Contraseña nueva</label>
            <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <label>Repetila</label>
            <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <ErrorText error={localError ?? m.error} />
          {m.error && <Link className="block text-center text-sm underline" to="/forgot-password">Pedir un link nuevo</Link>}
          <button className="btn-primary w-full" disabled={m.isPending}>Guardar contraseña</button>
        </form>
      )}
    </div>
  )
}
