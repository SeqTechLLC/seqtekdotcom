import { jwtVerify } from 'jose'
import type { Payload } from 'payload'
import { generateExpiredPayloadCookie, parseCookies } from 'payload/shared'

import type { User } from '../../payload-types'

/**
 * Manually invalidate the current session and return an expired cookie to
 * clear it client-side.
 *
 * Deliberately does NOT rely on Payload's built-in `req.user` / `payload.auth()`
 * resolution — verifying the JWT directly with `jose` here mirrors exactly
 * what Payload's own JWT strategy does internally (see
 * `node_modules/payload/dist/auth/strategies/jwt.js`), and removing the
 * session via `payload.db.updateOne` mirrors `issueSessionCookie`'s
 * `addSessionToUser` (the reverse operation, same low-level primitives).
 *
 * Why not just call Payload's built-in logout: sessions here are created by
 * `issueSessionCookie`'s direct `payload.db.updateOne` write (bypassing the
 * `users` collection's hook chain, per its own docs) rather than by
 * `payload.login()`. Payload's built-in logout — both the REST endpoint and
 * the admin UI's Server Action — depend on `req.user`/`payload.auth()`
 * correctly resolving through the SAME auth-strategy path `/api/users/me`
 * uses, but empirically (2026-08-11) that resolution succeeds for `/me` and
 * fails for both logout code paths against an identical session, cookie, and
 * request context — almost certainly the same `disableLocalStrategy` custom-
 * strategy-registration quirk `Users.ts` already had to work around once for
 * the admin shell. Rather than chase that specific internal discrepancy
 * further, this bypasses Payload's `req.user` resolution for logout
 * entirely and works directly against the database, the same way session
 * creation already does.
 */
export async function revokeSessionCookie(args: {
  payload: Payload
  headers: Headers
}): Promise<{ cookie: string; revoked: boolean }> {
  const { payload, headers } = args
  const collectionConfig = payload.config.collections.find((c) => c.slug === 'users')
  if (!collectionConfig) throw new Error('users collection not configured')

  const cookiePrefix = payload.config.cookiePrefix ?? 'payload'
  const expiredCookie = generateExpiredPayloadCookie({
    collectionAuthConfig: collectionConfig.auth,
    cookiePrefix,
  })

  const cookies = parseCookies(headers)
  const token = cookies.get(`${cookiePrefix}-token`)
  if (!token) {
    return { cookie: expiredCookie, revoked: false }
  }

  let decoded: { collection?: string; id?: number | string; sid?: string }
  try {
    const secretKey = new TextEncoder().encode(payload.secret)
    const { payload: verified } = await jwtVerify(token, secretKey)
    decoded = verified as typeof decoded
  } catch {
    // Invalid or expired token — nothing to revoke, but still clear the cookie.
    return { cookie: expiredCookie, revoked: false }
  }

  if (!decoded.id || !decoded.sid || decoded.collection !== 'users') {
    return { cookie: expiredCookie, revoked: false }
  }

  const user = (await payload.db.findOne({
    collection: 'users',
    where: { id: { equals: decoded.id } },
  })) as (User & { updatedAt: string | null }) | null

  if (!user) {
    return { cookie: expiredCookie, revoked: false }
  }

  const sid = decoded.sid
  user.sessions = (user.sessions ?? []).filter((s) => s.id !== sid)
  // Prevent updatedAt churn on a session removal — matches the pattern
  // `addSessionToUser` already uses for session creation.
  ;(user as { updatedAt: string | null }).updatedAt = null

  await payload.db.updateOne({
    id: user.id,
    collection: 'users',
    data: user as unknown as Parameters<typeof payload.db.updateOne>[0]['data'],
    returning: false,
  })

  return { cookie: expiredCookie, revoked: true }
}
