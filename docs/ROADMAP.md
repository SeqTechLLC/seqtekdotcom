# SEQTEK Website — Roadmap

**Last updated:** 2026-08-21 · **Owner:** Kenn Williamson

What is still open, in priority order. Nothing else.

**Rules for this file.** When something ships it leaves — move it to [`PROJECT_HISTORY.md`](./PROJECT_HISTORY.md)
with a `P{N}-*` row in the same commit. Don't check items off in place, don't keep the reasoning for a decision
that's already made, don't restate what shipped. If it isn't listed here, it's done or it isn't happening.

**Companion docs.** [`CONTENT_NEEDS.md`](./CONTENT_NEEDS.md) is the authoritative list of what we need _from
people_ — this file tracks the _work_. [`PROJECT_HISTORY.md`](./PROJECT_HISTORY.md) is the audit trail.
[`decisions/`](./decisions/) holds the ADRs.

---

## Where things stand

**Environments** (nothing is publicly launched):

| Trigger                        | Lands on                                         | Notes                                      |
| ------------------------------ | ------------------------------------------------ | ------------------------------------------ |
| merge to `main`                | `preview.seqtek.com` — UAT, primary Fargate lane | Cognito-gated. The ONLY deployment branch. |
| merge the **release PR**       | nothing                                          | Version bump only; `deploy.yml` skips it   |
| **publish** the GitHub Release | `ww3.seqtek.com` — production, secondary lane    | Promotes the already-built image; no build |
| —                              | `seqtek.com`                                     | still the **old Wix site**                 |

