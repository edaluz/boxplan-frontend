const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

/** Foto de perfil o iniciales. `url` puede ser relativa a la API o externa (Google). */
export default function Avatar({ url, name, size = 32 }: { url?: string | null; name: string; size?: number }) {
  const src = url ? (url.startsWith('/') ? API_BASE + url : url) : null
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?'
  return src ? (
    <img src={src} alt={name} referrerPolicy="no-referrer" width={size} height={size}
      className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-zinc-700 font-bold text-zinc-200"
      style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {initials}
    </span>
  )
}
