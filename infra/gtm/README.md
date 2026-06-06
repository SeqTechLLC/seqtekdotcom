# GTM container — version-controlled config

This directory holds the **exported Google Tag Manager container** for the
SEQTEK website. The container itself is configured in the GTM web UI; the export
lives here so the configuration has a reviewable diff, a rollback target, and a
reproducible state. Without it, the container is effectively unversioned
production config. (INTEGRATIONS.md §2.2 / spec 006 FR-008.)

## Container ID

**`GTM-54KBJ2Z3`** (created 2026-06-05; Kenn = admin). Set
`NEXT_PUBLIC_GTM_ID=GTM-54KBJ2Z3` in the environment to load it (see
INTEGRATIONS.md §7); leave it unset locally/CI so no real tags load.

## Tag scope (spec 008)

- **Live (site-wide):** the **LinkedIn Insight Tag** (partner `3952964`) and the
  **Google Ads** conversion tag (`AW-810041431`). Both require `ad_storage` (G3)
  and fire on Page View paired with the `hubspotConsentUpdate` Custom Event (G2),
  so they re-evaluate the instant consent flips.
- **Deferred (staged, no live trigger):** the **8 Meta browser pixels**. They are
  per-market and fire only on per-variant Case Study Workshop landing routes
  (`/tulsaacasestudyworkshop`, …) that **do not exist on the new site**. Stage
  them in the container labeled "pending per-market landing routes — content
  track" with **no bound trigger**; do **not** wire the `/…casestudyworkshop`
  path triggers. The per-market URL→pixel mapping in INTEGRATIONS.md §2.3 is a
  **documented TODO** for the content / paid-landing-page track: when those
  routes ship, bind each Meta tag to its path trigger and re-run G4 for those
  tags.
- **Server-side CAPI** (6 of 8 Meta datasets) is **not governed by this
  container** — it bypasses the cookie banner. Consent posture + owner are
  recorded in INTEGRATIONS.md §2.3 (spec 008 / FR-009).

## What the container must encode (spec 006, contracts/gtm-consent-governance.md)

1. **Consent defaults (G1)** — all non-essential storage `denied`
   (`analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`);
   `functionality_storage` `granted`; "Wait for update" enabled (honors the
   inline `wait_for_update: 500`). Belt-and-suspenders to the inline
   `gtag('consent','default')` in `ConsentDefault.tsx`, which is authoritative
   for first paint.
2. **HubSpot consent trigger (G2)** — a **Custom Event** trigger firing on the
   event name `hubspotConsentUpdate` (exact match to the `gtag('event', …)`
   string the consent bridge fires — see `ConsentDefault.tsx`).
3. **Per-tag consent requirements (G3)** — every paid tag carries
   "Require additional consent for tag to fire" = `ad_storage` (advertising) or
   is gated by `analytics_storage` (analytics). The 10 governed tags: 8 Meta
   Pixels (Tulsa/OKC/NW-Ark/KC, A+B), the LinkedIn Insight Tag, and the Google
   Ads conversion tag (`AW-810041431`). Pixel IDs are migrated from the current
   Wix site (INTEGRATIONS.md §2.3 "Action required") before tags are built.

## Export → commit workflow

1. Make the change in the GTM web UI (a new tag, a consent tweak, etc.).
2. **Admin → Export Container** → choose the workspace/version.
3. Save the downloaded JSON over `infra/gtm/container.json` in this repo.
4. Commit on the same change (`feat(gtm): …` or `chore(gtm): …`) so the diff
   is reviewable. The committed JSON is the rollback target.

**Export-on-change is the convention** — the live container is operational
truth, but the committed `container.json` is authoritative for review and
rollback. Every container change re-exports and commits in the **same** change,
so the config always has a reviewable diff. A re-export-and-diff at verification
time confirms zero drift (spec 008 SC-004). `container.json` lands on the first
real export of `GTM-54KBJ2Z3` (spec 008 US2), replacing this `TBD`-era note.

## Verification (the staging acceptance test — gtm-consent-governance.md G4)

Exercise Accept-all / Deny-all / Customize in GTM Preview/Debug and confirm the
tag fire matrix, corroborated by the browser Network tab (no ad host on Deny).
For spec 008 this runs on staging for the **live** tags only (LinkedIn + Google
Ads); the Meta rows are N/A until their landing routes exist. It is gated on
doing the GTM-UI build + a staging deploy (no longer on a missing container ID)
— the spec 008 external-config tail.
