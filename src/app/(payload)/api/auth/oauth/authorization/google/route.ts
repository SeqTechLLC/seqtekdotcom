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
  const url = new URL(req.url)
  url.pathname = '/api/auth/oauth/callback/google'
  url.search = ''
  return url.toString()
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
