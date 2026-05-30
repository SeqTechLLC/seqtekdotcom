import { getPayload, type Payload } from 'payload'
import type { BrowserContext, Cookie } from '@playwright/test'

import config from '../../src/payload.config.js'
import { issueSessionCookie } from '../../src/lib/auth/session-cookie'
import type { User } from '../../src/payload-types'

let cachedPayload: Payload | null = null

async function payloadInstance(): Promise<Payload> {
  if (!cachedPayload) {
    cachedPayload = await getPayload({ config: await config })
  }
  return cachedPayload
}

export interface EditorSessionInput {
  email: string
  name: string
  sub: string
  role: 'admin' | 'editor'
}

export interface EditorSession {
  userId: string
  /** The raw `Set-Cookie` response header (with attributes). */
  cookieHeader: string
  /**
   * The `name=value` pair only, suitable for sending as a request
   * `Cookie:` header. Use this when passing cookies via Playwright's
   * `request` fixture; use `cookieHeader` only for parsing into a browser
   * context cookie.
   */
  cookieValue: string
}

/**
 * Seed an editorial user and mint a Payload session cookie suitable for
 * attaching to a Playwright `request` or `BrowserContext`. Returns the raw
 * `Set-Cookie` header so callers can also use it with `fetch`/`request`
 * directly without a browser.
 *
 * Used by the spec 003 US2 preview E2E tests (T074–T077) to exercise the
 * `/preview/:collection/:slug` route as an authenticated editor.
 */
export async function seedEditorSession(input: EditorSessionInput): Promise<EditorSession> {
  const payload = await payloadInstance()

  await cleanupEditorSession(input.email)

  const user = (await payload.create({
    collection: 'users',
    data: {
      email: input.email,
      name: input.name,
      roles: [input.role],
      googleSub: input.sub,
    },
    overrideAccess: true,
  })) as User

  const { cookie } = await issueSessionCookie({ payload, user })
  const cookieValue = cookie.split(';', 1)[0]

  return { userId: String(user.id), cookieHeader: cookie, cookieValue }
}

export async function cleanupEditorSession(email: string): Promise<void> {
  const payload = await payloadInstance()
  await payload.delete({
    collection: 'users',
    where: { email: { equals: email } },
    overrideAccess: true,
  })
}

/**
 * Parse a `Set-Cookie` header into the Playwright cookie shape so it can be
 * attached via `context.addCookies([...])` for browser-driven tests.
 */
export function parseSetCookieForContext(cookieHeader: string, baseURL: string): Cookie {
  const [pair, ...attrs] = cookieHeader.split(';').map((p) => p.trim())
  const [name, ...rest] = pair.split('=')
  const value = rest.join('=')

  const attrMap = new Map<string, string | true>()
  for (const attr of attrs) {
    const [k, ...v] = attr.split('=')
    attrMap.set(k.toLowerCase(), v.length > 0 ? v.join('=') : true)
  }

  const url = new URL(baseURL)
  const path = (attrMap.get('path') as string | undefined) ?? '/'
  const sameSiteRaw = attrMap.get('samesite')
  const sameSite: Cookie['sameSite'] =
    sameSiteRaw === 'Lax' || sameSiteRaw === 'Strict' || sameSiteRaw === 'None'
      ? sameSiteRaw
      : 'Lax'

  return {
    name,
    value,
    domain: url.hostname,
    path,
    expires: attrMap.has('expires')
      ? Math.floor(new Date(attrMap.get('expires') as string).getTime() / 1000)
      : -1,
    httpOnly: attrMap.has('httponly'),
    secure: attrMap.has('secure'),
    sameSite,
  }
}

/**
 * Convenience wrapper: seed the editor + attach the session cookie to the
 * given browser context. Returns the seeded session so the caller can
 * cleanup in `afterAll`.
 */
export async function attachEditorSessionToContext(
  context: BrowserContext,
  baseURL: string,
  input: EditorSessionInput,
): Promise<EditorSession> {
  const session = await seedEditorSession(input)
  await context.addCookies([parseSetCookieForContext(session.cookieHeader, baseURL)])
  return session
}
