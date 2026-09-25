'use client'

import { useState } from 'react'

export type VideoProvider = 'youtube' | 'vimeo'

interface VideoFacadeProps {
  provider: VideoProvider
  videoId: string
  title: string
  poster?: { url: string; alt?: string | null } | null
}

const buildSrc = (provider: VideoProvider, id: string, autoplay: boolean) => {
  const base =
    provider === 'youtube'
      ? `https://www.youtube-nocookie.com/embed/${id}`
      : `https://player.vimeo.com/video/${id}`
  return autoplay ? `${base}?autoplay=1` : base
}

/**
 * A 16:9 player that, given a poster, shows the still and a Play button and
 * loads the third-party frame only when a reader asks for it — so YouTube or
 * Vimeo never see a visitor who does not watch. Without a poster it embeds the
 * player directly.
 *
 * ROADMAP INERT-2 — a poster once REPLACED the <iframe> with a still and a
 * non-interactive "▶ Play" span, so filling the field in made the video
 * unplayable. The still is a real button here for that reason.
 */
export function VideoFacade({ provider, videoId, title, poster }: VideoFacadeProps) {
  const [playing, setPlaying] = useState(false)

  return (
    <div className="aspect-video bg-surface-inverse">
      {poster && !playing ? (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play video: ${title}`}
          className="group relative block h-full w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={poster.url} alt={poster.alt ?? title} className="h-full w-full object-cover" />
          <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
            {/* ring + shadow, not just an opaque fill: a white pill on a pale
                poster disappears otherwise. */}
            <span className="rounded-full bg-white/90 px-6 py-3 text-h3 font-bold text-text-primary shadow-lg ring-1 ring-black/10 transition group-hover:bg-white">
              ▶ Play
            </span>
          </span>
        </button>
      ) : (
        <iframe
          src={buildSrc(provider, videoId, playing)}
          title={title}
          className="h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
          // no-referrer breaks YouTube (player error 153): the embed must send
          // its origin for YouTube to validate the embedder.
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
    </div>
  )
}

export default VideoFacade
