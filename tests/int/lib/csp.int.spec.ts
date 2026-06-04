// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { buildCspPolicy, cspHeaderName, readCspMode, type CspMode } from '../../../src/lib/csp'

/**
 * spec 006 US2 (T010) — CSP policy shape per mode (csp.md P2/P6).
 *
 * Two things this guards:
 *  1. `cspHeaderName(mode)` emits the right header (enforce → enforcing;
 *     report-only → -Report-Only; off → none), and `readCspMode` defaults to
 *     report-only (Constitution IV — the code default is never a premature
 *     enforce flip).
 *  2. The built directive set has parity with ARCHITECTURE.md §6, and
 *     `upgrade-insecure-requests` appears ONLY when enforcing (browsers ignore
 *     it in report-only; emitting it there is a Lighthouse best-practices ding).
 */

const NONCE = 'test-nonce-abc123'

const buildPublic = (mode: CspMode) =>
  buildCspPolicy({ nonce: NONCE, pathname: '/', mode, reportUri: '/api/csp-report' })

describe('cspHeaderName', () => {
  it('maps each mode to the documented header (P2)', () => {
    expect(cspHeaderName('enforce')).toBe('Content-Security-Policy')
    expect(cspHeaderName('report-only')).toBe('Content-Security-Policy-Report-Only')
    expect(cspHeaderName('off')).toBeNull()
  })
})

describe('readCspMode', () => {
  // `readCspMode` only reads `CSP_MODE`; cast the partial env to satisfy the
  // ProcessEnv type (NODE_ENV is irrelevant to this function).
  const env = (cspMode?: string): NodeJS.ProcessEnv =>
    (cspMode === undefined ? {} : { CSP_MODE: cspMode }) as NodeJS.ProcessEnv

  it('defaults to report-only when CSP_MODE is unset or invalid (Constitution IV)', () => {
    expect(readCspMode(env())).toBe('report-only')
    expect(readCspMode(env('garbage'))).toBe('report-only')
  })

  it('reads each valid mode case-insensitively', () => {
    expect(readCspMode(env('enforce'))).toBe('enforce')
    expect(readCspMode(env('ENFORCE'))).toBe('enforce')
    expect(readCspMode(env(' report-only '))).toBe('report-only')
    expect(readCspMode(env('off'))).toBe('off')
  })
})

describe('buildCspPolicy — directive parity with ARCHITECTURE.md §6', () => {
  const policy = buildPublic('enforce')

  it('carries the per-request nonce + strict-dynamic on script-src', () => {
    expect(policy).toContain(`script-src 'nonce-${NONCE}' 'strict-dynamic' 'self'`)
  })

  it('locks down the structural directives', () => {
    expect(policy).toContain(`default-src 'self'`)
    expect(policy).toContain(`frame-ancestors 'none'`)
    expect(policy).toContain(`base-uri 'self'`)
    expect(policy).toContain(`object-src 'none'`)
    expect(policy).toContain(`font-src 'self'`)
  })

  it('allowlists the confirmed HubSpot + GTM/GA hosts on connect-src', () => {
    for (const host of [
      "'self'",
      '*.hubspot.com',
      '*.hs-analytics.net',
      '*.hsforms.net',
      '*.hsforms.com',
      '*.hs-banner.com',
      '*.usemessages.com',
      '*.googletagmanager.com',
      '*.google-analytics.com',
    ]) {
      expect(policy).toContain(host)
    }
  })

  it('allowlists the HubSpot frame + img hosts', () => {
    expect(policy).toContain(`frame-src 'self' *.hubspot.com *.hsforms.net meetings.hubspot.com`)
    expect(policy).toMatch(/img-src 'self' data: \*\.hubspot\.com \*\.hsforms\.net/)
  })

  it('appends the report directives when a reportUri is set', () => {
    expect(policy).toContain('report-uri /api/csp-report')
    expect(policy).toContain('report-to csp-endpoint')
  })

  it('includes the media host on img-src when supplied', () => {
    const withMedia = buildCspPolicy({
      nonce: NONCE,
      pathname: '/',
      mode: 'enforce',
      mediaHost: 'seqtek-media.s3.us-east-1.amazonaws.com',
    })
    expect(withMedia).toContain('seqtek-media.s3.us-east-1.amazonaws.com')
  })
})

describe('buildCspPolicy — style-src is path-scoped (csp.md P4)', () => {
  it("public routes get style-src 'self' (the soak risk — no unsafe-inline)", () => {
    const policy = buildPublic('enforce')
    expect(policy).toMatch(/style-src 'self'(;|\s|$)/)
    expect(policy).not.toContain(`style-src 'self' 'unsafe-inline'`)
  })

  it("/admin relaxes style-src to 'self' 'unsafe-inline' for the Lexical editor", () => {
    const policy = buildCspPolicy({ nonce: NONCE, pathname: '/admin', mode: 'enforce' })
    expect(policy).toContain(`style-src 'self' 'unsafe-inline'`)
  })
})

describe('buildCspPolicy — upgrade-insecure-requests only when enforcing (P2)', () => {
  it('includes upgrade-insecure-requests under enforce', () => {
    expect(buildPublic('enforce')).toContain('upgrade-insecure-requests')
  })

  it('omits upgrade-insecure-requests under report-only (browsers ignore it)', () => {
    expect(buildPublic('report-only')).not.toContain('upgrade-insecure-requests')
  })
})
