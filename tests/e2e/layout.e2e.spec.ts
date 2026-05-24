import { expect, test } from '@playwright/test'
import { mkdir } from 'fs/promises'
import path from 'path'

const SCREENSHOTS_DIR = path.resolve('tests/e2e/screenshots')

test.beforeAll(async () => {
  await mkdir(SCREENSHOTS_DIR, { recursive: true })
})

test.describe('Site chrome — desktop viewport', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('skip link, header nav, primary CTA, and footer render on /', async ({ page }) => {
    await page.goto('/')

    // Skip-to-content link is in the DOM (visually hidden until focused).
    const skipLink = page.getByRole('link', { name: /skip to main content/i })
    await expect(skipLink).toBeAttached()

    // Sticky header is rendered with the primary nav links.
    const header = page.getByTestId('site-header')
    await expect(header).toBeVisible()
    const primaryNav = header.getByRole('navigation', { name: /primary/i })
    for (const label of ['About', 'Services', 'Workshops', 'Case Studies', 'Insights', 'Contact']) {
      await expect(primaryNav.getByRole('link', { name: label })).toBeVisible()
    }

    // Desktop primary CTA links to /contact/book-a-call.
    const ctaButton = header.getByRole('link', { name: /book a call/i })
    await expect(ctaButton).toBeVisible()
    await expect(ctaButton).toHaveAttribute('href', '/contact/book-a-call')

    // Footer is rendered with all four navigation columns + legal links.
    const footer = page.getByTestId('site-footer')
    await expect(footer).toBeVisible()
    for (const column of ['Company', 'Services', 'Resources', 'Connect']) {
      await expect(footer.getByRole('heading', { name: column, level: 2 })).toBeVisible()
    }
    await expect(footer.getByRole('link', { name: 'Privacy Policy' })).toBeVisible()
    await expect(footer.getByRole('link', { name: 'Terms of Service' })).toBeVisible()

    // Main landmark is present and skip link targets it.
    await expect(page.locator('main#main')).toBeVisible()
    await expect(skipLink).toHaveAttribute('href', '#main')

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'layout-desktop.png'),
      fullPage: true,
    })
  })

  test('skip link becomes visible on keyboard focus', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const skipLink = page.getByRole('link', { name: /skip to main content/i })
    await expect(skipLink).toBeFocused()
    const box = await skipLink.boundingBox()
    expect(box?.width ?? 0).toBeGreaterThan(0)
    expect(box?.height ?? 0).toBeGreaterThan(0)
  })
})

test.describe('Site chrome — mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('mobile menu opens, lists nav, and closes', async ({ page }) => {
    await page.goto('/')

    // Trigger is visible at mobile width; desktop nav is hidden.
    const trigger = page.getByTestId('mobile-menu-trigger')
    await expect(trigger).toBeVisible()

    const dialog = page.getByTestId('mobile-menu')
    await expect(dialog).toHaveJSProperty('open', false)

    await trigger.click()
    await expect(dialog).toHaveJSProperty('open', true)

    // Nav items rendered inside the dialog.
    for (const label of ['About', 'Services', 'Workshops', 'Case Studies', 'Insights', 'Contact']) {
      await expect(dialog.getByRole('link', { name: label })).toBeVisible()
    }

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'layout-mobile-menu-open.png'),
      fullPage: false,
    })

    // Close button dismisses the dialog.
    await page.getByTestId('mobile-menu-close').click()
    await expect(dialog).toHaveJSProperty('open', false)

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'layout-mobile.png'),
      fullPage: true,
    })
  })
})
