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

    // Footer is rendered with all THREE navigation columns + legal links. The
    // services column is gone on purpose: the services menu lives in the
    // header, and a cut-down copy of it below was a second, worse navigation.
    const footer = page.getByTestId('site-footer')
    await expect(footer).toBeVisible()
    for (const column of ['Company', 'Resources', 'Connect']) {
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
    const caret = header.getByRole('button', { name: 'What We Do menu' })

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

  // The panel is anchored to its trigger and capped in `vw`, so a wide panel at
  // a narrow desktop can run past the right edge and put a horizontal scrollbar
  // on every page. That shipped once: an 80vw cap measured 118px over at 1024px
  // and grew document.scrollWidth to 1142. Checked at 1024 — the `lg` boundary
  // and the worst case, because the cap grows with the viewport while the
  // trigger's left offset grows more slowly. The suite's default 1280 measured
  // 0px over even while the bug was live, so this test sets its own width.
  test('opening the widest nav panel does not widen the document', async ({ page }) => {
    // 1024 is the `lg` boundary and the worst case, but the cap and the
    // trigger's offset scale differently, so check across the desktop range
    // rather than trusting one width. 1280/1440 were hand-checked once; this
    // makes that permanent.
    for (const width of [1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 800 })
      await page.goto('/')
      const caret = page.getByTestId('site-header').getByRole('button', { name: 'What We Do menu' })
      await caret.click()
      await expect(caret).toHaveAttribute('aria-expanded', 'true')

      // `clientWidth`, not `innerWidth`: innerWidth includes the classic
      // scrollbar headless Chromium renders, while scrollWidth is content
      // width — so comparing against it hides any overflow smaller than the
      // scrollbar (~15px). clientWidth is the exact comparand.
      const m = await page.evaluate(() => ({
        doc: document.documentElement.scrollWidth,
        win: document.documentElement.clientWidth,
      }))
      expect(
        m.doc,
        `opening the nav panel widened the document to ${m.doc}px in a ${m.win}px viewport`,
      ).toBeLessThanOrEqual(m.win)
    }
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
    // "What We Do" carries three groups, so mobile nests a SECOND disclosure per
    // group — the group link is visible at this level, its leaves are not. (The
    // old single-group "Services" panel rendered leaves directly, which is why
    // this used to assert one.) Open the group to reach a leaf.
    const groupLink = servicesRegion.getByRole('link', { name: 'Strategy and Business Consulting' })
    await expect(groupLink).toBeVisible()
    const groupCaret = servicesRegion.getByRole('button', {
      name: 'Strategy and Business Consulting links',
    })
    await expect(groupCaret).toHaveAttribute('aria-expanded', 'false')
    await groupCaret.click()
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
