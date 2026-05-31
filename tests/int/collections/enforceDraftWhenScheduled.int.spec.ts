// @vitest-environment node
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '../../../src/payload.config.js'

/**
 * T121 / FR-028 / R-11 / spec 003 US7.
 *
 * `enforceDraftWhenScheduled` (`src/payload/hooks/enforceDraftWhenScheduled.ts`)
 * is the Payload-side half of scheduled publishing. The cron trigger that
 * flips matching docs from draft → published runs as a separate job (deferred
 * out of spec 003 — only the invariant matters here).
 *
 * Contract: at save time, if `publishedAt > now`, the hook forces
 * `_status = 'draft'` regardless of the value the editor submitted. Tested
 * here against `posts` (the primary surface) plus one structured collection
 * (`caseStudies`) to confirm the hook works across schema shapes.
 *
 * Wire-up audit (T122): the hook must be present in `beforeChange` on every
 * draftable collection that exposes a `publishedAt` field. Verified by
 * importing each collection config and asserting the hook reference is in
 * the beforeChange array.
 */

import { Pages } from '../../../src/collections/Pages'
import { Posts } from '../../../src/collections/Posts'
import { CaseStudies } from '../../../src/collections/CaseStudies'
import { Services } from '../../../src/collections/Services'
import { Workshops } from '../../../src/collections/Workshops'
import { enforceDraftWhenScheduled } from '../../../src/payload/hooks/enforceDraftWhenScheduled'

let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

afterAll(async () => {
  await payload.delete({
    collection: 'pages',
    where: { slug: { like: 'enforce-draft-%' } },
    overrideAccess: true,
  })
  await payload.delete({
    collection: 'caseStudies',
    where: { slug: { like: 'enforce-draft-%' } },
    overrideAccess: true,
  })
})

// Payload's `create` overload narrows `data` based on `draft: true/false`.
// Tests that set `_status` directly fight that narrowing; cast through unknown
// the same way `access.int.spec.ts` does for the same reason.
type CreateArgs = Parameters<typeof payload.create>[0]

// Tests against `pages` (title + slug are the only required fields, so we
// don't need to seed support fixtures). `caseStudies` smoke uses `draft: true`
// to skip its required-relation validation since we're only verifying the
// hook's effect on `_status`, not field shape.
describe('enforceDraftWhenScheduled hook (T121 / FR-028 / R-11)', () => {
  it('forces _status to draft when publishedAt is in the future (pages)', async () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const page = await payload.create({
      collection: 'pages',
      data: {
        title: 'Enforce Draft Future',
        slug: 'enforce-draft-future-page',
        publishedAt: future,
        _status: 'published', // editor tried to publish — hook should override
      },
      overrideAccess: true,
    } as unknown as CreateArgs)
    expect((page as { _status: string })._status).toBe('draft')
  })

  it('leaves _status alone when publishedAt is in the past (pages)', async () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const page = await payload.create({
      collection: 'pages',
      data: {
        title: 'Enforce Draft Past',
        slug: 'enforce-draft-past-page',
        publishedAt: past,
        _status: 'published',
      },
      overrideAccess: true,
    } as unknown as CreateArgs)
    expect((page as { _status: string })._status).toBe('published')
  })

  it('leaves _status alone when publishedAt is unset (pages)', async () => {
    const page = await payload.create({
      collection: 'pages',
      data: {
        title: 'Enforce Draft No Date',
        slug: 'enforce-draft-no-date-page',
        _status: 'published',
      },
      overrideAccess: true,
    } as unknown as CreateArgs)
    expect((page as { _status: string })._status).toBe('published')
  })

  it('forces _status to draft when publishedAt is in the future (caseStudies)', async () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const cs = await payload.create({
      collection: 'caseStudies',
      data: {
        title: 'Enforce Draft Case Future',
        slug: 'enforce-draft-case-future',
        publishedAt: future,
        _status: 'published',
      },
      overrideAccess: true,
      draft: true, // skip required-relation validation; we're testing the hook
    } as unknown as CreateArgs)
    expect((cs as { _status: string })._status).toBe('draft')
  })
})

/**
 * T122 — wire-up audit. Every draftable collection with a `publishedAt`
 * field must have `enforceDraftWhenScheduled` in its `beforeChange` array.
 */
describe('enforceDraftWhenScheduled wire-up audit (T122)', () => {
  const collectionsWithPublishedAt = [
    { name: 'Pages', config: Pages },
    { name: 'Posts', config: Posts },
    { name: 'CaseStudies', config: CaseStudies },
    { name: 'Services', config: Services },
    { name: 'Workshops', config: Workshops },
  ] as const

  it.each(collectionsWithPublishedAt)(
    '$name has enforceDraftWhenScheduled in beforeChange',
    ({ config }) => {
      const beforeChange = config.hooks?.beforeChange ?? []
      expect(beforeChange).toContain(enforceDraftWhenScheduled)
    },
  )
})
