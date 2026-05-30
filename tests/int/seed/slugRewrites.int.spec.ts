import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '../../../src/payload.config'
import { runSeed } from '../../../src/payload/seed/migrateFromAudit'
import { applySlugRewrite } from '../../../src/payload/seed/slugRewrites'
import {
  FIXTURE_EXPECTED_CASE_SLUGS,
  FIXTURE_EXPECTED_PAGE_SLUGS,
  FIXTURE_EXPECTED_POST_SLUGS,
  writeAuditFixture,
} from '../../helpers/seedFixtures'

/**
 * T093 / FR-031: when the audit key is a Wix garbage slug
 * (`case-study-3`, `driving-innovation-case-study`, `about-us-1`,
 * `workshops`), the seed writes the canonical slug from
 * INTEGRATIONS.md §9 — never the source slug.
 */

let payload: Payload
const fixture = writeAuditFixture()

beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

afterAll(async () => {
  for (const slug of FIXTURE_EXPECTED_CASE_SLUGS) {
    await payload.delete({
      collection: 'caseStudies',
      where: { slug: { equals: slug } },
      overrideAccess: true,
    })
  }
  for (const slug of FIXTURE_EXPECTED_PAGE_SLUGS) {
    await payload.delete({
      collection: 'pages',
      where: { slug: { equals: slug } },
      overrideAccess: true,
    })
  }
  await payload.delete({
    collection: 'posts',
    where: { slug: { in: [...FIXTURE_EXPECTED_POST_SLUGS] } },
    overrideAccess: true,
  })
  fixture.cleanup()
})

describe('slug rewrites (T093 / FR-031)', () => {
  it('applySlugRewrite resolves the canonical slug from INTEGRATIONS.md §9', () => {
    expect(applySlugRewrite('case-study-3')).toBe('mobile-apps-remote-operations')
    expect(applySlugRewrite('case-study-4')).toBe('retail-pos-update-experience')
    expect(applySlugRewrite('driving-innovation-case-study')).toBe('healthcare-ux-redesign')
    expect(applySlugRewrite('about-us-1')).toBe('about')
    expect(applySlugRewrite('workshops')).toBe('touchstone-workshops')
    expect(applySlugRewrite('blog-old')).toBe('insights')
    expect(applySlugRewrite('something-not-in-the-map')).toBe('something-not-in-the-map')
    expect(applySlugRewrite('https://www.seqtek.com/case-study-3')).toBe(
      'mobile-apps-remote-operations',
    )
  })

  it('seeded case studies and pages use canonical slugs, not source slugs', async () => {
    const summary = await runSeed({
      argv: [],
      auditDir: fixture.auditDir,
      logPath: fixture.logPath,
      payload,
      stdout: () => {},
      stderr: () => {},
    })
    expect(summary.exitCode).toBe(0)

    const mobile = await payload.find({
      collection: 'caseStudies',
      where: { slug: { equals: 'mobile-apps-remote-operations' } },
      overrideAccess: true,
      draft: true,
    })
    expect(mobile.totalDocs).toBe(1)

    const healthcare = await payload.find({
      collection: 'caseStudies',
      where: { slug: { equals: 'healthcare-ux-redesign' } },
      overrideAccess: true,
      draft: true,
    })
    expect(healthcare.totalDocs).toBe(1)
    expect(healthcare.docs[0].title).toMatch(/^\[CONTENT MISMATCH /)

    // Source slugs are never used as destination slugs.
    const oldSlug = await payload.find({
      collection: 'caseStudies',
      where: { slug: { equals: 'case-study-3' } },
      overrideAccess: true,
      draft: true,
    })
    expect(oldSlug.totalDocs).toBe(0)

    const about = await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'about' } },
      overrideAccess: true,
      draft: true,
    })
    expect(about.totalDocs).toBe(1)

    const workshops = await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'touchstone-workshops' } },
      overrideAccess: true,
      draft: true,
    })
    expect(workshops.totalDocs).toBe(1)
  })
})
