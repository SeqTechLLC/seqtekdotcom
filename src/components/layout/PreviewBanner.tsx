import { draftMode } from 'next/headers'

interface PreviewBannerProps {
  /**
   * When set, the banner is rendered unconditionally. Useful for the
   * showcase route which always wants the badge even outside draft mode.
   * Production templates should omit this and rely on the draft-mode check.
   */
  force?: boolean
}

/**
 * Server component banner shown above page content when Next.js draft mode
 * is enabled (FR-020). Public templates drop this in once per page; the
 * route handler at `src/app/(frontend)/preview/[collection]/[slug]/route.ts`
 * is what enables draft mode, so the banner just needs to read its state.
 *
 * Visual: high-contrast amber bar across the top of the page so editors
 * can never confuse a preview with live content.
 */
export async function PreviewBanner({ force }: PreviewBannerProps = {}) {
  if (!force) {
    const draft = await draftMode()
    if (!draft.isEnabled) return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="preview-banner"
      className="sticky top-0 z-tooltip w-full bg-warning-500 px-4 py-2 text-center text-body-sm font-semibold text-text-primary shadow-md"
    >
      <span aria-hidden="true">⚠</span>
      <span className="ml-2 uppercase tracking-wider">Preview mode</span>
      <span className="ml-3 font-normal opacity-90">
        You are viewing draft content. Publish to make it live.
      </span>
    </div>
  )
}
