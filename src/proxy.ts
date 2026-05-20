import { NextResponse, type NextRequest } from 'next/server'
import { NONCE_HEADER, buildCspPolicy, cspHeaderName, generateNonce, readCspMode } from '@/lib/csp'

const CSP_REPORT_PATH = '/api/csp-report'

export function proxy(request: NextRequest) {
  const mode = readCspMode()
  const headerName = cspHeaderName(mode)

  if (!headerName) return NextResponse.next()

  const nonce = generateNonce()

  // Make the nonce available to server components rendered for this request.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(NONCE_HEADER, nonce)

  const policy = buildCspPolicy({
    nonce,
    pathname: request.nextUrl.pathname,
    mediaHost: process.env.S3_BUCKET_HOSTNAME,
    reportUri: CSP_REPORT_PATH,
  })

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  // Mirror nonce on response so tests / debugging tools can read it.
  response.headers.set(NONCE_HEADER, nonce)
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
