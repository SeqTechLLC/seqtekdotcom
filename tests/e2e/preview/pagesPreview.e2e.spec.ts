import { expect, test } from '@playwright/test'

import {
  cleanupEditorSession,
  seedEditorSession,
  type EditorSession,
} from '../../helpers/editorSession'
import { cleanupDraftDoc, seedDraftPage } from '../../helpers/seedDraftDoc'

// Contract: specs/003-phase-2-content-models/contracts/live-preview-urls.md
// T074 — pages preview redirect mechanics (FR-019, FR-021, SC-003).
//
// Scope: the redirect contract (302 + Location + draft cookie). Visual
// verification (banner + draft content) is covered by spec 004's page-
// template tests once the public `/<slug>` route lands.

const EDITOR = {
  email: 'preview-editor-pages@seqtechllc.com',
  name: 'Preview Editor (pages)',
  sub: 'preview-pages-editor-sub',
  role: 'editor' as const,
}

const SLUG = 'us2-preview-pages'

let editor: EditorSession

test.beforeAll(async () => {
  await cleanupEditorSession(EDITOR.email)
  await cleanupDraftDoc('pages', SLUG)
  editor = await seedEditorSession(EDITOR)
  await seedDraftPage(SLUG)
})

test.afterAll(async () => {
  await cleanupDraftDoc('pages', SLUG)
  await cleanupEditorSession(EDITOR.email)
})

test.describe('US2: /preview/pages/:slug', () => {
  test('authenticated editor → 302 to /<slug> with draft-mode cookie set', async ({
    request,
    baseURL,
  }) => {
    const response = await request.get(`${baseURL}/preview/pages/${SLUG}`, {
      headers: { cookie: editor.cookieValue, origin: baseURL! },
      maxRedirects: 0,
    })

    expect(response.status()).toBe(302)
    const location = response.headers()['location'] ?? ''
    expect(new URL(location, baseURL).pathname).toBe(`/${SLUG}`)

    const setCookie = response.headersArray().filter((h) => h.name.toLowerCase() === 'set-cookie')
    const hasDraftCookie = setCookie.some((h) => /__prerender_bypass/.test(h.value))
    expect(
      hasDraftCookie,
      `expected a draft-mode cookie (__prerender_bypass) in Set-Cookie; got: ${setCookie
        .map((h) => h.value)
        .join(' | ')}`,
    ).toBe(true)
  })

  test('unauthenticated → 302 to /admin/login with redirect param', async ({
    request,
    baseURL,
  }) => {
    const response = await request.get(`${baseURL}/preview/pages/${SLUG}`, {
      maxRedirects: 0,
    })

    expect(response.status()).toBe(302)
    const location = new URL(response.headers()['location'] ?? '', baseURL)
    expect(location.pathname).toBe('/admin/login')
    expect(location.searchParams.get('redirect')).toContain(`/preview/pages/${SLUG}`)
  })

  test('missing document → 404', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/preview/pages/does-not-exist-fixture-zzz`, {
      headers: { cookie: editor.cookieValue, origin: baseURL! },
      maxRedirects: 0,
    })
    expect(response.status()).toBe(404)
  })

  test('unsupported collection → 404', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/preview/users/anything`, {
      headers: { cookie: editor.cookieValue, origin: baseURL! },
      maxRedirects: 0,
    })
    expect(response.status()).toBe(404)
  })
})
