# SEQTEK Website — Roadmap & Status Tracker

**Last updated:** 2026-06-11 (**Spec 009 (2026-06-11):** media now served from CloudFront `/media/*` with correct `serverURL` — the staging media-breakage fix (ADR 0008, Accepted) shipped in **PRs #43/#44** and is archived as **P5-6**: `media/<filename>` keys, `generateFileURL` edge URLs, `next_public_site_url` + `cloudfront_distribution_id` SSM params, FR-011 replace/delete invalidation hooks (the distribution's **first-ever** invalidation — the R-03 page-invalidation path had silently skipped since launch), and the in-place 233-object staging re-key. Verified live: `/team` 12/12, edge cache hits, zero localhost URLs. Prod inherits at Phase 6 by config; the Edge-deploy→instance-refresh ordering is on the Phase 6 checklist. Earlier: Phase 2 closed — spec 003 US1–US7 + media (S3) shipped through PR #19; staging healthy on PG 18.3. **Phase 3 split (2026-06-01):** spec 004's _engineering_ scope — the public render foundation + all five marquee page _templates_ — shipped in **PR #21** (cached readers + ISR tag-parity per ADR 0005, error/maintenance pages, 301 redirect map, metadata/JSON-LD, dynamic sitemap; 47/47 tasks, 443/443 int tests). Spec 004 acceptance was **template-scope** per its 2026-06-01 clarifications, so the spec is _done_, not blocked. The marquee _content_ is carved out to a content-lead-gated track (C-1/C-3/C-7/C-8) — templates are live and waiting on copy/photos, not on engineers. **Spec 008 (2026-06-06):** the GTM code/doc track — the single `pushDataLayer` emitter + `cta_click`/`case_study_view` conversion signals + CAPI decision — shipped in **PR #31** (P5-2); only the external GTM-UI/staging config tail + named deferrals remain open. Next: deferred-tech follow-ups + Phase 5 polish. **Reconcile (2026-06-08):** specs 005/006 + the case-study importer + the PR #21 review follow-ups (shipped earlier in PRs #23–#27) backfilled to `PROJECT_HISTORY` as P3-2 / P5-3 / P5-4 / P5-5, and their stale "open" bullets pruned below.)

> **Convention:** When a Phase implementation item ships, _move_ it out of this file (don't just check it off) and add a `P{N}-*` row to [`PROJECT_HISTORY.md`](./PROJECT_HISTORY.md). The roadmap stays a short punch list of what's _open_; history carries the audit trail.

**Status:** Phase 3 render foundation (spec 004) shipped (PR #21) and closed; marquee _content_ deferred to the content track (content-lead-gated). Spec 008 GTM code/doc track shipped (PR #31, P5-2) — external GTM-UI/staging config tail remains. Spec 009 media-via-CloudFront fix shipped and verified on staging (PRs #43/#44, P5-6) — media is edge-served end-to-end; no in-repo residual. Active engineering: deferred-tech follow-ups + Phase 5 polish.

Single source of truth for what's open, what's blocked, what's next on the website rebuild. Keep current. When something moves status, edit this file in the same commit. Completed items are archived in [`PROJECT_HISTORY.md`](./PROJECT_HISTORY.md) so this file stays focused on active work.

## Status legend

- 🔴 **Blocked** — waiting on a person or external dependency
- 🟡 **Open** — defined, not started
- 🟢 **In progress**
- ✅ **Done** (moved to `PROJECT_HISTORY.md`)

---

## 1. Open decisions (waiting on humans)

### Branding & narrative

_BR-1, BR-2, BR-3 resolved on 2026-05-20 — see `PROJECT_HISTORY.md`. Items remaining:_

| ID   | Decision                                              | Status | Owner        | Notes                                                                                                                                                                                                                                                                                                                                                                                       |
| ---- | ----------------------------------------------------- | ------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-4 | Core values — behavioral + marketing-friendly rewrite | 🟢     | Content lead | Pattern / anti-pattern rewrite for all 7 values in `docs/VALUES_REWRITE.md` (2026-05-20), ordered for marketing arc (Trust → Respect), keyed against brand-kit verbatim. Kenn-approved as dev placeholder. Leadership sign-off deferred to Phase 5.5 launch readiness review (per `project_internal_dynamics.md`). Voice pass + page integration spec are the only pre-launch active items. |
| BR-5 | Canonical company stats (years / projects / lives)    | 🟢     | Leadership   | Years resolved: **25+** (founded 1999, per leadership 2026-05-20). Projects and lives-touched counts remain placeholder; Kenn following up on canonical numbers. Migration script keeps source-of-truth flags on both stat sets until projects/lives close.                                                                                                                                 |
| BR-6 | Cherokee Nation courtesy outreach (optional)          | 🟡     | Leadership   | Deferred to pre-launch. Sequoyah is a public historical figure honored across Oklahoma without controversy; outreach is a goodwill gesture, not a permission gate. Reasoning recorded in ADR 0003. Decision happens at Phase 5.5 launch readiness review.                                                                                                                                   |
| BR-7 | Photo shoot scope — leadership + extended team        | 🟢     | Kenn         | Kenn coordinating: image library access in progress; managing-partner + leadership headshots still to schedule. Extended team coverage per Hinge research (firms with visible team pages convert better). Ties into long-lead content item C-2.                                                                                                                                             |

### Content collection (long lead time — start now)

| ID  | Item                                                                                                                                                                                               | Status | Owner        |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------ |
| C-1 | Testimonial re-collection with full attribution (target 12-15)                                                                                                                                     | 🟡     | Content lead |
| C-2 | Professional photo shoot (headshots + candids + office)                                                                                                                                            | 🟡     | Content lead |
| C-3 | Leadership interviews (Hank, Dana, Brent) — bios + story + timeline                                                                                                                                | 🟡     | Content lead |
| C-4 | Founder video — Hank tells origin story (3-5 min, professionally shot)                                                                                                                             | 🟡     | Content lead |
| C-5 | Client logo permission verification                                                                                                                                                                | 🟡     | Content lead |
| C-6 | Blog post bodies — not in audit (only titles + dates + truncated excerpts). Decide: re-crawl current Wix site for full bodies, re-write from scratch, or import as stubs and rewrite during Tier 3 | 🟡     | Content lead |
| C-7 | Case study hero images, testimonials, and metrics arrays — all missing from audit; every imported case study needs editor follow-up before publish                                                 | 🟡     | Content lead |
| C-8 | Ingest existing photo library (~915 images, 7.4 GB at `../photos`) into Media collection — HEIC→WebP conversion, downscale of >25 MB originals, batch upload script, cap revisit                   | 🟡     | Kenn         |

---

## 2. Design & engineering open work

| ID   | Task                                                                                 | Status | Notes                                                                                                                                                                                                                                       |
| ---- | ------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DS-1 | TestimonialCarousel — autoplay vs manual-only decision                               | 🟡     | Confirm during D-3 wireframe pass; accessibility implications                                                                                                                                                                               |
| DS-2 | Homepage hero size — `text-display-xl` (61px) vs `text-display` (49px)               | 🟡     | Depends on hero copy draft (CONTENT-REQUIREMENTS §4)                                                                                                                                                                                        |
| DS-3 | Lexical rich-text styling — validate `@tailwindcss/typography` matches design system | 🟡     | Validate during Phase 1; may need a `prose-seqtek` override class                                                                                                                                                                           |
| D-3  | 5 archetype wireframes (Home, About, Service Pillar, Service Detail, Case Study)     | 🟡     | Excalidraw or Figma; block-order sketches                                                                                                                                                                                                   |
| T-1  | Case-study importer — media dedup                                                    | 🟡     | `tools/import-case-study` (PR #27) re-uploads the hero on every re-import, orphaning the previous `media` row. Add hash-based reuse like the audit pipeline (`CONTENT_MIGRATION.md` §8) and optionally prune the superseded hero on update. |

---

## 3. Doc fixes

| ID  | Fix                                                                                                                                                                                                                                                 | Status | Notes                                                                                                                                                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-6 | AICO baseline — `llms.txt` + `llms-full.txt` route, `.md` alternatives for content pages, differentiated `robots.txt` per AI crawler, CloudFront cache rules tuned for crawler traffic, byline + last-updated metadata on Insights and Case Studies | 🟡     | Spec lives in ARCHITECTURE.md §14 (crawl mechanics) and CONTENT-REQUIREMENTS.md §8 (citation/schema layer). Implement in Phase 2 alongside structured data. AICO is treated as a sub-discipline of SEO — no new term being coined publicly. |

---

## 4. Implementation phases

Carrying over the structure from ARCHITECTURE.md §11 with refinements from this planning pass.

### Phase 1 — Foundation (1-2 weeks)

Completed items live in [`PROJECT_HISTORY.md` § Phase 1 implementation (P1)](./PROJECT_HISTORY.md). Phase 1 is closed — every roadmap-level Phase 1 item has shipped. Production cutover to `seqtek.com` (Phase 6) plus the multi-AZ RDS + private-subnet ASG flips (Phase 5.5) carry the remaining infra polish.

### Phase 2 — Content models (spec 003) — closed

All shipped — completed items live in [`PROJECT_HISTORY.md` § Phase 2 implementation (P2)](./PROJECT_HISTORY.md). US1–US5 (PRs #11/#13/#14/#15/#16), DB migration collapse + PG 18 bump (#17), and **US6 (media via S3) + US7 (scheduled-publish wire-up) + Polish (PR #19, P2-7)**. No open carry-over. (The US7 cron trigger `/api/cron/publish-scheduled` stays intentionally deferred — see Phase 5.5; only the Payload-side invariant was in scope.)

### Phase 3 — Public render foundation (spec 004) — closed (engineering)

The pivot, tech half. Spec 004's engineering scope shipped in **PR #21** (2026-06-01): cached Payload readers with ISR tag-parity (ADR 0005), all five marquee page _templates_ (homepage, case studies, team, Touchstone workshops, localshoring) plus the remaining in-scope routes (insights, services pillar/detail, listings), error/maintenance pages, the 301 redirect map, metadata + JSON-LD, and the dynamic sitemap. All 47 spec tasks (T001–T047) done; 443/443 int tests green. Acceptance was **template-scope** per the spec's 2026-06-01 clarifications — templates render against drafted content; the named, published marquee content is a separately-tracked content-lead deliverable. Implementation detail moved to [`PROJECT_HISTORY.md` § Phase 3 implementation (P3)](./PROJECT_HISTORY.md).

> **The split (2026-06-01):** spec 004 is the _engineering_ deliverable and it is done, not blocked — its acceptance was always template-scope. The marquee _content_ is the second half, carved out below into a content-lead-gated track so the engineering spec can close cleanly. Remaining engineering work is content-independent and lives in the Phase 5 "Deferred from spec 004" subsection.

### Phase 3 content — marquee content population (deferred — content-lead-gated, NOT engineering-blocked)

The content half of the original Phase 3. The templates are **live and waiting**; these items are gated on the C-\* content collection items in §1 (copy, photos, testimonials, logo permissions), not on any further engineering. Kenn is tracking down the source content.

- [ ] 🔴 **Homepage content** — hero copy + brand teaser + stats bar + featured case study + workshop CTA. Source: `BRAND_STRATEGY_RESEARCH.md` + `VALUES_REWRITE.md`. Gated on Sequoyah brand story (C-3), hero copy decision (DS-2), canonical stats (BR-5).
- [ ] 🔴 **One flagship case study** — strongest current engagement, rewritten specifically, client headshot + named quote. One great case study beats 8 generic ones. Gated on C-1 / C-5 / C-7.
- [ ] 🔴 **Team page content** — ingest existing photos (C-8), draft 3 leadership + 5-6 team bios (C-3). Humanizes the firm immediately.
- [ ] 🟡 **Localshoring story content** — rewrite from existing audit content (less people-gated than the others; the differentiator narrative vs. nearshore / offshore).
- [ ] 🔴 **Touchstone AI workshop landing content** — workshop description, agenda, registration CTA, supporting post links. The active campaign destination. (Live form wiring is the deferred-tech HubSpot item under Phase 5.)

### Phase 4 — Campaign content expansion (2-3 weeks)

The supporting content for the active AI workshop marketing push, plus filling out the case study library in batches.

- [ ] **3-5 supporting blog posts** for the AI workshop campaign (insights / thought-leadership pieces that map to workshop topics)
- [ ] **Lead magnet** — downloadable resource for the AI campaign (one-pager, assessment, framework brief — TBD with content lead)
- [ ] **Additional case studies (4-6)** — batched, each one specifically rewritten with real outcomes + testimonials (C-1, C-7)
- [ ] **Service pillar pages (3)** — rewrite from existing audit content; less marquee than homepage but core to the buyer journey
- [ ] **Mission/Vision/Values + About landing** — leadership-alignment-dependent (BR-4, BR-5)
- [ ] **Insights blog listing + categories + author pages** (uses `posts` + `teamMembers` + `categories`)

### Phase 5 — Polish (1-2 weeks)

- [ ] SEO: deeper structured data + per-page OG images **→ deferred to spec 008** (per the 2026-06-05 spec-007 clarification; SEO ≥ 0.95 kept only as a regression guard in 007). _Baseline shipped in spec 004 (PR #21): `Organization`/`Article`/`BreadcrumbList` JSON-LD, dynamic sitemap, metadata helper with OG defaults._
- [ ] AICO baseline (F-6) — `llms.txt` + `llms-full.txt`, `.md` alternatives, crawler-aware caching (the `llms-full` body needs published page content — partly content-gated)
- [x] ~~Accessibility audit (axe + manual screen reader pass) on the marquee + campaign pages~~ — **shipped in spec 007 (P5-1):** automated WCAG 2.2 A/AA across the 14-route in-scope set + landmark/heading/keyboard/alt/reduced-motion, SR test script + best-effort pass (`specs/007-launch-hardening-polish/sr-pass.md`). **Residual → Phase 5.5:** the formal _blocking_ screen-reader sign-off across the AT/browser matrix.
- [x] ~~Performance optimization until Lighthouse CI passes ARCHITECTURE.md §7 thresholds~~ — **proven + recorded in spec 007 (P5-1, `perf-results.md`):** a11y 1.00 / SEO 1.00 / CLS 0.000, Performance 0.95–0.96 on tuned routes. **Residual → Phase 5.5:** re-take against CloudFront staging (consent-gated third-party) + flip the `performance`/LCP/TBT/CLS budgets from `warn` → `error`.
- [x] ~~Cookie consent flow end-to-end test (HubSpot ↔ GTM bridge)~~ — **shipped in spec 006 (P5-4):** `consent-flows.e2e` + `privacy-consent-ui.e2e`; the keystone fix moved the HubSpot→GTM bridge onto the official `addPrivacyConsentListener` API. **Residual → gated tail:** live returning-visitor fire-matrix on the real GTM container + cross-browser pass.
- [ ] CSP promoted from report-only to enforcing
- [ ] Cross-browser/device QA (Chrome, Safari, Firefox; iOS, Android)
- [ ] Long-tail content — industry pages (6) and market landing pages (4) per the original Phase 4 list, if leadership/SEO priorities still call for them at this point

**Deferred from spec 004 (Phase 3) — explicitly tracked, not dropped:**

- [x] ~~**Slow-request / hung-request handling** (ERROR_PAGES.md §5)~~ — **shipped in spec 007 (P5-1):** `withReadTimeout` 5s `Promise.race` as the outermost layer of the 16 cached readers → branded `error.tsx` + correlated warn log; `/api/health` exempt by construction (ADR 0007).
- [x] ~~**Live HubSpot Forms API integration** (research §D10)~~ — **shipped in spec 005 (P5-3):** live custom React form engine → `api.hsforms.com`, `idle→submitting→success|error` state machine, `form_submission_*` dataLayer events, CSP-nonce + consent wiring; Workshop Inquiry Form live (native validation — no Zod). **Residual: Contact form go-live** — `/contact` + `ContactForm` are half-wired, gated on the Contact form's own HubSpot GUID (INTEGRATIONS.md §1.2).
- [ ] **CSP enforce, cross-browser/device QA, performance warn→error** — already listed above (Phase 5 / 5.5 gates); spec 004 keeps CSP report-only and Lighthouse Performance at `warn` (a11y/best-practices/SEO gate now). (Cookie-consent E2E shipped in spec 006 / P5-4.)
- [x] ~~**Block-library accent-contrast sweep**~~ — **shipped in spec 007 (P5-1):** per-usage remediation of the remaining ~40 meaning-bearing green-500 accents to the green-700 `accent-strong` family (foreground text, solid fills, blockquote/metric rules, hover borders); navy-surface accents and the decorative `Content` wash left as-is; the `text-accent` naming trap documented in DESIGN_SYSTEM §2.4. axe `color-contrast` is clean across the seeded in-scope routes (inventory: `specs/007-launch-hardening-polish/accent-audit.md`).
      **Spec 008 — GTM pixel activation (code/doc track shipped → P5-2; external-config tail + deferrals open):**

The in-repo code + doc track (US3 conversion-signal surface, US4 CAPI consent decision) shipped in **PR #31** (2026-06-06) and is archived in [`PROJECT_HISTORY.md` § Phase 5 implementation (P5-2)](./PROJECT_HISTORY.md). Remaining open work is **external-config** (GTM-UI / staging, not code) plus the named deferrals:

- [ ] **US1/US2 — external-config tail (🔶 verify, not code)** — build the LinkedIn Insight Tag + Google Ads conversion tag in container `GTM-54KBJ2Z3` (require `ad_storage`, fire on Page View + `hubspotConsentUpdate`), deploy to staging, run the Accept/Deny/Customize fire-matrix (G4, SC-001/002/003/007), then export → commit `infra/gtm/container.json` and confirm zero drift (SC-004). Gated on GTM-UI admin work + a staging deploy.
- [ ] **Deferred — 8 Meta browser pixels' live triggers** — staged in the container without a trigger; bind each to its per-market `/…casestudyworkshop` path trigger when the **content / paid-landing-page track** ships those routes, then re-run G4 for those tags (INTEGRATIONS.md §2.3).
- [ ] **Deferred — CAPI consent enforcement at source** — owners Megan/Domanick confirm whether server-side CAPI continues after the `seqtek.com` cutover; if it does, enforce consent at the CAPI source (off-site). Not an in-repo path (INTEGRATIONS.md §2.3 / research R2).
- [ ] **Deferred — `booking_complete` live emission** — the listener seam (`BookingCompleteSeam`) lights up when the real **HubSpot Meetings embed** replaces the `HubspotMeetings` placeholder (gated with the live-Meetings work, INTEGRATIONS.md §1.4).

### Phase 5.5 — Launch readiness review (1 week)

The content-and-copy gate before DNS cutover. Per `project_internal_dynamics.md`, leadership engages here, not during dev. Precondition: Phase 5 complete; staging fully rendered with final content in place (no lorem ipsum, no `[PLACEHOLDER]` tags); content lead has already done a voice-consistency pass against `BRAND_STRATEGY_RESEARCH.md` §5+§8.

- [ ] **Core values** (`BR-4`) — leadership reads the 7 Pattern / anti-pattern pairs on the rendered `/about/our-values` page; signs off or iterates
- [ ] **Sequoyah acknowledgement** (`BR-1`) — leadership reads the homepage trust-block sentence, the `/about/our-story` narrative, and the cultural-acknowledgement line on the rendered pages; signs off or iterates (suggested copy in ADR 0003)
- [ ] **Stats confirmation** (`BR-5`) — final projects-delivered and lives-touched numbers locked in; "25+ years" already settled
- [ ] **Cherokee Nation courtesy outreach** (`BR-6`) — decision to send or skip; if send, draft notification and route
- [ ] **Faith framing decision** — leadership reviews whether and how the brand-kit faith elements ("biblical principles," "grace and trust") surface on `/about/our-story` (flagged in `docs/VALUES_REWRITE.md` adjacent findings)
- [ ] **Mission, vision, hero copy** pass in context across homepage, About landing, service pillar heroes, case study heroes
- [ ] **Testimonial attribution** (`C-1`) — every quoted testimonial confirmed with named attribution
- [ ] **Leadership bios and headshots** (`C-3`, `BR-7`) — Hank, Dana, Brent (and extended team if scope expanded) approve their own bio copy and photos
- [ ] **Case study copy** (`C-7`) — each of 8 case studies has hero image, named client testimonial, and metrics array; client confirmation where possible
- [ ] **Legal / privacy** — privacy policy uses canonical Cheyenne address (no Sapulpa references anywhere); terms and cookie banner reviewed
- [ ] **RDS multi-AZ flip** _(infra, spec 002)_ — flip production RDS from single-AZ to multi-AZ before public launch. Small CDK property change; required for the SC-010 99.9% post-launch SLA to be mathematically achievable (AWS only SLAs single-AZ RDS at 99.5%). Deferred from spec 002 to keep pre-launch cost down.
- [ ] **ASG flip to private subnets + NAT (or VPC endpoints)** _(infra, spec 002)_ — flip the ASG from public-subnet validation posture to private-subnet production posture. Add NAT Gateway (or VPC endpoints) for outbound. Restore staging sizing from `t3.micro` / `db.t3.micro` / 20GB to spec-shape (`t3.small` / `db.t3.small` / 50GB). Bundle with the multi-AZ RDS flip into a single CFN deploy + change window. Deferred from spec 002 per Clarifications Session 2026-05-26.
- [ ] **Spec 003 US7 — scheduled-publish hook** — verify `enforceDraftWhenScheduled` is wired on every draftable collection with `publishedAt`; ship the integration test. The hook itself shipped in spec 003 foundational (T008); only the wire-up audit + test remain. Cron trigger (`/api/cron/publish-scheduled`) intentionally stays deferred — only the Payload-side invariant is needed today.
- [ ] **Schema-drift CI guard** — fail CI if `payload migrate:create --dry-run` would produce a diff vs. what's on disk. Systemic fix so the schema-vs-code desync that caused the P2-6 migration collapse can't recur. One-line process note in `PAYLOAD_DEVELOPMENT.md` to codify "schema change → `migrate:create` before merge to main."
- [ ] **Sign-off captured in writing** — leadership approvals recorded (Google Doc, signed email, or equivalent) so decisions don't get re-litigated post-launch

### Phase 6 — Launch (1 week)

- [ ] DNS cutover (low-traffic window)
- [ ] **Prod instance refresh AFTER the Edge stack deploys** — on a fresh environment Compute boots before Edge exists, so first-boot instances can never see the Edge-owned `cloudfront_distribution_id` SSM param; without the post-Edge refresh, CloudFront invalidations (page publish + media replace/delete) silently skip — the exact dormancy found on staging (spec 009 / PR #44). Verify post-refresh: a media delete produces an entry in `aws cloudfront list-invalidations`.
- [ ] Monitor errors/performance (CloudWatch + Search Console)
- [ ] Google Search Console: submit sitemap, verify redirects
- [ ] CloudFront cache behavior validation
- [ ] Backup verification (RDS snapshot test restore)
- [ ] Post-launch redirect crawl (Screaming Frog or similar)

---

## 5. Risks to watch

1. **Content production lag.** Engineering can build with placeholder content; launch requires real content. Per CONTENT-REQUIREMENTS §7, this is the bottleneck. Marquee-first pivot (2026-05-31) front-loads the highest-leverage content (homepage + 1 flagship case study + team page + AI workshop + localshoring) and accepts that long-tail content (industry / market / remaining case studies) lands incrementally — possibly post-launch.
2. **Bleeding-edge stack.** Next 16 + React 19 + Payload 3.84+. Tailwind v4 was evaluated and rejected during the spike — see ADR `docs/decisions/0001-tailwind-v3.md`. The combo is now validated end-to-end (D-13 ✅); if a future minor-version bump breaks the combo, downgrade Next first (don't downgrade Payload — that's the constraint). Postgres 18.3 confirmed compatible with `@payloadcms/db-postgres ^3.85` (P2-6).
3. **Schema drift between code and migrations.** Caused the staging 500s on PRs #13/#14/#15 — collections were added to the code without corresponding `payload migrate:create` runs. P2-6 collapsed everything into a single `init`. Phase 5.5 carries a CI guard to prevent recurrence; in the meantime, treat "added a collection or field → ran `migrate:create`" as the merge-to-main checklist line.
4. **CSP report-only oversight.** Easy to leave running in report-only past launch and never enforce. Calendar a hard date to flip enforce in Phase 5.
