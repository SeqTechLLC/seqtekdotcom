import { expect, test } from '@playwright/test'

import {
  cleanupEditorSession,
  seedEditorSession,
  type EditorSession,
} from '../../helpers/editorSession'
import { cleanupDraftDoc, seedDraftPost } from '../../helpers/seedDraftDoc'

// Contract: specs/003-phase-2-content-models/contracts/live-preview-urls.md
// T075 — posts preview redirect mechanics (FR-019, FR-021, SC-003).

const EDITOR = {
  email: 'preview-editor-posts@seqtechllc.com',
  name: 'Preview Editor (posts)',
  sub: 'preview-posts-editor-sub',
  role: 'editor' as const,
}

const SLUG = 'us2-preview-posts'

let editor: EditorSession

test.beforeAll(async () => {
  await cleanupEditorSession(EDITOR.email)
  await cleanupDraftDoc('posts', SLUG)
  editor = await seedEditorSession(EDITOR)
  await seedDraftPost(SLUG)
})

test.afterAll(async () => {
  await cleanupDraftDoc('posts', SLUG)
  await cleanupEditorSession(EDITOR.email)
})

test.describe('US2: /preview/posts/:slug', () => {
  test('authenticated editor → 302 to /insights/<slug> with draft-mode cookie', async ({
    request,
    baseURL,
  }) => {
    const response = await request.get(`${baseURL}/preview/posts/${SLUG}`, {
      headers: { cookie: editor.cookieValue, origin: baseURL! },
      maxRedirects: 0,
    })

    expect(response.status()).toBe(302)
    const location = new URL(response.headers()['location'] ?? '', baseURL)
    expect(location.pathname).toBe(`/insights/${SLUG}`)

    const setCookie = response.headersArray().filter((h) => h.name.toLowerCase() === 'set-cookie')
    const hasDraftCookie = setCookie.some((h) => /__prerender_bypass/.test(h.value))
    expect(hasDraftCookie).toBe(true)
  })

  test('unauthenticated → 302 to /admin/login', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/preview/posts/${SLUG}`, { maxRedirects: 0 })
    expect(response.status()).toBe(302)
    const location = new URL(response.headers()['location'] ?? '', baseURL)
    expect(location.pathname).toBe('/admin/login')
    expect(location.searchParams.get('redirect')).toContain(`/preview/posts/${SLUG}`)
  })

  test('missing document → 404', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/preview/posts/does-not-exist-zzz`, {
      headers: { cookie: editor.cookieValue, origin: baseURL! },
      maxRedirects: 0,
    })
    expect(response.status()).toBe(404)
  })
})
