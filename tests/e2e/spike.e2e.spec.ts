import { expect, test } from '@playwright/test'
import { mkdir } from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'
import config from '../../src/payload.config.js'
import { seedTestUser, testUser, cleanupTestUser } from '../helpers/seedUser'

const SCREENSHOTS_DIR = path.resolve('tests/e2e/screenshots')

test.describe('Spike: stack end-to-end', () => {
  test.beforeAll(async () => {
    await mkdir(SCREENSHOTS_DIR, { recursive: true })
    await seedTestUser()

    const payload = await getPayload({ config: await config })

    await payload.delete({
      collection: 'pages',
      where: { slug: { equals: 'home' } },
    })

    await payload.create({
      collection: 'pages',
      data: {
        title: 'SEQTEK Spike Home',
        slug: 'home',
        content: {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            direction: null,
            children: [
              {
                type: 'paragraph',
                format: '',
                indent: 0,
                version: 1,
                direction: null,
                textFormat: 0,
                textStyle: '',
                children: [
                  {
                    type: 'text',
                    text: 'Stack validation: Next 16 + Payload 3.84 + Postgres + Tailwind v3 + Lexical.',
                    format: 0,
                    detail: 0,
                    mode: 'normal',
                    style: '',
                    version: 1,
                  },
                ],
              },
              {
                type: 'heading',
                tag: 'h2',
                format: '',
                indent: 0,
                version: 1,
                direction: null,
                children: [
                  {
                    type: 'text',
                    text: 'It works.',
                    format: 0,
                    detail: 0,
                    mode: 'normal',
                    style: '',
                    version: 1,
                  },
                ],
              },
            ],
          },
        },
      },
    })
  })

  test.afterAll(async () => {
    const payload = await getPayload({ config: await config })
    await payload.delete({
      collection: 'pages',
      where: { slug: { equals: 'home' } },
    })
    await cleanupTestUser()
  })

  test('public home page renders Lexical content from Payload', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('page-title')).toHaveText('SEQTEK Spike Home')

    const content = page.getByTestId('page-content')
    await expect(content).toContainText(
      'Stack validation: Next 16 + Payload 3.84 + Postgres + Tailwind v3 + Lexical.',
    )
    await expect(content.getByRole('heading', { name: 'It works.' })).toBeVisible()

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'spike-home.png'),
      fullPage: true,
    })
  })

  test('admin panel loads', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin/)

    await page.waitForLoadState('networkidle')
    await page.locator('input[type="email"], input[type="password"]').first().waitFor({
      state: 'visible',
      timeout: 15_000,
    })

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'spike-admin-login.png'),
      fullPage: true,
    })
  })
})

test.describe('Spike: admin UI editor workflow', () => {
  test.beforeAll(async () => {
    await mkdir(SCREENSHOTS_DIR, { recursive: true })
    await seedTestUser()
    const payload = await getPayload({ config: await config })
    await payload.delete({
      collection: 'pages',
      where: { slug: { equals: 'home' } },
    })
  })

  test.afterAll(async () => {
    const payload = await getPayload({ config: await config })
    await payload.delete({
      collection: 'pages',
      where: { slug: { equals: 'home' } },
    })
    await cleanupTestUser()
  })

  test('login → create Page in admin → public route renders UI-authored content', async ({
    page,
  }) => {
    // 1. Log in through the admin login form.
    await page.goto('/admin')
    await page.locator('input[type="email"]').fill(testUser.email)
    await page.locator('input[type="password"]').fill(testUser.password)
    await page.getByRole('button', { name: /log\s*in/i }).click()

    // After successful auth Payload redirects to /admin (the dashboard).
    await page.waitForURL(/\/admin\/?$/, { timeout: 15_000 })
    await page.waitForLoadState('networkidle')

    // Verify we're authenticated by looking for a Pages collection link.
    await expect(page.getByRole('link', { name: /^pages$/i })).toBeVisible({ timeout: 10_000 })
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'spike-admin-dashboard.png'),
      fullPage: true,
    })

    // 2. Navigate to the Page create view.
    await page.goto('/admin/collections/pages/create')
    await page.waitForLoadState('networkidle')

    // 3. Fill title + slug.
    await page.locator('#field-title').fill('Authored via Admin UI')
    await page.locator('#field-slug').fill('home')

    // 4. Focus the Lexical editor and type a paragraph.
    const lexical = page.locator('[contenteditable="true"]').first()
    await lexical.click()
    await page.keyboard.type(
      'This paragraph was authored by clicking through the Payload admin UI.',
    )

    // Blur Lexical so its serialized state commits to the form value.
    await page.locator('#field-title').click()

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'spike-admin-editor.png'),
      fullPage: true,
    })

    // 5. Save the document.
    await page.getByRole('button', { name: /^save$/i }).click()

    // After a successful save Payload redirects /create → /:id.
    // Wait specifically for the URL to leave the create view.
    await page.waitForURL((url) => !url.pathname.endsWith('/create'), { timeout: 15_000 })
    await page.waitForLoadState('networkidle')
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'spike-admin-after-save.png'),
      fullPage: true,
    })

    // 6. Visit the public route and assert the UI-authored content rendered.
    await page.goto('/')
    await expect(page.getByTestId('page-title')).toHaveText('Authored via Admin UI')
    await expect(page.getByTestId('page-content')).toContainText(
      'This paragraph was authored by clicking through the Payload admin UI.',
    )

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'spike-public-from-ui.png'),
      fullPage: true,
    })
  })
})
