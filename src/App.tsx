import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router'
import { tokens } from './api/client'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import GroupPage from './pages/GroupPage'
import GroupsPage from './pages/GroupsPage'
import JoinPage, { JoinRedirect } from './pages/JoinPage'
import LoginPage from './pages/LoginPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import Avatar from './components/Avatar'
import { postLoginPath } from './lib/pendingJoin'
import { useMe } from './lib/useMe'
import ProfilePage from './pages/ProfilePage'
import TimersPage from './timers/TimersPage'

export default function App() {
  const [authed, setAuthed] = useState(() => !!tokens.access)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const logout = () => {
    tokens.clear()
    qc.clear()
    setAuthed(false)
    navigate('/login')
  }

  useEffect(() => {
    window.addEventListener('boxplan:logout', logout)
    return () => window.removeEventListener('boxplan:logout', logout)
  })

  if (!authed) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onAuthed={() => setAuthed(true)} />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/join/:code" element={<JoinRedirect />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16">
      <header className="flex items-center justify-between py-4">
        <a href="/" className="text-lg font-black tracking-tight">
          BOX<span className="text-lime-400">PLAN</span>
        </a>
        <div className="flex gap-2">
          <Link to="/timers" className="btn-ghost" title="Timers">⏱<span className="ml-1.5">Timers</span></Link>
          <ProfileLink />
          <button className="btn-ghost" onClick={logout}>Salir</button>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<GroupsPage />} />
        <Route path="/g/:groupId" element={<GroupPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/timers" element={<TimersPage />} />
        <Route path="/join/:code" element={<JoinPage />} />
        <Route path="/ajustes" element={<Navigate to="/perfil" replace />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        {/* Incluye /login tras autenticarse: va a la invitación pendiente o a inicio */}
        <Route path="*" element={<Navigate to={postLoginPath()} replace />} />
      </Routes>
    </div>
  )
}

function ProfileLink() {
  const me = useMe()
  return (
    <Link to="/perfil" className="btn-ghost gap-2 py-1.5 pl-1.5" title="Perfil">
      <Avatar url={me.data?.avatarUrl} name={me.data?.name ?? ''} size={28} />
      <span className="hidden max-w-32 truncate sm:inline">{me.data?.name ?? 'Perfil'}</span>
    </Link>
  )
}
