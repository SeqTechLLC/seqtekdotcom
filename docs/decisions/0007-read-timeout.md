# 0007. Server-read timeout: `Promise.race` as an outermost reader layer

**Status:** Accepted
**Date:** 2026-06-05

> **Implementation note (2026-06-30).** The wrapper pattern is unchanged, but the reader count has grown: spec 010's block-composition readers bring the total to **19 cached public readers** (the Decision's count is updated to match). The enumerated `listServices` / `listServicePillars` readers still exist and remain wrapped, but are **likely vestigial** after the four-offering services restructure (PRs #79–#83), which routes `/services` and `/services/[offering]` off Pages by slug rather than the `Services` / `ServicePillars` collections. The `withReadTimeout`-outermost invariant and the `headers()`-in-catch reasoning below are unaffected.

## Context

Next.js has no built-in request-level timeout for server-side data reads. A wedged Postgres query inside a Payload Local API call would hold a response thread indefinitely, producing a hung page instead of a branded error. ERROR_PAGES §5 calls for a 5s budget that fails fast to `error.tsx` and emits a correlated warn log carrying the per-request `x-request-id`.

Two framework constraints shape the implementation:

1. **`next/headers` cannot be called inside an `unstable_cache` callback** — that callback runs in a static cache scope with no request binding, so `headers()`/`cookies()` throw there. The reader layer in `src/lib/payload.ts` is `React.cache(unstable_cache(rawRead))`; the correlation-id read (FR-012) therefore cannot live inside the cached read.
2. **Payload's Local API (`payload.find`/`findGlobal`) accepts no `AbortSignal`** — unlike the HubSpot form `fetch` (which wires `controller.signal`), there is nothing to cancel, so an abort-based timeout has nothing to abort.

Some readers (`publishedSlugsFor`, `listServices`, `listServicePillars`) are also reached from `sitemap.ts` (`export const revalidate = 3600`), an ISR/static scope where `headers()` is unavailable.

## Options considered

- **Timeout inside each raw read** — rejected: `headers()` is illegal inside `unstable_cache`, and it would force threading the request id through every signature or an `AsyncLocalStorage` shim. More surface, no benefit.
- **Per-call-site `Promise.race` in each page component** — rejected: duplicates the 5s budget across ~10 templates, is easy to forget on a new route, and scatters the telemetry.
- **`AbortController`** (the form-timeout precedent) — rejected: the Local API honors no signal.
- **One `withReadTimeout` wrapper as the outermost layer of each cached reader** — chosen.

## Decision

Add `withReadTimeout(label, fn)` in `src/lib/payload.ts` and apply it as the **outermost** layer of all 19 cached public readers: `export const getX = withReadTimeout('getX', React.cache(unstable_cache(rawX)))`. It races the reader against a 5s timer with **`Promise.race`** (`clearTimeout` in `finally`). On timeout it reads `x-request-id` via `headers()` **in the `catch`** — which runs in the RSC render scope where `headers()` is legal, defensively falling back to `'unknown'` for the ISR scope — emits a single `console.warn(JSON.stringify({type:'payload_read_timeout', ts, requestId, reader, args}))`, and throws a typed `PayloadReadTimeoutError` that propagates to the existing branded `error.tsx`. The three raw `findPublished*` helpers run _inside_ `unstable_cache` and are intentionally **not** wrapped. `/api/health` runs its own DB ping and imports none of these readers, so it is exempt by construction.

## Consequences

- **Gain:** a single chokepoint enforces the 5s budget for every reader (and every future one added the same way); a hung query frees the response thread immediately and renders a branded, request-id-correlated error; happy path is a no-op beyond one `setTimeout`/`clearTimeout` per read (no measurable latency, no cache-hit cost).
- **Accept:** the losing query is **orphaned** — it keeps running in the connection pool until Postgres returns or errors. At a 5s budget with a bounded pool this is acceptable; a truly wedged DB is an instance-health problem the ALB `/api/health` probe handles separately.
- **Accept:** the wrapper must stay outermost. A future refactor that moves a reader's `headers()` read inside `unstable_cache` would reintroduce the throw — codified by the placement and the int test.

## Revisit when

Payload's Local API gains `AbortSignal` support (switch to true cancellation, ending the orphaned-query cost), or Next.js ships a first-class server-read timeout, or `headers()` becomes legal inside `unstable_cache`.
