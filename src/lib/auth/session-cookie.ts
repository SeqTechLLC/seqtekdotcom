import type { Payload, SanitizedCollectionConfig } from 'payload'
import { getFieldsToSign, jwtSign } from 'payload'
import { generatePayloadCookie } from 'payload/shared'

import type { User } from '../../payload-types'

interface UserSession {
  id: string
  createdAt: Date
  expiresAt: Date
}

type UserWithSessions = User & { sessions?: UserSession[] }

/**
 * Add a fresh session record to the user document when the collection has
 * `auth.useSessions: true` (Payload v3 default). Returns the session id to
 * embed in the JWT as `sid`. Payload's auth strategy compares the JWT's sid
 * against the user's sessions array on every request — without this,
 * cookies are silently rejected and `/admin` bounces to `/admin/login`.
 *
 * Mirrors Payload's own `addSessionToUser` (node_modules/payload/dist/auth/sessions.js).
 * Uses `payload.db.updateOne` to bypass the Users `beforeChange` hook chain
 * (we don't want a session push to look like a role-change).
 */
async function addSessionToUser(args: {
  payload: Payload
  collectionConfig: SanitizedCollectionConfig
  user: UserWithSessions
}): Promise<string | undefined> {
  const { payload, collectionConfig, user } = args
  if (!collectionConfig.auth.useSessions) return undefined

  const sid = crypto.randomUUID()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + collectionConfig.auth.tokenExpiration * 1000)
  const session: UserSession = { id: sid, createdAt: now, expiresAt }

  const filtered = (user.sessions ?? []).filter((s) => new Date(s.expiresAt) > now)
  user.sessions = [...filtered, session]
  // Prevent updatedAt churn — matches Payload's own pattern in sessions.js.
  ;(user as { updatedAt: string | null }).updatedAt = null

  await payload.db.updateOne({
    id: user.id,
    collection: collectionConfig.slug,
    data: user as unknown as Parameters<typeof payload.db.updateOne>[0]['data'],
    returning: false,
  })

  return sid
}

/**
 * Mint a Payload-compatible session cookie for a given user. The cookie
 * shape matches what Payload's own `payload.login` produces, so Payload's
 * default JWT cookie strategy validates it transparently on subsequent
 * requests.
 */
export async function issueSessionCookie(args: {
  payload: Payload
  user: User
}): Promise<{ cookie: string; token: string; exp: number; sid?: string }> {
  const { payload, user } = args
  const collectionConfig = payload.config.collections.find(
    (c): c is SanitizedCollectionConfig => c.slug === 'users',
  )
  if (!collectionConfig) throw new Error('users collection not configured')

  const sid = await addSessionToUser({ payload, collectionConfig, user })

  const fieldsToSign = getFieldsToSign({
    collectionConfig,
    email: user.email,
    sid,
    user: { ...user, collection: 'users' },
  })

  const { exp, token } = await jwtSign({
    fieldsToSign,
    secret: payload.secret,
    tokenExpiration: collectionConfig.auth.tokenExpiration,
  })

  const cookie = generatePayloadCookie({
    collectionAuthConfig: collectionConfig.auth,
    cookiePrefix: payload.config.cookiePrefix ?? 'payload',
    token,
  })

  return { cookie, token, exp, sid }
}
