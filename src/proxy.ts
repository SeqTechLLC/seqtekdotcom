import { NextResponse, type NextRequest } from 'next/server'
import { NONCE_HEADER, buildCspPolicy, cspHeaderName, generateNonce, readCspMode } from '@/lib/csp'

const CSP_REPORT_PATH = '/api/csp-report'
const REQUEST_ID_HEADER = 'x-request-id'
const HEALTH_PATH = '/api/health'

// spec 004 T038 (ERROR_PAGES §4). Static 503 body for maintenance mode. Kept
// inline + dependency-free so it renders even when the app can't boot.
const MAINTENANCE_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>SEQTEK — Down for maintenance</title>
<style>body{font-family:system-ui,sans-serif;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0b1220;color:#e6edf6;text-align:center;padding:1.5rem}main{max-width:32rem}h1{font-size:1.5rem;margin:0 0 .75rem}p{color:#9fb0c3;line-height:1.6}</style>
</head><body><main>
<h1>We will be right back</h1>
<p>SEQTEK is briefly down for scheduled maintenance. Please try again in a few minutes.</p>
</main></body></html>`

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Maintenance short-circuit (ERROR_PAGES §4 / invariant E4). Every path
  // returns a static 503 EXCEPT /api/health, which MUST stay 200 — otherwise
  // the ALB marks instances unhealthy and the ASG starts replacing them mid
  // maintenance. Runs before CSP so a broken app can't keep the page from
  // serving.
  if (process.env.MAINTENANCE_MODE === 'true' && pathname !== HEALTH_PATH) {
    return new NextResponse(MAINTENANCE_HTML, {
      status: 503,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'retry-after': '120',
        'cache-control': 'no-store',
      },
    })
  }

  // Per-request correlation id (ERROR_PAGES §3 / invariant E3). UUID v4 on the
  // response header for logs, plus a JS-readable cookie so the client error
  // boundaries (error.tsx / global-error.tsx) can surface it for support.
  const requestId = crypto.randomUUID()

  const mode = readCspMode()
  const headerName = cspHeaderName(mode)

  // CSP off — still attach the request id so error pages have a correlation id.
  if (!headerName) {
    const response = NextResponse.next()
    response.headers.set(REQUEST_ID_HEADER, requestId)
    response.cookies.set(REQUEST_ID_HEADER, requestId, {
      httpOnly: false,
      path: '/',
      sameSite: 'lax',
    })
    return response
  }

  const nonce = generateNonce()

  // Make the nonce + request id available to server components for this request.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(NONCE_HEADER, nonce)
  requestHeaders.set(REQUEST_ID_HEADER, requestId)

  const policy = buildCspPolicy({
    nonce,
    pathname: request.nextUrl.pathname,
    mediaHost: process.env.S3_BUCKET_HOSTNAME,
    reportUri: CSP_REPORT_PATH,
    mode,
  })

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  // Mirror nonce + request id on the response so tests / debugging tools / the
  // client error pages can read them.
  response.headers.set(NONCE_HEADER, nonce)
  response.headers.set(REQUEST_ID_HEADER, requestId)
  response.cookies.set(REQUEST_ID_HEADER, requestId, {
    httpOnly: false,
    path: '/',
    sameSite: 'lax',
  })
  response.headers.set(headerName, policy)

  // Reporting API endpoint group definition (paired with `report-to` in the policy).
  response.headers.set(
    'Report-To',
    JSON.stringify({
      group: 'csp-endpoint',
      max_age: 10_886_400,
      endpoints: [{ url: CSP_REPORT_PATH }],
    }),
  )

  return response
}

export const config = {
  // Skip Next internals, the report endpoint (avoids self-loops if it ever 4xx-s), and static files.
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|api/csp-report|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?)).*)',
  ],
}
