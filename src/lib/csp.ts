/**
 * Content Security Policy builder.
 *
 * Single source of policy construction so the proxy, the headers() set in
 * next.config.ts, and any tests stay in sync. Matches ARCHITECTURE.md §6 and
 * INTEGRATIONS.md §8.
 */

export type CspMode = 'enforce' | 'report-only' | 'off'

export const NONCE_HEADER = 'x-nonce'

export function readCspMode(env: NodeJS.ProcessEnv = process.env): CspMode {
  const raw = env.CSP_MODE?.trim().toLowerCase()
  if (raw === 'enforce' || raw === 'report-only' || raw === 'off') return raw
  return 'report-only'
}

export function cspHeaderName(mode: CspMode): string | null {
  if (mode === 'off') return null
  if (mode === 'enforce') return 'Content-Security-Policy'
  return 'Content-Security-Policy-Report-Only'
}

/** Generate a CSP nonce using the Web Crypto API (Edge-runtime friendly). */
export function generateNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/=+$/, '')
}

const HUBSPOT_CONNECT = [
  '*.hubspot.com',
  '*.hs-analytics.net',
  '*.hsforms.net',
  '*.hs-banner.com',
  '*.usemessages.com',
] as const

const HUBSPOT_FRAME = [
  '*.hubspot.com',
  '*.hsforms.net',
  'meetings.hubspot.com',
  '*.hubspotusercontent.com',
] as const

const HUBSPOT_IMG = ['*.hubspot.com', '*.hsforms.net'] as const

type BuildOptions = {
  nonce: string
  /** Pathname of the request. /admin/* relaxes style-src for the Payload Lexical editor. */
  pathname: string
  /** S3/CloudFront hostname for media (e.g. `seqtek-media.s3.us-east-1.amazonaws.com`). */
  mediaHost?: string
  /** Report endpoint URI; when set, appended as report-uri (legacy) + report-to. */
  reportUri?: string
  /** Current CSP mode; affects directives that browsers ignore in report-only. */
  mode?: CspMode
}

export function buildCspPolicy({
  nonce,
  pathname,
  mediaHost,
  reportUri,
  mode = 'enforce',
}: BuildOptions): string {
  const isAdmin = pathname.startsWith('/admin')
  const isEnforced = mode === 'enforce'

  const imgSrc = ["'self'", 'data:', ...HUBSPOT_IMG]
  if (mediaHost) imgSrc.push(mediaHost)

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [`'nonce-${nonce}'`, "'strict-dynamic'", "'self'"],
    'style-src': isAdmin ? ["'self'", "'unsafe-inline'"] : ["'self'"],
    'img-src': imgSrc,
    'font-src': ["'self'"],
    'connect-src': [
      "'self'",
      ...HUBSPOT_CONNECT,
      '*.googletagmanager.com',
      '*.google-analytics.com',
    ],
    'frame-src': ["'self'", ...HUBSPOT_FRAME],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'", '*.hsforms.net'],
    'object-src': ["'none'"],
  }

  // Browsers ignore `upgrade-insecure-requests` in report-only mode (which
  // also surfaces as a Chrome DevTools Issue / Lighthouse best-practices
  // ding). Only include it when we are actually enforcing.
  if (isEnforced) {
    directives['upgrade-insecure-requests'] = []
  }

  if (reportUri) {
    directives['report-uri'] = [reportUri]
    directives['report-to'] = ['csp-endpoint']
  }

  return Object.entries(directives)
    .map(([name, values]) => (values.length ? `${name} ${values.join(' ')}` : name))
    .join('; ')
}
