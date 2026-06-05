import type { APIRequestContext } from '@playwright/test'

/**
 * Bust the dev server's `unstable_cache` for the given tags via the in-process
 * `/api/revalidate` route.
 *
 * E2E content mutations run in a SEPARATE Payload process from the dev server,
 * so the `revalidateOnChange` afterChange hook's `revalidateTag(...)` never
 * reaches the server's cache. Tests that assert freshly-seeded content on a
 * shared-key LISTING route (e.g. `teamMembers_list` behind `/team`) must
 * therefore invalidate that tag explicitly, or a sibling suite that warmed the
 * listing cache first will leave them reading a stale render.
 *
 * Not needed for detail routes (a unique slug is always a cache miss) nor the
 * draft-preview path (draft mode bypasses `unstable_cache` by design).
 *
 * The shared secret is plumbed via `playwright.config.ts` so both the test
 * worker and the spawned `npm run dev` webServer agree on it.
 */
export async function revalidateDevCache(
  request: APIRequestContext,
  tags: string[],
): Promise<void> {
  const secret = process.env.REVALIDATION_SECRET
  if (!secret) {
    throw new Error('REVALIDATION_SECRET is unset; cannot revalidate the dev server cache')
  }
  const res = await request.post('/api/revalidate', {
    headers: { Authorization: `Bearer ${secret}` },
    data: { tags },
  })
  if (!res.ok()) {
    throw new Error(`/api/revalidate failed: ${res.status()} ${await res.text()}`)
  }
}
