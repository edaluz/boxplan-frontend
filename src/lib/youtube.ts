/** Extrae el ID (11 caracteres) de un link de YouTube: watch, youtu.be, shorts, embed o live. */
export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url.trim())
    const host = u.hostname.replace(/^(www\.|m\.)/, '')
    let id: string | null = null
    if (host === 'youtu.be') id = u.pathname.slice(1)
    else if (host === 'youtube.com') {
      id = u.searchParams.get('v') ?? u.pathname.match(/^\/(shorts|embed|live)\/([\w-]+)/)?.[2] ?? null
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null
  } catch {
    return null
  }
}
