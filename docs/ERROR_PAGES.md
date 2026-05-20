# Error Pages & Failure States

**Date:** 2026-05-14
**Status:** Reference — Phase 1 implementation

---

## 1. Overview

Four failure states need explicit design: a missing page (404), a server-side exception (500), a planned maintenance window, and a hung or slow request. Each must stay on-brand, keep the user moving forward, and feed enough telemetry to CloudWatch that we can debug after the fact. The governing principle: **no dead ends.** Even the maintenance page provides at least one outbound path back to the marketing site once traffic resumes.

---

## 2. 404 — Page Not Found

- **File:** `app/not-found.tsx`
- **Triggered when:** Next.js can't match the requested path, OR a server component explicitly calls `notFound()` (e.g., a case study slug doesn't resolve in Payload).
- **Layout:** Full site header and footer present. No breadcrumbs — there is no location to anchor them to.
- **Content blocks:** Clear heading, brief one-sentence explanation, three destination cards (Home, Services, Case Studies), and a "Book a Strategy Call" CTA as the secondary path per the CTA hierarchy in CONTENT-REQUIREMENTS §9.
- **Copy guidance:** Not jokey. SEQTEK's voice is consultative — "We couldn't find that page." beats "Oops!" every time. All brand voice rules from CONTENT-REQUIREMENTS §5A apply: no "leverage," no "synergies," buyer-centric language only.
- **Tracking:** `dataLayer.push({ event: 'page_not_found', path: <requested> })` so marketing can see which 404s actually take traffic. High-traffic 404s usually signal a missing redirect from the old Wix URL set.

---

## 3. 500 — Server Error

- **Files:** `app/error.tsx` (route segment boundary) and `app/global-error.tsx` (root layout failure — replaces the entire HTML document).
- **Triggered when:** An uncaught exception in a server component, layout, or route handler.
- **Layout:** Minimal. Logo at top, no global nav — the nav may itself be the thing that broke. Don't risk a cascading render error inside the error page.
- **Content:** Short apology, "Try again" button that calls `reset()`, email fallback `support@seqtek.com`, and a visible request ID for support correlation.
- **Request ID:** Generated in `src/proxy.ts` (Next 16 rename of `middleware.ts`) as a UUID v4, attached to every request via the `x-request-id` response header, and exposed to error pages via a context provider (or cookie fallback for `global-error.tsx`, which sits outside the root layout). Logged in CloudWatch Logs alongside the stack trace.
- **Tracking:** Error and full stack written to stdout — the CloudWatch Logs agent picks them up. A Sentry integration is deferred per ARCHITECTURE.md §8 Future Consideration; do not add a third-party error aggregator at launch.

---

## 4. Maintenance Mode

- **Trigger:** `MAINTENANCE_MODE=true` env var, sourced from AWS Parameter Store at instance boot.
- **Mechanism:** `src/proxy.ts` short-circuits all incoming requests with a static maintenance HTML response — EXCEPT `/api/health`, which must still return 200. If the health endpoint flips, the ALB will mark instances unhealthy and start a replacement loop, which is exactly the wrong behavior during a planned outage.
- **Page content:** Brand-consistent layout (logo, neutral background), brief message, expected return time if known. Status page link is a future option if SEQTEK adopts one — not at launch.
- **Use case:** Emergency Postgres migration that can't be done blue-green. Should be rare; default off.

---

## 5. Slow Page & Hung Request Detection

- **Server side:** Next.js has no built-in request-level timeout. Wrap each Payload Local API call site with a `Promise.race` against a 5-second hard timeout. Exceeding the budget throws — control falls through to `error.tsx`. Fail fast; don't hold a response thread waiting on a stuck query.
- **Client side:** Forms already enforce a 15-second submission timeout (see INTEGRATIONS.md §1.2). Images use `next/image` with native lazy loading and graceful failure — no additional handling needed.
- **ALB layer:** Target group health check hits `/api/health` every 30s, threshold 3 — the instance is replaced after three consecutive failures. Already documented in ARCHITECTURE.md §9; cross-reference there rather than duplicating.

---

## 6. Brand Voice in Error Pages

The same rules apply as the rest of the site (CONTENT-REQUIREMENTS §5A). Three non-negotiables:

- **Never blame the user.** They didn't break anything.
- **Never be jokey for the sake of clever.** "We couldn't find that page" is right. "Whoops, looks like our digital gophers ate this one!" is wrong.
- **Always provide at least one onward path.** No dead ends.

---

## 7. Tracking & Recovery

Client-side events fired into the GTM dataLayer:

| Event                   | Where fired                    | What it captures       |
| ----------------------- | ------------------------------ | ---------------------- |
| `page_not_found`        | 404 page client component      | Requested path         |
| `error_boundary_caught` | 500 page client component      | Request ID, error name |
| `maintenance_view`      | Maintenance page client script | Timestamp              |

Server-side logging and user surfacing:

| Error class          | Logged in                                  | Surfaced to user                   |
| -------------------- | ------------------------------------------ | ---------------------------------- |
| 404                  | CloudWatch Logs (request log)              | Yes — 404 page                     |
| 500                  | CloudWatch Logs (stack trace + request ID) | Yes — 500 page with request ID     |
| Slow request timeout | CloudWatch Logs (warn level)               | Yes — 500 page after timeout fires |
| Maintenance          | n/a                                        | Yes — maintenance page             |

---

## 8. Acceptance Criteria

- **Manual QA:** Trigger each error class — broken slug for 404, a force-throw in a server component for 500, env var flip for maintenance, `await new Promise(r => setTimeout(r, 6000))` inside a Payload call for slow-request. Verify layout, copy, CTAs, and tracking events for each.
- **Lighthouse:** Error pages still score Performance > 95. They're lighter than regular pages and should comfortably exceed the threshold.
- **Axe:** WCAG 2.2 AA passes on every error page.
- **Visual regression:** Playwright snapshots of each error state at 375 / 768 / 1440 viewport widths.
