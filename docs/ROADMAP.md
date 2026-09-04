# SEQTEK Website — Roadmap

**Owner:** Kenn Williamson

What is still open, in priority order. Nothing else.

**Rules for this file.** When something ships it leaves — move it to [`PROJECT_HISTORY.md`](./PROJECT_HISTORY.md)
with a `P{N}-*` row in the same commit. Don't check items off in place, don't keep the reasoning for a decision
that's already made, don't restate what shipped, don't catalogue content. If it isn't listed here, it's done or
it isn't happening.

**Companion docs.** [`CONTENT_NEEDS.md`](./CONTENT_NEEDS.md) is what we need _from people_; this file tracks the
_work_. [`PROJECT_HISTORY.md`](./PROJECT_HISTORY.md) is the audit trail. [`decisions/`](./decisions/) holds the
ADRs. Meeting notes live in [`meetings/`](./meetings/).

---

## Priority at a glance

| #      | Item                                                           | Owner                  |
| ------ | -------------------------------------------------------------- | ---------------------- |
| **P0** | NAV-1 Dropdown panels + the pages under them                   | Kenn, blocked on Brent |
|        | SVC-2 Seed the services content                                | Kenn                   |
|        | SVC-3 Collapse the duplicate Localshoring pages                | Kenn                   |
|        | IND-1 Six industry pages                                       | Kenn + Brent           |
|        | BOOK-1 Book-a-call widget routing to Daniel                    | Kenn, blocked on Megan |
|        | PROOF-1 Case studies + quotes, on hard dates                   | Megan, Brent escalates |
|        | AB-1 The alternative "what we do" page, A/B against the menu   | Kenn                   |
|        | LM-1 Decide what "soft launch" means                           | Kenn                   |
| **P1** | Spec 011 — Payload admin UX (US5, US6 open)                    | Kenn                   |
|        | A-1 Megan signs in + editor training                           | Kenn                   |
|        | HYG-1 Content data hygiene                                     | Kenn                   |
|        | UI-3 Default skeletons are publishable placeholder copy        | Kenn                   |
|        | INERT-2 residual — icons, related-posts resolver, field sweep  | Kenn                   |
| **P2** | K8 Broken-link + broken-image sweep                            | Kenn                   |
|        | CL-1 Load the drafted content                                  | Kenn                   |
|        | C-7 Taurex sign-off                                            | Kenn + Megan           |
|        | BR-5 Stats bar                                                 | Leadership             |
|        | COPY-1 Tagline ↔ hero reconciliation                           | Kenn + Megan           |
|        | HS-1 HubSpot cookie policy for this site's hostnames           | Megan                  |
|        | VID-1 `/our-story` video embeds render as black boxes          | Kenn                   |
| **P3** | Cutover checklist — CSP, QA, a11y sign-off, infra posture, DNS | Kenn + infra           |
| **P4** | SEC-1 / F-6 / regional pages and the campaign content          | Kenn + Megan           |

---

## P0 — Committed at the 2026-08-31 sales alignment

Go/no-go **2026-09-14**. Context and quotes: `docs/meetings/2026-08-31-hank-sales-website-alignment.md`.

