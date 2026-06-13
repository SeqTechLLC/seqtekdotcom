import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import type { Payload } from 'payload'

import {
  cleanupInScopeRoutes,
  getPayloadClient,
  inScopeRoutes,
  seedInScopeRoutes,
} from './helpers/seedInScopeRoutes'

/**
 * spec 007 US1 + US2 (T005, T015–T017). Accessibility coverage across the full
 * in-scope route set (contracts/a11y-perf-acceptance.md C-1), seeded via the
 * Local-API helper so the detail/generic routes render real content.
 *
 * - T005/T015: zero WCAG 2.2 A/AA axe violations on every in-scope route
 *   (subsumes US1's `color-contrast` proof — SC-001/002 — and the full WCAG
 *   sweep — SC-002).
 * - T016: one `<main>`, header/nav/footer landmarks, non-skipping heading
 *   order, keyboard reachability + a visible `:focus-visible` ring (FR-006/007).
 * - T017: every `<img>` carries an explicit `alt` (decorative ⇒ `alt=""`),
 *   and `prefers-reduced-motion: reduce` suppresses non-essential motion via
 *   the global reset (FR-008/009).
 *
 * `/admin` keeps its own critical/serious-only policy in
 * `tests/a11y/adminAuthoring.e2e.spec.ts` and is intentionally out of this set.
 *
 * Runtime-gated: needs the dev server (Playwright `webServer` → `npm run dev`)
 * + a reachable Postgres (DATABASE_URL), same as the spec-004 marquee suite.
 */

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const ROUTES = inScopeRoutes()

let payload: Payload

test.beforeAll(async () => {
  payload = await getPayloadClient()
  await seedInScopeRoutes(payload)
})

test.afterAll(async () => {
  await cleanupInScopeRoutes(payload)
})

// ---------------------------------------------------------------------------
// T005 / T015 — full WCAG 2.2 A/AA axe sweep (incl. color-contrast)
// ---------------------------------------------------------------------------

test.describe('a11y — WCAG 2.2 A/AA, all in-scope routes (T005/T015)', () => {
  for (const route of ROUTES) {
    test(`${route.label} (${route.path}) — zero axe violations`, async ({ page }) => {
      const res = await page.goto(route.path)
      expect(res?.status(), `${route.path} did not return 200`).toBe(200)

      // Exclude third-party video player frames: a route with a video embed
      // (e.g. /about) renders YouTube's own player DOM, which axe flags
      // (role-less aria-label div, unlabeled buttons) — their markup, not
      // ours. Same scope as the marquee suite (PR #51).
      const results = await new AxeBuilder({ page })
        .withTags(AXE_TAGS)
        .exclude('iframe[src*="youtube-nocookie.com"]')
        .exclude('iframe[src*="player.vimeo.com"]')
        .analyze()
      expect(
        results.violations,
        `axe found ${results.violations.length} violation(s) on ${route.path}:\n` +
          results.violations
            .map(
              (v) =>
                `  • [${v.impact}] ${v.id} — ${v.help}\n    ${v.nodes
                  .map((n) => n.target.join(' '))
                  .slice(0, 5)
                  .join('\n    ')}`,
            )
            .join('\n'),
      ).toEqual([])
    })
  }
})

// ---------------------------------------------------------------------------
// T016 — landmarks, heading order, keyboard/focus
// ---------------------------------------------------------------------------

/** Heading levels in DOM order. */
async function headingLevels(page: Page): Promise<number[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((h) => Number(h.tagName[1])),
  )
}

test.describe('a11y — landmarks + heading order (T016)', () => {
  for (const route of ROUTES) {
    test(`${route.label} (${route.path}) — landmarks + heading order`, async ({ page }) => {
      const res = await page.goto(route.path)
      expect(res?.status()).toBe(200)

      // Exactly one main; the page chrome supplies header/nav/footer.
      await expect(page.locator('main')).toHaveCount(1)
      await expect(page.locator('header').first()).toBeVisible()
      await expect(page.locator('footer').first()).toBeVisible()
      expect(await page.locator('nav').count()).toBeGreaterThan(0)

      // Heading order never skips a level downward (e.g. h1 → h3).
      const levels = await headingLevels(page)
      for (let i = 1; i < levels.length; i++) {
        expect(
          levels[i] - levels[i - 1],
          `heading order jumps from h${levels[i - 1]} to h${levels[i]} on ${route.path} (levels: ${levels.join(',')})`,
        ).toBeLessThanOrEqual(1)
      }
    })
  }

  test('homepage — keyboard reaches the skip link with a visible focus ring', async ({ page }) => {
    await page.goto('/')
    // First Tab lands on the skip-to-content link (first focusable in the body).
    await page.keyboard.press('Tab')
    const active = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el) return null
      const cs = getComputedStyle(el)
      return {
        tag: el.tagName.toLowerCase(),
        text: (el.textContent ?? '').trim(),
        outlineWidth: cs.outlineWidth,
        outlineStyle: cs.outlineStyle,
      }
    })
    expect(active?.tag).toBe('a')
    expect(active?.text).toContain('Skip to main content')
    // The universal :focus-visible indicator (styles.css §2.4.11) is a 2px outline.
    expect(active?.outlineStyle).not.toBe('none')
    expect(active?.outlineWidth).toBe('2px')
  })

  test('homepage — Tab advances focus without trapping (logical order)', async ({ page }) => {
    await page.goto('/')
    const seen: string[] = []
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab')
      const sig = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null
        if (!el || el === document.body) return 'body'
        return `${el.tagName}:${(el.getAttribute('href') ?? el.textContent ?? '').trim().slice(0, 24)}`
      })
      seen.push(sig)
    }
    // Focus must not get stuck on a single element (a keyboard trap).
    const uniqueConsecutive = seen.filter((s, i) => i === 0 || s !== seen[i - 1])
    expect(uniqueConsecutive.length, `focus appears trapped: ${seen.join(' → ')}`).toBeGreaterThan(
      2,
    )
  })
})

// ---------------------------------------------------------------------------
// T017 — image alt + reduced motion
// ---------------------------------------------------------------------------

test.describe('a11y — image alt + reduced motion (T017)', () => {
  for (const route of ROUTES) {
    test(`${route.label} (${route.path}) — every <img> has an explicit alt`, async ({ page }) => {
      const res = await page.goto(route.path)
      expect(res?.status()).toBe(200)
      // Meaningful images carry descriptive alt; decorative carry alt="" — both
      // satisfy "the attribute is present". A missing alt attribute is the defect.
      const missingAlt = await page.locator('img:not([alt])').count()
      expect(missingAlt, `${route.path} has <img> element(s) with no alt attribute`).toBe(0)
    })
  }

  test('reduced motion — global reset zeroes transition/animation durations', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    // The primary nav links carry `transition-colors`; under the reduced-motion
    // reset (styles.css 67–76) their duration collapses to ~1ms.
    const durations = await page.evaluate(() => {
      const out: string[] = []
      for (const el of Array.from(document.querySelectorAll('a, button'))) {
        const cs = getComputedStyle(el)
        if (cs.transitionDuration && cs.transitionDuration !== '0s') {
          out.push(cs.transitionDuration)
        }
      }
      return out
    })
    // Whatever still declares a transition must be reduced to the 1ms floor.
    for (const d of durations) {
      expect(d, `a transition-duration of ${d} survived the reduced-motion reset`).toBe('0.001s')
    }
  })
})
