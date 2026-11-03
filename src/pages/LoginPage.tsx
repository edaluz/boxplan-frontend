import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation } from 'react-router'
import { z } from 'zod'
import { api, tokens, unwrap } from '../api/client'
import ErrorText from '../components/ErrorText'
import GoogleButton from '../components/GoogleButton'

const schema = z.object({
  name: z.string().optional(),
  email: z.email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})
type Form = z.infer<typeof schema>

export default function LoginPage({ onAuthed }: { onAuthed: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const notice = (useLocation().state as { notice?: string } | null)?.notice
  const { register, handleSubmit, formState } = useForm<Form>({ resolver: zodResolver(schema) })

  const onAuthSuccess = (t: { accessToken: string; refreshToken: string }) => {
    tokens.set(t)
    onAuthed()
  }

  const google = useMutation({
    mutationFn: (idToken: string) => unwrap(api.POST('/auth/google', { body: { idToken } })),
    onSuccess: onAuthSuccess,
  })

  const m = useMutation({
    mutationFn: (f: Form) =>
      mode === 'login'
        ? unwrap(api.POST('/auth/login', { body: { email: f.email, password: f.password } }))
        : unwrap(api.POST('/auth/register', { body: { name: f.name || f.email.split('@')[0], email: f.email, password: f.password } })),
    onSuccess: onAuthSuccess,
  })

  return (
    <div className="mx-auto mt-24 max-w-sm px-4">
      <h1 className="mb-8 text-center text-3xl font-black tracking-tight">
        BOX<span className="text-lime-400">PLAN</span>
      </h1>
      {notice && <p className="mb-4 rounded-md border border-lime-400/40 bg-lime-400/10 p-3 text-center text-sm text-lime-200">{notice}</p>}
      <form className="card space-y-4" onSubmit={handleSubmit((f) => m.mutate(f))}>
        <GoogleButton onCredential={(t) => google.mutate(t)} />
        <ErrorText error={google.error} />
        {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="h-px flex-1 bg-zinc-800" />o con email<span className="h-px flex-1 bg-zinc-800" />
          </div>
        )}
        {mode === 'register' && (
          <div><label>Nombre</label><input {...register('name')} /></div>
        )}
        <div>
          <label>Email</label>
          <input type="email" autoComplete="email" {...register('email')} />
          <ErrorText error={formState.errors.email?.message} />
        </div>
        <div>
          <label>Contraseña</label>
          <input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} {...register('password')} />
          <ErrorText error={formState.errors.password?.message} />
          {mode === 'login' && (
            <Link to="/forgot-password" className="mt-1 block text-right text-xs text-zinc-400 hover:text-zinc-200">
              ¿Olvidaste tu contraseña?
            </Link>
          )}
        </div>
        <ErrorText error={m.error} />
        <button className="btn-primary w-full" disabled={m.isPending}>
          {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
        <button type="button" className="w-full text-sm text-zinc-400 hover:text-zinc-200"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); m.reset() }}>
          {mode === 'login' ? '¿No tenés cuenta? Registrate' : 'Ya tengo cuenta'}
        </button>
      </form>
    </div>
  )
}
