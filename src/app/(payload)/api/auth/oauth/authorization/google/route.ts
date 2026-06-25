import { NextResponse, type NextRequest } from 'next/server'

import {
  buildAuthorizationUrl,
  generatePkce,
  generateState,
} from '../../../../../../../lib/auth/google-oauth'

const STATE_COOKIE = '__seqtek_oauth_state'
const VERIFIER_COOKIE = '__seqtek_oauth_verifier'
// `hd` is the Google account-picker hint. We run TWO Workspace domains
// (seqtechllc.com + seqtek.com), and `hd` only takes a single domain — pinning
// one would hide the other's accounts from the chooser. `*` restricts the
// picker to any hosted (Workspace) account, keeping personal Gmail out; the
// specific-domain enforcement happens server-side in the callback against the
// shared allowlist (allowed-domains.ts).
const HOSTED_DOMAIN_HINT = '*'
const MAX_AGE_SECONDS = 600 // 10 minutes — long enough to complete consent

function callbackUri(req: NextRequest): string {
  // Behind CloudFront -> ALB -> EC2 -> Docker -> Next.js, `req.url` shows
  // the container's internal bind address (http://0.0.0.0:3000/...).
  // Reconstruct the viewer-facing URL from forwarded headers.
  //
  // Protocol: prefer CloudFront's own `cloudfront-forwarded-proto` header
  // which always reflects the actual VIEWER protocol. Our CloudFront
  // distribution uses HTTP_ONLY to the ALB origin (validation-period
  // topology), so `x-forwarded-proto` arrives at Next.js as 'http' —
  // wrong for OAuth redirect_uri which must match the registered
  // viewer-facing HTTPS URL. Fall back to x-forwarded-proto for non-CF
  // proxy setups, then req.url's protocol for local dev.
  //
  // Host: prefer x-forwarded-host (set by ALB), then standard Host header.
  const proto =
    req.headers.get('cloudfront-forwarded-proto') ??
    req.headers.get('x-forwarded-proto') ??
    new URL(req.url).protocol.replace(':', '')
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
    hd: HOSTED_DOMAIN_HINT,
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
