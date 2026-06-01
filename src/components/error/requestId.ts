// spec 004 (ERROR_PAGES §3). Read the per-request correlation id the proxy set
// as a JS-readable cookie (`x-request-id`). Client-only — falls back to the
// Next error `digest` when the cookie is unavailable (e.g. global-error before
// the proxy ran).
export function readRequestId(fallback?: string): string | undefined {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)x-request-id=([^;]+)/)
    if (match) return decodeURIComponent(match[1])
  }
  return fallback
}
