import createClient from 'openapi-fetch'
import type { components, paths } from './schema'

export type Schemas = components['schemas']
export type Workout = Schemas['WorkoutDto']
export type Block = Schemas['BlockDto']
export type MyGroup = Schemas['MyGroupDto']
export type ScoreType = NonNullable<Block['scoreType']>
export type BlockType = Block['type']
export type Division = Schemas['Division']

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'
const ACCESS = 'boxplan.access'
const REFRESH = 'boxplan.refresh'

export const tokens = {
  get access() { return safeGet(ACCESS) },
  get refresh() { return safeGet(REFRESH) },
  set(t: { accessToken: string; refreshToken: string }) {
    safeSet(ACCESS, t.accessToken)
    safeSet(REFRESH, t.refreshToken)
  },
  clear() {
    safeSet(ACCESS, null)
    safeSet(REFRESH, null)
  },
}

let refreshing: Promise<boolean> | null = null

async function refresh(): Promise<boolean> {
  const refreshToken = tokens.refresh
  if (!refreshToken) return false
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) { tokens.clear(); return false }
  tokens.set(await res.json())
  return true
}

/** Agrega el Bearer y, ante un 401, refresca una vez y reintenta. */
async function authFetch(input: Request): Promise<Response> {
  const retry = input.clone()
  const withAuth = (req: Request) => {
    if (tokens.access) req.headers.set('Authorization', `Bearer ${tokens.access}`)
    return fetch(req)
  }
  const res = await withAuth(input)
  if (res.status !== 401 || input.url.includes('/auth/')) return res
  refreshing ??= refresh().finally(() => { refreshing = null })
  if (!(await refreshing)) {
    window.dispatchEvent(new Event('boxplan:logout'))
    return res
  }
  return withAuth(retry)
}

export const api = createClient<paths>({ baseUrl: BASE_URL, fetch: authFetch })

/** Devuelve data o tira un Error con el mensaje de Nest. */
export async function unwrap<T>(p: Promise<{ data?: T; error?: unknown; response: Response }>): Promise<T> {
  const { data, error, response } = await p
  if (!response.ok) {
    const msg = (error as { message?: string | string[] } | undefined)?.message
    throw new Error(Array.isArray(msg) ? msg.join(' · ') : msg ?? `Error ${response.status}`)
  }
  return data as T
}

function safeGet(k: string) {
  try { return localStorage.getItem(k) } catch { return null }
}
function safeSet(k: string, v: string | null) {
  try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v) } catch { /* noop */ }
}

/** userId (sub) del access token actual. */
export function currentUserId(): string | undefined {
  try {
    const payload = tokens.access?.split('.')[1]
    if (!payload) return undefined
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))).sub
  } catch {
    return undefined
  }
}
