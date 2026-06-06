# Feature Specification: GTM Pixel Activation

**Feature Branch**: `feat/008-gtm-pixel-activation`

**Created**: 2026-06-06

**Status**: Draft

**Input**: User description: "GTM pixel activation: wire the Google Tag Manager container (GTM-54KBJ2Z3) to fire all paid-marketing pixels through consent mode, per the confirmed mappings in docs/INTEGRATIONS.md §2. Versioned container.json, dataLayer event completeness, CAPI consent decision, and staging verification. Per-market URL triggers, ScoreApp, and contact-form GUID are out of scope."

## Context & Background

The app-side tracking foundation already shipped: the GTM loader, the consent-default initializer, the HubSpot `_hsp` consent bridge that maps cookie-banner choices to `gtag('consent','update', …)`, and the enforcing Content Security Policy (specs 005/006/007). Nothing in that foundation is re-built here.

What is missing is the **GTM container configuration itself** — the tags, triggers, and variables that decide which marketing pixels fire and under what consent — plus the supporting signal (dataLayer events) those tags consume, a versioned record of the container, a decision on the server-side Conversions API (CAPI) consent gap, and proof on staging that consent actually gates the pixels.

A scope reality drives the priorities below: the eight Meta Pixels are **per-market** assets that fire on per-variant Case Study Workshop landing pages (e.g. `/tulsaacasestudyworkshop`). Those landing routes **do not exist on the new site** and are deferred to a separate content / paid-landing-page track. The Meta browser tags therefore cannot go live in this feature — they have no page to trigger on. The tracking that _can_ activate now is the **site-wide** paid tags: the LinkedIn Insight Tag and the Google Ads conversion tag, which fire on pages that already exist (home, contact, services, case studies, careers).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Consent-gated site-wide conversion tracking (Priority: P1)

A visitor lands on a page that exists today (home, contact, a case study). No advertising pixel fires until the visitor grants advertising consent through the cookie banner. When they accept, the LinkedIn Insight Tag and Google Ads conversion tag begin firing; when they deny, no advertising beacon ever leaves the page. Marketing gets attribution from consenting visitors without creating legal/consent exposure from the rest.

**Why this priority**: This is the core value and the compliance-critical path. Firing an advertising pixel before consent is the exact failure the whole consent architecture exists to prevent, and these are the only paid tags that have a live home on the new site today. Shipping just this story delivers a working, compliant, demonstrable conversion-tracking setup.

**Independent Test**: In the GTM Preview/Debug pane on staging, run the three consent flows (accept all / deny all / customize) on an existing page and confirm tag fire/no-fire status matches the consent state, corroborated by the browser Network tab (no advertising host appears under Deny).

**Acceptance Scenarios**:

1. **Given** a first-time visitor with the banner showing, **When** they choose "Accept all," **Then** the LinkedIn Insight Tag and Google Ads tag fire after the consent-update event, and `ad_storage` is granted.
2. **Given** a first-time visitor, **When** they choose "Deny all," **Then** no LinkedIn or Google Ads tag fires and no request to an advertising host appears in the Network tab; functionality-only behavior is unaffected.
3. **Given** a first-time visitor, **When** they choose "Customize" with analytics granted but advertising denied, **Then** analytics is allowed but the LinkedIn and Google Ads tags are held (no `ad_storage` beacons leave the page).
4. **Given** a returning visitor with a prior-consent cookie, **When** the page loads (no banner shown), **Then** consent is rehydrated through the same bridge path and the tags fire or hold per the stored choice, respecting the "wait for update" window before evaluating.

---

### User Story 2 - Versioned, reviewable container configuration (Priority: P2)

An engineer or marketer needs to see what the GTM container actually contains, review a change before it goes live, and roll back a bad edit. The container configuration is exported to a committed file so it has a reviewable diff, a rollback target, and a reproducible state instead of being unversioned production config living only in the GTM web UI.

**Why this priority**: Without this, every tag/trigger/consent setting from Story 1 is invisible to version control — a change (or accidental deletion) by anyone with GTM access leaves no trace and no recovery point. It protects the work done in Story 1 but isn't required for the pixels to fire correctly the first time.

**Independent Test**: Export the live container, confirm the committed `infra/gtm/container.json` matches it, make a trivial container change, re-export, and confirm the diff is meaningful and reviewable.

**Acceptance Scenarios**:

1. **Given** the configured container, **When** it is exported, **Then** the export is committed to `infra/gtm/container.json` and reflects every tag, trigger, and variable currently live.
2. **Given** a documented export-on-change convention, **When** a future container edit is made, **Then** the convention requires re-exporting and committing so the file does not drift from the live container.
3. **Given** a committed container file, **When** a reviewer reads the diff of a change, **Then** they can see which tag/trigger/consent setting changed without logging into the GTM UI.

---

### User Story 3 - Complete conversion-signal surface (Priority: P2)

