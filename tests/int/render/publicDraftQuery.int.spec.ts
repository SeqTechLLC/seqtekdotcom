import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'

import config from '../../../src/payload.config.js'
import { cleanupDraftDoc, seedDraftCaseStudy, seedDraftPage } from '../../helpers/seedDraftDoc'

const DRAFT_SLUG = 'us3-public-draft-query-fixture'
const PUBLISHED_SLUG = 'us3-public-published-query-fixture'

let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

afterAll(async () => {
  await cleanupDraftDoc('caseStudies', DRAFT_SLUG)
  await cleanupDraftDoc('pages', PUBLISHED_SLUG)
})

/**
 * Render-path invariant for US3 acceptance #5 / FR-016 / contract
 * `public-api-draft-filter.md`.
 *
 * Phase 3 (Spec 004) page templates query Payload by slug and pass the
 * result straight to `<RenderBlocks>` — no defensive `_status` filter,
 * because the collection's `read` access (`publishedOrAuthed`) is the
 * single source of truth. A regression here would silently leak draft
 * content to the public site.
 *
 * Companion test `tests/int/collections/draftLeak.test.ts` (US5, T109)
 * extends this matrix to every draftable collection and to REST/GraphQL.
 * This file scopes to the caseStudies Local API path that engineers
 * actually call from Phase 3 page templates.
 */
describe('public Payload query hides drafts (FR-016, US3 #5)', () => {
  it('omits a draft caseStudy when called without req.user', async () => {
    const draft = await seedDraftCaseStudy(DRAFT_SLUG)

    const publicResult = await payload.find({
      collection: 'caseStudies',
      where: { slug: { equals: DRAFT_SLUG } },
      overrideAccess: false,
    })

    expect(publicResult.docs).toEqual([])
    expect(publicResult.totalDocs).toBe(0)

    // Control: the same query with overrideAccess proves the doc exists in
    // the DB. If this fails the draft was never seeded; the public-empty
    // assertion above would be a false positive otherwise.
    const privilegedResult = await payload.find({
      collection: 'caseStudies',
      where: { slug: { equals: DRAFT_SLUG } },
      overrideAccess: true,
      draft: true,
    })
    expect(privilegedResult.totalDocs).toBe(1)
    expect(String(privilegedResult.docs[0].id)).toBe(draft.id)
    expect(privilegedResult.docs[0]._status).toBe('draft')
  })

  it('returns a published page when called without req.user', async () => {
    // Positive companion: prove the filter is `_status === 'published'`,
    // not "always empty". Engineers building Phase 3 templates need the
    // public path to actually return published rows; otherwise they would
    // (reasonably) start passing `overrideAccess: true` to compensate and
    // re-open the draft-leak. `pages` shares the same `publishedOrAuthed`
    // helper and has no required relationships — so the publish step
    // here exercises the access path without dragging a media+industry
    // fixture into a render-path test.
    const seeded = await seedDraftPage(PUBLISHED_SLUG, 'US3 Published Fixture')

    await payload.update({
      collection: 'pages',
      id: seeded.id,
      data: { _status: 'published' },
      overrideAccess: true,
    })

    const publicResult = await payload.find({
      collection: 'pages',
      where: { slug: { equals: PUBLISHED_SLUG } },
      overrideAccess: false,
    })

    expect(publicResult.totalDocs).toBe(1)
    expect(publicResult.docs[0].slug).toBe(PUBLISHED_SLUG)
  })
})
