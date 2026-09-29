# Contract: GTM container consent governance

What container `GTM-54KBJ2Z3` must encode. It is configured in the GTM web UI. GTM does not load on
the deployed lanes yet (INTEGRATIONS §2.1).

## G1 — Container-side consent defaults

The container repeats the default: `analytics_storage`, `ad_storage`, `ad_user_data` and
`ad_personalization` denied, `functionality_storage` granted, with "Wait for update" enabled. The
inline default (consent-bridge C1) governs first paint; this is the fallback.

## G2 — HubSpot consent trigger

A Custom Event trigger on `hubspotConsentUpdate`, the exact name consent-bridge C2 fires. Tags
without built-in Consent Mode checks attach to it.

## G3 — Per-tag consent requirements

| Tag                                      | Required consent    |
| ---------------------------------------- | ------------------- |
| Meta Pixel ×8 (Tulsa/OKC/NW-Ark/KC, A+B) | `ad_storage`        |
| LinkedIn Insight Tag                     | `ad_storage`        |
| Google Ads `AW-810041431`                | `ad_storage`        |
| HubSpot analytics                        | `analytics_storage` |

A tag with no consent requirement is a defect.

## G4 — Fire matrix

| Flow                              | Analytics tags      | Advertising tags                           |
| --------------------------------- | ------------------- | ------------------------------------------ |
| Accept all                        | fire after `update` | fire after `update`                        |
| Deny all                          | do not fire         | do not fire; no ad host in network         |
| Customize (analytics on, ads off) | fire                | held; no ad-storage beacon leaves the page |

Check it in GTM Preview and in the browser Network tab. The container export belongs in
`infra/gtm/container.json`, which is not committed yet.
