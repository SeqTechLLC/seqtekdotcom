import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'

import config from '../../../../../../../payload.config'
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
const ALLOWED_DOMAIN = 'seqtechllc.com'

function loginErrorRedirect(req: NextRequest, code: string): NextResponse {
  const response = NextResponse.redirect(new URL(`/admin/login?error=${code}`, req.url))
  response.cookies.delete(STATE_COOKIE)
  response.cookies.delete(VERIFIER_COOKIE)
  return response
}

function callbackUri(req: NextRequest): string {
  const url = new URL(req.url)
  url.pathname = '/api/auth/oauth/callback/google'
  url.search = ''
  return url.toString()
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
  // `hd=` hint were bypassed, the ID token's hd claim must match.
  if (claims.hd !== ALLOWED_DOMAIN) {
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

  const response = NextResponse.redirect(new URL('/admin', req.url))
  response.cookies.delete(STATE_COOKIE)
  response.cookies.delete(VERIFIER_COOKIE)
  response.headers.append('Set-Cookie', cookie)
  return response
}
