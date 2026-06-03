# Feature Specification: Consent & Privacy Compliance

**Feature Branch**: `006-consent-privacy-compliance`

**Created**: 2026-06-03

**Status**: Draft

**Input**: "On the next phase." Resolved to the **consent half** of spec 005's "Conversion + Consent" — the slice spec 005 explicitly deferred: _"Cookie-consent → GTM consent bridge E2E + CSP enforce flip… `ConsentDefault`/`HubSpotTracking` already scaffolded; bridge is largely GTM-container config. Tracked for a follow-up."_ This spec closes that arc and pairs it with the two remaining visitor-facing privacy surfaces (privacy policy page, footer consent-preferences control) so the site is launch-legal on tracking and hardened on CSP.

## Background

Spec 004 (PR #21) scaffolded the consent _mechanism_ in code and spec 005 (PR #25, in review) shipped the conversion _forms_. What exists today:

- `ConsentDefault.tsx` — an inline `<head>` script that (1) stamps the GTM consent default (everything denied except `functionality_storage`, `wait_for_update: 500`) and (2) registers the `__hs_opt_in_consent` listener that bridges HubSpot's banner choice into `gtag('consent','update', …)`. Wired in the frontend layout.
- `HubSpotTracking` / `GtmScript` — env-gated loaders (no network hits until `NEXT_PUBLIC_HUBSPOT_PORTAL_ID` / `NEXT_PUBLIC_GTM_ID` are set).
- `lib/csp.ts` + `proxy.ts` — a per-request nonce CSP with a `CSP_MODE` switch (`enforce` | `report-only` | `off`), a `/api/csp-report` endpoint, and the paired `Report-To` header. `.env.example` ships `CSP_MODE=report-only`.

What does **not** exist yet, and is the work of this spec:

- **No end-to-end proof** the consent bridge actually gates tracking. The listener is wired in code, but no GTM container governs the pixels, and the three consent flows have never been exercised against a real banner. The bridge "is largely GTM-container config" (ROADMAP) — config that has not been authored.
- **No GTM container.** Container ID is `TBD` (INTEGRATIONS.md §2); the consent-mode defaults, the HubSpot bridge trigger, and the consent-gating on all 10 paid pixels live in the GTM web UI and have not been built or version-controlled.
- **CSP is still report-only everywhere but dev.** Production has never been promoted to enforcing; the promote-to-enforce gate (soak window, known-violations catalogue, alarm, dated cutover) is documented in INTEGRATIONS.md §8 but not executed, and `docs/CSP_VIOLATIONS_KNOWN.md` does not exist.
- **No `/privacy-policy` route.** The 301 map already reserves the path (`/privacy-policy → /privacy-policy`), but the page is absent.
- **No consent-preferences control in the footer.** INTEGRATIONS.md §4 requires a footer link so visitors can change their choice; `SiteFooter` has none.

This is the same **mechanism-vs-external-config boundary** specs 004 and 005 used: engineering ships and verifies everything code-owned and gates the live-config proof on the external provisioning (there, form GUIDs; here, the GTM Container ID and the HubSpot Privacy & Consent portal settings).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A visitor's "Deny" actually blocks tracking (Priority: P1)

A first-time visitor lands on the site, sees the cookie banner, and chooses **Deny all** (or **Customize** with advertising off). From that point no analytics or advertising tracking may run. Conversely, before they interact at all, nothing non-essential may fire.

**Why this priority**: This is the legal-liability core. Tracking that fires before or against a visitor's choice creates GDPR/CPRA exposure and risks ad-platform penalties (INTEGRATIONS.md §4: _"Incorrect consent handling creates legal liability and can result in ad platform penalties."_). If only one thing in this spec works, it must be this.

**Independent Test**: In staging, load a page with a cleared consent cookie, choose Deny all, and capture network traffic — no analytics or ad-pixel host may appear. Repeat the "before any interaction" case: no non-essential beacon fires while the banner is still open.

**Acceptance Scenarios**:

1. **Given** a fresh visitor with no consent cookie, **When** the page loads and the banner is shown but not yet actioned, **Then** consent state is "all denied except functionality" and no analytics/advertising tag has fired.
2. **Given** the banner is shown, **When** the visitor chooses Deny all, **Then** no analytics or ad-storage tag fires and no pixel host (Meta, LinkedIn, Google Ads, HubSpot analytics) appears in network traffic.
3. **Given** the banner is shown, **When** the visitor chooses Customize with analytics granted and advertising denied, **Then** analytics tags fire and every advertising pixel is held with no ad-storage beacon leaving the page.

---

### User Story 2 - Production serves an enforcing CSP without breaking the site (Priority: P1)

The site is promoted from a report-only Content Security Policy to an **enforcing** one in production, hardening visitors against injected/third-party scripts, and it does so without breaking any legitimate page (forms, tracking, media, the Payload admin editor).

**Why this priority**: This is the security half of "conversion + consent" and a named launch blocker (ROADMAP Phase 5 + Risk #4: _"Easy to leave running in report-only past launch and never enforce. Calendar a hard date to flip."_). Report-only is observability, not protection. It is P1 because shipping to production in report-only indefinitely is a standing security gap.

**Independent Test**: After the documented soak, flip production to enforcing and verify every marquee + campaign surface and the admin editor still function (no console CSP blocks on legitimate resources), and that the enforcing header is present on responses.

**Acceptance Scenarios**:

1. **Given** a report-only soak that has run the required window with no new violation directives, **When** the promote-to-enforce gate is satisfied (catalogue, sign-off, dated cutover), **Then** production responses carry `Content-Security-Policy` (enforcing), not `Content-Security-Policy-Report-Only`.
2. **Given** the enforcing policy is live, **When** a visitor uses any form, loads media, accepts cookies (HubSpot + GTM + consented pixels), or an editor uses `/admin`, **Then** nothing legitimate is blocked.
3. **Given** the enforcing policy is live, **When** a new third-party origin appears that the policy does not allow, **Then** the violation is reported, counted, and — above threshold — alerts on-call.

---

### User Story 3 - A returning visitor is not asked again (Priority: P2)

A visitor who already made a consent choice returns later (new session, same browser). They are not shown the banner again, and their prior choice is restored before any tag evaluates — so a returning "Accept all" visitor's consented tags fire, and a returning "Deny" visitor's tracking stays blocked.

**Why this priority**: Re-prompting a returning visitor is both a poor experience and a compliance smell (consent should persist). It is P2 because the persistence is handled by HubSpot's cookie + the already-wired rehydration path; this story is primarily verification that the path works, not new construction.

**Independent Test**: Make a choice, reload / start a new session with the consent cookie intact, and confirm (a) no banner is shown and (b) the restored consent state matches the prior choice before the first tag evaluates.

**Acceptance Scenarios**:

1. **Given** a visitor who previously chose Accept all, **When** they return with the consent cookie present, **Then** no banner is shown and consented tags fire on load.
2. **Given** a visitor who previously chose Deny, **When** they return, **Then** no banner is shown and no non-essential tag fires.

---

### User Story 4 - A visitor can change or withdraw consent later (Priority: P2)

After the initial choice, a visitor can find a persistent control (in the footer, on every page) to re-open their consent preferences and change or withdraw what they previously allowed, and the change takes effect.

**Why this priority**: Required by INTEGRATIONS.md §4 (_"Consent preferences link should be in the footer for users to change their choice"_) and a baseline GDPR/CPRA expectation (withdrawal must be as easy as granting). P2 because it is a small, well-scoped addition on top of the P1 enforcement.

**Independent Test**: From any page, use the footer control to re-open preferences, switch advertising from granted to denied, and confirm advertising tags stop firing on the next navigation.

**Acceptance Scenarios**:

1. **Given** a visitor on any page, **When** they activate the footer consent-preferences control, **Then** the consent management UI re-opens with their current choices reflected.
2. **Given** a visitor who previously accepted advertising, **When** they withdraw it via the control, **Then** advertising consent flips to denied and advertising pixels no longer fire.

---

### User Story 5 - A visitor can read how their data is handled (Priority: P3)

A visitor can reach a privacy policy from any page that explains what data the site collects, which cookie categories and third parties are involved, how to change their consent, and how to contact the company — at the canonical company address.

**Why this priority**: Legally expected and referenced by the consent banner and footer, but it is P3 because the page is largely static content and the final legal prose is a content/legal deliverable (Phase 5.5 "Legal / privacy"); engineering delivers the route, structure, canonical address, and linkage.

**Independent Test**: From any page, click the footer privacy link, land on `/privacy-policy`, and confirm it states the data/cookie/third-party practices, links the consent-preferences control, and shows the canonical Cheyenne address (no Sapulpa references).

**Acceptance Scenarios**:

1. **Given** a visitor anywhere on the site, **When** they follow the footer privacy link, **Then** they reach `/privacy-policy` and see the data-handling, cookie-category, and third-party disclosures.
2. **Given** the privacy policy page, **When** it is rendered, **Then** it uses the canonical address (12 N Cheyenne Ave, Tulsa, OK 74103) and links back to the consent-preferences control.

---

### Edge Cases

- **Banner/script fails to load or JS is disabled** → consent defaults to "all denied" and stays there; no non-essential tracking fires (fail-closed, not fail-open).
- **Consent cookie expired or cleared** → the visitor is treated as new: banner reappears, defaults denied.
- **Returning-visitor rehydration races a tag** → the `wait_for_update: 500` window must hold tags long enough for HubSpot to rehydrate the prior cookie; verify no tag evaluates before the consent update on a returning Accept-all visit.
- **A new marketing tag is added in GTM without a consent requirement** → it could fire unconsented; the "100% of tags carry a consent requirement" criterion + the Deny-all no-leak check are the guards.
- **A new third-party origin appears after CSP enforce** (e.g. marketing adds a widget) → enforcing CSP blocks it and reports; mitigated by the soak, the known-violations catalogue, and the per-directive alarm so it is caught as a regression, not a silent break.
- **Region differences (EU opt-in vs US notice-only)** → the banner's geo behavior is HubSpot portal config; the code posture is fail-closed/opt-in for everyone, which is valid under both regimes. Geo-specific banner tuning is portal config, not in this spec's code scope.
- **CSP report-only and enforcing drift** → a single policy builder (`lib/csp.ts`) feeds both modes so report-only soak observes the same directives that will enforce.

## Requirements _(mandatory)_

### Functional Requirements

**Consent enforcement**

- **FR-001**: No analytics or advertising storage/tracking MUST fire before the visitor has granted the corresponding consent category.
- **FR-002**: The default consent state MUST be `denied` for `analytics_storage`, `ad_storage`, `ad_user_data`, and `ad_personalization`, and `granted` for `functionality_storage`, established before any third-party script evaluates consent.
- **FR-003**: When a visitor grants consent (Accept all or a Customize selection), the system MUST update consent state so that only the granted categories' tags become eligible to fire.
- **FR-004**: When a visitor denies (Deny all, or Customize with a category off), the system MUST block all tracking in the denied categories such that no corresponding beacon leaves the page.
- **FR-005**: Consent state MUST persist across navigations and sessions; a returning visitor with a prior choice MUST NOT be re-prompted, and their prior state MUST be restored before any tag evaluates.
- **FR-006**: The system MUST provide a persistent control, reachable from every page via the footer, that lets a visitor re-open, change, or withdraw their consent choice after the initial decision.

**Tag / pixel governance**

- **FR-007**: Every marketing and analytics tag (the 8 Meta Pixels, the LinkedIn Insight Tag, the Google Ads conversion tag `AW-810041431`, and HubSpot analytics) MUST be governed by a consent requirement so it holds until its matching consent category is granted.
- **FR-008**: The tag/trigger/variable configuration that governs consent MUST be version-controlled (the container exported and committed, e.g. `infra/gtm/container.json`) so the live configuration has a reviewable diff and a rollback target.

**Content Security Policy**

- **FR-009**: Production MUST serve an enforcing Content Security Policy (promoted from report-only) without breaking legitimate page functionality (forms, tracking, media, and the Payload admin editor).
- **FR-010**: The promotion from report-only to enforcing MUST follow a documented gate: a report-only soak over production-like traffic for a defined window, no new violation directives in the trailing portion of that window, a maintained known-violations catalogue, a recorded engineer sign-off, and a dated cutover with an owner.
- **FR-011**: A maintained catalogue of known/expected CSP violations (`docs/CSP_VIOLATIONS_KNOWN.md`) MUST exist so on-call can distinguish expected third-party noise from a real regression.
- **FR-012**: CSP violation reports MUST be collected and emit a per-directive metric, with an alert when a single directive exceeds a defined threshold (per INTEGRATIONS.md §8: 100 violations/hour).

**Privacy policy**

- **FR-013**: A privacy policy page MUST exist at `/privacy-policy`, describing the data collected, the cookie categories, the third parties involved, and how a visitor changes their consent.
- **FR-014**: The privacy policy MUST use the canonical company address (12 N Cheyenne Ave, Tulsa, OK 74103) with no Sapulpa references, and both it and the consent-preferences control MUST be linked from the site footer.

**Verification**

- **FR-015**: The three consent flows (Accept all / Deny all / Customize) MUST be verifiable in staging with documented expected tag-fire patterns and a network-level no-leak check on the Deny path.

### Key Entities

- **Consent state**: a per-visitor record of granted/denied per category (analytics, advertising/ad-storage, functionality), with a default of "all denied except functionality," persisted via the HubSpot consent cookie and restored on return.
- **Cookie category**: the consent buckets — Necessary/Functionality (always on), Analytics, Advertising — that map to GTM consent signals.
- **Tag / pixel**: a governed tracking unit (Meta Pixel, LinkedIn Insight Tag, Google Ads, HubSpot analytics) with a declared consent requirement.
- **CSP policy**: the directive set plus mode (`enforce` | `report-only` | `off`) and report endpoint, built from a single source so report-only and enforcing stay identical in shape.
- **Known-violation catalogue**: the list of accepted/expected CSP violations used to triage reports during and after the soak.
- **Privacy policy document**: the visitor-facing data-practices content, including cookie/third-party disclosures and the canonical address.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: With "Deny all," **zero** analytics or advertising network requests leave the page (verified by network capture in staging).
- **SC-002**: With "Accept all," all consented tags fire after the consent-update event; with "Customize" (analytics on, advertising off) analytics fires and 0 advertising pixels fire — both verified in staging.
- **SC-003**: A returning visitor with a prior choice is shown the banner **0** times and their prior consent state is restored before the first tag evaluates.
- **SC-004**: Production runs an enforcing CSP with **0** user-facing breakages reported across the marquee + campaign surfaces and `/admin` after cutover.
- **SC-005**: The report-only soak runs for at least **7 days** of production-like traffic with **0** new violation directives in the final **3 days** before promotion (the documented gate is met, not bypassed).
- **SC-006**: **100%** of marketing/analytics tags in the container carry a consent requirement (no tag fires unconsented).
- **SC-007**: The privacy policy is reachable from **every** page via the footer, uses the canonical Cheyenne address (0 Sapulpa references), and passes automated accessibility checks.
- **SC-008**: The consent-preferences control is reachable from **every** page; re-opening it and withdrawing advertising consent stops advertising pixels from firing on the next navigation.
- **SC-009**: A single CSP directive exceeding the defined threshold (100 violations/hour) raises an on-call alert (alarm verified to fire).

## Assumptions

- **Fail-closed / opt-in is the build posture.** The code already defaults every non-essential category to denied; that posture is valid under both strict-GDPR (opt-in) and US notice-only regimes. The legal choice of which regime applies, and any geo-targeted banner behavior, is a HubSpot portal-config + leadership/legal decision (Phase 5.5 launch readiness), not a code change in this spec.
- **HubSpot is the consent management platform.** The cookie banner, the consent cookie, and the `__hs_opt_in_consent` event come from HubSpot; GTM consent mode is the enforcement layer. No custom consent-banner UI is built — the footer "preferences" control re-opens HubSpot's own UI.
- **The consent-default + HubSpot↔GTM bridge already ships** (`ConsentDefault.tsx`). This spec verifies and completes that path (GTM-side config + E2E proof), it does not re-implement the inline bridge.
- **Privacy policy prose is a content/legal deliverable.** Engineering delivers the `/privacy-policy` route, structure, canonical address, cookie/third-party disclosure scaffolding, and footer linkage; the finalized legal text and its sign-off land at the Phase 5.5 "Legal / privacy" gate.
- **No payment or sensitive data is collected** by any form (INTEGRATIONS.md §1.2), which keeps the consent/compliance surface to analytics + advertising cookies only.
- **Pixel IDs are migrated into GTM** from the current Wix site as a configuration task; the website code loads only two third-party scripts (HubSpot, GTM), never the pixels directly (INTEGRATIONS.md §2.3).

## Dependencies (soft blocks — external configuration, not engineering)

These mirror spec 005's "half-wired" seam: the code lands and is unit/E2E-testable against configured values, and the **live** proof is gated on external provisioning.

- **GTM Container ID is `TBD`** (INTEGRATIONS.md §2). The container must be created or identified, then configured in the GTM web UI with the consent-mode defaults, the HubSpot `__hs_opt_in_consent` bridge trigger, and the consent requirement on all 10 paid tags, and exported to `infra/gtm/container.json`. Live three-flow verification (SC-001/002) is gated on this the same way spec 005's live submit was gated on the form GUID.
- **HubSpot Privacy & Consent portal settings** (cookie categories, banner brand + copy, geo targeting) are admin-owned (INTEGRATIONS.md §1.5).
- **Pixel IDs to migrate** (8 Meta, LinkedIn, Google Ads) must be collected from the current Wix site before the GTM tags can be built (INTEGRATIONS.md §2.3 "Action required").

## Out of Scope

- Building a custom (non-HubSpot) consent banner UI.
- The HubSpot Meetings embed (§1.4) and chat widget (§1.3) — the chat already respects consent; both are separate work.
- AICO / per-AI-crawler robots + caching and the deeper SEO schema work (separate spec candidate; ROADMAP F-6 / Phase 5).
- Newsletter signup and its consent subscription type — dropped in spec 005 (no newsletter program).
- The `RDS multi-AZ` / `ASG private-subnet` infra flips and other Phase 5.5 launch-readiness items, except where this spec produces their inputs (the CSP cutover date, the legal/privacy content hook).
