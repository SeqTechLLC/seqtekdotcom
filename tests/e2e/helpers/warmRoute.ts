import { expect, type APIRequestContext } from '@playwright/test'

/**
 * Prime the dev server's `unstable_cache` for `path` after a cache-busting seed,
 * so a content assertion exercises the *warm* render path (what the app actually
 * serves) instead of racing the cold read.
 *
 * Why: spec-010 block-composed pages do heavy multi-block joins, so a fresh
 * (cache-busted) read on the cold CI dev server can exceed the 5s
 * READ_TIMEOUT_MS (ADR 0007) and render `error.tsx`. That cold→error→warm
 * behaviour IS the architecture (and is covered on its own by
 * slow-request.e2e.spec.ts) — content tests should not flake on it. The
 * read-timeout wrapper orphans the slow query, but `unstable_cache` still stores
 * the result when it finishes, so we poll until a follow-up request returns the
 * real page. Generous spacing keeps cold reads from stacking.
 *
 * Call after revalidateDevCache(...) and before the page.goto(...) + assertions.
 */
export async function warmRoute(request: APIRequestContext, path: string): Promise<void> {
  await expect(async () => {
    const res = await request.get(path)
    expect(res.ok(), `${path} returned ${res.status()}`).toBeTruthy()
    const body = await res.text()
    expect(body, `${path} still rendering the read-timeout error page`).not.toContain(
      'data-testid="error-boundary"',
    )
  }).toPass({ timeout: 90_000, intervals: [10_000] })
}
