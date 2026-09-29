# GTM container

The site's Google Tag Manager container is **`GTM-54KBJ2Z3`**, configured in the GTM
web UI. Its export belongs in `infra/gtm/container.json` so the configuration has a
reviewable diff and a rollback target; no export is committed yet.

GTM loads only when `NEXT_PUBLIC_GTM_ID` is set at build time (ARCHITECTURE.md §6).
Both lanes build with it empty (`.github/workflows/deploy.yml`), and local dev and CI
leave it unset, so GTM loads nowhere today.

## Tag scope

- **Site-wide (to build):** the LinkedIn Insight Tag (partner `3952964`) and the
  Google Ads conversion tag (`AW-810041431`). Both require `ad_storage` (G3) and fire
  on Page View paired with the `hubspotConsentUpdate` Custom Event (G2), so they
  re-evaluate the moment consent changes.
- **Deferred:** the 8 per-market Meta browser pixels. Their old Case Study Workshop
  landing paths now 301 to `/workshops/touchstone` (`src/lib/redirects.ts`), so a path
  trigger on them can never fire. Stage them with no bound trigger until per-market
  landing routes exist.
- Server-side Meta CAPI is not governed by this container; it bypasses the cookie
  banner.

## Consent governance

What the container must encode. The inline default in `ConsentDefault.tsx`
(contracts/consent-bridge.md C1) governs first paint; the container repeats it.

- **G1 — Consent defaults.** `analytics_storage`, `ad_storage`, `ad_user_data` and
  `ad_personalization` denied; `functionality_storage` granted; "Wait for update"
  enabled.
- **G2 — HubSpot consent trigger.** A Custom Event trigger on `hubspotConsentUpdate`,
  the exact name consent-bridge C2 fires. Tags without built-in Consent Mode checks
  attach to it.
- **G3 — Per-tag consent requirements.** A tag with no consent requirement is a
  defect.

  | Tag                                      | Required consent    |
  | ---------------------------------------- | ------------------- |
  | Meta Pixel ×8 (Tulsa/OKC/NW-Ark/KC, A+B) | `ad_storage`        |
  | LinkedIn Insight Tag                     | `ad_storage`        |
  | Google Ads `AW-810041431`                | `ad_storage`        |
  | HubSpot analytics                        | `analytics_storage` |

- **G4 — Fire matrix.** Check it in GTM Preview and in the browser Network tab on a
  lane once GTM is enabled there.

  | Flow                              | Analytics tags      | Advertising tags                           |
  | --------------------------------- | ------------------- | ------------------------------------------ |
  | Accept all                        | fire after `update` | fire after `update`                        |
  | Deny all                          | do not fire         | do not fire; no ad host in network         |
  | Customize (analytics on, ads off) | fire                | held; no ad-storage beacon leaves the page |

## Export → commit workflow

1. Make the change in the GTM web UI.
2. **Admin → Export Container**, choosing the workspace or version.
3. Save the downloaded JSON over `infra/gtm/container.json`.
4. Commit it in the same change (`feat(gtm): …` or `chore(gtm): …`).

The live container is operational truth; the committed export is what review and
rollback use. Every container change re-exports and commits, and a re-export at
verification should show no drift.
