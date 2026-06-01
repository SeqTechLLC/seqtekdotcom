interface MediaLike {
  url?: string | null
  alt?: string | null
}

interface DownloadCardProps {
  title: string
  description: string
  coverImage?: MediaLike | string | number | null
  formId: string
  fileUrl: string
}

const isFullMedia = (v: unknown): v is MediaLike =>
  typeof v === 'object' && v !== null && 'url' in (v as object)

export function DownloadCard({
  title,
  description,
  coverImage,
  formId,
  fileUrl,
}: DownloadCardProps) {
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto grid max-w-container-lg gap-8 rounded-md border border-border-subtle bg-surface p-6 shadow-sm md:grid-cols-2">
        {isFullMedia(coverImage) && coverImage.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImage.url}
            alt={coverImage.alt ?? title}
            className="h-full w-full rounded-md object-cover"
          />
        ) : null}
        <div className="flex flex-col">
          <p className="text-caption uppercase tracking-wide text-accent-strong">Free download</p>
          <h2 className="mt-2 text-h2 font-bold">{title}</h2>
          <p className="mt-3 text-body text-text-secondary">{description}</p>
          <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="you@company.com"
              className="rounded-md border border-border-strong bg-surface px-4 py-3 text-body"
              disabled
            />
            <button
              type="button"
              className="rounded-md bg-accent-strong px-5 py-3 font-medium text-white"
              disabled
            >
              Get it
            </button>
          </div>
          <p className="mt-4 text-caption text-text-muted">
            HubSpot form {formId} loads in production.
          </p>
          <p className="mt-1 text-caption text-text-muted">Asset: {fileUrl}</p>
        </div>
      </div>
    </section>
  )
}

export default DownloadCard
