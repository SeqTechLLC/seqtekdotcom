# Contract: GTM activation — delta to spec 006 governance

Spec 006 authored the GTM consent-governance contract (`specs/006-consent-privacy-compliance/contracts/gtm-consent-governance.md`, gates G1–G5) and left live execution gated on a `TBD` container ID. This contract records what changed now that the container exists, and what this feature does vs. defers. It does **not** restate G1–G5 — read that file first.

## What unblocked since spec 006

| 006 soft block (G5)                       | Status now                                                                                          |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| GTM Container ID `TBD`                    | **Resolved** — `GTM-54KBJ2Z3` (created 2026-06-05; `NEXT_PUBLIC_GTM_ID` set).                       |
| HubSpot portal Privacy & Consent settings | **Resolved** — notice-only model decided 2026-06-05 (INTEGRATIONS.md §1.5).                         |
| Wix pixel IDs to migrate                  | **Resolved (IDs)** — confirmed via Megan's Events Manager export 2026-06-05 (INTEGRATIONS.md §2.3). |

## A1 — Live tags this feature activates

LinkedIn Insight Tag (partner `3952964`) and Google Ads conversion tag (`AW-810041431`). Both:

- carry "Require additional consent for tag to fire" = `ad_storage` (G3);
- fire on a Page View trigger paired with the `hubspotConsentUpdate` Custom Event trigger (G2), so they re-evaluate the instant consent flips (research R1);
- are **site-wide** — they have live homes on existing routes (home, contact, services, case studies, careers), unlike the Meta pixels.

## A2 — Meta pixels: staged, not triggered (FR-011, deferred)

The 8 Meta Pixels are per-market and fire on per-variant Case Study Workshop landing routes (`/tulsaacasestudyworkshop` etc.) that **do not exist on the new site**. Therefore:

- Meta browser tags are **either omitted or staged in the container with no bound (live) trigger**, clearly labeled "pending per-market landing routes — content track."
- The per-market URL triggers in INTEGRATIONS.md §2.3 are recorded as a **documented TODO**; they are **not wired** here (an unbound or mis-bound Meta tag firing on an unintended page is the failure G4's Deny/Network check guards against).
- When the landing-page track ships the routes, a follow-up binds each Meta tag to its `/…casestudyworkshop` path trigger and re-runs G4 for those tags.

## A3 — Fire-matrix this feature verifies (subset of G4)

Run the G4 Accept/Deny/Customize matrix on staging for the **live** tags only:

| Flow                              | LinkedIn + Google Ads                         | HubSpot analytics   |
| --------------------------------- | --------------------------------------------- | ------------------- |
| Accept all                        | fire after `update`                           | fire after `update` |
| Deny all                          | do not fire — **no ad host in Network**       | do not fire         |
| Customize (analytics on, ads off) | held — no `ad_storage` beacon leaves the page | fire                |

Verified in GTM Preview/Debug + browser Network tab. Meta rows are N/A until their pages exist.

## A4 — CAPI consent posture (US4 / FR-009 — decision, recorded off this contract)

Six of eight Meta datasets receive server-side via the Conversions API, **not gated by the cookie banner**. This feature records the decision in INTEGRATIONS.md §2.3: whether CAPI continues post-launch, and — if it does — that consent is enforced at the CAPI source (off-site), with a named owner. See research R2. No CAPI code lands in this repo.

## A5 — Provenance (G5)

First real export of `GTM-54KBJ2Z3` committed to `infra/gtm/container.json` via the README's export→commit workflow. A re-export diff at verification time confirms zero drift (SC-004). `infra/gtm/README.md` updated: container ID, the Meta-deferral note, and the live-vs-deferred tag scope.
