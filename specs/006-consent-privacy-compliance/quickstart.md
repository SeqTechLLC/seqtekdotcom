# Quickstart: verifying Consent & Privacy Compliance

How to exercise and verify each user story locally and in staging. Assumes the spec-004/005 dev setup (see `docs/LOCAL_DEVELOPMENT.md`).

## Env

| Var                             | Purpose                                 | Local                           | Staging/Prod                                                   |
| ------------------------------- | --------------------------------------- | ------------------------------- | -------------------------------------------------------------- |
| `NEXT_PUBLIC_HUBSPOT_PORTAL_ID` | activates tracking + banner (`8504846`) | optional                        | set                                                            |
| `NEXT_PUBLIC_GTM_ID`            | GTM container                           | optional                        | set once Container ID lands                                    |
| `CSP_MODE`                      | `enforce`\|`report-only`\|`off`         | `enforce` (dev surfaces issues) | staging `report-only`; prod `report-only`→`enforce` at cutover |

With HubSpot/GTM env unset, the loaders no-op and the footer control renders inert — the rest of the page (privacy route, CSP) is still fully testable.

## US1 — Deny blocks tracking / nothing fires pre-consent

1. Staging with HubSpot + GTM set. Clear cookies (`__hs_opt_out`, `__hs_cookie_cat_pref`, `hubspotutk`).
2. Load a page; before interacting, open DevTools → Network: **no** request to `*.facebook.com`/`*.linkedin.com`/`googleads`/`track.hubspot.com` analytics beacon.
3. Choose **Deny all** → assert the same (zero pixel hosts).
4. Choose **Customize**: analytics on, ads off → analytics beacon present, **0** ad hosts.
5. Cross-check in GTM Preview/Debug (fire matrix, gtm-consent-governance.md G4).

- Automated: `tests/e2e/consent-flows.e2e.spec.ts` (network no-leak assertions).

## US2 — CSP report-only → enforcing

1. Staging: confirm responses carry `Content-Security-Policy-Report-Only`. Browse the marquee + campaign surfaces and accept cookies; watch the CSP console + `/api/csp-report` logs.
2. **Watch `style-src` specifically** — if the HubSpot banner is style-blocked, relax public `style-src` to `'unsafe-inline'` (csp.md P4) and re-soak.
3. Run the gate (csp.md P5): ≥7 days, no new directives in the last 3, `docs/CSP_VIOLATIONS_KNOWN.md` current, sign-off, dated cutover.
4. Flip `CSP_MODE=enforce` in prod Parameter Store; verify `Content-Security-Policy` header present and nothing legitimate breaks (forms, media, tracking, `/admin`).

- Automated: `tests/int/lib/csp.int.spec.ts` (header/directive per mode); extend `tests/e2e/csp.e2e.spec.ts` (no legit-resource block under enforce).

## US3 — Returning visitor not re-prompted

1. Make a choice; reload / new session with `__hs_opt_out` + `__hs_cookie_cat_pref` intact.
2. Assert: banner not shown; consent `update` reflects the prior choice before any pixel host appears.

- Automated: in `consent-flows.e2e.spec.ts`, pre-seed the cookies and assert no banner + correct restored state.

## US4 — Change / withdraw via footer

1. From any page, activate the footer **Cookie preferences** control → HubSpot banner re-opens (`_hsp showBanner`).
2. Switch advertising from granted to denied → on next navigation, ad pixels no longer fire.
3. Use **Withdraw** → `_hsp revokeCookieConsent` clears cookies; next load = default-denied.

- Automated: `tests/e2e/privacy-consent-ui.e2e.spec.ts` (control present every page, keyboard-operable, axe-clean, withdraw flips ad firing).

## US5 — Privacy policy

1. From any page, footer **Privacy policy** link → `/privacy-policy`.
2. Assert: data/cookie/third-party disclosures present; links the consent control; shows **12 N Cheyenne Ave, Tulsa, OK 74103** (0 Sapulpa references); in sitemap; axe + Lighthouse a11y ≥0.95.

- Automated: `privacy-consent-ui.e2e.spec.ts` (render, footer linkage, address, a11y).

## Definition of done (engineering, code-owned)

- Bridge corrected to `addPrivacyConsentListener`; INTEGRATIONS.md §2.2 reconciled.
- Footer `ConsentPreferences` control + `/privacy-policy` route shipped, a11y-clean.
- CSP enforce machinery + `docs/CSP_VIOLATIONS_KNOWN.md` + alarm in place; staging soaking.
- `infra/gtm/container.json` committed once the container exists.
- E2E + int suites green; Lighthouse a11y/best-practices/SEO ≥0.95.

## Gated on external owners (not engineering)

- Live G4 fire-matrix verification → GTM Container ID + HubSpot portal banner config + migrated pixel IDs.
- Production enforce cutover → the §8 gate sign-off (Phase 5 / Phase 5.5).
- Final privacy-policy legal prose + sign-off → Phase 5.5 "Legal / privacy".
