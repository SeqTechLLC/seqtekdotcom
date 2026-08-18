// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { PayloadRestClient, PayloadRestError } from '../../../tools/payload-rest/client'
import type { FetchFn } from '../../../tools/payload-rest/client'

/**
 * The gate cookie: an environment can sit behind an authenticating proxy in
 * FRONT of the app (prod is gated by an ALB + Cognito rule, so every path —
 * `/api/*` included — 302s to the IdP before Payload sees it). `cookie` is a
 * separate concern from `token`: the proxy decides whether the request reaches
 * the origin, the JWT decides who you are once it does.
 */

interface Recorded {
  url: string
  headers: Record<string, string>
}

const recorder = (response: () => Response): { fetchFn: FetchFn; calls: Recorded[] } => {
  const calls: Recorded[] = []
  const fetchFn: FetchFn = async (input, init) => {
    calls.push({
      url: typeof input === 'string' ? input : input.toString(),
      headers: (init?.headers as Record<string, string>) ?? {},
    })
    return response()
  }
  return { fetchFn, calls }
}

const jsonResponse = (obj: unknown): Response =>
  new Response(JSON.stringify(obj), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })

describe('PayloadRestClient — auth headers', () => {
  it('sends the gate cookie alongside the JWT when one is configured', async () => {
    const { fetchFn, calls } = recorder(() => jsonResponse({ docs: [{ id: 7 }] }))
    const client = new PayloadRestClient({
      baseUrl: 'https://ww3.example.com',
      token: 'jwt-123',
      cookie: 'AWSELBAuthSessionCookie-0=abc; AWSELBAuthSessionCookie-1=def',
      fetchFn,
    })

    await client.findIdByField('caseStudies', 'slug', 'acme', { draft: false })

    expect(calls[0].headers.Authorization).toBe('JWT jwt-123')
    expect(calls[0].headers.Cookie).toBe(
      'AWSELBAuthSessionCookie-0=abc; AWSELBAuthSessionCookie-1=def',
    )
  })

  it('omits the Cookie header entirely for an ungated environment', async () => {
    const { fetchFn, calls } = recorder(() => jsonResponse({ docs: [] }))
    const client = new PayloadRestClient({
      baseUrl: 'https://seqtek-preview.com',
      token: 'jwt-123',
      fetchFn,
    })

    await client.findIdByField('caseStudies', 'slug', 'acme', { draft: false })

    expect(calls[0].headers.Authorization).toBe('JWT jwt-123')
    expect('Cookie' in calls[0].headers).toBe(false)
  })

  it('reports the auth proxy when a gated origin answers with an HTML sign-in page', async () => {
    // fetch follows the gate's 302 to the IdP and lands on a 200 HTML page, so
    // without the content-type guard the first symptom of a missing or expired
    // cookie is an opaque JSON syntax error.
    const { fetchFn } = recorder(
      () =>
        new Response('<html><body>Sign in</body></html>', {
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        }),
    )
    const client = new PayloadRestClient({
      baseUrl: 'https://ww3.example.com',
      token: 'jwt-123',
      fetchFn,
    })

    await expect(
      client.findIdByField('caseStudies', 'slug', 'acme', { draft: false }),
    ).rejects.toThrow(PayloadRestError)
    await expect(
      client.findIdByField('caseStudies', 'slug', 'acme', { draft: false }),
    ).rejects.toThrow(/behind an auth proxy/)
  })

  it('does not report success for a gated global write that never landed', async () => {
    // updateGlobal returns void, so the sign-in page's 200 satisfied `res.ok`
    // and the seeder logged `global:homepage [published]` for a write the
    // origin never saw. A globals-only seed file could report a fully
    // successful run against a gate with no cookie at all.
    const { fetchFn } = recorder(
      () =>
        new Response('<html><body>Sign in</body></html>', {
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        }),
    )
    const client = new PayloadRestClient({
      baseUrl: 'https://ww3.example.com',
      token: 'jwt-123',
      fetchFn,
    })

    await expect(client.updateGlobal('homepage', { title: 'x' }, { draft: false })).rejects.toThrow(
      /behind an auth proxy/,
    )
  })

  it('names the auth proxy when a gate rejects outright with an HTML body', async () => {
    // The sibling case: a proxy that answers 401/403 with its own markup
    // instead of redirecting, which would otherwise surface as 500 characters
    // of HTML in the error message.
    const { fetchFn } = recorder(
      () =>
        new Response('<html><body>Access denied</body></html>', {
          status: 403,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        }),
    )
    const client = new PayloadRestClient({
      baseUrl: 'https://ww3.example.com',
      token: 'jwt-123',
      fetchFn,
    })

    await expect(client.updateGlobal('homepage', { title: 'x' }, { draft: false })).rejects.toThrow(
      /behind an auth proxy/,
    )
  })
})