**Merging to `main` does not touch production** (#110/#111, 2026-08-25). Publishing a release is the
deliberate human gate, which matters because the container runs `payload migrate` on start — under the
previous model a merge was an unattended schema change on `seqtek_prod`. `Preview` is no longer a
deployment branch. The separate staging account (`seqtek-preview.com`) was retired 2026-08-14; no
trigger deploys there. Authoritative version: `ARCHITECTURE.md` §"Promotion model".

**The build is essentially done.** Two content primitives (a block-composed `Page`, a rich-text `Post`) plus
typed metadata collections — `partners` (#99) is the reference implementation of ADR 0009 Option C. 45 blocks,
drafts + versioning, live preview, CloudFront media, a generic REST seeder that can write through the Cognito
gate (#102). Remaining engineering is IA, hardening and cutover — not features.

**The bottleneck is content throughput, not code.** Every content change is still a developer task. That is
what P1 exists to fix.

**Launch is two steps.** _Soft launch_ — go live with the content already in hand and gather real feedback.
_Hard launch_ — the polished public push, gated on the **September** All Hands photo/video shoot.
Sign-off chain for both: Kenn does a work-first pass → **Megan** does a polish pass → **Megan + Hank + Brent**
sign off → **Dom** does the domain swap (he controls the domain; the swap itself is low-effort).

> **LM-1 — open question, answer before scheduling the soft launch.** "Soft launch" has never been pinned to a
> mechanism. The DNS cutover sits on the hard-launch checklist, so a soft launch means either (a) ungating
> `ww3.seqtek.com` for a named audience, or (b) cutting DNS early and treating the hard launch as a content
> refresh. (b) pulls most of P3 forward. Kenn decides.

---

## Priority at a glance

| #      | Item                                                           | Owner        |
| ------ | -------------------------------------------------------------- | ------------ |
| **P1** | Spec 011 — Payload admin UX (US1 shipped, US2–US6 open)        | Kenn         |
|        | A-1 Megan signs in + editor training                           | Kenn         |
|        | HYG-1 Content data hygiene                                     | Kenn         |
|        | UI-3 Default skeletons are publishable placeholder copy        | Kenn         |
| **P2** | K8 Broken-link + broken-image sweep                            | Kenn         |
|        | CL-1 Load the drafted content                                  | Kenn         |
|        | C-7 Taurex sign-off                                            | Kenn + Megan |
|        | BR-5 Stats bar                                                 | Leadership   |
|        | COPY-1 Tagline ↔ hero reconciliation                           | Kenn + Megan |
|        | HS-1 HubSpot cookie policy for this site's hostnames           | Megan        |
|        | VID-1 `/our-story` video embeds render as black boxes          | Kenn         |
| **P3** | Cutover checklist — CSP, QA, a11y sign-off, infra posture, DNS | Kenn + infra |
| **P4** | SVC-2 / SVC-3 / IND-1 / SEC-1 / F-6 and the campaign content   | Kenn + Megan |

---

## P1 — Unblock content throughput

Content is the project bottleneck and every content change is still a developer task. This tier fixes that
before we spend more effort loading content by hand.

- **Spec 011 — Payload admin UX** _(US1 shipped, US2–US6 open)_. Make the admin panel usable by a marketing
  lead without a developer next to them.
  **US1 landed in PR #107** (PROJECT_HISTORY P5-26): every inert control withdrawn, the spec-010
  expand/contract finished by dropping the retained legacy body columns, and the dead `Navigation` /
  `SiteSettings` globals settled — site chrome is code-owned now (ADR 0010). FR-008 is recorded **NOT MET**;
  its one real finding is **INERT-1** below.
  **US2 landed in PR #118** (block picker), **US3 in PR #120** (media thumbnails, `_status` columns),
  **US4 in PR #123**: every field an editor can see now carries a written label and, where its effect is not
  visible, help text; variant-only fields hide; collapsed block rows name themselves by their content.
  INERT-1 is closed by it (see below).
  **Still open:** US5 slug-from-title with collision handling, US6 collection grouping. Tasks T052–T065.
  → `specs/011-payload-admin-ux/spec.md`
- **A-1 residual — Megan signs in, then editor training.** The multi-domain admin auth code shipped (#77,
  P5-11); what's left is a deploy, Megan's first sign-in (auto-provisions an `editor`), and a short CMS
  quickstart. Do the training **after** 011 lands so she learns the fixed panel, not the current one.
- **HYG-1 — content data hygiene.** No human input needed; see `CONTENT_NEEDS.md` §10.
  `industries` is empty while published case studies reference industry IDs (dangling refs) — seed it or drop
  the relationship; `locations` is empty (needed only if the regional pages get built); delete the
  `ztest-delete-me` category; case-study `ogImage` is null sitewide. **The empty `industries` now costs more than dangling refs:** `case-study-grid` resolves `source: by-industry` through `caseStudies.industry` (UI-2), so such a block returns zero rows and renders an empty section rather than a visible placeholder. (The missing `teamMembers.title` values were supplied 2026-08-25 and are in `docs/content-drafts/team.json`; they still need seeding to the deployed lanes.)
- **UI-3 — a new record's default skeleton is publishable placeholder copy.** `TeamMembers.layout`
  defaults to `teamMemberSkeleton`, whose body is literally `About` / _"A short professional bio."_ — and
  seven team members were created and published without anyone overwriting it, so six public
  `/team/[slug]` pages served that string. **The copy half is done** (2026-08-25): all nine published
  members now carry a real bio, and `expertise` — which `personLd` emits as `knowsAbout` — is populated
  for all nine rather than the three leadership members only. What is left is the code half, because the
  underlying flaw is the skeleton design, not the data: the same pattern exists for `caseStudy`,
  `workshop` and `partner` (_"What the client was up against, in their terms."_, etc.) and only escaped
  notice because those records had real copy written over them. A default that reads as finished prose can
  be published by accident. Decide: ship the skeletons as empty blocks, mark skeleton text so a publish
  check can catch it, or add a "still has placeholder copy" guard to the K8 sweep. Same class as UI-2 —
  developer text reaching public copy.
- **UI-2 leftover — `related-posts` printed developer text. Resolved 2026-08-27 (PR #125).** An empty
  `manualItems` used to render _"No manual items — falls back to category-derived list at render time."_ as
  public body copy, promising a fallback that was never built. The block now renders nothing when nothing is
  picked, the same as every other collection-backed block. Giving it a real resolver is still open and is
  tracked under INERT-2 below: it needs the containing document's categories, which `resolveLayout`'s
  block-only signature does not carry.
- **INERT-2 — controls whose renderer does nothing with them. Now enforced, and half fixed.** Opened by the
  spec 011 US4 variant audit (2026-08-27) and widened by the PR #123 review, which read every new description
  against its renderer. US1 audited whether a _field_ had a consumer; none of these failed that test, because
  the consumer exists and ignores the value. Three review rounds each found more of them by hand (5, then 3,
  then 3) — always by reading, never by testing, because nothing in CI checked what a block actually rendered.

  **The gate (PR #125).** `tests/int/blocks/blockOutputContract.int.spec.tsx` renders every block in
  `layoutBlocks` from its own field config and holds it to three promises: none of the developer phrases this
  repo has actually published reaches body text (a denylist no block may opt out of, not a proof that no such
  sentence exists); every control changes the rendered output; every option of a select draws something, and
  something different from its siblings. Blocks are pure synchronous components by design
  (ADR 0009), so this costs a unit test. Exceptions are declared **on the block** via
  `custom: outputContract({...})` (`src/payload/blocks/outputContract.ts`) in three named kinds —
  `resolvedUpstream` (read by `lib/resolveLayout.ts` before render), `behavioural` (read at submit time, not
  paint time), and `inert` (read by nothing: a defect, with the reason it still exists). A declaration that
  stops being true fails the gate, so the list cannot rot the way this prose one did. It found 24 defects on
  its first run, including two nobody had catalogued.

  **Fixed (PR #124, #125):**
  - `contact-cta` — the only one that was live. Nine blocks in `services.json` leave `meetingUrl` blank, and
    the panel rendered either way, publishing _"Configure a HubSpot meetings URL to embed the scheduler"_ on
    nine services pages. The panel is now optional, and when it is filled in it books the meeting through a
    button instead of printing the raw address.
  - `newsletter-cta` — was a disabled input, a disabled button and a caption naming
    `NEXT_PUBLIC_HUBSPOT_NEWSLETTER_FORM_ID`, an env var nothing in `src/` reads. Now mounts the working
    `HubspotLeadForm` with an email field; with no form GUID the section is left off the page entirely.
  - `download-card` — was the same disabled mock **plus `Asset: <fileUrl>` printed in the clear**, so the gated
    download was neither gated nor a download. Now a real form; the file arrives in the success panel.
  - `hubspot-meetings` — was a bordered box printing the raw URL and _"loads in production"_. Now a real
    booking button. The inline embed would mean shipping HubSpot's `MeetingsEmbedCode.js` and widening the CSP
    (INTEGRATIONS.md §8) for a block with no live instances; `BookingCompleteSeam` stays wired for it.
  - `related-posts` — see the UI-2 leftover above.

  **Still open, each now declared `inert` on its block and failing the gate the moment it is fixed:**
  - `hero.variant: 'split'` — `Hero.tsx:76` draws the image for `with-image || split` on one branch, so "Split"
    is "With image" under another name. **Found by the gate, not by the audit.**
  - `hero.primaryCta.variant` — declared on the `Cta` type, never destructured; `Hero.tsx:99` hardcodes
    `bg-accent-strong text-white`, so all three options draw the same button.
  - `logo-bar.source: 'from-homepage'` — `LogoBar.tsx:27` maps it to an empty list, so the block publishes an
    empty band. The value lives in eight Postgres enum types, so withdrawing it is a migration.
  - `mission-vision-values.layout: 'tabs'` — `MissionVisionValues.tsx:25` branches only on `stacked`, so "tabs"
    renders exactly like "grid".
  - `video-embed.thumbnail` — **worse than inert**: `VideoEmbed.tsx:34` swaps the `<iframe>` for a still and a
    non-interactive "▶ Play" span, so filling it in makes the video unplayable and takes `provider`, `videoId`
    and `title` down with it.
  - `tabs` (the block) — jump links over a stack; no panel is ever hidden. Either build the tabs or rename the
    block to what it draws. (Not gate-visible: it renders every tab, so every control moves the output.)
  - `hubspot-form.submitRedirect`, `posts.relatedPosts`, `media.caption`, `servicePillars.order` — declared,
    never read. (`featured-testimonials.autoplay` is now declared inert on the block; `listServicePillars` has
    no callers and `service-pillar-cards` renders its relationship in pick order, so that one is `admin.hidden`.)
  - `services.icon` and `process-steps.steps.icon` — read, but there is no icon set behind them:
    `ServiceCards.tsx:36` and `ProcessSteps.tsx:29` print the raw string on the page.
  - A related renderer defect, same audit: three components read fields their collection does not have —
    `LocationsList.tsx:16` (`state`, which lives at `address.state`), `ServicePillarCards.tsx:24` (`tagline`)
    and `WorkshopList.tsx:21` (`subtitle`). Each is a silently dead branch. The gate builds its related
    documents from the real collection configs, so it will not paper over these, but it cannot fail on them
    either — they are collection fields, not block controls.

  Sequencing and the remaining fixes are in `docs/planning/block-output-contract.md`.

  **Worth a sweep**: this list came from auditing the ~120 descriptions one PR happened to touch, and the gate
  only covers `layoutBlocks`. Nothing has checked the collections' own fields the same way.

- **IND-1 / SVC-2 leftover — two blocks link to routes that do not exist.** Also found 2026-08-27.
  `industry-grid` links each card to `/industries/<slug>` and `locations-list` to `/locations/<slug>`
  (`IndustryGrid.tsx:30`, `LocationsList.tsx:37`); neither route is built, so both are 404s wherever those
  blocks are published. `LocationsList` also reads a top-level `state` the collection does not have (it lives
  at `address.state`), and `ServicePillarCards` reads a `tagline` that does not exist on `servicePillars` — two
  more silent no-ops. Fold into IND-1 / SVC-2, or make the cards unlinked until the routes exist.
- **UI-1 / UI-2 — both resolved 2026-08-25 (P5-27, P5-28).** Team cards render `title`, not the
  descriptive `role`. The four collection-backed blocks (`team-grid`, `post-list`, `case-study-grid`,
  `service-cards`) now resolve their `source`/`filter` in `src/lib/resolveLayout.ts` instead of printing
  `(resolves at template time)` as public body copy; the unbacked `featured` option was withdrawn.
  Nine of nine published team members now carry a job title. Chad Coleman is retired via the seeder's new
  `status: "unpublished"` (P5-29) — re-seed `team.json` against a lane and he drops off `/team` there too.
  The five listing pages no longer double-container their grid, so the page `h1` and the card grid share
  one left edge and one column width (was 32px out at desktop, 16px at mobile).

---

## P2 — Soft launch

- **K8 — broken-link + broken-image sweep.** Kenn's stated **number-one** soft-launch requirement ("everything
  has to go somewhere"). Crawl every route at both viewports for dead links and non-painting images, then
  re-run after each content load. Individual fixes have shipped (#84 site chrome, #90 the assessment redirect,
  #105 nine 301s that landed on 404s) but the sweep itself has never been run end-to-end. Note the recurring
  class: Leonardo mid-post figures live only in the DB, so any post re-seed strips them — see `tools/leonardo-images`.
- **CL-1 — load the drafted content.** All of this is written and waiting; it is a seeder run, not authoring:
  the values block onto `/our-story` (BR-4 — Hank signed off 2026-06-19), testimonial re-seed with the
  attribution we already hold (C-1), the curated photo picks via `tools/ingest-photos` (C-8), the six blog
  bodies (C-6), and the three staged Taurex studies.
  **The `teamMembers` slice is DONE on preview (2026-08-26):** all nine published members carry a job title, a
  real bio and `expertise` (which `personLd` emits as `knowsAbout`), and Chad Coleman is retired via the new
  `status: "unpublished"`. Verified on the lane — `/team` renders nine titled cards, `/team/chad-coleman` 404s,
  no placeholder copy anywhere, `h1` and grid share one x. **Not yet on production** — that moves on the next
  published release, and the seeder must be re-run against `ww3` separately. Run `npm run payload:seed` against the gated environment
  with `IMPORT_TOKEN` + `IMPORT_COOKIE` (#102). Load order and known defects: `docs/content-drafts/README.md`.
- **C-7 — Taurex sign-off (via Andrew).** The single highest-leverage content conversation: four written
  studies become publishable, all three outstanding `pendingQuote` slots are Taurex people, and it clears the
  soft-launch "one named, signed case study" gate in one call. **NovaMud** stays the editorial flagship (the
  only study with metrics) but needs its own write-up + naming permission. **ONEOK and QuickTrip are a hard no
  for case studies.** Details and the rest of the target set: `CONTENT_NEEDS.md`.
- **BR-5 — stats bar.** **25+ years (founded 1999) is the only sourced number.** The projects count is
  **unsourceable — do not publish it**: the old Wix site ran two contradictory sets at once (homepage
  20+/411+/8,221+; About 25+/500+/10,000+), so the earlier "500+" resolution picked the rounder pair rather
  than counting anything. "Lives touched" stays dropped. The current bar (25+ years / 4 markets / 1999) states
  the founding year twice — replace the third slot or drop to two stats. Reinstate a projects figure **only**
  if the PSA/invoicing history can produce one from a system of record.
- **COPY-1 — reconcile the tagline and the homepage hero.** Brent's tagline change ("Delivering Successful
  Software since 1999" → "Delivering Transformative Technologies since 1999") and the homepage hero
  ("Technology that fits how you work") currently make different claims. Settles the long-open hero-size
  question (DS-2) at the same time.
- **HS-1 — publish a HubSpot cookie policy for this site's hostnames** _(launch blocker, portal config only)_.
  Audited 2026-07-29: portal `8504846` has three enabled banners attached to `blog.seqtek.com`,
  `info.seqtek.com` and the **old Wix** `www.seqtek.com`, and **none** define cookie categories. Nothing
  matches this site's hostnames, so HubSpot's banner never renders and the footer "Cookie preferences" /
  "Withdraw consent" controls are silent no-ops. The code side is complete (ADR 0006). Steps + the audited
  table: `INTEGRATIONS.md` §4.1.
- **VID-1 — `/our-story` video embeds.** The founder/brand cuts render as large empty dark blocks in a fresh
  page capture. Verify they show a poster frame, not a black box, before anyone reviews the page.
- **Soft-launch sign-off.** Kenn's work-first pass → Megan's polish pass → Megan + Hank + Brent.
  Relational-branding minimum: real faces + at least one named, signed case study (anonymous studies are
  dropped, not softened). No `[PLACEHOLDER]`, no lorem.

---

## P3 — Hard launch and cutover

Gated on the **September** All Hands shoot plus the P2 content. Leadership engages here, not during dev.

**Content and copy gate**

- Mission, vision and hero copy read in context across the homepage, `/our-story`, service and case-study heroes.
- Sequoyah acknowledgement (BR-1) — leadership reads the rendered homepage trust block, the `/our-story`
  narrative and the cultural-acknowledgement line, then signs off or iterates (copy in ADR 0003).
- Faith framing — leadership decides whether and how the brand-kit faith elements ("biblical principles",
  "grace and trust") surface on `/our-story` (flagged in `VALUES_REWRITE.md`).
- Testimonial attribution (C-1) — every quoted testimonial confirmed with a named attribution.
- Leadership bios and headshots (C-3, BR-7) — each person approves their own copy and photo.
- Case-study copy (C-7) — each of the 7 studies has a hero image, a named client testimonial and a metrics
  array. **Only 2 of 7 carry a quantified outcome today**; the competitor teardown ranked "a hard number in
  every study" the single highest-impact fix.
- Cookie banner reviewed (the canonical Cheyenne address and Terms of Service shipped in #105).
- **Sign-off captured in writing** — Google Doc, signed email or equivalent, so decisions don't get
  re-litigated post-launch.

**Quality gates**

- **CSP promoted from report-only to enforcing** (`src/lib/csp.ts` still defaults to `report-only`).
  Calendar a hard date — this is the easiest thing on the list to forget.
- Cross-browser / device QA — Chrome, Safari, Firefox; iOS, Android.
- **Blocking screen-reader sign-off** across the AT/browser matrix (spec 007 shipped the automated WCAG 2.2 A/AA
  sweep and a best-effort SR pass; the formal blocking pass is the residual).
- Re-take Lighthouse against CloudFront with the consent-gated third parties live, then flip the
  `performance` / LCP / TBT / CLS budgets from `warn` → `error`.
- Live returning-visitor consent fire-matrix on the real GTM container, cross-browser (the E2E half shipped in
  spec 006).
- **Schema-drift CI guard** _(now also: no CI gate runs migrations at all — P5-30)_ — fail CI if `payload migrate:create --dry-run` would produce a diff against what's
  on disk. Systemic fix for the desync that forced the P2-6 migration collapse; add the one-line
  "schema change → `migrate:create` before merge" note to `PAYLOAD_DEVELOPMENT.md`.
- **CI e2e stability under the spec-010 schema** — the Playwright job still races the dev-server schema push
  (`relation … does not exist` → cascade). Push once before the webServer + test process, or have the test
  process reuse the dev server's schema.
- **Spec 003 US7** — verify `enforceDraftWhenScheduled` is wired on every draftable collection with
  `publishedAt` and ship the integration test. The cron trigger (`/api/cron/publish-scheduled`) stays
  deliberately deferred; only the Payload-side invariant is needed.

**GTM external config** (GTM-UI work, not code — the in-repo track shipped as P5-2)

- **US1/US2 tail** — build the LinkedIn Insight Tag + Google Ads conversion tag in container `GTM-54KBJ2Z3`
  (require `ad_storage`, fire on Page View + `hubspotConsentUpdate`), deploy, run the Accept/Deny/Customize
  fire-matrix (SC-001/002/003/007), then export → commit `infra/gtm/container.json` and confirm zero drift.
- **Deferred, unblock when their content ships** — the 8 Meta browser pixels are staged without triggers; bind
  each to its per-market `/…casestudyworkshop` path trigger when those routes exist (INTEGRATIONS §2.3).
- **Deferred** — CAPI consent enforcement at source (Megan/Domanick confirm whether server-side CAPI continues
  after cutover; off-site, not an in-repo path), and `booking_complete` live emission (the `BookingCompleteSeam`
  listener lights up when the real HubSpot Meetings embed replaces the placeholder).

**Infrastructure** _(the Fargate migration is owned by the infra engineer — reconcile docs after, don't port)_

- **RDS multi-AZ flip** before public launch. Small CDK property change, required for the SC-010 99.9% SLA to be
  mathematically achievable (AWS SLAs single-AZ RDS at 99.5% only). Deferred from spec 002 to keep pre-launch
  cost down.
- **Production network posture** — tasks on private subnets with NAT or VPC endpoints, and restore
  production-shape sizing. Bundle with the multi-AZ flip into one change window. _(The spec-002 wording for this
  item predates the EC2→Fargate move; re-derive it against the current stack.)_
- **Force a new service deployment AFTER the Edge stack deploys.** On a fresh environment Compute comes up
  before Edge exists, so first-boot tasks never see the Edge-owned `cloudfront_distribution_id` SSM param and
  every CloudFront invalidation silently skips — the exact dormancy found on staging (spec 009 / PR #44).
  Verify after: a media delete produces an entry in `aws cloudfront list-invalidations`.
- ~~**Spec-010 composer run after `payload migrate`**~~ — **removed: spec 011 dropped the legacy body
  columns**, so there is nothing left to compose from and the composers' CLI entry points are gone. What
  replaces it is the pre-migration gate in `INFRASTRUCTURE_RUNBOOK.md` §2.9: snapshot the lane, then run
  take an RDS snapshot of that lane **before merging** — merging is what deploys, and the container's `CMD` runs
  `payload migrate` on start.
- DNS cutover in a low-traffic window (Dom).
- Post-cutover: submit the sitemap to Search Console and verify redirects, validate CloudFront cache behavior,
  test-restore an RDS snapshot, run a full redirect crawl (Screaming Frog or similar), watch CloudWatch +
  Search Console for errors and regressions.

---

## P4 — After the cutover

Real work, none of it blocking a launch. Ordered by expected return.

- **SEC-1 — security / compliance page.** The one addition with a _measured_ commercial gate behind it. G2
  (n=1,002): **83% of companies require a security or privacy assessment** to purchase (75% SMB, 82% mid-market,
  **88% enterprise**), and **39% overall / 50% of enterprise** buyers name IT security review as their single
  biggest source of evaluation delay. We have no such page.
- **IND-1 — industry pages, Energy first.** We publish **zero**; the Momentum3 competitor publishes four in its
  nav. Hinge _Inside the Buyer's Brain_ 4th ed. (n=1,914) ranks **industry / subject-matter expertise the #1
  evaluation criterion at 36.4%**, ahead of relevant experience (32.3%) and talented staff (32.2%). Our own
  taxonomy is **4 of 5 energy/oilfield** — a real vertical concentration that is invisible in the IA. Energy
  first: it already has the case-study proof.
- **INERT-1 — 24 admin fields on four unrouted collections have no consumer.** Found by audit during spec 011. `industries`, `locations`, `servicePillars` and `services` have no detail route, so nothing calls
  `buildMetadata` with their `seo` group and nothing renders their longer prose. An editor can fill any of
  these in and publish to no effect:
  - `industries` — `description`, `relevantServices`, `clientLogos`, `seo.*` (would be consumed by **IND-1**)
  - `locations` — `description`, `hasOffice`, `address.*`, `seo.*` (by the four market pages, `CONTENT_NEEDS` §9)
  - `servicePillars` — `description`, `heroImage`, `seo.*` (by **SVC-2**)
  - `services` — `seo.*` (by **SVC-2**)

  They were left in place rather than deleted: they are metadata sitting _ahead of_ routes the roadmap intends
  to build, so deleting them today means re-adding them later. **Closed 2026-08-27 by spec 011 US4 (PR #123)**:
  all 24 are `admin.hidden`, so the columns survive for SVC-2 and IND-1 to consume while the controls are gone
  from the panel. `admin.hidden` does not touch REST, so `tools/payload-seed` and `docs/content-drafts/*.json`
  still write them. Un-hide each group in the same change that ships the route reading it.

- **SVC-2 — put services back on a metadata collection.** _(Blocks SVC-3.)_ The `/services` fold took the wrong
  half of ADR 0009: services became bare `Page` slugs behind hardcoded lookups, so a fifth offering means
  editing `OFFERING_TO_SLUG` + `OFFERING_TITLE` (`services/[offering]/page.tsx`), `SERVICE_OFFERING_PATHS` +
  `SERVICE_PAGE_SLUGS` (`sitemap.ts`) and the footer nav, then deploying — contradicting the ADR's own rule
  that only creating or fixing a _block_ requires code. Every other type derives routing, indexing, sitemap and
  JSON-LD from its collection. **Fix:** give `Services` (or a fresh `offerings` collection) the `layout` body +
  listing metadata, resolve `/services/[offering]` off the collection, delete the four hardcoded lists, migrate
  the four `service-*` Pages in, hold the 301s. `partners` (#99) is the reference implementation. Also clean up
  the orphaned `services` path builder in `livePreview/url.ts`.
- **SVC-3 — services IA restructure.** Direction decided, not built; blocked on SVC-2.
  <details><summary>The measured case and the target shape</summary>

  The four peer offerings sit on **four different axes** — Localshoring (delivery model), Workshops (format),
  Digital Transformation (outcome), AI Integration (technology) — which is why **Data has no home** and got
  absorbed into Digital Transformation. Measured: the 4 offering pages average **327 words** against **348** for
  the nine archived service pages, so the consolidation happened **without deepening**; `/services` itself is
  **169 words**.

  Target shape — **flat 6-item top nav, no mega/multi-layer menu (Kenn ruled that out):**
  `Services · Industries · Case Studies · Insights · About · Contact`, with the axis split expressed **on the
  `/services` page** where it can be explained: "What we build" (Software · Data · AI) / "How we work with you"
  (Localshoring · Workshops) / "Full capabilities" (**one index page, not 47 pages**). The footer carries the
  full flat capability list. **Digital Transformation is demoted from a service door to the brand narrative** —
  Brent's tagline change already puts transformation at the brand level, so this is a promotion, not a cut.

  **The nine capability pages are already written** — `docs/content-drafts/_archive/content-batch.json`,
  ~4,000–4,800 chars each, in current voice, including Cloud & Data Engineering — so this is a seeding job, not
  a writing job. Five are distinct enough for their own page (Custom Software, Application Modernization,
  Cloud & Data Engineering, ML Solutions, Process Automation); four fold in (AI-Assisted Modernization → App
  Modernization; Fractional Product Ownership → a delivery model; Strategy & Roadmap Alignment → the
  engagement-process block; Discovery & Team Workshops → a `/workshops` section).

  ⚠️ **Cheaper before the DNS cutover.** Nothing has launched, so PR #79's nine internal 301s are _replaced,
  not layered_, and the Wix→new 301s get **retargeted and become more accurate** (`/technology-and-data` → the
  data page rather than digital-transformation). If SVC-3 is happening at all, seed it while it still costs one
  seed run.

  </details>

- **Regional landing pages (4) + a careers stub.** `/tulsa-consulting`, `/okc-consulting`,
  `/northwest-arkansas-consulting`, `/kansas-city-consulting` are all currently parked on `/localshoring`, and
  `/careers` was removed from the nav. The four regional pages were a deliberate local-SEO play and
  multi-market positioning is core to the brand. Each wants market-specific copy, proof and contact.
  See `CONTENT_NEEDS.md` §9.
- **F-6 — AICO baseline.** `llms.txt` + `llms-full.txt` routes, `.md` alternatives for content pages,
  differentiated `robots.txt` per AI crawler, CloudFront cache rules tuned for crawler traffic, byline +
  last-updated metadata on Insights and Case Studies. Spec in `ARCHITECTURE.md` §14 + `CONTENT-REQUIREMENTS.md`
  §8. Partly content-gated — the `llms-full` body needs published page content.
- **Campaign content expansion.** 3–5 supporting blog posts for the AI workshop push; a lead magnet
  (one-pager, assessment or framework brief); 4–6 more case studies in batches, each with real outcomes and a
  testimonial. **Megan's ask (2026-06-24):** the workshop and case-study pages should also read as
  self-contained **LinkedIn / email / direct campaign landing pages** — a cold visitor arriving from an ad
  needs full context and a clear CTA without the rest of the site. The Touchstone page is already close.
- **Deeper SEO** — per-page OG images and structured data beyond the spec-004 baseline
  (`Organization` / `Article` / `BreadcrumbList` JSON-LD, dynamic sitemap, metadata helper with OG defaults).
- **Portfolio-readiness polish.** A live link + screenshots in `README.md`; a one-line note framing the
  engineering depth (invariant tests, full AWS infra, the block engine) as deliberate rather than gold-plating;
  replace the `(record.layout ?? []) as never` casts in the block-rendered detail routes with a typed
  `BlockLike[]` adapter (#66 review follow-up).
- **CI Actions cost.** The `push`+`pull_request` double-run is fixed (#69); the remaining per-run cost is the
  ~11-minute Playwright + axe + Lighthouse job — gate it behind ready-for-review PRs so draft pushes skip it.
  The org Actions spending limit was hit 2026-06-16: someone needs to raise it, or take the repo public
  (Actions are free there).
- **Small stuff.** Backfill the `ws` / `happy-dom` `_overridesNotes` entries now that those overrides are on
  main (issue #75 tracks the stale ones); decide autoplay vs manual-only _if_ a testimonial carousel is ever
  built (`FeaturedTestimonials` ships a static stack-grid today).
  - ~~**T-1** — hash-based media reuse in `tools/import-case-study`~~ **closed as moot (spec 011).** The tool
    was superseded by the generic `payload-seed` CLI (P5-15) and had no npm script and no callers; case studies
    load from `docs/content-drafts/case-studies.json` like every other type. Spec 011's field removals left it
    writing only dropped columns, so it was deleted rather than repaired.

---

## Waiting on people

`CONTENT_NEEDS.md` is the authoritative list — hand _that_ to Hank, Justin and Megan, not this file. Summary of
what's outstanding and who owns it:

| Item                            | Owner        | State                                                                                                                                                                                                                                                                        |
| ------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-3 Hank + Brent interview copy | Kenn         | **Filmed and in edit** — extraction from the transcript, not a scheduling gate. Covers the 1999→now timeline, the localshoring definition, "Why Touchstone", Brent's bio and his copy for the two non-Touchstone workshops. Draft off the raw audio; don't wait for the cut. |
| BR-7 / C-2 Photo shoot          | Kenn         | Studio headshots exist and are catalogued. Still to shoot at the **September** All Hands: group leadership, full team, Kenn's headshot.                                                                                                                                      |
| C-9 Video delivery + placement  | Kenn + Megan | The localshoring explainer and the Hank + Brent partner videos are filmed and in edit. Take delivery, upload to the SEQTEK channel, place as `video-embed` blocks. Megan's bio video is her call — script one for her or omit it.                                            |
| C-5 Client logo permissions     | Megan + Kenn | Keep: Hogan, BOK, QuickTrip. Drop or refresh: GE, AVB, Change Health. Verify we ever worked with ONEOK / ONE Gas. Well Checked is a logo/permission item, not a case study.                                                                                                  |
| C-7 Case-study sign-offs        | Kenn + Megan | Taurex (Andrew) first — see P2. Then Hogan (Ryan) and NovaMud (Sam).                                                                                                                                                                                                         |
| BR-5 A sourced projects count   | Leadership   | Or we ship years + markets only — see P2.                                                                                                                                                                                                                                    |
| BR-6 Cherokee Nation outreach   | —            | **Decided 2026-06-19: no outreach.** Listed only because it keeps getting re-asked. Revisit only if the Nation asks.                                                                                                                                                         |
| HS-1 HubSpot portal config      | Megan        | See P2.                                                                                                                                                                                                                                                                      |
| Written leadership sign-off     | Leadership   | See P3.                                                                                                                                                                                                                                                                      |

---

## Risks

1. **Content production lag.** Engineering can build against placeholders; launch cannot. This has been the
   bottleneck for the whole project. The mitigation is P1 — make content changes stop requiring a developer.
2. **CSP report-only drifts past launch.** Easy to leave running and never enforce. Set a hard date.
3. **Schema drift between code and migrations.** Caused the staging 500s on #13/#14/#15 and forced the P2-6
   migration collapse. Until the CI guard in P3 ships, "added a collection or field → ran `migrate:create`" is
   a merge-to-main checklist line.
4. **Bleeding-edge stack.** Next 16 + React 19 + Payload 3.84+ on Postgres 18.3. Validated end-to-end. If a
   future minor bump breaks the combo, **downgrade Next first** — not Payload; that's the constraint.
   Tailwind v4 was evaluated and rejected (ADR 0001).
5. **One AWS account runs both lanes.** `preview.seqtek.com` and `ww3.seqtek.com` are two services in the same
   stack in the same account, and the separate staging account is gone. There is no isolated environment left
   to rehearse a destructive change in.