Marketing needs to build conversion triggers and ad-platform conversions off real user actions. The site's dataLayer emits a complete, documented set of conversion-relevant events. The HubSpot form-submission events already ship; this adds the still-missing CTA-click, case-study-view, and booking-complete signals so triggers can be built on them rather than on brittle DOM scraping.

**Why this priority**: It unblocks future conversion configuration and makes the container's triggers robust, but the P1 consent gating works without these additional events. It is enabling signal, not the core compliance path.

**Independent Test**: Drive each interaction (click a CTA, view a case study, complete a booking flow) and confirm the corresponding event with its documented payload appears in the dataLayer / GTM Preview pane.

**Acceptance Scenarios**:

1. **Given** the existing `form_submission_*` events, **When** the dataLayer surface is reviewed, **Then** `cta_click`, `case_study_view`, and `booking_complete` events are present with documented, stable payloads.
2. **Given** a user clicks a primary CTA, **When** the handler runs, **Then** a `cta_click` event is pushed with enough payload to identify the CTA.
3. **Given** a user opens a case study page, **When** the page is viewed, **Then** a `case_study_view` event is pushed identifying the case study.

---

### User Story 4 - Server-side CAPI consent posture decided and recorded (Priority: P2)

A stakeholder responsible for compliance needs a clear, written answer to: do the six Meta datasets that currently receive events via the server-side Conversions API keep running after launch, and if so, where is consent enforced for them? Because CAPI events bypass the cookie banner entirely, an undocumented "yes, they keep running" is a silent consent gap. This story produces the decision and the required follow-up action, not necessarily the enforcement code (which may live at the CAPI source, outside this site).

**Why this priority**: It is compliance-significant and must not be lost, but it is a decision-and-documentation deliverable with its likely enforcement point outside this codebase, so it does not gate the site-side activation in Story 1.

**Independent Test**: Confirm a written decision exists in the integrations documentation stating whether CAPI continues post-launch, where consent is enforced if it does, and the owner/action for any enforcement work.

**Acceptance Scenarios**:

1. **Given** the §2.3 CAPI heads-up, **When** the decision is made, **Then** the integrations doc records whether the six CAPI datasets continue post-launch and the rationale.
2. **Given** a decision to keep CAPI running, **When** the doc is updated, **Then** it names where consent is enforced (at the CAPI source, not this site) and the owner of that work.
3. **Given** a decision to stop CAPI, **When** the doc is updated, **Then** it records the cutoff and who actions it on the ad-platform / server side.

---

### Edge Cases

- **Returning visitor, no banner shown**: consent is rehydrated from the stored cookie through the same bridge path; tags must respect the `wait_for_update` window before evaluating, so a prior "denied" choice is honored and a prior "granted" choice fires without a banner.
- **Consent withdrawn after being granted**: when a visitor uses the footer "Cookie preferences" control to withdraw, subsequent navigation must stop firing advertising tags (consent update to denied).
- **Container drift**: a container edited in the GTM UI but not re-exported leaves the committed file stale — the export-on-change convention is the mitigation; absence of drift is verifiable by re-exporting and diffing.
- **CAPI / browser double-count or consent gap**: a denied visitor whose event still reaches a Meta dataset via CAPI is the precise gap Story 4 must resolve; it must be named even if the fix lives off-site.
- **Per-market Meta trigger has no page**: the per-variant landing routes do not exist; any Meta browser tag staged in the container must not bind to a live trigger and must be clearly marked as pending the deferred landing-page track, so it cannot fire on an unintended page.
- **Deny flow leakage**: a tag misconfigured without the `ad_storage` requirement would fire under Deny — the Network-tab check in Story 1 is the catch.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The GTM container MUST configure the LinkedIn Insight Tag (partner `3952964`) and the Google Ads conversion tag (`AW-810041431`) as tags, each requiring `ad_storage` consent with "wait for update" behavior enabled.
- **FR-002**: Advertising tags MUST NOT fire before the consent state resolves — they MUST honor the `wait_for_update` window so a returning visitor's stored consent (or denial) is read before any tag evaluates.
- **FR-003**: On a "Deny all" choice, NO advertising tag MUST fire and NO request to an advertising host MUST leave the page.
- **FR-004**: On an "Accept all" choice, the site-wide advertising tags MUST fire after the consent-update event.
- **FR-005**: On a "Customize" choice granting analytics but denying advertising, analytics MUST be allowed while every `ad_storage`-gated tag is held.
- **FR-006**: The complete GTM container configuration MUST be exported and committed to `infra/gtm/container.json`, reflecting all live tags, triggers, and variables.
- **FR-007**: An export-on-change convention MUST be documented so the committed container file is kept in sync with the live container on every meaningful change.
- **FR-008**: The dataLayer MUST emit `cta_click`, `case_study_view`, and `booking_complete` events, each with a documented, stable payload, in addition to the existing `form_submission_*` events.
- **FR-009**: A written decision on the server-side CAPI consent posture MUST be recorded in the integrations documentation: whether the six CAPI datasets continue post-launch, where consent is enforced if they do, and the owner of any enforcement work.
- **FR-010**: The accept / deny / customize consent flows MUST be exercised on staging via GTM Preview/Debug and corroborated against the Network tab, with results captured.
- **FR-011**: The eight Meta Pixel browser tags MUST be left out of live operation in this feature: either omitted or staged without a bound trigger, explicitly marked as pending the deferred per-market landing-page track. The per-market URL triggers MUST be recorded as a documented TODO and MUST NOT be wired here.
- **FR-012**: The existing app-side foundation (GTM loader, consent-default initializer, HubSpot `_hsp` consent bridge, CSP) MUST be reused unchanged; this feature MUST NOT re-implement it.
- **FR-013**: The ScoreApp landing page (and its `assessment_start` event) and the contact-form HubSpot GUID wiring MUST remain out of scope.

