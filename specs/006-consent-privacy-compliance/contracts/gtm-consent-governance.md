# Contract: GTM container consent governance (external config, version-controlled)

Configured in the GTM web UI, exported to `infra/gtm/container.json` (FR-008). Sources: INTEGRATIONS.md §2.2/§2.3, research.md R4.

## G1 — Consent defaults (container-side, belt-and-suspenders to the inline default)

All non-essential storage `denied` by default: `analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization` = denied; `functionality_storage` = granted; "Wait for update" enabled (honors `wait_for_update: 500`). The inline `gtag('consent','default')` (consent-bridge.md C1) is authoritative for first paint; the container default is the fallback if the inline script is ever bypassed.

## G2 — HubSpot consent trigger

A **Custom Event** trigger firing on event name `hubspotConsentUpdate` (exact match to the `gtag('event', …)` in consent-bridge.md C2). Tags that lack built-in Consent Mode checks attach to this trigger so they only fire post-consent.

## G3 — Per-tag consent requirements (FR-007)

Every paid tag declares "Require additional consent for tag to fire" = `ad_storage` (advertising) or is gated by `analytics_storage` (analytics):

| Tag                                      | Required consent    |
| ---------------------------------------- | ------------------- |
| Meta Pixel ×8 (Tulsa/OKC/NW-Ark/KC, A+B) | `ad_storage`        |
| LinkedIn Insight Tag                     | `ad_storage`        |
| Google Ads `AW-810041431`                | `ad_storage`        |
| HubSpot analytics                        | `analytics_storage` |

**Invariant**: 100% of marketing/analytics tags carry a consent requirement (SC-006). A tag with no requirement is a defect — caught by the Deny-all network no-leak check (SC-001) and a config review of the exported container diff.

## G4 — Expected fire matrix (the staging acceptance test — INTEGRATIONS.md §2.2)

| Flow                              | Analytics tags      | Advertising tags (Meta/LinkedIn/GoogleAds)  |
| --------------------------------- | ------------------- | ------------------------------------------- |
| Accept all                        | fire after `update` | fire after `update`                         |
| Deny all                          | do not fire         | do not fire — **no ad host in network**     |
| Customize (analytics on, ads off) | fire                | held — no ad-storage beacon leaves the page |

Verified in GTM Preview/Debug (tag fire status) AND corroborated in the browser Network tab (no pixel host on Deny).

## G5 — Container provenance

- Pixel IDs migrated from the current Wix site (INTEGRATIONS.md §2.3 "Action required") before tags are built.
- `infra/gtm/container.json` committed on every meaningful change for a reviewable diff + rollback target.
- **Soft block**: GTM Container ID is `TBD`; live G4 verification is gated on the container existing + the HubSpot portal banner being configured.
