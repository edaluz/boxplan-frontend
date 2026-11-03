import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { api, unwrap } from '../api/client'
import ErrorText from '../components/ErrorText'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const m = useMutation({
    mutationFn: () => unwrap(api.POST('/auth/forgot-password', { body: { email: email.trim() } })),
  })

  return (
    <div className="mx-auto mt-24 max-w-sm px-4">
      <h1 className="mb-6 text-center text-2xl font-bold">Olvidé mi contraseña</h1>
      {m.isSuccess ? (
        <div className="card space-y-4 text-center">
          <p>Si existe una cuenta con <b>{email}</b>, te mandamos un mail con un link para elegir una contraseña nueva.</p>
          <p className="text-sm text-zinc-400">El link vence en 1 hora. Revisá también spam.</p>
          <Link to="/login" className="btn-ghost w-full">Volver al login</Link>
        </div>
      ) : (
        <form className="card space-y-4" onSubmit={(e) => { e.preventDefault(); m.mutate() }}>
          <div>
            <label>Email</label>
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <ErrorText error={m.error} />
          <button className="btn-primary w-full" disabled={m.isPending || !email.trim()}>Mandarme el link</button>
          <Link to="/login" className="block text-center text-sm text-zinc-400 hover:text-zinc-200">Volver</Link>
        </form>
      )}
    </div>
  )
}
