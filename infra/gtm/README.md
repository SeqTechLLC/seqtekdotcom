# GTM container — version-controlled config

This directory holds the **exported Google Tag Manager container** for the
SEQTEK website. The container itself is configured in the GTM web UI; the export
lives here so the configuration has a reviewable diff, a rollback target, and a
reproducible state. Without it, the container is effectively unversioned
production config. (INTEGRATIONS.md §2.2 / spec 006 FR-008.)

## Container ID

**`TBD`** — the GTM Container ID is not yet provisioned. It is a soft block
(mirrors spec 005's form-GUID seam): the bridge code, the consent default, and
the privacy surfaces ship without it; the live tag fire-matrix verification
(spec 006 US1 / SC-002) is gated on the container existing and the HubSpot
portal banner being configured. When it lands, set `NEXT_PUBLIC_GTM_ID` in the
environment (see INTEGRATIONS.md §7) and record the ID here.

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

`container.json` is **not** present until the container exists (Container ID is
`TBD`). It is committed here on the first meaningful container change.

## Verification (the staging acceptance test — gtm-consent-governance.md G4)

Exercise Accept-all / Deny-all / Customize in GTM Preview/Debug and confirm the
tag fire matrix, corroborated by the browser Network tab (no pixel host on
Deny). This is gated on the Container ID + HubSpot portal banner config and is
tracked as the spec 006 live-verification tail (T009/T019/T030).
