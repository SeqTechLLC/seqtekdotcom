'use client'

import Link from 'next/link'
import { useEffect } from 'react'

import { readRequestId } from '@/components/error/requestId'

// spec 004 T036 (ERROR_PAGES §3 / invariants E2/E3). Segment-level 500
// boundary. Minimal — logo, apology, retry, support fallback, and the visible
// request id for support correlation. Renders within the (frontend) layout.

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Stack already went to stdout server-side (CloudWatch); log the digest
    // client-side so it correlates with the request id.
    console.error('Render error', error.digest)
  }, [error])

  const requestId = readRequestId(error.digest)

  return (
    <div
      data-testid="error-boundary"
      className="mx-auto flex max-w-container-md flex-col items-center px-4 py-24 text-center md:px-6"
    >
      <Link href="/" className="text-h4 font-bold tracking-tight">
        SEQTEK
      </Link>
      <h1 className="mt-8 text-h2 font-bold">Something went wrong on our end</h1>
      <p className="mx-auto mt-4 max-w-prose text-body-lg text-text-secondary">
        We hit an unexpected error. You can try again, or reach us and we will sort it out.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-accent px-6 py-3 font-semibold text-white transition hover:opacity-90"
        >
          Try again
        </button>
        <a href="mailto:support@seqtek.com" className="text-link underline hover:text-link-hover">
          support@seqtek.com
        </a>
      </div>

      {requestId ? (
        <p className="mt-8 text-small text-text-muted">
          Reference: <code data-testid="error-request-id">{requestId}</code>
        </p>
      ) : null}
    </div>
  )
}
