import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import config from '../../src/payload.config'
import { attachEditorSessionToContext, cleanupEditorSession } from '../sessions/editorSession'
import { revalidateDevCache } from './helpers/revalidateDevCache'
import { warmRoute } from './helpers/warmRoute'
import type { CaseStudy } from '../../src/payload-types'

/** Minimal valid Payload/Lexical richText value carrying a single paragraph. */
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

/**
 * spec 004 marquee-page E2E suite. Each user story appends its own
 * `describe` block (T011 US1, T014 US2, T018 US3, T021 US4, T024 US5).
 *
 * Tests self-seed published/draft fixtures through the Local API against the
 * same DATABASE_URL the dev server reads (the spec-003 preview E2E pattern),
 * so they don't depend on ambient seed state. Detail routes whose collections
 * require media/relationship fields are verified through the authenticated
 * draft-preview path (acceptance is "one drafted doc renders" — spec.md
 * clarification 2026-06-01); the public published path is exercised where the
 * collection can be published without standing up upload fixtures.
 *
 * Runtime-gated: this suite needs the dev server (Playwright `webServer`
 * starts `npm run dev`) + a reachable Postgres. It is part of the quickstart
 * validation (T047) and CI, not the hermetic int suite.
 */

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

let payload: Payload

test.beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

// ---------------------------------------------------------------------------
// US1 — Homepage renders a credible firm (T011)
// ---------------------------------------------------------------------------

test.describe('US1 — homepage renders the homepage global', () => {
  test.beforeAll(async () => {
    // Best-effort: ensure the homepage global has a hero so the composition
    // renders meaningfully. We do NOT assert this exact text — `getHomepage()`
    // is `unstable_cache`-wrapped and the server's cache can't be busted from
    // the test process (the a11y spec renders `/` first and may cache the
    // pre-seed state). The load-bearing US1 assertions below are cache-
    // independent: the homepage composition renders (hero present, NOT the
    // spike placeholder), and it's axe-clean.
    await payload.updateGlobal({
      slug: 'homepage',
      data: {
        hero: {
          headline: 'A consulting partner you would want to hire',
          subheadline: 'Strategy, delivery, and localshoring from Tulsa.',
        },
        _status: 'published',
      },
      overrideAccess: true,
    })
  })

  test('GET / → 200, homepage composition renders (no placeholder), axe-clean', async ({
    page,
  }) => {
    await revalidateDevCache(page.request, ['homepage_list'])
    await warmRoute(page.request, '/', 'data-testid="hero"')
    const res = await page.goto('/')
    expect(res?.status()).toBe(200)

    await expect(page.getByTestId('homepage')).toBeVisible()
    await expect(page.getByTestId('hero')).toBeVisible()
    // The hero renders a heading from the homepage global (or its fallback) —
    // proves the template composed, not the empty-state placeholder.
    await expect(page.getByTestId('hero').locator('h1, h2').first()).toBeVisible()

    // The spike "No page yet" placeholder must be gone (drift #2).
    await expect(page.getByText('No page yet')).toHaveCount(0)

    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()
    expect(
      results.violations,
      results.violations.map((v) => `[${v.id}] ${v.help}`).join('\n'),
    ).toEqual([])
  })
})

// 1x1 transparent PNG — the smallest valid upload for the required `photo`.
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

// ---------------------------------------------------------------------------
// US3 — Team page shows real people (T018)
// ---------------------------------------------------------------------------

const TEAM_SLUG = 'us3-marquee-member'
const TEAM_NAME = 'US3 Marquee Member'

