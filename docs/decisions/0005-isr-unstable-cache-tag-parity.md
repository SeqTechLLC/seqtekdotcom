# 0005. ISR caching via `unstable_cache` with tag parity to `buildRevalidatePlan`

**Status:** Accepted
**Date:** 2026-06-01

> Note: tasks.md (spec 004) referred to this as "ADR 0004"; 0004 was taken by
> `0004-postgres-18.md` (PR #17), so this ADR is 0005. Same decision.

## Context

Spec 003 shipped the `revalidateOnChange` afterChange hook, which computes a `buildRevalidatePlan(collection, doc)` of `{ tags, paths }` and calls `revalidateTag(tag)` for each tag on every publish. But the public render layer (spec 004) reads Payload through its **Local API** (Drizzle → Postgres), which uses **no `fetch`** — so nothing was tag-registered, and `revalidateTag` had nothing to invalidate. The pre-spec-004 readers (`getHomepage` etc.) used only `React.cache` (per-request dedupe), which resets every request and never persists across requests. Result: without a fix, on-demand revalidation was a no-op and pages would only refresh on the 3600s fallback.

Two Next 16 caching models were available (both exports confirmed present in 16.2.6): the stable `unstable_cache` tag model, and the newer `'use cache'` + `cacheTag`/`cacheLife` Cache Components model (gated behind `cacheComponents`/`dynamicIO` config).

Source files read at decision time (Constitution §I):

- `node_modules/next/dist/server/web/spec-extension/unstable-cache.js` — cache read guarded on `!workStore.isDraftMode` (line 146), write at line 207; tags collected onto the work-unit store (lines 113–122). Confirms draft mode auto-bypasses both read and write, and that an outside-the-server call throws `Invariant: incrementalCache missing`.
- In-repo: `src/payload/hooks/revalidateOnChange.ts` (the tag/path plan), `src/lib/payload.ts` (the readers).

## Options considered

- **`unstable_cache(fn, keyParts, { tags, revalidate })`** — the documented mechanism for tagging non-`fetch` async reads. Slots directly onto the existing `buildRevalidatePlan` tag scheme with **zero hook changes**.
- **`'use cache'` Cache Components** — config-level change to global rendering semantics, gated behind an unpinned experimental flag, and unvalidated against Payload's Local API in this stack. A Constitution §V risk (bleeding-edge behavior on the load-bearing render path) for no benefit the tag model doesn't already provide.
- **`revalidatePath`-only** — drop tags, rely on path invalidation + CloudFront. Loses the granular per-doc invalidation the hook already computes and couples render to URL strings.

## Decision

Wrap each published Local API read in `unstable_cache` with `tags` that **exactly mirror** `buildRevalidatePlan`'s output (`${collection}_${slug}`, `${collection}_list`, and `${global}_list` for globals). The chrome globals layer `unstable_cache` **inside** `React.cache` (`cache(async () => unstable_cache(read, key, { tags })())`) so both properties hold: one Postgres round-trip per request and tag-based cross-request invalidation. Draft reads do not go through these readers — templates read Payload directly with `draft: true` (and `unstable_cache` auto-bypasses under draft mode regardless).

The tag parity is the load-bearing invariant. Two independent definitions — the reader tag helpers in `src/lib/payload.ts` and `buildRevalidatePlan` in the hook — MUST agree, pinned by the keystone test `tests/int/lib/payload-cache-tags.int.spec.ts` (C1). Drift there silently breaks on-demand revalidation, so it is treated as a build-breaker.

Practical consequence: `unstable_cache` throws `incrementalCache missing` outside the Next server. The raw published-read functions (`findPublished*`) are therefore exported so the published-filter (no-draft-leak) invariant can be unit-tested directly; the `unstable_cache` wrappers add only the tag caching the keystone test already covers.

## Addendum (implementation, 2026-06-01): the CSP nonce precludes static prerender

Spec 004's plan/research (§D6) called for `generateStaticParams` + `dynamicParams` so detail routes prebuild as static HTML. Implementation surfaced a hard conflict the plan didn't anticipate: the shared `(frontend)` layout renders `ConsentDefault` (and, when env-gated, `GtmScript`/`HubSpotTracking`), which read the **per-request CSP nonce** via `headers()`. Per Next's CSP docs, reading the nonce **forces dynamic rendering** — a unique-per-request nonce cannot be baked into a statically prerendered page. With `generateStaticParams` present, Next attempts static generation and the layout's `headers()` throws `DYNAMIC_SERVER_USAGE` at runtime (a 500) for any on-demand / not-found slug.

**Resolution** (Constitution §IV — CSP nonce is non-negotiable — outranks the static-prerender optimization): the public routes render **dynamically** (`ƒ`); `generateStaticParams` is **removed** from the detail routes. This is **not** the retired `force-dynamic` spike pattern — the routes carry `export const revalidate = 3600` and read through the `unstable_cache` readers, so the ISR DATA caching + on-demand tag invalidation (the whole point of this ADR) are fully retained. Only the HTML render is per-request — which the nonce requires anyway, and which is cheap because the DB reads are cached. Published slugs are still enumerated for `/sitemap.xml` via `publishedSlugsFor`, so the draft-leak invariant (R3) holds on the public enumeration. Verified on a prod build: every marquee route 200s, every unknown slug 404s, on-demand revalidation works.

**Revisit trigger**: if the CSP consent/nonce architecture moves to a static-compatible mechanism (e.g. hashed inline scripts instead of per-request nonces, or Next PPR matures out of experimental), the detail routes can reintroduce `generateStaticParams` for static prerender.

## Revisit triggers

- Payload publishes official Cache Components (`'use cache'`) integration guidance for the Local API.
- Next deprecates `unstable_cache` (Constitution §V — migrate the same change it surfaces).
