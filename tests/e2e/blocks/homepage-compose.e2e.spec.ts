import { expect, test, type Page } from '@playwright/test'
import type { Payload } from 'payload'

import { getPayloadClient } from '../helpers/seedInScopeRoutes'
import { revalidateDevCache } from '../helpers/revalidateDevCache'
import { warmRoute } from '../helpers/warmRoute'

// spec 010 US5 (Phase F) — the homepage GLOBAL is block-composed. Setting its
// `layout` and publishing makes `/` render through RenderBlocks with no deploy,
// while the Organization JSON-LD and the conversion-signal surface (header
// cta_click) are preserved (data-model.md "Keep"). The global's layout is
// saved + restored so the dev homepage is untouched after the run.

const HERO_MARKER = 'HP-E2E-hero-headline-marker'
const BRAND_MARKER = 'HP-E2E-brand-teaser-marker'

const testLayout = [
  {
    blockType: 'homepage-hero',
    headline: HERO_MARKER,
    subheadline: 'Composed through RenderBlocks, not a bespoke template.',
    primaryCta: { label: 'Explore our services', url: '/services' },
    secondaryCta: { label: 'Book a call', url: '/contact' },
  },
  {
    blockType: 'brand-teaser',
    headline: BRAND_MARKER,
    body: 'A composed brand teaser block.',
    linkLabel: 'Read the story',
    linkUrl: '/about',
  },
]

let payload: Payload
let originalLayout: unknown
let originalStatus: string | undefined

/** dataLayer entries that are object events (our pushes), not gtag arg-arrays. */
async function dataLayerEvents(page: Page): Promise<Array<Record<string, unknown>>> {
  return page.evaluate(() =>
    (window.dataLayer ?? []).filter(
      (e): e is Record<string, unknown> =>
        !!e && typeof e === 'object' && !Array.isArray(e) && 'event' in e,
    ),
  )
}

test.beforeAll(async () => {
  payload = await getPayloadClient()
  const current = (await payload.findGlobal({
    slug: 'homepage',
    draft: true,
    overrideAccess: true,
    depth: 0,
  })) as unknown as Record<string, unknown>
  originalLayout = current.layout ?? []
  originalStatus = current._status as string | undefined

  await payload.updateGlobal({
    slug: 'homepage',
    data: { layout: testLayout as never, _status: 'published' },
    overrideAccess: true,
  })
})

test.afterAll(async () => {
  // Restore the homepage exactly as it was so the dev homepage / visual capture
  // and sibling suites see the real composed content, not the test layout.
  await payload.updateGlobal({
    slug: 'homepage',
    data: {
      layout: originalLayout as never,
      _status: (originalStatus ?? 'published') as never,
    },
    overrideAccess: true,
  })
})

test('homepage renders its global layout via RenderBlocks with Organization JSON-LD intact', async ({
  page,
  request,
}) => {
  // The mutation ran in a separate process from the dev server — bust the
  // homepage_list cache (globalCacheTags('homepage')).
  await revalidateDevCache(request, ['homepage_list'])
  await warmRoute(request, '/', HERO_MARKER)
  await page.goto('/')

  // The composed blocks render — proves `/` reads `homepage.layout` through the
  // shared dispatcher (the markers live only in the layout, not the legacy fields).
  await expect(page.getByRole('heading', { name: HERO_MARKER })).toBeVisible()
  await expect(page.getByText(BRAND_MARKER)).toBeVisible()

  // Organization JSON-LD preserved (SEO / AICO).
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents()
  expect(ld.some((s) => s.includes('"@type":"Organization"') || s.includes('"Organization"'))).toBe(
    true,
  )
})

test('the header cta_click conversion signal still fires on the composed homepage', async ({
  page,
  request,
}) => {
  await revalidateDevCache(request, ['homepage_list'])
  await warmRoute(request, '/', HERO_MARKER)
  await page.goto('/')
  await page.waitForFunction(() => Array.isArray(window.dataLayer))

  expect((await dataLayerEvents(page)).filter((e) => e.event === 'cta_click')).toHaveLength(0)

  const cta = page.locator('[data-cta-id="header-cta"]').first()
  await expect(cta).toBeVisible()
  await cta.click()

  await expect
    .poll(async () => (await dataLayerEvents(page)).filter((e) => e.event === 'cta_click').length)
    .toBe(1)
})
