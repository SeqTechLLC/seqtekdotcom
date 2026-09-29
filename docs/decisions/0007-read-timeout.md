# 0007. Server-read timeout: `Promise.race` as the outermost reader layer

**Status:** Accepted
**Date:** 2026-06-05

## Context

Next.js has no request-level timeout for server data reads, so a wedged Postgres query would hang the page.
`ERROR_PAGES.md` §5 sets a 5 s budget that fails to `error.tsx`, with a warn log carrying the request's `x-request-id`.
Two constraints apply: `headers()` cannot be called inside an `unstable_cache` callback, and Payload's Local API accepts
no `AbortSignal`.

## Options considered

- **A timeout inside each raw read** — `headers()` is illegal there.
- **`Promise.race` in each page** — duplicates the budget across routes and is easy to forget.
- **`AbortController`** — the Local API honours no signal.
- **One wrapper as the outermost layer of each cached reader** — chosen.

## Decision

`withReadTimeout(label, fn)` in `src/lib/payload.ts` wraps every cached public reader:
`withReadTimeout('getX', React.cache(unstable_cache(rawX)))`. It races the read against a 5 s timer. On timeout it reads
`x-request-id` in the `catch`, which runs where `headers()` is legal (falling back to `'unknown'` in ISR scope), logs one
`payload_read_timeout` JSON line, and throws `PayloadReadTimeoutError` to the branded `error.tsx`. The raw
`findPublished*` helpers run inside `unstable_cache` and are not wrapped. `/api/health` imports none of the readers.

## Consequences

- One chokepoint enforces the budget for every reader, current and future.
- The losing query is orphaned and runs until Postgres returns; a wedged database is the health check's problem.
- The wrapper must stay outermost; its placement and an integration test hold it there.

## Revisit when

Payload's Local API supports `AbortSignal`, Next ships a server-read timeout, or `headers()` becomes legal inside
`unstable_cache`.
