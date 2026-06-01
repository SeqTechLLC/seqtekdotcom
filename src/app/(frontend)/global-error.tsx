'use client'

import { useEffect } from 'react'

import { readRequestId } from '@/components/error/requestId'

// spec 004 T037 (ERROR_PAGES §3). Root-layout failure boundary. Replaces the
// ENTIRE document, so it must render its own <html><body> (the root layout
// that normally provides them is the thing that failed). Self-contained
// inline styles — the app's CSS may not have loaded.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Root render error', error.digest)
  }, [error])

  const requestId = readRequestId(error.digest)

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '1.5rem',
          background: '#0b1220',
          color: '#e6edf6',
        }}
      >
        <main data-testid="global-error" style={{ maxWidth: '32rem' }}>
          <p style={{ fontWeight: 700, letterSpacing: '0.05em' }}>SEQTEK</p>
          <h1 style={{ fontSize: '1.5rem', margin: '1rem 0 0.5rem' }}>
            Something went wrong on our end
          </h1>
          <p style={{ color: '#9fb0c3', lineHeight: 1.6 }}>
            We hit an unexpected error. Please try again, or email{' '}
            <a href="mailto:support@seqtek.com" style={{ color: '#9fc2ff' }}>
              support@seqtek.com
            </a>
            .
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.375rem',
              border: 0,
              fontWeight: 600,
              cursor: 'pointer',
              background: '#2563eb',
              color: '#fff',
            }}
          >
            Try again
          </button>
          {requestId ? (
            <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: '#9fb0c3' }}>
              Reference: <code data-testid="global-error-request-id">{requestId}</code>
            </p>
          ) : null}
        </main>
      </body>
    </html>
  )
}
