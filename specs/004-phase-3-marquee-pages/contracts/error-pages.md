# Contract — Error & Maintenance Pages

Implements ERROR_PAGES.md §2–§4. Slow-request handling (§5) is **deferred to Phase 5** (noted so it isn't silently dropped).

## Surfaces

| Surface       | File                                  | HTTP | Content (ERROR_PAGES)                                                                                                                                             |
| ------------- | ------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 404           | `src/app/(frontend)/not-found.tsx`    | 404  | Full header/footer; heading; 3 destination cards (Home, Services, Case Studies); "Book a Strategy Call" CTA. `dataLayer.push({ event: 'page_not_found', path })`. |
| 500 (segment) | `src/app/(frontend)/error.tsx`        | 500  | `'use client'`; logo; apology; "Try again" → `reset()`; `support@seqtek.com` fallback; **visible request id**.                                                    |
| 500 (root)    | `src/app/(frontend)/global-error.tsx` | 500  | Same, for root-layout failures (must render its own `<html><body>`).                                                                                              |
| Maintenance   | `src/proxy.ts` short-circuit          | 503  | Static HTML; brand chrome; brief message; **`/api/health` exempt** (returns 200).                                                                                 |

## Request ID (ERROR_PAGES §3)

- Generated in `src/proxy.ts` as a UUID v4 per request, attached via `x-request-id` response header.
- The 500 pages surface it for support correlation; logged to stdout (CloudWatch).

## Maintenance mode (ERROR_PAGES §4)

- Trigger: `MAINTENANCE_MODE=true` (AWS Parameter Store env).
- `proxy.ts` short-circuits **all** requests with static 503 **except `/api/health`**, which MUST return 200 — otherwise the ALB health check fails and the ASG begins replacing instances mid-maintenance.
- Default off; rare; for emergency DB migrations.

## Invariants (testable)

| #   | Invariant                                                        | Test                     |
| --- | ---------------------------------------------------------------- | ------------------------ |
| E1  | Unmatched route → 404 status + full chrome                       | integration / E2E        |
| E2  | Thrown render error → `error.tsx`, 500, `reset()` present        | E2E (forced throw)       |
| E3  | `x-request-id` present on responses; surfaced on 500 page        | integration              |
| E4  | `MAINTENANCE_MODE=true` → 503 for `/`, **200 for `/api/health`** | integration (proxy unit) |
| E5  | Error pages carry no draft/internal data leakage                 | review + integration     |
