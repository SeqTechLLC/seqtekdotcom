import { promises as fs } from 'fs'
import path from 'path'
import { test } from '@playwright/test'

/**
 * Per-page visual capture. Screenshots every real public route at desktop +
 * mobile so a human (or Claude) can eyeball the actual rendered pages — not
 * blocks in isolation (that's showcase.e2e.spec.ts).
 *
 * This is a capture harness, NOT a CI assertion gate: it overwrites the PNGs
 * under screenshots/pages/ (gitignored) and skips any route that isn't 200 on
 * the target server rather than failing. The point is to LOOK at the output.
 *
 * Run:  PLAYWRIGHT_BASE_URL=http://localhost:3100 npm run visual:capture
 * Add new routes to ROUTES below as pages ship.
 */

const SCREENSHOT_DIR = path.resolve(import.meta.dirname, 'screenshots/pages')

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
] as const

const ROUTES: { slug: string; path: string }[] = [
  { slug: 'home', path: '/' },
  { slug: 'about', path: '/about' },
  { slug: 'services', path: '/services' },
  { slug: 'case-studies', path: '/case-studies' },
  { slug: 'insights', path: '/insights' },
  { slug: 'team', path: '/team' },
  { slug: 'workshops', path: '/workshops' },
  { slug: 'contact', path: '/contact' },
  { slug: 'privacy-policy', path: '/privacy-policy' },
]

test.beforeAll(async () => {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true })
})

for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    test(`visual capture: ${route.path} @ ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      const res = await page.goto(route.path, { waitUntil: 'networkidle' })
      const status = res?.status() ?? 0
      // Capture tool, not a gate: skip (don't fail) routes that aren't live.
      test.skip(status !== 200, `route ${route.path} returned ${status} — not captured`)
      await page.waitForTimeout(200)
      const file = path.join(SCREENSHOT_DIR, `${route.slug}-${vp.name}.png`)
      await page.screenshot({ path: file, fullPage: true })
    })
  }
}
