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
    // NAV-1 two-axis IA: "Services" split into "What We Do" (the nine services
    // in three groups) and "How We Work" (workshops, localshoring). Workshops
    // moved under the second axis rather than staying a seventh top-level item.
    for (const label of [
      'Our Story',
      'What We Do',
      'How We Work',
      'Case Studies',
      'Insights',
      'Contact',
    ]) {
      await expect(primaryNav.getByRole('link', { name: label })).toBeVisible()
    }

    // Desktop primary CTA links to the contact form (the dedicated booking
    // route is not built yet; see CONTENT_NEEDS §4).
    const ctaButton = header.getByRole('link', { name: /book a call/i })
    await expect(ctaButton).toBeVisible()
    await expect(ctaButton).toHaveAttribute('href', '/contact')

    // Footer is rendered with all four navigation columns + legal links.
    const footer = page.getByTestId('site-footer')
    await expect(footer).toBeVisible()
    for (const column of ['Company', 'What We Do', 'Resources', 'Connect']) {
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

  // ROADMAP NAV-1. The top-level item stays a link and the caret is its own
  // button, which is why the six-visible-links assertion above still holds.
  test('a nav panel opens on click, closes on Escape, and hands focus back', async ({ page }) => {
    await page.goto('/')
    const header = page.getByTestId('site-header')
    const caret = header.getByRole('button', { name: 'Services menu' })

    // The caret controls a panel that actually exists in the document.
    const panelId = await caret.getAttribute('aria-controls')
    expect(panelId).toBeTruthy()
    const panel = page.locator(`[id="${panelId}"]`)

    await expect(panel).toBeHidden()
    await expect(caret).toHaveAttribute('aria-expanded', 'false')

    await caret.click()
    await expect(panel).toBeVisible()
    await expect(caret).toHaveAttribute('aria-expanded', 'true')
    // A real leaf from `site-content.ts`. Panel 1 is now the "What We Do" axis,
    // whose groups hold the nine services; Localshoring moved to "How We Work".
    await expect(panel.getByRole('link', { name: 'Strategy and Alignment' })).toBeVisible()

    // Escape closes and returns focus to the control that opened it, rather
    // than dropping the keyboard user at the top of the document.
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
    await expect(caret).toBeFocused()

    // A pointer landing outside the nav closes it too.
    await caret.click()
    await expect(panel).toBeVisible()
    await page.evaluate(() =>
      document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })),
    )
    await expect(panel).toBeHidden()
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
    for (const label of [
      'Our Story',
      'What We Do',
      'How We Work',
      'Case Studies',
      'Insights',
      'Contact',
    ]) {
      await expect(dialog.getByRole('link', { name: label })).toBeVisible()
    }

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'layout-mobile-menu-open.png'),
      fullPage: false,
    })

    // ROADMAP NAV-1. Children are collapsed behind a caret rather than
    // rendered as a permanently expanded tree. Resolved by accessible name
    // through `aria-controls`, the same way the desktop test does, so a nav
    // reorder fails on the behaviour rather than on a missing test id.
    const servicesCaret = dialog.getByRole('button', { name: 'What We Do menu' })
    const regionId = await servicesCaret.getAttribute('aria-controls')
    expect(regionId).toBeTruthy()
    const servicesRegion = page.locator(`[id="${regionId}"]`)

    await expect(servicesRegion).toBeHidden()
    await expect(servicesCaret).toHaveAttribute('aria-expanded', 'false')
    await servicesCaret.click()
    await expect(servicesRegion).toBeVisible()
    await expect(servicesRegion.getByRole('link', { name: 'Strategy and Alignment' })).toBeVisible()

    // Close button dismisses the dialog.
    await page.getByTestId('mobile-menu-close').click()
    await expect(dialog).toHaveJSProperty('open', false)

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'layout-mobile.png'),
      fullPage: true,
    })
  })
})
