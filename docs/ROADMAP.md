# SEQTEK Website — Roadmap

What is still open, in priority order. When an item ships it moves to [`PROJECT_HISTORY.md`](./PROJECT_HISTORY.md)
with a `P{N}-*` entry in the same commit. What we need from people, and content status, is tracked in the private
content repo (`CONTENT_NEEDS.md`, `WAITING_ON_PEOPLE.md`).

## P0 — Launch scope

- **NAV-1 / SVC-2 residual.** The menu, the services collection and the service copy have shipped (P5-31, P5-37,
  P5-46, P5-52).
  - Retarget `/technology-and-data` (`src/lib/redirects.ts`) at the data service page rather than the axis.
  - Decide whether the leaf namespace stays named `/services/`. Every leaf shares one flat namespace whichever axis
    it hangs off; only the name is open.
- **IND-1 residual — industry copy and proof.** `industries.json` still carries placeholder bodies. Healthcare,
  Manufacturing, Aerospace and Retail have no case study, so their `cards` block renders nothing; each either gets a
  study (PROOF-1) or stays a draft.
- **BOOK-1 residual — `booking_complete` does not fire.** Booking is a Google Calendar appointment page (P5-53).
  `BookingCompleteSeam` listens for HubSpot's `onMeetingBookSucceeded`, which a Google booking never sends, so
  bookings are not measured on the site.
- **PROOF-1 — case studies and attributable quotes.** Every capability claim links to proof, and there are fewer
  proofs than menu items. Status is in the private `WAITING_ON_PEOPLE.md`.
- **AB-1 — an alternative "what we do" page.** A page that explains everything we do quickly without the full list,
  A/B tested against the menu once there is traffic. Settle how "understood quickly" is measured before building it.
- **LM-1 — what "soft launch" means.** Either ungate `ww3.seqtek.com` for a named audience, or cut DNS early and
  treat the hard launch as a content refresh (which pulls most of P3 forward).

## P1 — Content throughput

- **A-1 residual — editor onboarding.** The marketing editor's first sign-in (it provisions an `editor`) and a short
  CMS quickstart.
- **IMG-1 — WebP masters.** Payload re-encodes an uploaded WebP at quality 80, so a WebP master loses quality on
  every upload and every restore. `ingest-photos` now writes JPEG or PNG; the WebP media already loaded (most
  headshots, heroes and panels) need their originals uploaded in their place, where the originals exist.
- **HYG-1 — data hygiene.** Case studies have no `ogImage`; seed `locations` if the regional pages are built.
- **UI-3 — a skeleton `defaultValue` is publishable placeholder copy.** Payload applies a `defaultValue` on read as
  well as on create, and five collections default `layout` to a skeleton (`skeletonDefaultValue.int.spec.ts`). The
  K8 sweep detects a skeleton published unedited. Still to decide: ship skeletons as empty blocks, or mark skeleton
  text so a publish check refuses it.
- **INERT-2 residual.** `services.icon` is printed as a raw string (`ServiceCards.tsx:37`); there is no icon set
  behind it. The output-contract gate covers block controls only; collection fields have not been audited the same
  way.
- **Location cards** (`LocationCards.tsx`) are not links. `revalidateOnChange` builds `/consulting/<slug>`; settle
  the URL before the route is built.

## P2 — Soft launch

- **K8 — gate CI on the sweep.** Wire `npm run sweep -- --fail-on=links,images,alt,redirects` into CI. Don't gate
  on `placeholders` until the copy is written.
- **HS-1 — a HubSpot cookie policy for this site's hostnames** _(launch blocker, portal config only)_. Portal
  `8504846`'s banners are attached to other hostnames and define no cookie categories, so the banner never renders
  and the footer's consent controls do nothing. The code side is complete (ADR 0006); steps are in `INTEGRATIONS.md`
  §4.1.
- **VID-1 — `/our-story` video embeds render as black boxes.** Verify a poster frame shows.

## P3 — Hard launch and cutover

**Quality gates**

- **CSP enforcing.** `src/lib/csp.ts` defaults to report-only and no lane sets `CSP_MODE`. Set a date.
- Cross-browser and device QA: Chrome, Safari, Firefox; iOS, Android.
- A blocking screen-reader sign-off across the AT and browser matrix. The automated axe sweep exists.
- Re-take Lighthouse against CloudFront with the consent-gated third parties live, then flip the performance, LCP,
  TBT and CLS budgets in `.lighthouserc.cjs` from `warn` to `error`.
