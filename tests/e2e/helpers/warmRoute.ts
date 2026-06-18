import { expect, type APIRequestContext } from '@playwright/test'

/**
 * Prime the dev server's `unstable_cache` for `path` after a cache-busting seed,
 * so a content assertion exercises the *warm* render path (what the app actually
 * serves) instead of racing the cold read or a stale cache.
 *
 * Why: spec-010 block-composed pages do heavy multi-block joins, so a fresh
 * (cache-busted) read on the cold CI dev server can exceed the 5s
 * READ_TIMEOUT_MS (ADR 0007) and render `error.tsx`. That cold→error→warm
 * behaviour IS the architecture (covered on its own by slow-request.e2e.spec.ts)
 * — content tests should not flake on it. The read-timeout wrapper orphans the
 * slow query, but `unstable_cache` still stores the result when it finishes.
 *
 * Pass `expectContent` substrings for shared-key routes (homepage/listings):
 * after `revalidateDevCache`, Next's `revalidateTag` propagates asynchronously,
 * so an immediate read can still return the pre-seed render. Polling until the
 * expected content appears rides out both the cold read and that propagation
 * race. Unique-slug detail routes (always a cache miss) only need the cold read
 * warmed, so the substrings can be omitted.
 *
 * Pass `allowNotFound` for the draft-preview path: the detail page runs the
 * CACHED published read first (e.g. getCaseStudyBySlug), which for a draft-only
 * doc is a heavy query returning null → it can time out before the draft branch.
 * Warming it caches the null (a 404), so the real draft navigation skips the
 * cold published read.
 *
 * Call after revalidateDevCache(...) and before the page.goto(...) + assertions.
 */
export async function warmRoute(
  request: APIRequestContext,
  path: string,
  expectContent: string | string[] = [],
  allowNotFound = false,
): Promise<void> {
  const needles = Array.isArray(expectContent) ? expectContent : [expectContent]
  await expect(async () => {
    const res = await request.get(path)
    const body = await res.text()
    // The read completed rather than hitting the READ_TIMEOUT_MS error page.
    expect(body, `${path} still rendering the read-timeout error page`).not.toContain(
      'data-testid="error-boundary"',
    )
    if (!allowNotFound) {
      expect(res.ok(), `${path} returned ${res.status()}`).toBeTruthy()
    }
    for (const needle of needles) {
      expect(body, `${path} not warm yet — missing ${JSON.stringify(needle)}`).toContain(needle)
    }
  }).toPass({ timeout: 90_000, intervals: [5_000, 8_000, 10_000] })
}
