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
  accountId: string
}

/**
 * Insert a users row and a matching accounts row simulating a completed
 * Google sign-in. Returns the new IDs. The session cookie is minted by the
 * caller via payload.login() — see tests/e2e helpers.
 */
export async function seedOauthUser(input: SeedOauthUserInput): Promise<SeededOauthUser> {
  const payload = await payloadInstance()

  const user = await payload.create({
    collection: 'users',
    data: {
      email: input.email,
      name: input.name,
      roles: [input.role],
    },
    overrideAccess: true,
  })

  const account = await payload.create({
    collection: 'accounts',
    data: {
      user: user.id,
      issuerName: 'google',
      sub: input.sub,
      name: input.name,
    },
    overrideAccess: true,
  })

  return {
    userId: String(user.id),
    accountId: String(account.id),
  }
}

export async function cleanupOauthUser(email: string): Promise<void> {
  const payload = await payloadInstance()
  await payload.delete({
    collection: 'accounts',
    where: { 'user.email': { equals: email } },
    overrideAccess: true,
  })
  await payload.delete({
    collection: 'users',
    where: { email: { equals: email } },
    overrideAccess: true,
  })
}
