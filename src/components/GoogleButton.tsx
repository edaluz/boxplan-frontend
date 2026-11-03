import { useEffect, useRef, useState } from 'react'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

type Gsi = {
  accounts: {
    id: {
      initialize(opts: { client_id: string; callback: (r: { credential: string }) => void }): void
      renderButton(el: HTMLElement, opts: Record<string, unknown>): void
    }
  }
}
declare global { interface Window { google?: Gsi } }

let scriptPromise: Promise<void> | null = null
function loadScript(): Promise<void> {
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => { scriptPromise = null; reject(new Error('No se pudo cargar Google')) }
    document.head.appendChild(s)
  })
  return scriptPromise
}

/** Botón oficial de Google Identity Services. Sirve para registro y login. */
export default function GoogleButton({ onCredential }: { onCredential: (idToken: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const cb = useRef(onCredential)
  cb.current = onCredential
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!CLIENT_ID) return
    loadScript()
      .then(() => {
        if (!ref.current || !window.google) return
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (r) => cb.current(r.credential),
        })
        window.google.accounts.id.renderButton(ref.current, {
          theme: 'filled_black', size: 'large', shape: 'pill', text: 'continue_with', width: 320, locale: 'es',
        })
      })
      .catch((e: Error) => setError(e.message))
  }, [])

  if (!CLIENT_ID) return null
  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={ref} className="min-h-[44px]" />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
