import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'

import config from '../../../../../payload.config'
import { revokeSessionCookie } from '../../../../../lib/auth/revoke-session-cookie'

/**
 * Custom logout endpoint. See revoke-session-cookie.ts for why this exists
 * instead of relying on Payload's built-in logout (REST or the admin UI's
 * Server Action) — both fail to resolve the current session on this app's
 * custom OAuth-issued sessions.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const payload = await getPayload({ config: await config })
  const { cookie, revoked } = await revokeSessionCookie({ payload, headers: req.headers })

  const response = NextResponse.json({ revoked, message: 'Logged out' }, { status: 200 })
  response.headers.set('Set-Cookie', cookie)
  return response
}
