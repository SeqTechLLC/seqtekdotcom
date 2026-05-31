import { expect, test } from '@playwright/test'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'

import config from '../../../src/payload.config'
import { attachEditorSessionToContext, cleanupEditorSession } from '../../sessions/editorSession'

/**
 * T111 / R-17 (access matrix UI smoke).
 *
 * The access matrix says editors cannot delete content (`delete:
 * isAdmin`). The admin UI surfaces this by NOT rendering the delete
 * affordance for editor sessions — Payload's DocumentControls
 * conditionally renders `<DeleteDocument />` only when
 * `hasDeletePermission` is true. This test mints an editor session,
 * lands on a real `caseStudies` document, and asserts the action
 * button (`#action-delete`) never appears.
 *
 * The companion access-matrix int test (T108) covers the API-level
 * gate; this file is the UI affordance smoke that guarantees the
 * editor doesn't see a button that would also fail server-side.
 */

const EDITOR = {
  email: 'fixture-editor-delete-forbidden@seqtechllc.com',
  name: 'Editor Delete Forbidden',
  sub: 'fixture-editor-delete-forbidden-sub',
  role: 'editor' as const,
}

const CASE_FIXTURE = {
  slug: 'editor-delete-forbidden-fixture',
  industrySlug: 'editor-delete-forbidden-industry',
  mediaFilename: 'editor-delete-forbidden.png',
}

let payload: Payload
let caseStudyId: string | number
let mediaId: string | number
let industryId: string | number

test.describe('T111 — editor delete forbidden (R-17, UI affordance)', () => {
  test.beforeAll(async () => {
    payload = await getPayload({ config: await config })

    // Wipe any leftover fixtures from a prior run.
    await payload.delete({
      collection: 'caseStudies',
      where: { slug: { equals: CASE_FIXTURE.slug } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'industries',
      where: { slug: { equals: CASE_FIXTURE.industrySlug } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'media',
      where: { filename: { like: 'editor-delete-forbidden-%' } },
      overrideAccess: true,
    })

    // Seed via the SVG→PNG path that `placeholders.ts` proved works
    // against Payload's `file-type`-based MIME check.
    const pngBuffer = await sharp(
      Buffer.from(
        '<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" fill="#888"/></svg>',
      ),
    )
      .png()
      .toBuffer()
    const media = await payload.create({
      collection: 'media',
      data: { alt: 'editor delete forbidden hero' },
      file: {
        data: pngBuffer,
        mimetype: 'image/png',
        name: CASE_FIXTURE.mediaFilename,
        size: pngBuffer.length,
      },
      overrideAccess: true,
    })
    mediaId = media.id

    const industry = await payload.create({
      collection: 'industries',
      data: {
        title: 'Editor Delete Forbidden Industry',
        slug: CASE_FIXTURE.industrySlug,
        _status: 'published',
      },
      overrideAccess: true,
    })
    industryId = industry.id

    const caseStudy = await payload.create({
      collection: 'caseStudies',
      data: {
        title: 'Editor Delete Forbidden Fixture',
        slug: CASE_FIXTURE.slug,
        industry: industryId as number,
        heroImage: mediaId as number,
        _status: 'published',
      },
      overrideAccess: true,
    })
    caseStudyId = caseStudy.id
  })

  test.afterAll(async () => {
    await cleanupEditorSession(EDITOR.email)
    await payload.delete({
      collection: 'caseStudies',
      where: { slug: { equals: CASE_FIXTURE.slug } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'industries',
      where: { slug: { equals: CASE_FIXTURE.industrySlug } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'media',
      where: { filename: { like: 'editor-delete-forbidden-%' } },
      overrideAccess: true,
    })
  })

  test('editor on /admin/collections/caseStudies/:id sees no delete button', async ({
    context,
    page,
    baseURL,
  }) => {
    expect(baseURL).toBeTruthy()
    await attachEditorSessionToContext(context, baseURL!, EDITOR)

    await page.goto(`/admin/collections/caseStudies/${caseStudyId}`)

    // Wait for the document shell to mount — the title input is the
    // most reliable signal that we're actually on the edit view (and
    // not stuck on /admin/login or a 404).
    await expect(page).toHaveURL(new RegExp(`/admin/collections/caseStudies/${caseStudyId}`), {
      timeout: 10_000,
    })

    // Payload renders the dot menu only when there's something to put
    // in it — for an editor without delete perms the menu may be
    // absent entirely. Either way, the delete action (button id
    // `action-delete`) must not exist anywhere on the page.
    await expect(page.locator('#action-delete')).toHaveCount(0)
  })
})