test.describe('US3 — team page renders members with photos', () => {
  test.afterAll(async () => {
    await payload.delete({
      collection: 'teamMembers',
      where: { slug: { equals: TEAM_SLUG } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'media',
      where: { alt: { equals: 'US3 marquee headshot' } },
      overrideAccess: true,
    })
  })

  test('GET /team → 200, TeamGrid renders the member, axe-clean', async ({ page, request }) => {
    const media = await payload.create({
      collection: 'media',
      data: { alt: 'US3 marquee headshot' },
      file: { data: PNG_1x1, mimetype: 'image/png', name: 'us3-team.png', size: PNG_1x1.length },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'teamMembers',
      where: { slug: { equals: TEAM_SLUG } },
      overrideAccess: true,
    })
    await payload.create({
      collection: 'teamMembers',
      data: {
        name: TEAM_NAME,
        slug: TEAM_SLUG,
        title: 'Principal Consultant',
        role: 'Engineering',
        photo: media.id,
        isLeadership: true,
        order: 1,
      },
      overrideAccess: true,
    })

    // `/team` is the one cached LISTING route this suite asserts seeded content
    // on. The create above mutates via a separate Payload process, so its
    // afterChange `revalidateTag` never reaches the dev server — and a sibling
    // suite (a11y) may have already warmed `teamMembers_list`. Bust it in-process
    // so the render reflects the just-created member regardless of suite order.
    await revalidateDevCache(request, ['teamMembers_list'])

    await warmRoute(request, '/team', TEAM_NAME)
    const res = await page.goto('/team')
    expect(res?.status()).toBe(200)
    await expect(page.getByTestId('team')).toBeVisible()
    await expect(page.getByText(TEAM_NAME)).toBeVisible()

    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()
    expect(
      results.violations,
      results.violations.map((v) => `[${v.id}] ${v.help}`).join('\n'),
    ).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// US2 — Flagship case study renders structured content (T014)
// Verified against one DRAFTED case study via the authenticated preview path
// (spec.md clarification 2026-06-01 — the named published flagship is a
// separately-tracked content deliverable).
// ---------------------------------------------------------------------------

const CASE_EDITOR = {
  email: 'marquee-editor-case@seqtechllc.com',
  name: 'Marquee Editor (case)',
  sub: 'marquee-case-editor-sub',
  role: 'editor' as const,
}
const CASE_SLUG = 'us2-marquee-case'

test.describe('US2 — case study renders structured fields', () => {
  test.afterAll(async () => {
    await payload.delete({
      collection: 'caseStudies',
      where: { slug: { equals: CASE_SLUG } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'testimonials',
      where: { quote: { like: 'US2 marquee testimonial%' } },
      overrideAccess: true,
    })
    await cleanupEditorSession(CASE_EDITOR.email)
  })

  test('draft case study renders problem/metrics/testimonial + axe-clean', async ({
    context,
    page,
    baseURL,
  }) => {
    const testimonial = await payload.create({
      collection: 'testimonials',
      data: {
        quote: 'US2 marquee testimonial — they delivered ahead of schedule.',
        personName: 'Dana Client',
        personTitle: 'VP Engineering',
        company: 'Acme Energy',
      },
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
        title: 'Modernizing a Legacy Platform',
        slug: CASE_SLUG,
        subtitle: 'A phased rebuild that cut deploy time in half.',
        problem: lexical('The legacy system shipped quarterly and broke often.'),
        solution: lexical('We introduced CI/CD and a strangler-fig migration.'),
        impact: lexical('Deploys went from quarterly to daily.'),
        metrics: [
          { number: '50%', label: 'Faster deploys' },
          { number: '3x', label: 'Release frequency' },
        ],
        testimonial: testimonial.id,
      },
      draft: true,
      overrideAccess: true,
    })

    // Warm the cached published read (getCaseStudyBySlug) to a cache hit (null —
    // this case study is draft-only) so the draft render skips the cold heavy
    // published query that can trip the read-timeout. allowNotFound: once the
    // null read is cached the warm lands on the 404.
    await warmRoute(page.request, `/case-studies/${CASE_SLUG}`, [], true)
    await attachEditorSessionToContext(context, baseURL!, CASE_EDITOR)

    // The preview route authenticates, enables draft mode, and 302s to the
    // public path; following it lands on the draft render.
    await page.goto(`/preview/caseStudies/${CASE_SLUG}`)
    await expect(page).toHaveURL(new RegExp(`/case-studies/${CASE_SLUG}$`))

    await expect(page.getByTestId('case-study')).toBeVisible()
    await expect(page.getByTestId('case-study-title')).toContainText(
      'Modernizing a Legacy Platform',
    )
    await expect(page.getByTestId('case-study-problem')).toBeVisible()
    await expect(page.getByTestId('case-study-metrics')).toContainText('Faster deploys')
    await expect(page.getByTestId('case-study-testimonial')).toContainText('Dana Client')

    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()
    expect(
      results.violations,
      results.violations.map((v) => `[${v.id}] ${v.help}`).join('\n'),
    ).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// US4 — Touchstone AI workshop campaign landing (T021)
// Workshops publish with just title+slug, so this exercises the PUBLIC path.
// The HubSpot form is the Phase-2 PLACEHOLDER (live submission out of scope —
// research §D10).
// ---------------------------------------------------------------------------

const WORKSHOP_SLUG = 'us4-marquee-workshop'

test.describe('US4 — workshop detail + placeholder form mounts', () => {
  test.afterAll(async () => {
    await payload.delete({
      collection: 'workshops',
      where: { slug: { equals: WORKSHOP_SLUG } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'media',
      where: { alt: { equals: 'US4 workshop proof photo' } },
      overrideAccess: true,
    })
  })

  test('GET /workshops/<slug> → 200, detail + hubspot-form mount, axe-clean', async ({ page }) => {
    await payload.delete({
      collection: 'workshops',
      where: { slug: { equals: WORKSHOP_SLUG } },
      overrideAccess: true,
    })
    const proofPhoto = await payload.create({
      collection: 'media',
      data: { alt: 'US4 workshop proof photo' },
      file: { data: PNG_1x1, mimetype: 'image/png', name: 'us4-proof.png', size: PNG_1x1.length },
      overrideAccess: true,
    })
    await payload.create({
      collection: 'workshops',
      data: {
        title: 'Touchstone AI Strategy Workshop',
        slug: WORKSHOP_SLUG,
        description: lexical('A facilitated working session for leadership teams.'),
        audience: lexical('For executives accountable for an AI roadmap.'),
        photos: [{ image: proofPhoto.id, caption: 'Working the plan at the whiteboard.' }],
        video: { provider: 'youtube', videoId: 'dQw4w9WgXcQ', title: 'Workshop recap' },
        _status: 'published',
      },
      overrideAccess: true,
    })

    await warmRoute(page.request, `/workshops/${WORKSHOP_SLUG}`, 'data-testid="workshop-detail"')
    const res = await page.goto(`/workshops/${WORKSHOP_SLUG}`)
    expect(res?.status()).toBe(200)
    await expect(page.getByTestId('workshop-detail')).toBeVisible()
    await expect(page.getByTestId('workshop-description')).toBeVisible()
    // Proof section: captioned photo gallery + video embed render from the
    // new schema fields (spec: touchstone-landing.md §5).
    await expect(page.getByTestId('workshop-photos')).toBeVisible()
    await expect(page.getByText('Working the plan at the whiteboard.')).toBeVisible()
    await expect(page.getByTestId('workshop-video')).toBeVisible()
    // The placeholder block mounts; a live HubSpot submission is NOT asserted.
    await expect(page.getByTestId('hubspot-form')).toBeVisible()

    // Exclude third-party video player frames from the scan: with the iframe
    // referrer policy fixed (YouTube error 153), the real player DOM loads
    // here and axe flags violations inside it (role-less aria-label div,
    // unlabeled buttons) — YouTube's markup, not ours. The gate covers our DOM.
    const results = await new AxeBuilder({ page })
      .withTags(AXE_TAGS)
      .exclude('iframe[src*="youtube-nocookie.com"]')
      .exclude('iframe[src*="player.vimeo.com"]')
      .analyze()
    expect(
      results.violations,
      results.violations.map((v) => `[${v.id}] ${v.help}`).join('\n'),
    ).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// US5 — Localshoring narrative via the generic /[slug] pages route (T024)
// ---------------------------------------------------------------------------

const LOCALSHORING_SLUG = 'localshoring'

test.describe('US5 — localshoring renders via RenderBlocks', () => {
  test.afterAll(async () => {
    await payload.delete({
      collection: 'pages',
      where: { slug: { equals: LOCALSHORING_SLUG } },
      overrideAccess: true,
    })
  })

  test('GET /localshoring → 200, comparison-table narrative renders, axe-clean', async ({
    page,
  }) => {
    await payload.delete({
      collection: 'pages',
      where: { slug: { equals: LOCALSHORING_SLUG } },
      overrideAccess: true,
    })
    await payload.create({
      collection: 'pages',
      data: {
        title: 'Localshoring',
        slug: LOCALSHORING_SLUG,
        layout: [
          {
            blockType: 'comparison-table',
            heading: 'Localshoring vs the alternatives',
            columns: [{ label: 'Localshoring' }, { label: 'Offshore' }],
            rows: [{ dimension: 'Time zone', cells: [{ value: 'Same' }, { value: 'Opposite' }] }],
          },
        ],
        _status: 'published',
      },
      overrideAccess: true,
    })

    const res = await page.goto(`/${LOCALSHORING_SLUG}`)
    expect(res?.status()).toBe(200)
    await expect(page.getByTestId('page')).toBeVisible()
    await expect(page.getByText('Localshoring vs the alternatives')).toBeVisible()

    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()
    expect(
      results.violations,
      results.violations.map((v) => `[${v.id}] ${v.help}`).join('\n'),
    ).toEqual([])
  })
})
