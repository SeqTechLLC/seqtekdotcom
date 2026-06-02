import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/**
 * spec 005 — HubSpot forms E2E. Exercises the shared form lifecycle against the
 * `/contact` form, which is half-wired (no GUID) and therefore never POSTs to
 * HubSpot — safe to actually submit in any env. The workshop form reuses the
 * same engine; its render/mount is covered by the spec-004 marquee suite, and
 * it is deliberately NOT submitted here since it may be live-configured.
 */

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

test.describe('spec 005 — HubSpot contact form', () => {
  test('/contact renders, validates, submits → success, fires dataLayer events', async ({
    page,
  }) => {
    const res = await page.goto('/contact')
    expect(res?.status()).toBe(200)

    await expect(page.getByTestId('hubspot-lead-form')).toBeVisible()

    // Honeypot is in the DOM but hidden from humans.
    await expect(page.locator('#company_website')).toBeHidden()

    // Submitting empty trips required-field validation — no success view.
    await page.getByRole('button', { name: /send message/i }).click()
    await expect(page.getByTestId('form-success')).toHaveCount(0)
    await expect(page.locator('#firstname-error')).toBeVisible()

    // Fill the required fields and submit.
    await page.fill('#firstname', 'Ada')
    await page.fill('#lastname', 'Lovelace')
    await page.fill('#email', 'ada@example.com')
    await page.selectOption('#inquiry_type', 'new_project')
    await page.fill('#message', 'We need help sequencing an AI roadmap.')
    await page.getByRole('button', { name: /send message/i }).click()

    await expect(page.getByTestId('form-success')).toBeVisible()

    const events: string[] = await page.evaluate(() => {
      const dl = (window as unknown as { dataLayer?: Array<{ event?: string }> }).dataLayer ?? []
      return dl.map((entry) => entry.event ?? '')
    })
    expect(events).toContain('form_submission_attempt')
    expect(events).toContain('form_submission_success')

    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()
    expect(
      results.violations,
      results.violations.map((v) => `[${v.id}] ${v.help}`).join('\n'),
    ).toEqual([])
  })
})
