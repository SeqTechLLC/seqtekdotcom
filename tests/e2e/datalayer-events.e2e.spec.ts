import { expect, test, type Page } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import config from '../../src/payload.config'
import type { CaseStudy } from '../../src/payload-types'

/**
 * spec 008 US3 (T013) — the conversion-signal surface lands its documented
 * events on `window.dataLayer` (contracts/datalayer-events.md D1/D2, quickstart
 * §1). The emitters are env-gated-safe: with `NEXT_PUBLIC_GTM_ID` unset
 * (CI/local default) GTM never loads, but the inline ConsentDefault still
 * initializes `window.dataLayer` and the pushes land — which is what this
 * asserts against. No consent is required: a dataLayer push is not a gated tag.
 *
 * Authored FIRST to FAIL: with only the shared helper present and no emitters
 * wired, the CTA click / case-study view produce no push → red. T015–T018 turn
 * it green. `booking_complete` is seam-only (no live assertion until the real
 * Meetings embed — D3).
 *
 * Self-seeds a published case study through the Local API against the same
 * DATABASE_URL the dev server reads (the spec-004 marquee pattern). The detail
 * route is a unique-slug cache miss, so no `revalidateDevCache` is needed.
 */

const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

const lexical = (text: string): NonNullable<CaseStudy['problem']> =>
  ({
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          children: [
            { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 },
          ],
        },
      ],
    },
  }) as NonNullable<CaseStudy['problem']>

const CASE_SLUG = 'dl-events-case'
const CASE_TITLE = 'DataLayer Events Case Study'
const MEDIA_ALT = 'dl-events seed image'
const INDUSTRY_SLUG = 'dl-events-industry'

/** dataLayer entries that are object events (our pushes), not gtag arg-arrays. */
async function dataLayerEvents(page: Page): Promise<Array<Record<string, unknown>>> {
  return page.evaluate(() =>
    (window.dataLayer ?? []).filter(
      (e): e is Record<string, unknown> =>
        !!e && typeof e === 'object' && !Array.isArray(e) && 'event' in e,
    ),
  )
}

let payload: Payload

test.beforeAll(async () => {
  payload = await getPayload({ config: await config })

  const media = await payload.create({
    collection: 'media',
    data: { alt: MEDIA_ALT },
    file: { data: PNG_1x1, mimetype: 'image/png', name: 'dl-events.png', size: PNG_1x1.length },
    overrideAccess: true,
  })
  const industry = await payload.create({
    collection: 'industries',
    data: { title: 'Energy', slug: INDUSTRY_SLUG },
    overrideAccess: true,
  })
  await payload.delete({
    collection: 'caseStudies',
    where: { slug: { equals: CASE_SLUG } },
    overrideAccess: true,
  })
  await payload.create({
    collection: 'caseStudies',
    data: {
      title: CASE_TITLE,
      slug: CASE_SLUG,
      subtitle: 'Seeded for the dataLayer case_study_view assertion.',
      industry: industry.id,
      heroImage: media.id,
      problem: lexical('A seeded problem statement.'),
      _status: 'published',
    },
    overrideAccess: true,
  })
})

test.afterAll(async () => {
  await payload.delete({
    collection: 'caseStudies',
    where: { slug: { equals: CASE_SLUG } },
    overrideAccess: true,
  })
  await payload.delete({
    collection: 'industries',
    where: { slug: { equals: INDUSTRY_SLUG } },
    overrideAccess: true,
  })
  await payload.delete({
    collection: 'media',
    where: { alt: { equals: MEDIA_ALT } },
    overrideAccess: true,
  })
})

test.describe('US3 — dataLayer conversion signals', () => {
  test('clicking a primary CTA pushes exactly one cta_click with event + ctaId (D1)', async ({
    page,
  }) => {
    await page.goto('/')
    // ConsentDefault initializes window.dataLayer before any interaction.
    await page.waitForFunction(() => Array.isArray(window.dataLayer))

    expect((await dataLayerEvents(page)).filter((e) => e.event === 'cta_click')).toHaveLength(0)

    // The site-wide header CTA (Button rendered as a CTA). App-Router soft
    // navigation preserves window.dataLayer, so the push survives the click.
    const cta = page.locator('[data-cta-id="header-cta"]').first()
    await expect(cta).toBeVisible()
    await cta.click()

    await expect
      .poll(async () => (await dataLayerEvents(page)).filter((e) => e.event === 'cta_click').length)
      .toBe(1)

    const click = (await dataLayerEvents(page)).find((e) => e.event === 'cta_click')!
    expect(click.ctaId).toBeTruthy()
    expect(click.event).toBe('cta_click')
  })

  test('visiting a case study pushes exactly one case_study_view with the right slug (D2)', async ({
    page,
  }) => {
    await page.goto(`/case-studies/${CASE_SLUG}`)
    await page.waitForFunction(() => Array.isArray(window.dataLayer))
    await expect(page.getByTestId('case-study-title')).toContainText(CASE_TITLE)

    await expect
      .poll(
        async () =>
          (await dataLayerEvents(page)).filter((e) => e.event === 'case_study_view').length,
      )
      .toBe(1)

    const view = (await dataLayerEvents(page)).find((e) => e.event === 'case_study_view')!
    expect(view.slug).toBe(CASE_SLUG)
  })

  // booking_complete (D3) is a seam only — emission is gated on the real
  // HubSpot Meetings embed (HubspotMeetings.tsx is a placeholder). No live
  // assertion here; the listener shape is reviewable in BookingCompleteSeam.tsx.
})
