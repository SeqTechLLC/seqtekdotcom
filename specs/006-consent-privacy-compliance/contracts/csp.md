# Contract: CSP policy, reporting, and promote-to-enforce gate

Built by `src/lib/csp.ts`, applied in `src/proxy.ts`, reported to `/api/csp-report`. Authoritative policy: ARCHITECTURE.md §6 + INTEGRATIONS.md §8. Sources: research.md R6.

## P1 — Policy shape (per request)

```
default-src 'self';
script-src 'nonce-<n>' 'strict-dynamic' 'self';
style-src 'self';                         # public routes — SOAK RISK (see P4); /admin adds 'unsafe-inline'
img-src 'self' data: *.hubspot.com *.hsforms.net <mediaHost>;
font-src 'self';
connect-src 'self' *.hubspot.com *.hs-analytics.net *.hsforms.net *.hsforms.com *.hs-banner.com *.usemessages.com *.googletagmanager.com *.google-analytics.com;
frame-src 'self' *.hubspot.com *.hsforms.net meetings.hubspot.com *.hubspotusercontent.com;
frame-ancestors 'none'; base-uri 'self'; form-action 'self' *.hsforms.net; object-src 'none';
upgrade-insecure-requests;                 # ONLY when mode=enforce
report-uri /api/csp-report; report-to csp-endpoint;
```

- `script-src` uses `'strict-dynamic'` → HubSpot/GTM sub-scripts inherit trust from the nonced loader; no script-host allowlist needed.
- Confirmed banner/beacon hosts are already covered (`track.hubspot.com` → `*.hubspot.com`; `js.hs-banner.com` → `*.hs-banner.com`).

## P2 — Mode → header (existing `cspHeaderName`)

| `CSP_MODE`    | Header emitted                        | Env                                              |
| ------------- | ------------------------------------- | ------------------------------------------------ |
| `enforce`     | `Content-Security-Policy`             | dev; production **after** the gate               |
| `report-only` | `Content-Security-Policy-Report-Only` | staging (soak); production until the gate passes |
| `off`         | none (request-id only)                | escape hatch                                     |

`upgrade-insecure-requests` is emitted only when enforcing (browsers ignore it in report-only; avoids a Lighthouse best-practices ding).

## P3 — Report endpoint contract (`/api/csp-report`)

- Accepts `application/csp-report` and `application/reports+json`.
- Validates basic shape (`violated-directive`/`blocked-uri`, or the modern `report.body` equivalent).
- Writes one structured JSON line to stdout → CloudWatch via `awslogs`.
- Excluded from the proxy matcher (no self-loop). A per-directive CloudWatch metric filter emits a count; alarm at **>100 violations/hour/directive** (FR-012).

## P4 — The soak's #1 target: `style-src 'self'` vs the HubSpot banner

No official doc confirms whether `js.hs-banner.com` injects inline styles. **Plan**: ship `style-src 'self'` for public routes, run the staging report-only soak, and watch the `style-src` directive specifically. If the banner is style-blocked, relax public `style-src` to include `'unsafe-inline'` (single-line change in `lib/csp.ts`) and re-soak. Do **not** pre-emptively add `'unsafe-inline'` (it weakens the policy) without soak evidence.

## P5 — Promote-to-enforce gate (FR-010, Constitution IV)

Production flips `report-only → enforce` ONLY when all of:

1. Report-Only active in staging ≥ **7 days** of production-like traffic.
2. **No new** violation directives in the trailing **3 days**.
3. `docs/CSP_VIOLATIONS_KNOWN.md` current (known/expected entries catalogued — FR-011).
4. One engineer sign-off recorded in the cutover ticket.
5. Dated cutover with an owner; then flip `CSP_MODE=enforce` in production Parameter Store.

Report retention: 30 days on the CSP log group. The flip is config (env), not a code change — `lib/csp.ts` default stays `report-only`.

## P6 — Tests

- Int (`csp.int.spec.ts`): for each `CSP_MODE`, assert the correct header name, presence/absence of `upgrade-insecure-requests`, and that the directive set matches the documented policy (parity with ARCHITECTURE.md §6).
- E2E (`csp.e2e.spec.ts`, existing — extend): assert the enforcing header is present and no console CSP violation blocks a legitimate resource on the marquee surfaces + `/admin` editor.
