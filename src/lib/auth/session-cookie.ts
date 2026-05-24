import type { Payload, SanitizedCollectionConfig } from 'payload'
import { getFieldsToSign, jwtSign } from 'payload'
import { generatePayloadCookie } from 'payload/shared'

import type { User } from '../../payload-types'

/**
 * Mint a Payload-compatible session cookie for a given user. The cookie
 * shape matches what Payload's own `payload.login` produces, so Payload's
 * default JWT cookie strategy validates it transparently on subsequent
 * requests.
 */
export async function issueSessionCookie(args: {
  payload: Payload
  user: User
}): Promise<{ cookie: string; token: string; exp: number }> {
  const { payload, user } = args
  const collectionConfig = payload.config.collections.find(
    (c): c is SanitizedCollectionConfig => c.slug === 'users',
  )
  if (!collectionConfig) throw new Error('users collection not configured')

  const fieldsToSign = getFieldsToSign({
    collectionConfig,
    email: user.email,
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

  return { cookie, token, exp }
}
