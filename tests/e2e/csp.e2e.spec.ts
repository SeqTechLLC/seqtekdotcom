import { expect, test } from '@playwright/test'

type Violation = { effectiveDirective: string; blockedURI: string; violatedDirective: string }

declare global {
  interface Window {
    __cspViolations?: Violation[]
  }
}

test.describe('CSP proxy', () => {
  test('public route sets report-only CSP with a per-request nonce', async ({ request }) => {
    const first = await request.get('/')
    expect(first.status()).toBe(200)

    const policy = first.headers()['content-security-policy-report-only']
    expect(policy, 'expected report-only CSP header on public route').toBeTruthy()

    // Nonce in policy must match the x-nonce response header.
    const nonceFromHeader = first.headers()['x-nonce']
    expect(nonceFromHeader).toBeTruthy()
    expect(policy).toContain(`'nonce-${nonceFromHeader}'`)

    // Required directives.
    expect(policy).toContain(`script-src 'nonce-${nonceFromHeader}' 'strict-dynamic' 'self'`)
    expect(policy).toContain(`default-src 'self'`)
    expect(policy).toMatch(/style-src\s+'self'(\s*;|$)/) // no unsafe-inline on public routes
    expect(policy).toContain(`frame-ancestors 'none'`)
    expect(policy).toContain(`object-src 'none'`)
    expect(policy).toContain('report-uri /api/csp-report')
    expect(policy).toContain('report-to csp-endpoint')

    // Each request gets a fresh nonce.
    const second = await request.get('/')
    expect(second.headers()['x-nonce']).not.toBe(nonceFromHeader)

    // Static security headers from next.config.ts also present.
    expect(first.headers()['x-frame-options']).toBe('DENY')
    expect(first.headers()['x-content-type-options']).toBe('nosniff')
    expect(first.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(first.headers()['permissions-policy']).toContain('camera=()')
  })

  test('admin route relaxes style-src for the Payload Lexical editor', async ({ request }) => {
    const response = await request.get('/admin')
    const policy = response.headers()['content-security-policy-report-only']
    expect(policy, 'expected report-only CSP header on /admin').toBeTruthy()
    expect(policy).toContain(`style-src 'self' 'unsafe-inline'`)
  })

  test('Report-To response header advertises the csp-endpoint group', async ({ request }) => {
    const response = await request.get('/')
    const reportTo = response.headers()['report-to']
    expect(reportTo).toBeTruthy()
    const parsed = JSON.parse(reportTo!)
    expect(parsed.group).toBe('csp-endpoint')
    expect(parsed.endpoints?.[0]?.url).toBe('/api/csp-report')
  })
})

test.describe('CSP report endpoint (/api/csp-report)', () => {
  test('accepts a legacy application/csp-report payload with 204', async ({ request }) => {
    const response = await request.post('/api/csp-report', {
      headers: { 'content-type': 'application/csp-report' },
      data: {
        'csp-report': {
          'document-uri': 'https://example.com/page',
          'violated-directive': "script-src 'self'",
          'effective-directive': 'script-src',
          'blocked-uri': 'https://evil.example/payload.js',
          'original-policy': "default-src 'self'",
          disposition: 'report',
        },
      },
    })
    expect(response.status()).toBe(204)
  })

  test('accepts a modern Reporting API payload (array of reports) with 204', async ({
    request,
  }) => {
    const response = await request.post('/api/csp-report', {
      headers: { 'content-type': 'application/reports+json' },
      data: [
        {
          type: 'csp-violation',
          age: 12,
          url: 'https://example.com/page',
          user_agent: 'TestAgent/1.0',
          body: {
            documentURL: 'https://example.com/page',
            blockedURL: 'https://evil.example/inline',
            effectiveDirective: 'script-src-elem',
            originalPolicy: "default-src 'self'",
            disposition: 'report',
            statusCode: 200,
          },
        },
      ],
    })
    expect(response.status()).toBe(204)
  })

  test('rejects malformed JSON with 400', async ({ request }) => {
    const response = await request.post('/api/csp-report', {
      headers: { 'content-type': 'application/csp-report' },
      data: 'not json at all',
    })
    expect(response.status()).toBe(400)
  })

  test('rejects empty/invalid report shape with 400', async ({ request }) => {
    const response = await request.post('/api/csp-report', {
      headers: { 'content-type': 'application/csp-report' },
      data: { unrelated: true },
    })
    expect(response.status()).toBe(400)
  })

  test('rejects GET with 405', async ({ request }) => {
    const response = await request.get('/api/csp-report')
    expect(response.status()).toBe(405)
    expect(response.headers().allow).toBe('POST')
  })
})

test.describe('CSP enforce readiness (US2 T011 / csp.md P6)', () => {
  // Record CSP violations the browser raises while a marquee surface loads.
  // Under report-only (the staging/dev default) the browser REPORTS the same
  // violations it would BLOCK under enforce, so this is a preview of what
  // enforcing would break — without needing CSP_MODE=enforce in CI.
  //
  // The meaningful production signal is a blocked REAL RESOURCE: a violation
  // whose blockedURI is a concrete http(s) URL we failed to allowlist. Two
  // classes of violation are dev-only noise that a production build does NOT
  // emit and so must be excluded here:
  //   - `script-src ⟵ eval`  — Next.js dev bundler / React Refresh use eval;
  //     production bundles do not (this is also why local dev runs
  //     report-only, not the enforce posture ARCHITECTURE.md §6 targets).
  //   - `style-src ⟵ inline`  — Next.js dev HMR + browser-extension injected
  //     styles; the documented soak risk (csp.md P4). Tailwind ships external
  //     CSS in production.
  // Live third-party host coverage (HubSpot banner/beacons, GTM) is verified
  // empirically in the gated staging soak (T014), not against this dev server.
  const captureViolations = async (page: import('@playwright/test').Page, path: string) => {
    await page.addInitScript(() => {
      window.__cspViolations = []
      document.addEventListener('securitypolicyviolation', (e) => {
        window.__cspViolations!.push({
          effectiveDirective: e.effectiveDirective,
          blockedURI: e.blockedURI,
          violatedDirective: e.violatedDirective,
        })
      })
    })
    await page.goto(path, { waitUntil: 'networkidle' })
    return page.evaluate(() => window.__cspViolations ?? [])
  }

  test('homepage blocks no real (http) resource under the policy', async ({ page }) => {
    const violations = await captureViolations(page, '/')
    // Keep only blocks of a concrete http(s) resource (a genuine allowlist gap);
    // drop dev-tooling keyword blocks (`eval`, `inline`, `blob:`) and
    // browser-extension noise (`chrome-extension:` etc.).
    const realResourceBlocks = violations.filter((v) => /^https?:/i.test(v.blockedURI))
    expect(
      realResourceBlocks,
      `enforcing CSP would block legitimate external resources:\n` +
        realResourceBlocks.map((v) => `  • ${v.effectiveDirective} ⟵ ${v.blockedURI}`).join('\n'),
    ).toEqual([])
  })

  test('when CSP_MODE=enforce, the enforcing header is present on a public route', async ({
    request,
  }) => {
    test.skip(
      process.env.CSP_MODE !== 'enforce',
      'CSP_MODE is not enforce in this environment (default report-only) — header-name assertion N/A',
    )
    const response = await request.get('/')
    expect(response.headers()['content-security-policy']).toBeTruthy()
    expect(response.headers()['content-security-policy-report-only']).toBeFalsy()
    expect(response.headers()['content-security-policy']).toContain('upgrade-insecure-requests')
  })
})