### Key Entities _(include if feature involves data)_

- **GTM Container (`GTM-54KBJ2Z3`)**: the single management surface for all marketing tags; holds tags, triggers, variables, and consent settings. Source of truth mirrored to `infra/gtm/container.json`.
- **Paid Tag**: a configured pixel/conversion tag with an ID, a consent requirement (`ad_storage`), and a trigger. In-scope-live: LinkedIn Insight Tag, Google Ads. Staged-but-deferred: the eight Meta Pixels (per-market).
- **dataLayer Event**: a named signal pushed from a user interaction (`form_submission_*` existing; `cta_click`, `case_study_view`, `booking_complete` added) with a documented payload that triggers route to tags.
- **Consent State**: the `analytics_storage` / `ad_storage` / `ad_user_data` / `ad_personalization` / `functionality_storage` values driven by the visitor's banner choice through the existing bridge.
- **CAPI Dataset**: a Meta dataset receiving events server-side (six of eight today), not gated by the cookie banner — the subject of the Story 4 decision.
- **Container Export (`infra/gtm/container.json`)**: the committed, versioned snapshot of the live container providing diff, review, and rollback.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: On a Deny-all visit to any existing page, zero advertising-pixel network requests are observed.
- **SC-002**: On an Accept-all visit, 100% of the site-wide advertising tags (LinkedIn, Google Ads) fire after consent is granted.
- **SC-003**: On a Customize (analytics-yes, advertising-no) visit, advertising tags fire 0% of the time while analytics is allowed.
- **SC-004**: The live container and the committed `infra/gtm/container.json` are identical at the end of the feature (zero drift), verifiable by a re-export diff.
- **SC-005**: All three new dataLayer events fire on their respective interactions in 100% of test runs with the documented payload shape.
- **SC-006**: A reviewer can determine the CAPI post-launch consent posture and its enforcement owner from the documentation alone, without asking a person.
- **SC-007**: All three consent flows are recorded as executed on staging with captured results, and no advertising host appears in the Deny-flow network capture.

## Assumptions

- **Meta pixels are deferred with their triggers.** Because the eight Meta Pixels fire on per-market landing pages that do not exist on the new site, and those routes are deferred to a content/paid-landing-page track, the Meta browser tags cannot go live in this feature. The site-wide LinkedIn and Google Ads tags are the activatable conversion tracking now. This is the single most scope-shaping assumption — if the intent is instead to build per-market landing routes here (or fire Meta pixels on an existing consolidated route), this spec's scope changes materially. (Resolve in `/speckit-clarify` if this reading is wrong.)
- **CAPI enforcement, if needed, lives off-site.** The six server-side CAPI datasets are configured at the ad-platform / server source, not in this site's codebase; this feature decides and documents the posture but its enforcement action may be owned elsewhere.
- **Consent values are not secrets and the foundation is correct.** The GTM container ID, pixel IDs, portal ID, and the already-shipped consent bridge behave as documented in `docs/INTEGRATIONS.md §2` and are trusted as-is.
- **Staging is the verification environment.** Consent-flow verification runs against `seqtek-preview.com`; production cutover and the per-market landing pages are out of this feature's window.
- **GTM access exists.** Admin access to container `GTM-54KBJ2Z3` and the Google Ads / LinkedIn ad accounts is available to whoever configures the tags (Kenn holds GTM admin + Google Ads; LinkedIn lives in Justine's ad account).
- **Container configuration is partly web-UI work.** A meaningful portion of this feature is performed in the GTM web UI (tags/triggers/variables) and captured via export, not as application code; only the dataLayer events and any helper code are code changes in this repo.

## Dependencies

- The merged `docs/INTEGRATIONS.md §2` mappings (GTM container ID, pixel IDs, LinkedIn partner ID, Google Ads ID, consent model) — the agreed source of truth.
- The shipped consent foundation from specs 005/006/007 (loader, consent default, `_hsp` bridge, CSP).
- For the deferred Meta pixels: the per-market Case Study Workshop landing routes from the content/paid-landing-page track (blocking, out of scope here).
