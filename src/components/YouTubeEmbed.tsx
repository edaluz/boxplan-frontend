import { useState } from 'react'
import { youtubeId } from '../lib/youtube'

/**
 * Miniatura del video con botón de play; al tocarla carga el reproductor
 * (YouTube no se carga hasta que se pide, así no gasta datos).
 */
export default function YouTubeEmbed({ url, compact = false }: { url: string; compact?: boolean }) {
  const [playing, setPlaying] = useState(false)
  const id = youtubeId(url)
  if (!id) return null

  return (
    <div className={`mt-2 aspect-video w-full overflow-hidden rounded-md bg-black ${compact ? 'max-w-xs' : ''}`}>
      {playing ? (
        <iframe
          className="h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1&playsinline=1`}
          title="Video de YouTube"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} aria-label="Reproducir video"
          className="group relative block h-full w-full">
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy"
            className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-12 w-16 items-center justify-center rounded-xl bg-red-600/90 shadow-lg transition group-hover:bg-red-600">
              <span className="ml-1 border-y-[10px] border-l-[16px] border-y-transparent border-l-white" />
            </span>
          </span>
        </button>
      )}
    </div>
  )
}
