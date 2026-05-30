interface VideoEmbedProps {
  provider: 'youtube' | 'vimeo'
  videoId: string
  title: string
  thumbnail?: { url?: string | null; alt?: string | null } | string | number | null
}

const isMedia = (v: unknown): v is { url: string; alt?: string | null } =>
  typeof v === 'object' && v !== null && 'url' in (v as object) && !!(v as { url: unknown }).url

const buildSrc = (provider: 'youtube' | 'vimeo', id: string) =>
  provider === 'youtube'
    ? `https://www.youtube-nocookie.com/embed/${id}`
    : `https://player.vimeo.com/video/${id}`

export function VideoEmbed({ provider, videoId, title, thumbnail }: VideoEmbedProps) {
  return (
    <section className="px-4 py-12 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-md">
        <figure>
          <div className="aspect-video overflow-hidden rounded-md bg-surface-inverse">
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
              />
            )}
          </div>
          <figcaption className="mt-3 text-small text-text-secondary">{title}</figcaption>
        </figure>
      </div>
    </section>
  )
}

export default VideoEmbed
