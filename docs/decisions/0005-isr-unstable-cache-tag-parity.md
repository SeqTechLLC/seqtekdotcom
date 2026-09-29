# 0005. ISR data caching via `unstable_cache`, with tag parity to `buildRevalidatePlan`

**Status:** Accepted
**Date:** 2026-06-01

## Context

The `revalidateOnChange` hook computes `buildRevalidatePlan(collection, doc)` (tags and paths) and revalidates them on
every publish. The public pages read Payload through its Local API, which makes no `fetch` calls, so nothing was
registered under those tags and on-demand revalidation did nothing. Next 16 offers two ways to tag non-`fetch` reads:
`unstable_cache`, and the experimental `'use cache'` Cache Components.

## Options considered

- **`unstable_cache(fn, keyParts, { tags, revalidate })`** — the documented mechanism for tagging non-`fetch` reads;
  it fits the existing tag scheme with no hook change.
- **`'use cache'`** — a global rendering change behind an experimental flag, unvalidated against Payload's Local API.
- **`revalidatePath` only** — loses per-document invalidation and couples rendering to URL strings.

## Decision

Every published read in `src/lib/payload.ts` is wrapped in `unstable_cache`, with tags that exactly mirror
`buildRevalidatePlan`: `${collection}_${slug}`, `${collection}_list`, and `${global}_list`. Readers wrap
`unstable_cache` in `React.cache`, so a request makes one database round-trip and invalidation works across
requests. Draft reads bypass these readers, and `unstable_cache` skips its cache in draft mode anyway. The tag parity
is pinned by `tests/int/lib/payload-cache-tags.int.spec.ts`.

The routes render dynamically. The layout reads the per-request CSP nonce through `headers()`, which rules out static
prerendering, so detail routes have no `generateStaticParams`. Pages keep `revalidate = 3600` and take their data from
the cached readers; only the HTML render happens per request.

## Consequences

- On-demand revalidation works on publish, with the hourly fallback.
- Two definitions of the tags must agree; drift silently breaks revalidation, so the parity test is a build-breaker.
- `unstable_cache` throws outside the Next server, so the raw `findPublished*` reads are exported for unit tests.
- No static HTML: every request renders, which is cheap because the reads are cached.

## Revisit when

Payload documents Cache Components for the Local API, Next deprecates `unstable_cache`, or the nonce moves to a
static-compatible mechanism (hashed inline scripts) that allows static prerendering.
