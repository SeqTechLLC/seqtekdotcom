interface VideoEmbedProps {
  provider: 'youtube' | 'vimeo'
  videoId: string
  title: string
  eyebrow?: string | null
  thumbnail?: { url?: string | null; alt?: string | null } | string | number | null
}

const isMedia = (v: unknown): v is { url: string; alt?: string | null } =>
  typeof v === 'object' && v !== null && 'url' in (v as object) && !!(v as { url: unknown }).url

const buildSrc = (provider: 'youtube' | 'vimeo', id: string) =>
  provider === 'youtube'
    ? `https://www.youtube-nocookie.com/embed/${id}`
    : `https://player.vimeo.com/video/${id}`

/**
 * Renders on a subtle-surface band at the same container width as the
 * two-column sections (the about page stacks them adjacent — shared grid
 * edge), with the caption anchored inside the card rather than floating
 * below it. The optional eyebrow ("From the SEQTEK Podcast") marks the
 * section as an intentional interlude; templates that pass none (workshop
 * recaps) render the bare card.
 */
export function VideoEmbed({ provider, videoId, title, eyebrow, thumbnail }: VideoEmbedProps) {
  return (
    <section className="bg-surface-subtle px-4 py-14 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-lg">
        {eyebrow ? (
          <p className="mb-4 text-eyebrow uppercase tracking-wide text-accent-strong">{eyebrow}</p>
        ) : null}
        <figure className="overflow-hidden rounded-md border border-border-subtle bg-surface-elevated shadow-sm">
          <div className="aspect-video bg-surface-inverse">
            {isMedia(thumbnail) ? (
              <div className="relative h-full w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbnail.url}
                  alt={thumbnail.alt ?? title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="rounded-full bg-white/90 px-6 py-3 text-h3 font-bold text-text-primary">
                    ▶ Play
                  </span>
                </div>
              </div>
            ) : (
              <iframe
                src={buildSrc(provider, videoId)}
                title={title}
                className="h-full w-full"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                loading="lazy"
                // no-referrer breaks YouTube (player error 153): the embed
                // must send its origin for YouTube to validate the embedder.
                referrerPolicy="strict-origin-when-cross-origin"
              />
            )}
          </div>
        </figure>
      </div>
    </section>
  )
}

export default VideoEmbed