- **NAV-1 — the menu is built and wired; what it points at is empty.** The panel shipped (#129) and
  `site-content.ts` now carries both axes, all three groups and all nine leaves, every one resolving against a
  published `services` row. The mechanism is done. **The open item is the copy those 13 pages don't have —
  see SVC-2 below.**
  - **Open decision: should the axis panels derive from the `services` collection?** Today a new service is a
    content edit plus a code change to `site-content.ts`, which is the friction ADR 0010 accepted when the nav
    was six decade-scale items. It is 13 entries now. The hierarchy already exists as typed relations
    (`tier`, and `items` constrained to `tier: 'leaf'`), so a derived panel builds URLs from `slug` and has no
    free-text URL field to get wrong — which is the specific risk ADR 0010 rejected. Scope it to the two axis
    panels; top-level items, footer, legal nav and the JSON-LD values stay code-owned. Costs: `SiteHeader`
    becomes async (`listServices()` and its `services_list` tag already exist), and it renders on every page,
    so the revalidation gap below becomes load-bearing rather than cosmetic. Wants an ADR revising 0010.
  - `tests/e2e/layout.e2e.spec.ts` (~:28-35) asserts all six top-level items are visible **links**. If an axis
    item becomes a button that opens a panel, that assertion changes shape.
  - **A group's URL is optional, and that is what de-risks the second panel.** A group with no URL renders as
    a heading and nothing more, so "how we work" can ship with headless groups and earn pages later. Brent
    asked for all three "what we do" groups to be clickable, so on that panel every group takes a URL. The
    panel already renders a group either way (#129) — what changes is how much copy has to exist first.
  - **Decide whether the leaf namespace stays named `/services/`.** It was worth asking once the axis labels
    settled, and they have. All leaves share ONE flat namespace whichever axis they hang off — that is not
    optional, because a leaf reachable from both panels must resolve to one URL. Only the name is open.
  - The a11y gate is the cost, not the CSS: click/tap to open (hover-only fails WCAG 2.2 §1.4.13), no focus
    trap. `tests/e2e/a11y.e2e.spec.ts` sweeps at zero axe violations.

- **SVC-2 residual — the content.** The code shipped (P5-31 / #131, and P5-41 / #136 for the `/services` fold). A deploy never runs the seeder, so:
  - ~~Seed the services content~~ **Done on preview (verified 2026-09-04):** 24 `services` docs, tiers
    matching the drafts file, both axes and all three groups published, the nine legacy capability-set docs
    retired to `draft`. `ww3` is a separate run after the next release.
  - **Flip the five Localshoring links.** The `localshoring` leaf is seeded and published, so
    `/services/localshoring` resolves today — but `site-content.ts:190` and `:252-255` still point at the old
    `/localshoring` Page, and their comments still claim the leaf does not exist. Flip all five and retire the
    Page in one commit. No internal 301 — nothing is live, so the URL simply changes. Overlaps SVC-3: there
    are currently THREE Localshoring artifacts (the `localshoring` Page, the `service-localshoring` Page, and
    the service leaf) where there should be one.
  - **Re-pick every block the SVC-2 migration emptied.** `*_rels.service_pillars_id` was dropped across
    thirteen tables, discarding the `pillars` selection on any `service-pillar-cards` block and NULLing
    `service-cards.pillar` wherever the source was "By pillar". `pillars` is `required, minRows: 1`, so those
    documents are invalid until re-picked. A re-seed repairs whatever the seed files cover; the exposure is
    what was authored directly in the admin. Check a lane.
  - **Write the copy. This is the P0 item now.** All 13 service pages are seeded as placeholders — measured
    2026-09-04, every one is a hero plus one content block at **540-850 characters**. The old Wix service
    pages averaged 348 words, so these are roughly a third of what they replaced. The menu is fully wired and
    delivers a visitor to a near-empty page, which is the exact failure Hank and Brent both described: a
    capability list without substance. Ten leaves, three groups, two axes (`CONTENT_NEEDS.md` §12).
    **A group page needs a reason to exist:** if it is only a list of its own children it is a worse version
    of the menu that got you there. That is the bar. Flag it early if a grouping produces a heading nothing
    can be written about.
  - **`services.json` lists each of the three group slugs twice** — once with a real 3-block layout, once with
    an empty one. Whichever seeds last wins, so a re-seed can silently blank a group page. Fix in the content
    repo before the next run.
  - **Refine the 21 Wix service 301s once the leaves are seeded.** They all land on the axis today, which is
    the honest interim target. `/technology-and-data` should reach the data page rather than the axis.
    Cheaper before the DNS cutover: nothing is live, so these are retargeted at source rather than layered.

  **Carry forward:** absorbing tiers into one collection means every relationship pointing at that collection
  has to constrain to a tier, or the pickers offer nonsense. Six fields pointed at `services`; without
  `filterOptions` each would have offered an axis as a taggable service. Any future collection merge inherits
  this.

- **SVC-3 — collapse the duplicate Localshoring pages.** Two Page records exist for one subject
  (`/localshoring` and `/services/localshoring`), both titled "Localshoring". Only the first is linked. Collapse
  to one page and two links as part of SVC-2, with a 301 from whichever slug loses. Which one wins is a content
  call. Cross-listing means one page and two links, never two pages — the flat leaf URL is that rule expressed
  in routing.
  - Re-check the four folded capability pages against Brent's grouping (AI-Assisted Modernization, Fractional
    Product Ownership, Strategy & Roadmap Alignment, Discovery & Team Workshops); some map onto items he named
    and may need to come back out.

- **IND-1 — six industry pages.** Healthcare, FinTech, Oil & Gas, Energy, Manufacturing, plus Aerospace.
  Non-profit is explicitly out. Build Energy first — it has the most case-study proof.
  - **One taxonomy.** The industry pages and `case-study-grid`'s `by-industry` source read the same collection,
    so the six marketing industries become the canonical slugs and the existing per-client case-study refs
    remap onto them. Endurance Lift / NovaMud / Taurex → Oil & Gas; WellChecked → Energy.
  - **Hogan is open.** Its vertical is psychometrics, which is not one of the six. Left tagged as-is. Settle it
    before the collection is seeded. It surfaces a constraint: an industry that exists for tagging but should
    not get a page needs a way not to route — publish state is the lever, since `/industries/[slug]` builds
    from published records only.
  - **Four of the six have no proof.** Healthcare, FinTech, Manufacturing and Aerospace carry no case study.
    Either PROOF-1 lands one each, or the pages ship in the order the proof does. Recorded in
    `CONTENT_NEEDS.md` §11.
  - **Re-link the cards.** `industry-grid` cards were unlinked in #126. `revalidateOnChange.ts:135-141` already
    builds invalidation paths for the route, and the `seo.*` group on `industries` un-hides here.

- **BOOK-1 — book-a-call widget, routing to Daniel.** The blocks shipped (#124). What is missing:
  - **Daniel's real HubSpot meetings URL** (Megan, portal config). The only URL in the repo is a fixture. The
    button cannot go live without it.
  - The footer's "Book a Call" still points at `/contact` (`site-content.ts`). Repoint it, and place the block
    where a visitor actually lands.
  - `booking_complete` starts emitting for real once a live URL is in place — fold it into the P3 GTM matrix.
  - The inline calendar embed stays unshipped: it needs HubSpot's `MeetingsEmbedCode.js` and a CSP widening
    (`INTEGRATIONS.md` §8). A button satisfies the ask.

- **PROOF-1 — case studies and attributable quotes, on hard dates.** Every capability claim links to proof, and
  there are fewer proofs than the menu will have items.
  **Protocol:** approach with a specific study and a hard date, not "write some success stories"; run it as a
  30-minute recorded call Megan drafts from; CC Brent on every ask, marked `IMPORTANT`; on the third no-reply
  Brent calls them. Megan owns the chase; Brent has backed the escalation.
  **In flight:** YCS (drafting), YouVersion (no reply), NovaMud (needs a redo), Hogan. Targets added by Hank:
  BOK, QuickTrip, ONEOK — which reopens what `CONTENT_NEEDS.md` had closed as logo-only.
  **Decide at the go/no-go:** whether a named, signed case study gates the cutover.

- **AB-1 — the alternative "what we do" page.** Build a page that meets Brent's goal — a visitor understands
  everything we do very quickly — without the full list, and A/B it against the menu. Not launch-gating; do it
  after the menu ships and there is traffic. Settle how "understood quickly" gets measured before building it.

- **LM-1 — decide what "soft launch" means.** Answer at the 2026-09-14 go/no-go. Either (a) ungate
  `ww3.seqtek.com` for a named audience, or (b) cut DNS early and treat the hard launch as a content refresh.
  (b) pulls most of P3 forward, and is what the meeting described in everything but name. Kenn decides.

---

## P1 — Unblock content throughput

Every content change is still a developer task. This tier fixes that before we load more content by hand.

- **Spec 011 — Payload admin UX.** US1–US4 shipped. **Open: US5** slug-from-title with collision handling,
  **US6** collection grouping. Tasks T052–T065. → `specs/011-payload-admin-ux/spec.md`
- **A-1 residual — Megan signs in, then editor training.** The auth code shipped (#77). What is left is a
  deploy, her first sign-in (auto-provisions an `editor`), and a short CMS quickstart. Train **after** 011
  lands so she learns the fixed panel.
- **HYG-1 — content data hygiene.** No human input needed; see `CONTENT_NEEDS.md` §10. Check a live lane, then:
  seed `industries` or drop the relationship (published case studies reference industry IDs, and
  `case-study-grid`'s `by-industry` source returns zero rows against an empty collection); seed `locations` if
  the regional pages get built; delete the `ztest-delete-me` category; give case studies an `ogImage`.
- **UI-3 — a new record's default skeleton is publishable placeholder copy.** `TeamMembers.layout` defaults to
  `teamMemberSkeleton`, whose body reads as finished prose — seven members were published without overwriting
  it. The copy half is done; the code half is not, because the flaw is the skeleton design. The same pattern
  exists for `caseStudy`, `workshop` and `partner`. **Decide:** ship skeletons as empty blocks, mark skeleton
  text so a publish check can catch it, or add a placeholder guard to the K8 sweep.
- **INERT-2 residual — controls whose renderer does nothing with them.** The gate
  (`tests/int/blocks/blockOutputContract.int.spec.tsx`) holds every block in `layoutBlocks` to three promises:
  no developer phrase reaches body text, every control changes the output, every select option draws something
  different. Exceptions are declared on the block via `custom: outputContract({...})`. Still open:
  - `services.icon` and `process-steps.steps.icon` are read, but there is no icon set behind them —
    `ServiceCards.tsx:36` and `ProcessSteps.tsx:29` print the raw string. Not gate-visible: it does reach the
    output, just as a string.
  - `related-posts` has no resolver. It needs the containing document's categories, which `resolveLayout`'s
    block-only signature does not carry.
  - **The gate covers block controls, not collection fields.** Nothing has audited the collections' own fields
    the same way. Sequencing: `docs/planning/block-output-contract.md`.
- **Publishing a group does not bust the axis page that renders it.** `services` is the only routed
  collection whose revalidate plan names no listing path — correct in itself, since `/services` is a
  redirect now. But the axis page took over the overview role, and its `service-pillar-cards` block renders
  the `tier: 'group'` rows through a depth-2 populate, so publishing or renaming a group refreshes neither
  that page's data cache nor its CloudFront copy. Bounded by `revalidate: 3600` on a gated, unlaunched
  site. The fix wants the axis slugs, which are content — so it needs a query in `revalidateOnChange`,
  not a hardcoded slug.
- **Three top-level nav destinations are not editable without a deploy — deliberately parked 2026-09-04.**
  `/case-studies`, `/insights` and `/contact` are bespoke route files: their `<h1>`, intro copy and SEO strings
  are literals. The other three nav destinations (`/our-story`, and both `/services` axes) are documents.
  ADR 0009 says there should be no bespoke page templates, so these are the remaining exceptions.

  **Converting them is not the small job it looks like.** Each blocks on something real:
  - `case-study-grid` caps at `limit: max 9` and `post-list` at `max: 12`; the routes bypass that by passing
    `limit={items.length}`. A block-composed listing would silently drop the 10th case study — content that
    exists and is in the sitemap but is unreachable from its own listing. P4 plans 4-6 more studies and 3-5
    more posts, so it is not hypothetical.
  - Removing the cap means unbounded listings, which means **pagination** — page state in a URL the block does
    not own. That is a feature, not a schema tweak.
  - `/contact` is worse: `ContactForm` is a curated six-field schema with HubSpot internal names verified by a
    live test submit (2026-06-22), including the `inquiry_type` select that routes the lead. The
    `hubspot-form` block renders generic `DEFAULT_FIELDS` with a hardcoded special case for the Workshop GUID
    and nothing for contact, and `NEXT_PUBLIC_HUBSPOT_CONTACT_FORM_ID` is unset. Converting would swap the
    real form for the generic one.

  **Cost of leaving it:** one deploy to reword about six lines of copy, rarely. Revisit when pagination is
  wanted for its own sake, or when the contact form's field set is being reworked anyway (which would also
  remove the Workshop hardcode in `HubspotForm.tsx`).

- **Clear the remaining production advisory (issue #132).** Opened at 6 high; today's autoprefixer bump moved
  `browserslist` past the affected range, leaving **one high** — `fast-uri` under `payload`, with a patched
  version available — plus one low (`postcss-selector-parser` under `tailwindcss`/`postcss-nested`). Both are
  transitive, so the fix is a bump of the parent or a `package.json#overrides` pin.
- **Re-link `industry-grid` and `locations-list` cards** when IND-1 and the locations route ship. The cards are
  one call site; `revalidateOnChange.ts:135-141` is the other. **The two disagree on the name** — the hook says
  `/consulting/<slug>`, the block said `/locations/<slug>`. Settle that before either route is built.

---

## P2 — Soft launch

- **K8 — broken-link + broken-image sweep.** The number-one soft-launch requirement: everything has to go
  somewhere. Crawl every route at both viewports for dead links and non-painting images, then re-run after each
  content load. Individual fixes have shipped; the sweep itself never has. Recurring class: Leonardo mid-post
  figures live only in the DB, so any post re-seed strips them (`tools/leonardo-images`).
- **CL-1 — load the drafted content.** A seeder run, not authoring: the values block onto `/our-story`, the
  testimonial re-seed, the curated photo picks (C-8, `tools/ingest-photos`), the six blog bodies, and the
  three staged Taurex studies. The `teamMembers` slice is done on preview and **not yet on production** — the seeder
  runs against `ww3` separately. Run against a gated lane with `IMPORT_TOKEN` + `IMPORT_COOKIE` (#102).
- **C-7 — Taurex sign-off (via Andrew).** The highest-leverage content conversation: four written studies
  become publishable, all three outstanding `pendingQuote` slots are Taurex people, and it clears the
  soft-launch "one named, signed case study" gate in one call. NovaMud stays the editorial flagship (the only
  study with metrics) but needs its own write-up and naming permission.
- **BR-5 — stats bar.** 25+ years (founded 1999) is the only sourced number. **The projects count is
  unsourceable — do not publish it**; the old Wix site ran two contradictory sets at once. "Lives touched"
  stays dropped. The current bar states the founding year twice — replace the third slot or drop to two.
  Reinstate a projects figure only if the PSA/invoicing history can produce one from a system of record.
- **COPY-1 — reconcile the tagline and the homepage hero.** They currently make different claims, and neither
  is what leadership wants carried. Write against Hank's definition instead: boutique scale as the advantage,
  Localshoring as the name for it, trust → speed → bottom line, since 1999. Settles the open hero-size
  question (DS-2) at the same time.
- **HS-1 — publish a HubSpot cookie policy for this site's hostnames** _(launch blocker, portal config only)_.
  Portal `8504846`'s three banners are attached to other hostnames and none define cookie categories, so the
  banner never renders and the footer's "Cookie preferences" / "Withdraw consent" controls are silent no-ops.
  The code side is complete (ADR 0006). Steps: `INTEGRATIONS.md` §4.1.
- **VID-1 — `/our-story` video embeds render as black boxes.** Verify they show a poster frame before anyone
  reviews the page.
- **Soft-launch sign-off.** Kenn's work-first pass → Megan's polish pass → Megan + Hank + Brent. Minimum: real
  faces and at least one named, signed case study (anonymous studies are dropped, not softened). No
  `[PLACEHOLDER]`, no lorem.

---

## P3 — Hard launch and cutover

Gated on the September All Hands shoot plus the P2 content. Leadership engages here, not during dev.

**Content and copy gate**

- Mission, vision and hero copy read in context across the homepage, `/our-story`, service and case-study heroes.
- Sequoyah acknowledgement (BR-1) — leadership reads the rendered pages, then signs off or iterates (ADR 0003).
- Faith framing — leadership decides whether and how the brand-kit faith elements surface on `/our-story`.
- Testimonial attribution (C-1) — every quoted testimonial confirmed with a named attribution.
- Leadership bios and headshots (C-3, BR-7) — each person approves their own copy and photo.
- Case-study copy (C-7) — each study has a hero image, a named testimonial and a metrics array. **Only 2 of 7
  carry a quantified outcome**; a hard number in every study was the highest-impact fix in the teardown.
- Cookie banner reviewed.
- **Sign-off captured in writing** so decisions don't get re-litigated post-launch.

**Quality gates**

- **CSP promoted from report-only to enforcing** (`src/lib/csp.ts` still defaults to `report-only`). Calendar a
  hard date — the easiest thing here to forget.
- Cross-browser / device QA — Chrome, Safari, Firefox; iOS, Android.
- **Blocking screen-reader sign-off** across the AT/browser matrix. Spec 007 shipped the automated sweep and a
  best-effort SR pass; the formal blocking pass is the residual.
- Re-take Lighthouse against CloudFront with the consent-gated third parties live, then flip the performance /
  LCP / TBT / CLS budgets from `warn` → `error`. **These numbers are sales-facing** — SEO 100 against Wix's 85,
  and mobile load 1s against 10s, were quoted to leadership, so they have to stay true through cutover. Best
  Practices is held down by the HubSpot and LinkedIn integrations: fix it here or stop quoting it.
- Live returning-visitor consent fire-matrix on the real GTM container, cross-browser.
- **Schema-drift CI guard** — fail CI if `payload migrate:create --dry-run` would produce a diff against what is
  on disk. No CI gate runs migrations at all today (P5-30). Add the "schema change → `migrate:create` before
  merge" note to `PAYLOAD_DEVELOPMENT.md`.
- **CI e2e stability** — the Playwright job races the dev-server schema push (`relation … does not exist` →
  cascade). Push once before the webServer and test process, or have the test process reuse the schema.
- **Spec 003 US7** — verify `enforceDraftWhenScheduled` is wired on every draftable collection with
  `publishedAt` and ship the integration test. The cron trigger stays deliberately deferred.

**GTM external config** (GTM-UI work, not code)

- **US1/US2 tail** — build the LinkedIn Insight Tag + Google Ads conversion tag in container `GTM-54KBJ2Z3`
  (require `ad_storage`, fire on Page View + `hubspotConsentUpdate`), deploy, run the Accept/Deny/Customize
  fire-matrix, then export → commit `infra/gtm/container.json` and confirm zero drift.
- **Deferred until their content ships** — the 8 Meta browser pixels are staged without triggers; bind each to
  its per-market path trigger when those routes exist (INTEGRATIONS §2.3).
- **Deferred** — CAPI consent enforcement at source, and `booking_complete` live emission (BOOK-1).

**Infrastructure** _(the Fargate migration is owned by the infra engineer — reconcile docs after, don't port)_

- **RDS multi-AZ flip** before public launch. Small CDK change, required for the 99.9% SLA to be achievable
  (AWS SLAs single-AZ RDS at 99.5%).
- **Production network posture** — tasks on private subnets with NAT or VPC endpoints, and production-shape
  sizing. Bundle with the multi-AZ flip into one change window. Re-derive against the current stack.
- **Force a new service deployment AFTER the Edge stack deploys.** On a fresh environment Compute comes up
  before Edge, so first-boot tasks never see the Edge-owned `cloudfront_distribution_id` SSM param and every
  invalidation silently skips. Verify after: a media delete produces an entry in
  `aws cloudfront list-invalidations`.
- **Snapshot the lane before merging** — merging is what deploys, and the container's `CMD` runs
  `payload migrate` on start. `INFRASTRUCTURE_RUNBOOK.md` §2.9.
- DNS cutover in a low-traffic window (Dom).
- Post-cutover: submit the sitemap to Search Console and verify redirects, validate CloudFront cache behavior,
  test-restore an RDS snapshot, run a full redirect crawl, watch CloudWatch and Search Console for regressions.

---

## P4 — After the cutover

Real work, none of it blocking a launch. Ordered by expected return.

- **SEC-1 — security / compliance page.** The one addition with a measured commercial gate behind it. G2
  (n=1,002): 83% of companies require a security or privacy assessment to purchase (88% enterprise), and 39%
  overall / 50% of enterprise name IT security review as their biggest source of evaluation delay. We have no
  such page.
- **INERT-1 residual — un-hide `industries` and `locations` metadata.** Their `description`, `seo.*` and
  related fields are `admin.hidden` because no detail route consumes them. Un-hide each group in the same
  change that ships the route reading it. `admin.hidden` does not touch REST, so the seeder still writes them.
- **Regional landing pages (4) + a careers stub.** `/tulsa-consulting`, `/okc-consulting`,
  `/northwest-arkansas-consulting`, `/kansas-city-consulting` are parked on `/localshoring`. Each wants
  market-specific copy, proof and contact (`CONTENT_NEEDS.md` §9). Careers: one "if you want to join us" page
  at most — the old Wix job listings are not coming across.
- **F-6 — AICO baseline.** `llms.txt` + `llms-full.txt` routes, `.md` alternatives for content pages,
  differentiated `robots.txt` per AI crawler, CloudFront cache rules for crawler traffic, byline and
  last-updated metadata. Spec: `ARCHITECTURE.md` §14 + `CONTENT-REQUIREMENTS.md` §8. Partly content-gated.
- **Campaign content expansion.** 3–5 supporting blog posts for the AI workshop push; a lead magnet; 4–6 more
  case studies in batches, each with real outcomes and a testimonial. The workshop and case-study pages should
  also read as self-contained campaign landing pages — a cold visitor from an ad needs full context and a clear
  CTA without the rest of the site. New posts get solicited from technical staff and written by the people who
  did the work, not generated.
- **Deeper SEO** — per-page OG images and structured data beyond the spec-004 baseline (`BreadcrumbList`
  JSON-LD; a `primaryGroup` on services if a breadcrumb ever needs one parent).
- **Portfolio-readiness polish.** A live link + screenshots in `README.md`; a note framing the engineering depth
  as deliberate; replace the `(record.layout ?? []) as never` casts in the block-rendered detail routes with a
  typed `BlockLike[]` adapter.
- **CI Actions cost.** The remaining per-run cost is the ~11-minute Playwright + axe + Lighthouse job — gate it
  behind ready-for-review PRs so draft pushes skip it. (The org Actions spending limit was hit 2026-06-16; taking the repo public resolved it, since Actions are free there.)
- **Small stuff.** Backfill the `ws` / `happy-dom` `_overridesNotes` entries (issue #75); decide autoplay vs
  manual-only if a testimonial carousel is ever built.

---

## Waiting on people

`CONTENT_NEEDS.md` is the authoritative list — hand _that_ to Hank, Justin and Megan, not this file.

| Item                            | Owner        | State                                                                                                                                               |
| ------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-3 Hank + Brent interview copy | Kenn         | Filmed and in edit. Extraction from the transcript, not a scheduling gate — draft off the raw audio, don't wait for the cut.                        |
| BR-7 / C-2 Photo shoot          | Kenn         | Studio headshots exist and are catalogued. Still to shoot at the September All Hands: group leadership, full team, Kenn's headshot.                 |
| C-9 Video delivery + placement  | Kenn + Megan | Localshoring explainer and the Hank + Brent partner videos are in edit. Take delivery, upload to the SEQTEK channel, place as `video-embed` blocks. |
| C-5 Client logo permissions     | Megan + Kenn | Keep: Hogan, BOK, QuickTrip. Drop or refresh: GE, AVB, Change Health. Verify we ever worked with ONEOK / ONE Gas.                                   |
| C-7 Case-study sign-offs        | Kenn + Megan | Taurex (Andrew) first — see P2. Then Hogan (Ryan) and NovaMud (Sam).                                                                                |
| BR-5 A sourced projects count   | Leadership   | Or we ship years + markets only — see P2.                                                                                                           |
| BR-6 Cherokee Nation outreach   | —            | Decided 2026-06-19: no outreach. Listed only because it keeps getting re-asked. Revisit only if the Nation asks.                                    |
| Industry list                   | Brent        | Outstanding. It did not come with the services email. IND-1 runs on the meeting's five plus Aerospace until he confirms.                            |
| PROOF-1 case-study chase        | Megan        | Brent escalates. YCS drafting, YouVersion unanswered, NovaMud needs a redo, Hogan open.                                                             |
| 2026-09-14 go/no-go invite      | Megan        | Add Dana and Trevor.                                                                                                                                |
| Daniel's HubSpot meetings link  | Megan        | For BOOK-1. Portal config, not code.                                                                                                                |
| HS-1 HubSpot portal config      | Megan        | See P2.                                                                                                                                             |
| Written leadership sign-off     | Leadership   | See P3.                                                                                                                                             |
