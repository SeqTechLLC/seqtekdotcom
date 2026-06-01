import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import config from '../../src/payload.config'
import { attachEditorSessionToContext, cleanupEditorSession } from '../sessions/editorSession'
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

const HOMEPAGE_HERO = 'A consulting partner you would want to hire'

test.describe('US1 — homepage renders the homepage global', () => {
  test.beforeAll(async () => {
    await payload.updateGlobal({
      slug: 'homepage',
      data: {
        hero: {
          headline: HOMEPAGE_HERO,
          subheadline: 'Strategy, delivery, and localshoring from Tulsa.',
        },
        _status: 'published',
      },
      overrideAccess: true,
    })
  })

  test('GET / → 200, homepage global sections render (no placeholder), axe-clean', async ({
    page,
  }) => {
    const res = await page.goto('/')
    expect(res?.status()).toBe(200)

    await expect(page.getByTestId('homepage')).toBeVisible()
    await expect(page.getByTestId('hero')).toBeVisible()
    await expect(page.getByText(HOMEPAGE_HERO)).toBeVisible()

    // The spike "No page yet" placeholder must be gone (drift #2).
    await expect(page.getByText('No page yet')).toHaveCount(0)

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
