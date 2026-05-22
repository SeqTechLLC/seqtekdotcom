import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'

import config from '../../src/payload.config.js'

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

describe('guardRoleUpdates (FR-007, US2)', () => {
  it('forbids role escalation when req.user is null (forged PATCH)', async () => {
    const user = await payload.create({
      collection: 'users',
      data: {
        email: 'editor@seqtechllc.com',
        name: 'Editor',
        roles: ['editor'],
      },
      overrideAccess: true,
      req: { user: null } as Parameters<typeof payload.create>[0]['req'],
    })

    await expect(
      payload.update({
        collection: 'users',
        id: user.id,
        data: { roles: ['admin'] },
        overrideAccess: true,
        req: { user: null } as Parameters<typeof payload.update>[0]['req'],
      }),
    ).rejects.toThrow(/Role changes require an authenticated admin/)

    const refreshed = await payload.findByID({
      collection: 'users',
      id: user.id,
      overrideAccess: true,
    })
    // Bootstrap rule made the first signer admin already; the point is the
    // role wasn't *re-changed* by the forged update.
    expect(refreshed.roles).not.toEqual(['admin', 'editor'])
  })

  it('allows role change when req.user is an Admin', async () => {
    const admin = await payload.create({
      collection: 'users',
      data: {
        email: 'admin@seqtechllc.com',
        name: 'Admin',
        roles: ['admin'],
      },
      overrideAccess: true,
      req: { user: null } as Parameters<typeof payload.create>[0]['req'],
    })

    const editor = await payload.create({
      collection: 'users',
      data: {
        email: 'editor@seqtechllc.com',
        name: 'Editor',
        roles: ['editor'],
      },
      overrideAccess: true,
      req: { user: null } as Parameters<typeof payload.create>[0]['req'],
    })

    const promoted = await payload.update({
      collection: 'users',
      id: editor.id,
      data: { roles: ['admin'] },
      overrideAccess: true,
      req: { user: { ...admin, collection: 'users' } } as Parameters<
        typeof payload.update
      >[0]['req'],
    })
    expect(promoted.roles).toEqual(['admin'])
  })
})
