import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'

import config from '../../src/payload.config.js'
import { FIXTURES } from '../fixtures/authFixtures'

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

describe('Auto-provision + bootstrap-admin (FR-005, US2, R-4)', () => {
  it('first OAuth-provisioning create on an empty table → role=admin', async () => {
    const fixture = FIXTURES.editor
    const created = await payload.create({
      collection: 'users',
      data: {
        email: fixture.email,
        name: fixture.name,
        roles: ['editor'],
        googleSub: fixture.sub,
      },
      overrideAccess: true,
      req: { user: null } as Parameters<typeof payload.create>[0]['req'],
    })
    expect(created.roles).toEqual(['admin'])
    expect(created.googleSub).toBe(fixture.sub)
  })

  it('subsequent OAuth-provisioning creates default to role=editor', async () => {
    await payload.create({
      collection: 'users',
      data: {
        email: FIXTURES['bootstrap-admin'].email,
        name: FIXTURES['bootstrap-admin'].name,
        roles: ['editor'],
        googleSub: FIXTURES['bootstrap-admin'].sub,
      },
      overrideAccess: true,
      req: { user: null } as Parameters<typeof payload.create>[0]['req'],
    })

    const second = await payload.create({
      collection: 'users',
      data: {
        email: FIXTURES.editor.email,
        name: FIXTURES.editor.name,
        roles: ['editor'],
        googleSub: FIXTURES.editor.sub,
      },
      overrideAccess: true,
      req: { user: null } as Parameters<typeof payload.create>[0]['req'],
    })

    expect(second.roles).toEqual(['editor'])
  })

  it('returning user matched by googleSub — no duplicate users row (FR-006)', async () => {
    const fixture = FIXTURES.editor
    await payload.create({
      collection: 'users',
      data: {
        email: fixture.email,
        name: fixture.name,
        roles: ['editor'],
        googleSub: fixture.sub,
      },
      overrideAccess: true,
      req: { user: null } as Parameters<typeof payload.create>[0]['req'],
    })

    // Returning sign-in path: callback looks up by googleSub and re-uses.
    const found = await payload.find({
      collection: 'users',
      where: { googleSub: { equals: fixture.sub } },
      limit: 1,
      overrideAccess: true,
    })
    expect(found.docs).toHaveLength(1)
    expect(found.docs[0].email).toBe(fixture.email)

    const allUsers = await payload.find({ collection: 'users', overrideAccess: true })
    expect(allUsers.docs).toHaveLength(1)
  })

  it('googleSub is unique — Payload rejects a second row with the same sub', async () => {
    const fixture = FIXTURES.editor
    await payload.create({
      collection: 'users',
      data: {
        email: fixture.email,
        name: fixture.name,
        roles: ['editor'],
        googleSub: fixture.sub,
      },
      overrideAccess: true,
      req: { user: null } as Parameters<typeof payload.create>[0]['req'],
    })

    await expect(
      payload.create({
        collection: 'users',
        data: {
          email: 'other@seqtechllc.com',
          name: 'Other',
          roles: ['editor'],
          googleSub: fixture.sub, // duplicate
        },
        overrideAccess: true,
        req: { user: null } as Parameters<typeof payload.create>[0]['req'],
      }),
    ).rejects.toThrow()
  })
})
