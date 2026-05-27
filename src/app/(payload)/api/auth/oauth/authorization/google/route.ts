import { NextResponse, type NextRequest } from 'next/server'

import {
  buildAuthorizationUrl,
  generatePkce,
  generateState,
} from '../../../../../../../lib/auth/google-oauth'

const STATE_COOKIE = '__seqtek_oauth_state'
const VERIFIER_COOKIE = '__seqtek_oauth_verifier'
const ALLOWED_DOMAIN = 'seqtechllc.com'
const MAX_AGE_SECONDS = 600 // 10 minutes — long enough to complete consent

function callbackUri(req: NextRequest): string {
  // Behind ALB/CloudFront, `req.url` shows the container's internal
  // bind address (http://0.0.0.0:3000/...), not the viewer-facing URL.
  // The ALB injects `x-forwarded-host` and `x-forwarded-proto` per
  // RFC 7239 conventions; use those to reconstruct the public URL.
  // Fallback chain handles local dev and direct-to-Next.js connections.
  const proto = req.headers.get('x-forwarded-proto') ?? new URL(req.url).protocol.replace(':', '')
  const host =
    req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? new URL(req.url).host
  return `${proto}://${host}/api/auth/oauth/callback/google`
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.redirect(new URL('/admin/login?error=internal', req.url))
  }

  const state = generateState()
  const { verifier, challenge } = await generatePkce()
  const authorizationUrl = buildAuthorizationUrl({
    clientId,
    redirectUri: callbackUri(req),
    state,
    codeChallenge: challenge,
    hd: ALLOWED_DOMAIN,
  })

  const response = NextResponse.redirect(authorizationUrl)
  const cookieOpts = {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: MAX_AGE_SECONDS,
    secure: req.nextUrl.protocol === 'https:',
  }
  response.cookies.set(STATE_COOKIE, state, cookieOpts)
  response.cookies.set(VERIFIER_COOKIE, verifier, cookieOpts)
  return response
}
