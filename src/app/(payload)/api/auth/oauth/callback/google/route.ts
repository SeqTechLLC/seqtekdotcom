import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'

import config from '../../../../../../../payload.config'
import { isAllowedHostedDomain } from '../../../../../../../lib/auth/allowed-domains'
import {
  OAuthError,
  exchangeCodeForTokens,
  verifyGoogleIdToken,
} from '../../../../../../../lib/auth/google-oauth'
import { issueSessionCookie } from '../../../../../../../lib/auth/session-cookie'
import { logSignIn } from '../../../../../../../lib/auth/sign-in-audit'
import type { User } from '../../../../../../../payload-types'

const STATE_COOKIE = '__seqtek_oauth_state'
const VERIFIER_COOKIE = '__seqtek_oauth_verifier'

function loginErrorRedirect(req: NextRequest, code: string): NextResponse {
  const response = NextResponse.redirect(new URL(`/admin/login?error=${code}`, req.url))
  response.cookies.delete(STATE_COOKIE)
  response.cookies.delete(VERIFIER_COOKIE)
  return response
}

function callbackUri(req: NextRequest): string {
  // Mirror the authorization route's helper — must produce the same
  // URI value or Google's token exchange fails the redirect_uri match.
  // See the authorization route for the proxy-header rationale.
  const proto =
    req.headers.get('cloudfront-forwarded-proto') ??
    req.headers.get('x-forwarded-proto') ??
    new URL(req.url).protocol.replace(':', '')
  const host =
    req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? new URL(req.url).host
  return `${proto}://${host}/api/auth/oauth/callback/google`
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const code = req.nextUrl.searchParams.get('code')
  const returnedState = req.nextUrl.searchParams.get('state')
  const providerError = req.nextUrl.searchParams.get('error')

  if (providerError) {
    return loginErrorRedirect(req, 'provider_error')
  }

  const cookieState = req.cookies.get(STATE_COOKIE)?.value
  const verifier = req.cookies.get(VERIFIER_COOKIE)?.value
  if (!code || !returnedState || !cookieState || !verifier || returnedState !== cookieState) {
    return loginErrorRedirect(req, 'state_mismatch')
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return loginErrorRedirect(req, 'internal')
  }

  let claims
  try {
    const tokens = await exchangeCodeForTokens({
      code,
      clientId,
      clientSecret,
      redirectUri: callbackUri(req),
      verifier,
    })
    claims = await verifyGoogleIdToken({ idToken: tokens.id_token, clientId })
  } catch (err) {
    const oauthErr = err instanceof OAuthError ? err.code : 'internal'
    return loginErrorRedirect(req, oauthErr)
  }

  // Defence-in-depth: enforce the hd claim server-side. Even if Google's
  // `hd=*` hint were bypassed, the ID token's hd claim must be one of our
  // Workspace domains (seqtechllc.com / seqtek.com — see allowed-domains.ts).
  if (!isAllowedHostedDomain(claims.hd)) {
    logSignIn({
      email: claims.email,
      outcome: 'domain-rejected',
      provider: 'google',
      errorCode: 'domain_rejected',
    })
    return loginErrorRedirect(req, 'domain_rejected')
  }

  const payload = await getPayload({ config: await config })

  let user: User | null = null

  // 1. Returning user? Match by stable Google sub.
  const existing = await payload.find({
    collection: 'users',
    where: { googleSub: { equals: claims.sub } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs.length > 0) {
    user = existing.docs[0] as User
  } else {
    // 2. First-time sign-in. Let the beforeChange hook chain run domain check
    //    + bootstrap-admin + audit. Hook throws on domain reject.
    try {
      user = (await payload.create({
        collection: 'users',
        data: {
          email: claims.email.toLowerCase(),
          name: claims.name ?? claims.email,
          roles: ['editor'],
          googleSub: claims.sub,
        },
        overrideAccess: true,
        req: { user: null } as Parameters<typeof payload.create>[0]['req'],
      })) as User
    } catch {
      // enforceDomainAllowlist already audited the rejection.
      return loginErrorRedirect(req, 'domain_rejected')
    }
  }

  if (!user) {
    return loginErrorRedirect(req, 'internal')
  }

  let cookie: string
  try {
    const result = await issueSessionCookie({ payload, user })
    cookie = result.cookie
  } catch {
    return loginErrorRedirect(req, 'internal')
  }

  logSignIn({
    email: user.email,
    outcome: 'success',
    provider: 'google',
    userId: String(user.id),
  })

  // Return an HTML "bounce" page that JS-redirects to /admin rather than a
  // 307. The 307 path inherits Sec-Fetch-Site: cross-site from the Google
  // hop in the redirect chain, which makes Payload's CSRF check in
  // extractJWT reject the session cookie on the very next request. A
  // client-initiated navigation from this same-origin page resets
  // Sec-Fetch-Site to same-origin and the cookie validates normally.
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Signing you in&hellip;</title><meta name="robots" content="noindex,nofollow"><meta http-equiv="refresh" content="0;url=/admin"></head><body><p>Signing you in&hellip;</p><script>window.location.replace('/admin')</script></body></html>`

  const response = new NextResponse(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
  response.cookies.delete(STATE_COOKIE)
  response.cookies.delete(VERIFIER_COOKIE)
  response.headers.append('Set-Cookie', cookie)
  return response
}
