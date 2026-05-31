import { expect, test } from '@playwright/test'

import {
  cleanupEditorSession,
  seedEditorSession,
  type EditorSession,
} from '../../sessions/editorSession'
import {
  cleanupDraftDoc,
  cleanupServicePillar,
  seedDraftService,
  type SeededService,
} from '../../seeders/seedDraftDoc'

// Contract: specs/003-phase-2-content-models/contracts/live-preview-urls.md
// T077 — services preview redirect mechanics (FR-019, FR-021, SC-003).
// Services additionally exercise pillar.slug resolution via depth=1.

const EDITOR = {
  email: 'preview-editor-services@seqtechllc.com',
  name: 'Preview Editor (services)',
  sub: 'preview-services-editor-sub',
  role: 'editor' as const,
}

const SLUG = 'us2-preview-service'
const PILLAR_SLUG = 'us2-preview-pillar'

let editor: EditorSession
let service: SeededService

test.beforeAll(async () => {
  await cleanupEditorSession(EDITOR.email)
  await cleanupDraftDoc('services', SLUG)
  await cleanupServicePillar(PILLAR_SLUG)
  editor = await seedEditorSession(EDITOR)
  service = await seedDraftService(SLUG, { pillarSlug: PILLAR_SLUG })
})

test.afterAll(async () => {
  await cleanupDraftDoc('services', SLUG)
  await cleanupServicePillar(PILLAR_SLUG)
  await cleanupEditorSession(EDITOR.email)
})

test.describe('US2: /preview/services/:slug', () => {
  test('authenticated editor → 302 to /services/<pillar>/<slug> with draft cookie', async ({
    request,
    baseURL,
  }) => {
    const response = await request.get(`${baseURL}/preview/services/${SLUG}`, {
      headers: { cookie: editor.cookieValue, origin: baseURL! },
      maxRedirects: 0,
    })

    expect(response.status()).toBe(302)
    const location = new URL(response.headers()['location'] ?? '', baseURL)
    // Pillar.slug must resolve via depth=1 — this is the bit that uniquely
    // distinguishes the services preview path from the other three.
    expect(location.pathname).toBe(`/services/${service.pillarSlug}/${SLUG}`)

    const setCookie = response.headersArray().filter((h) => h.name.toLowerCase() === 'set-cookie')
    expect(setCookie.some((h) => /__prerender_bypass/.test(h.value))).toBe(true)
  })

  test('unauthenticated → 302 to /admin/login', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/preview/services/${SLUG}`, {
      maxRedirects: 0,
    })
    expect(response.status()).toBe(302)
    expect(new URL(response.headers()['location'] ?? '', baseURL).pathname).toBe('/admin/login')
  })
})