- A live returning-visitor consent fire-matrix on the real GTM container, cross-browser.
- **Schema-drift CI guard.** No CI job runs migrations. Fail CI when `payload migrate:create` would produce a diff
  against what is on disk, and note "schema change → `migrate:create` before merge" in `PAYLOAD_DEVELOPMENT.md`.

**Content**

- **CM-1 — the database becomes the content master (ADR 0014).** At cutover: the final load from the content JSON,
  then `tools/payload-export` against production, that export loaded twice into an empty local database, and
  `visual:capture` compared with the lane. From then on, tooling starts from an export.

**GTM (container config, not code)**

- Build the Google Ads conversion tag in `GTM-54KBJ2Z3` (require `ad_storage`; fire on page
  view and `hubspotConsentUpdate`), run the accept/deny/customize matrix, then export and commit
  `infra/gtm/container.json`.
- Deferred until their content ships: the eight Meta pixels, staged without triggers (`INTEGRATIONS.md` §2.3).
- Deferred: CAPI consent enforcement at the source.

**Infrastructure**

- **RDS multi-AZ** before public launch. AWS's SLA for single-AZ RDS is 99.5%.
- **Production network posture:** tasks on private subnets with NAT or VPC endpoints, production sizing. One change
  window with multi-AZ.
- **Force a new service deployment after the Edge stack deploys** on a fresh env, or tasks never read the
  Edge-owned `cloudfront_distribution_id` and every invalidation skips.
- **Snapshot before merging a destructive migration** (`INFRASTRUCTURE_RUNBOOK.md` §2).
- **Cutover to seqtek.com** (infra engineer, low-traffic window). It has to cover:
  - ungating ww3 without ungating preview.seqtek.com, since `cognitoAuthEnabled` is env-wide;
  - `seqtek.com` as the first entry of `secondaryLane.dnsRecordNames`, which drives the CloudFront aliases, the
    Route 53 records, the ALB host rule, the Cognito callbacks and the lane's `NEXT_PUBLIC_SITE_URL`;
  - removing the zone's existing `seqtek.com`/`www` records and the older distribution's aliases in the window;
  - a by-category HubSpot cookie policy for `seqtek.com` and `www.seqtek.com` (`INTEGRATIONS.md` §4.1), replacing
    www's cookies-without-banner one. Without it HubSpot grants consent to every visitor and the ad tags load
    without asking;
  - caching: the shared distribution disables CloudFront caching while the env has a gate, because its cache key
    has no host (`edge-stack.ts`). Public seqtek.com needs a host-aware cache policy or its own distribution.
- **Production's database has no deletion guard.** `seqtek_prod` is on the `preview` env's RDS instance, which has
  no deletion protection and `RemovalPolicy.DESTROY` (`data-stack.ts`).
- After cutover: submit the sitemap to Search Console, crawl the redirects, check CloudFront cache behavior,
  test-restore an RDS snapshot, watch CloudWatch and Search Console.

## P4 — After the cutover

- **AI-1 — AI-assisted small edits in `/admin` through `@payloadcms/plugin-mcp`** (ADR 0014). Find, create and
  update on the content collections, no delete; a hook forces every MCP write to a draft; the `compose-page` rules
  ship as an MCP prompt.
  The plugin adds an API-key collection, so it needs a migration, and Payload v4 changes its config and auth. It is
  unreachable while the lane is gated.
- **CM-3 — scheduled export.** Run `tools/payload-export` against production on a schedule and commit the result to
  the content repo. Decide where it runs.
- **SEC-1 — a security and compliance page.** In G2's survey (n=1,002), 83% of companies require a security or
  privacy assessment to purchase. We have no such page.
- **INERT-1 residual.** `industries.description`, `relevantServices` and `clientLogos`, and every `locations` group,
  are hidden with no reader. Un-hide each in the change that ships its consumer.
- **Regional landing pages and a careers page.** The footer's four city links point at `/services/localshoring`.
- **F-6 — AICO baseline.** Spec: [`planning/aico.md`](./planning/aico.md) and `CONTENT-REQUIREMENTS.md` §8.
- **Deeper SEO:** per-page OG images; a `primaryGroup` on services if a breadcrumb ever needs one parent.
- **Portfolio polish:** a live link and screenshots in `README.md`; replace the
  `resolveLayout(x.layout as never)) as never` casts in the eight block-rendered routes with a typed adapter.
- **Vertical rhythm.** `Section` maps `tight`, `default` and `spacious` to flat padding. Making it responsive is a
  deliberate visual change (ADR 0012).
- **CI cost:** gate the Playwright, axe and Lighthouse job behind ready-for-review PRs.
- **Override notes:** `package.json` `_overridesNotes` has drifted from the overrides it describes. All five
  overrides stay (`tools/check-stale-overrides/README.md`).
