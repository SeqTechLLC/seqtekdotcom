import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { getPayload, type Payload } from 'payload'

import config from '../../src/payload.config.js'
import { isWorkspaceEmail } from '../../src/lib/auth/enforce-domain'
import { FIXTURES } from '../helpers/authFixtures'

let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

beforeEach(async () => {
  await payload.delete({
    collection: 'accounts',
    where: { id: { exists: true } },
    overrideAccess: true,
  })
  await payload.delete({
    collection: 'users',
    where: { id: { exists: true } },
    overrideAccess: true,
  })
})

describe('isWorkspaceEmail (FR-002, R-5)', () => {
  it.each([
    ['foo@seqtechllc.com', true],
    ['Foo@SEQTECHLLC.com', true],
    ['  user@seqtechllc.com  ', true],
    ['foo@bar.seqtechllc.com', false],
    ['foo@seqtechllc.co', false],
    ['foo@gmail.com', false],
    ['', false],
    [null, false],
    [undefined, false],
  ])('isWorkspaceEmail(%j) === %p', (email, expected) => {
    expect(isWorkspaceEmail(email as string | null | undefined)).toBe(expected)
  })
})

describe('Users beforeChange rejects non-Workspace emails (FR-003, US3)', () => {
  it('throws on intruder@gmail.com and persists no rows', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const intruder = FIXTURES.intruder

    await expect(
      payload.create({
        collection: 'users',
        data: {
          email: intruder.email,
          name: intruder.name,
          roles: ['editor'],
        },
        overrideAccess: true,
        req: { user: null } as Parameters<typeof payload.create>[0]['req'],
      }),
    ).rejects.toThrow(/Only SEQTEK Workspace accounts/)

    const users = await payload.find({ collection: 'users', overrideAccess: true })
    expect(users.docs).toHaveLength(0)
    const accounts = await payload.find({ collection: 'accounts', overrideAccess: true })
    expect(accounts.docs).toHaveLength(0)

    const auditLines = logSpy.mock.calls
      .map((c) => c[0])
      .filter((line): line is string => typeof line === 'string')
      .filter((line) => line.includes('"event":"admin_sign_in"'))
    expect(auditLines).toHaveLength(1)
    expect(auditLines[0]).toContain('"outcome":"domain-rejected"')
    expect(auditLines[0]).toContain(`"email":"${intruder.email.toLowerCase()}"`)

    logSpy.mockRestore()
  })

  it('throws on someone@otherco.com and persists no rows', async () => {
    const wrongWorkspace = FIXTURES['wrong-workspace']
    await expect(
      payload.create({
        collection: 'users',
        data: {
          email: wrongWorkspace.email,
          name: wrongWorkspace.name,
          roles: ['editor'],
        },
        overrideAccess: true,
        req: { user: null } as Parameters<typeof payload.create>[0]['req'],
      }),
    ).rejects.toThrow(/Only SEQTEK Workspace accounts/)
    const users = await payload.find({ collection: 'users', overrideAccess: true })
    expect(users.docs).toHaveLength(0)
  })

  it('does not run on authenticated creates (admin manually creating a user)', async () => {
    // Pretend an authed Admin is creating an external (Workspace) user record.
    // The hook's `if (req.user) return data` branch should skip enforcement —
    // domain validity is moot when an authed admin is making the call.
    const admin = await payload.create({
      collection: 'users',
      data: {
        email: 'admin@seqtechllc.com',
        name: 'Bootstrap Admin',
        roles: ['admin'],
      },
      overrideAccess: true,
      req: { user: null } as Parameters<typeof payload.create>[0]['req'],
    })

    const created = await payload.create({
      collection: 'users',
      data: {
        email: 'second@seqtechllc.com',
        name: 'Second User',
        roles: ['editor'],
      },
      overrideAccess: true,
      // simulate an authed admin
      req: { user: { ...admin, collection: 'users' } } as Parameters<
        typeof payload.create
      >[0]['req'],
    })
    expect(created.email).toBe('second@seqtechllc.com')
  })
})
