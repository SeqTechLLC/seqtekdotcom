# Error Pages & Failure States

## 1. Principle

No dead ends. Every failure state stays on-brand, gives at least one onward path, and logs enough to debug.
Copy follows the voice rules in CONTENT-REQUIREMENTS §5A: consultative, never jokey, never blaming the
visitor.

## 2. 404 — Page Not Found

- **File:** `src/app/(frontend)/not-found.tsx`, rendered inside the site layout, so header and footer are
  present. Triggered by an unmatched path or a server component calling `notFound()`.
- **Content:** "We could not find that page", three destination cards (Home, What We Do, Case studies) and
  a "Book a strategy call" link to `/contact`, per the CTA hierarchy in CONTENT-REQUIREMENTS §9.
- **Tracking:** `NotFoundTracker` pushes `{ event: 'page_not_found', path }` to the dataLayer. Frequent
  404s usually mean a missing redirect in `src/lib/redirects.ts`.

A path under `/feeds/*` (the retired resource hub) returns **410 Gone** from `src/proxy.ts` instead
(`src/lib/gone.ts`).

## 3. 500 — Server Error

- **Files:** `src/app/(frontend)/error.tsx` (segment boundary, rendered inside the site layout) and
  `global-error.tsx` (root failure; replaces the whole document, so no nav).
- **Content:** a short apology, a "Try again" button calling `reset()`, `support@seqtek.com`, and a
  visible request ID.
- **Request ID:** `src/proxy.ts` generates a UUID per request and sets it as the `x-request-id` response
  header and a JS-readable cookie. It sets no cookie on Server Action requests (`next-action`), because
  Next refreshes the route on a cookie mutation and that reset the Payload admin's form. `readRequestId()`
  (`src/components/error/requestId.ts`) reads the cookie and falls back to the error `digest`.
- **Logging:** the error and stack go to stdout, and from there to CloudWatch Logs.

## 4. Maintenance Mode

- **Trigger:** `MAINTENANCE_MODE=true`. No lane sets it; turning it on is a task-definition change and a
  deploy.
- **Mechanism:** `src/proxy.ts` answers every request with a static 503 page, **except** `/api/health`,
  which must keep returning 200 or the ALB would start replacing tasks during a planned outage.

## 5. Slow Page & Hung Request Detection

- **Server:** each cached public reader in `src/lib/payload.ts` is wrapped, outermost, in
  `withReadTimeout`, which races it against a 5-second timer with `Promise.race` (Payload's Local API
  takes no `AbortSignal`, so the losing query runs on in the pool). On timeout it throws
  `PayloadReadTimeoutError`, which renders `error.tsx`, and logs `payload_read_timeout` with the request
  ID. The request ID is read through `headers()` in the wrapper's `catch`, outside `unstable_cache`, where
  `headers()` would throw. `getNavigation`, awaited from the root layout, also catches the error and falls
  back to the code-owned menu, because a throw there would skip `error.tsx`. Details:
  [ADR 0007](decisions/0007-read-timeout.md) and
  [`contracts/read-timeout-telemetry.md`](contracts/read-timeout-telemetry.md).
- **Client:** HubSpot form submits time out at 15 seconds (INTEGRATIONS §1.2).
- **ALB:** the target group checks `/api/health` every 30 s and marks a task unhealthy after 2 failures
  (ARCHITECTURE §8).

Coverage: `tests/e2e/slow-request.e2e.spec.ts`, `tests/int/config/error-maintenance.int.spec.ts`,
`tests/int/lib/readerFallback.int.spec.ts`.
