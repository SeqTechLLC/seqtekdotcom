import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config.js'

let cachedPayload: Payload | null = null

async function payloadInstance(): Promise<Payload> {
  if (!cachedPayload) {
    cachedPayload = await getPayload({ config: await config })
  }
  return cachedPayload
}

export interface SeedOauthUserInput {
  email: string
  name: string
  role: 'admin' | 'editor'
  sub: string
}

export interface SeededOauthUser {
  userId: string
}

/**
 * Insert a users row simulating a completed Google sign-in. The `googleSub`
 * field carries the stable identity Google provided. Tests that need a
 * minted session cookie should additionally call `issueSessionCookie` from
 * src/lib/auth/session-cookie.ts with the returned user.
 */
export async function seedOauthUser(input: SeedOauthUserInput): Promise<SeededOauthUser> {
  const payload = await payloadInstance()

  const user = await payload.create({
    collection: 'users',
    data: {
      email: input.email,
      name: input.name,
      roles: [input.role],
      googleSub: input.sub,
    },
    overrideAccess: true,
  })

  return { userId: String(user.id) }
}

export async function cleanupOauthUser(email: string): Promise<void> {
  const payload = await payloadInstance()
  await payload.delete({
    collection: 'users',
    where: { email: { equals: email } },
    overrideAccess: true,
  })
}
