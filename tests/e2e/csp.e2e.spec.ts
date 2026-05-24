import { expect, test } from '@playwright/test'

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
