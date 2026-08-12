import { NextResponse, type NextRequest } from 'next/server'

// ALB chunks a large OIDC session across up to 4 cookies
// (AWSELBAuthSessionCookie-0 .. -3) rather than one.
const ALB_SESSION_COOKIE_CHUNKS = 4

/**
 * Clears the ALB Cognito perimeter gate's session (infra/lib/cognito-auth.ts,
 * infra/lib/compute-stack.ts's cognitoAuthEnabled) — this is a DIFFERENT
 * session than Payload's own admin login; see ../logout for that one.
 *
 * ALB has no logout endpoint of its own: it only cryptographically
 * validates its session cookie on each request and re-issues it as long
 * as the underlying OIDC token is valid, with no server-side session state
 * to revoke (confirmed against AWS's own docs / re:Post threads,
 * 2026-08-12). The only real way to force a fresh login is for the app
 * itself — which runs BEHIND the ALB and can set arbitrary Set-Cookie
 * headers — to expire ALB's own cookie names directly, then also bounce
 * through Cognito's /logout so that layer's session clears too.
 */
export function GET(request: NextRequest): NextResponse {
  const origin = request.nextUrl.origin
  const cognitoLogoutBase = process.env.COGNITO_LOGOUT_URL
  const clientId = process.env.COGNITO_CLIENT_ID

  const destination =
    cognitoLogoutBase && clientId
      ? `${cognitoLogoutBase}?client_id=${clientId}&logout_uri=${encodeURIComponent(`${origin}/`)}`
      : `${origin}/`

  const response = NextResponse.redirect(destination)
  for (let i = 0; i < ALB_SESSION_COOKIE_CHUNKS; i++) {
    response.cookies.set(`AWSELBAuthSessionCookie-${i}`, '', {
      expires: new Date(0),
      path: '/',
      secure: true,
      httpOnly: true,
    })
  }
  return response
}
