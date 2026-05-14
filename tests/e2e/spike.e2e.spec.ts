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
