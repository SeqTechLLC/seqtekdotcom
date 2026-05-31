import { expect, test } from '@playwright/test'

import {
  cleanupEditorSession,
  seedEditorSession,
  type EditorSession,
} from '../../sessions/editorSession'
import { cleanupDraftDoc, seedDraftCaseStudy } from '../../seeders/seedDraftDoc'

// Contract: specs/003-phase-2-content-models/contracts/live-preview-urls.md
// T076 — caseStudies preview redirect mechanics (FR-019, FR-021, SC-003).

const EDITOR = {
  email: 'preview-editor-cases@seqtechllc.com',
  name: 'Preview Editor (cases)',
  sub: 'preview-cases-editor-sub',
  role: 'editor' as const,
}

const SLUG = 'us2-preview-case'

let editor: EditorSession

test.beforeAll(async () => {
  await cleanupEditorSession(EDITOR.email)
  await cleanupDraftDoc('caseStudies', SLUG)
  editor = await seedEditorSession(EDITOR)
  await seedDraftCaseStudy(SLUG)
})

test.afterAll(async () => {
  await cleanupDraftDoc('caseStudies', SLUG)
  await cleanupEditorSession(EDITOR.email)
})

test.describe('US2: /preview/caseStudies/:slug', () => {
  test('authenticated editor → 302 to /case-studies/<slug> with draft-mode cookie', async ({
    request,
    baseURL,
  }) => {
    const response = await request.get(`${baseURL}/preview/caseStudies/${SLUG}`, {
      headers: { cookie: editor.cookieValue, origin: baseURL! },
      maxRedirects: 0,
    })

    expect(response.status()).toBe(302)
    const location = new URL(response.headers()['location'] ?? '', baseURL)
    expect(location.pathname).toBe(`/case-studies/${SLUG}`)

    const setCookie = response.headersArray().filter((h) => h.name.toLowerCase() === 'set-cookie')
    expect(setCookie.some((h) => /__prerender_bypass/.test(h.value))).toBe(true)
  })

  test('unauthenticated → 302 to /admin/login', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/preview/caseStudies/${SLUG}`, {
      maxRedirects: 0,
    })
    expect(response.status()).toBe(302)
    expect(new URL(response.headers()['location'] ?? '', baseURL).pathname).toBe('/admin/login')
  })
})
