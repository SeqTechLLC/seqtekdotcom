import { expect, test } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import config from '../../src/payload.config'
import { attachEditorSessionToContext, cleanupEditorSession } from '../sessions/editorSession'

/**
 * spec 004 T042 (invariant R4). The draft round-trip held on the PUBLIC render
 * side: an editor at /preview/<collection>/<slug> sees draft content + the
 * amber PreviewBanner; an anonymous hit on the public URL sees published-only
 * (here, a 404 because the doc was never published). This is the spec-003 US5
 * draft-leak invariant, now enforced by the spec-004 route templates.
 *
 * Runtime-gated (needs the dev server + Postgres) — quickstart/T047 + CI.
 */

const EDITOR = {
  email: 'preview-roundtrip-editor@seqtechllc.com',
  name: 'Preview Roundtrip Editor',
  sub: 'preview-roundtrip-editor-sub',
  role: 'editor' as const,
}
const SLUG = 'preview-roundtrip-case'

let payload: Payload

test.beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

test.afterAll(async () => {
  await payload.delete({
    collection: 'caseStudies',
    where: { slug: { equals: SLUG } },
    overrideAccess: true,
  })
  await cleanupEditorSession(EDITOR.email)
})

test.describe('preview round-trip — draft visible in preview, hidden in public', () => {
  test('editor sees draft + PreviewBanner; anon sees 404 (never published)', async ({
    context,
    page,
    baseURL,
    browser,
  }) => {
    await payload.delete({
      collection: 'caseStudies',
      where: { slug: { equals: SLUG } },
      overrideAccess: true,
    })
    await payload.create({
      collection: 'caseStudies',
      data: { title: 'Preview Roundtrip Draft', slug: SLUG, subtitle: 'Draft-only subtitle' },
      draft: true,
      overrideAccess: true,
    })

    // Editor: preview route → draft render + amber banner.
    await attachEditorSessionToContext(context, baseURL!, EDITOR)
    await page.goto(`/preview/caseStudies/${SLUG}`)
    await expect(page).toHaveURL(new RegExp(`/case-studies/${SLUG}$`))
    await expect(page.getByTestId('preview-banner')).toBeVisible()
    await expect(page.getByTestId('case-study')).toBeVisible()
    await expect(page.getByText('Preview Roundtrip Draft')).toBeVisible()

    // Anonymous: a fresh context (no draft cookie) hits the public URL and 404s
    // because the doc was never published — no draft leak.
    const anonContext = await browser.newContext()
    const anonPage = await anonContext.newPage()
    const res = await anonPage.goto(`${baseURL}/case-studies/${SLUG}`)
    expect(res?.status()).toBe(404)
    await anonContext.close()
  })
})
