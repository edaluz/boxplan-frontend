/** Código de invitación pendiente mientras el usuario inicia sesión. */
const KEY = 'boxplan.pendingJoin'

export function setPendingJoin(code: string) {
  try { localStorage.setItem(KEY, code) } catch { /* noop */ }
}

export function clearPendingJoin() {
  try { localStorage.removeItem(KEY) } catch { /* noop */ }
}

/** Ruta a la que ir después del login (sin efectos: lo limpia JoinPage). */
export function postLoginPath(): string {
  try {
    const code = localStorage.getItem(KEY)
    return code ? `/join/${encodeURIComponent(code)}` : '/'
  } catch {
    return '/'
  }
}
