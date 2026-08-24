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

| Trigger                      | Lands on                                      | Notes                             |
| ---------------------------- | --------------------------------------------- | --------------------------------- |
| push to `Preview`            | `preview.seqtek.com` — primary Fargate lane   | Cognito-gated                     |
| push to `main`, or a release | `ww3.seqtek.com` — secondary lane, same stack | Cognito-gated; stands in for prod |
| —                            | `seqtek.com`                                  | still the **old Wix site**        |

The separate staging account (`seqtek-preview.com`) was retired 2026-08-14; no trigger deploys there.

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
| **P1** | Spec 011 — Payload admin UX (in flight)                        | Kenn         |
|        | A-1 Megan signs in + editor training                           | Kenn         |
|        | HYG-1 Content data hygiene                                     | Kenn         |
|        | UI-1 `TeamGrid` renders `role`, never `title`                  | Kenn         |
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

- **Spec 011 — Payload admin UX** _(in flight, branch `feat/011-payload-admin-ux`, 60 tasks)_. Make the admin
  panel usable by a marketing lead without a developer next to them: remove controls that do nothing, make the
  45-block picker pickable, add guidance. Also finishes the spec-010 expand/contract by dropping the retained
  legacy body columns, and settles the dead `Navigation` / `SiteSettings` globals.
  → `specs/011-payload-admin-ux/spec.md`
- **A-1 residual — Megan signs in, then editor training.** The multi-domain admin auth code shipped (#77,
  P5-11); what's left is a deploy, Megan's first sign-in (auto-provisions an `editor`), and a short CMS
  quickstart. Do the training **after** 011 lands so she learns the fixed panel, not the current one.
- **HYG-1 — content data hygiene.** No human input needed; see `CONTENT_NEEDS.md` §10.
  `industries` is empty while published case studies reference industry IDs (dangling refs) — seed it or drop
  the relationship; `locations` is empty (needed only if the regional pages get built); delete the
  `ztest-delete-me` category; case-study `ogImage` is null sitewide.
- **UI-1 — `TeamGrid` renders `role`, never `title`.** `TeamMembers` has two overlapping text fields —
  `title` (the job title) and `role` (a full descriptive sentence) — and `TeamGrid.tsx:87` renders `role`, so
  cards show prose where a job title belongs and the **members with neither field populated render as a face
  and a name with nothing underneath**. Team pages are the top credibility element in the research and this one
  is half-broken. Decide: render `title` (recommended), collapse the two fields, or render both. Hours of work.

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
  bodies (C-6), and the three staged Taurex studies. Run `npm run payload:seed` against the gated environment
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
- **Schema-drift CI guard** — fail CI if `payload migrate:create --dry-run` would produce a diff against what's
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
  `tools/legacy-equivalence/check.ts` **against that lane** before the drop migration goes anywhere near it.
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
  to build, so deleting them today means re-adding them later. Until then they should be hidden from the admin
  (`admin.hidden`) so nobody fills in a control that does nothing — a US4 form-legibility task, not a schema
  change.

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
