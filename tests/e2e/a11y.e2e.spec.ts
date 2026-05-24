import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/**
 * Phase 1 accessibility baseline. Asserts zero WCAG 2.2 AA violations on the
 * public route (DESIGN_SYSTEM.md §12). Expand coverage to the 5 archetype
 * pages (Home / About / Service Pillar / Service Detail / Case Study) once
 * they exist — see ARCHITECTURE.md §12 Visual Regression.
 *
 * `/admin/*` is Payload's UI and not in scope for our a11y gates.
 */

test.describe('a11y — WCAG 2.2 AA on public routes', () => {
  test('/ has no axe violations', async ({ page }) => {
    await page.goto('/')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()

    expect(
      results.violations,
      `axe found ${results.violations.length} accessibility violation(s) on /:\n` +
        results.violations.map((v) => `  • [${v.id}] ${v.help} — ${v.helpUrl}`).join('\n'),
    ).toEqual([])
  })
})
