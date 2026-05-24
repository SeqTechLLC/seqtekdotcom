import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'

import config from '../../src/payload.config.js'

let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

beforeEach(async () => {
  await payload.delete({
    collection: 'users',
    where: { id: { exists: true } },
    overrideAccess: true,
  })
})

describe('guardRoleUpdates (FR-007, US2)', () => {
  it('forbids role escalation when req.user is null (forged PATCH)', async () => {
    // Seed an admin first so the bootstrap-admin rule doesn't fire on the next create.
    await payload.create({
      collection: 'users',
      data: {
        email: 'bootstrap-admin@seqtechllc.com',
        name: 'Bootstrap',
        roles: ['editor'],
      },
      overrideAccess: true,
      req: { user: null } as Parameters<typeof payload.create>[0]['req'],
    })

    // Now create a real editor (bootstrap is exhausted, so the hook keeps role=editor).
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
    expect(editor.roles).toEqual(['editor'])

    await expect(
      payload.update({
        collection: 'users',
        id: editor.id,
        data: { roles: ['admin'] },
        overrideAccess: true,
        req: { user: null } as Parameters<typeof payload.update>[0]['req'],
      }),
    ).rejects.toThrow(/Role changes require an authenticated admin/)

    const refreshed = await payload.findByID({
      collection: 'users',
      id: editor.id,
      overrideAccess: true,
    })
    expect(refreshed.roles).toEqual(['editor'])
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
