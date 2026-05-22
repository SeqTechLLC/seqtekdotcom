import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'

import config from '../../src/payload.config.js'
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

describe('Auto-provision + bootstrap-admin (FR-005, US2, R-4)', () => {
  it('first OAuth-provisioning create on an empty table → role=admin', async () => {
    const fixture = FIXTURES.editor // role=editor in the fixture, hook overrides on empty table
    const created = await payload.create({
      collection: 'users',
      data: {
        email: fixture.email,
        name: fixture.name,
        roles: ['editor'],
      },
      overrideAccess: true,
      req: { user: null } as Parameters<typeof payload.create>[0]['req'],
    })
    expect(created.roles).toEqual(['admin'])
  })

  it('subsequent OAuth-provisioning creates default to role=editor', async () => {
    // bootstrap an admin first
    await payload.create({
      collection: 'users',
      data: {
        email: FIXTURES['bootstrap-admin'].email,
        name: FIXTURES['bootstrap-admin'].name,
        roles: ['editor'],
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
      },
      overrideAccess: true,
      req: { user: null } as Parameters<typeof payload.create>[0]['req'],
    })

    expect(second.roles).toEqual(['editor'])
  })

  it('matches returning user by Google sub — no duplicate users row (FR-006)', async () => {
    // Provision via OAuth path
    const user = await payload.create({
      collection: 'users',
      data: {
        email: FIXTURES.editor.email,
        name: FIXTURES.editor.name,
        roles: ['editor'],
      },
      overrideAccess: true,
      req: { user: null } as Parameters<typeof payload.create>[0]['req'],
    })
    await payload.create({
      collection: 'accounts',
      data: {
        user: user.id,
        issuerName: 'google',
        sub: FIXTURES.editor.sub,
        name: FIXTURES.editor.name,
      },
      overrideAccess: true,
    })

    // Returning sign-in resolves by sub — caller does a find, gets the row, then re-uses.
    // Simulate that lookup:
    const found = await payload.find({
      collection: 'accounts',
      where: {
        and: [{ issuerName: { equals: 'google' } }, { sub: { equals: FIXTURES.editor.sub } }],
      },
      overrideAccess: true,
    })
    expect(found.docs).toHaveLength(1)

    const allUsers = await payload.find({ collection: 'users', overrideAccess: true })
    expect(allUsers.docs).toHaveLength(1)
  })
})
