export function SkipToContent({ targetId = 'main' }: { targetId?: string } = {}) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-tooltip focus-visible:rounded-md focus-visible:bg-surface focus-visible:px-4 focus-visible:py-2 focus-visible:text-body focus-visible:font-medium focus-visible:text-text-primary focus-visible:shadow-md"
    >
      Skip to main content
    </a>
  )
}
