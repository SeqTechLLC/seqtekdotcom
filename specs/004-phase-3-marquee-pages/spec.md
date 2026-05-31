# Feature Specification: Phase 3 — Public Render Foundation + Marquee Pages

**Feature Branch**: `004-phase-3-marquee-pages`

**Created**: 2026-05-31

**Status**: Stub — fill in via `/speckit-specify` / `/speckit-plan` / `/speckit-tasks` before implementation

**Input**: User strategic pivot 2026-05-31 — "Let's make a site that looks like a company we'd want to hire. With real people. We have a whole marketing campaign we need to publish on seqtek's AI strategy and workshop. Freeze the seed work and pivot to marquee pages. Tech first then content."

## Background

Spec 003 (Phase 2) shipped a comprehensive content infrastructure: 13 collections + 3 globals, 32 layout blocks + 8 inline blocks with full React renderers in `src/components/sections/`, live preview wiring, audit-seed pipeline, access matrix. What it did **not** ship was the public-facing route layer: `src/app/(frontend)/page.tsx` is still the spike-era "No page yet" placeholder, and there are no Payload-driven templates for `/case-studies/[slug]`, `/insights/[slug]`, `/services/*`, `/team`, `/touchstone-workshops/*`, etc.

Spec 004 closes that gap **and** ships the first round of marquee content on top of it. The strategic decision (recorded in ROADMAP §4 and `CLAUDE.md` Current phase) is that the rebuild's value isn't "faster Wix" — it's a site that demonstrates the level of craft SEQTEK sells. That requires high-leverage marquee pages, not pixel-perfect parity with every existing Wix page.

## Strategic constraints

- **Tech first, then content** (Kenn 2026-05-31). Engineer-side route wiring lands first so the content team has real templates to author against. Content lead doesn't sit blocked waiting for engineers.
- **Marquee pages, not faithful Wix replica**. Spec scope is the small set of pages that move the needle for a tech consulting firm's website: homepage, flagship case study, team, localshoring, Touchstone AI workshop. Long-tail content (industry pages, market landing pages, every existing case study) is out of scope here — they land incrementally in Phase 4 or post-launch.
- **Audit seed is frozen** (P2-4). The pipeline stays as a one-shot migration tool + 301-redirect-map source. Imported content lands as drafts only; no automated publish from the seed.
- **Real people, real content.** Team page uses real photos (we have them in `~/projects/seqtek-internal/photos/`, bulk ingest via C-8 once US6 ships the S3 plugin). Case studies get de-genericized — named clients where possible, real outcome numbers, real testimonial quotes.

## User Scenarios & Testing _(to be expanded)_

### User Story 1 — Visitor lands on the homepage and sees a credible consulting firm (Priority: P1)

A prospective client visits `seqtek-preview.com` for the first time. The homepage tells them in 5 seconds who SEQTEK is, what they do, who they've done it for, and what to do next. Above the fold: a clear value-proposition headline, supporting subhead, primary CTA. Below: social proof (stats / logos / featured case study), the Touchstone AI workshop hook (the active campaign), and a secondary CTA.

**Why this priority**: The homepage is the single highest-leverage URL. Until it loads from Payload and renders real content, nothing else matters.

**Acceptance** (to expand): `GET /` returns 200 with a Payload-rendered page (no "No page yet" fallback). All blocks in the homepage global render to their `src/components/sections/` components. Live preview from the admin produces a matching draft view.

### User Story 2 — Editor publishes one flagship case study with real client content (Priority: P1)

A SEQTEK editor (or Kenn) takes the strongest current case study, rewrites it specifically (named client where contractually possible, real outcome numbers, real testimonial quote, client headshot), and publishes it through the existing `caseStudies` collection. The page renders at `/case-studies/[slug]` via a new template that consumes Payload data through `RenderBlocks`.

**Why this priority**: One great case study beats eight generic ones. This is the proof-of-craft pattern every subsequent case study will follow.

### User Story 3 — Visitor browses the team page and sees real people (Priority: P1)

`/team` lists current SEQTEK team members with real photos, role titles, brief bios, market assignments (Tulsa / OKC / NW Ark / KC). Uses the existing `teamMembers` collection + `TeamGrid` block.

**Why this priority**: Humanizes the firm. Per Hinge research, visible team pages are one of the strongest conversion levers for professional services firms.

**Prereq**: Spec 003 US6 (media via S3 plugin) must ship first so uploaded photos persist beyond the next ASG instance refresh. Bulk photo ingest C-8 runs after that.

### User Story 4 — Visitor hits the Touchstone AI workshop campaign landing page (Priority: P1)

`/touchstone-workshops/ai-strategy` (or similar) renders the active marketing campaign — workshop description, agenda, who-it's-for, registration CTA. Supporting blog posts at `/insights/*` link to this page. A lead-magnet download (form via HubSpot) captures interest.

**Why this priority**: This is the _active_ campaign, not a future hypothetical. Workshop revenue + brand authority both depend on this funnel existing.

### User Story 5 — Visitor reads the localshoring narrative and understands the differentiator (Priority: P2)

A `/about/localshoring` page that explains the localshoring model in SEQTEK's voice: what it is, why it's different from nearshore / offshore, what the buyer gets. Rewrite of existing audit content, not from scratch.

**Why this priority**: This is SEQTEK's actual positioning differentiator vs. competitors. Doesn't strictly block launch but the homepage hero copy depends on this story landing somewhere coherent.

## In scope

- Public route handlers for: homepage, generic `/[slug]` for `pages`, collection detail routes (`/case-studies/[slug]`, `/insights/[slug]`, `/services/[pillar]/[slug]`, `/touchstone-workshops/[slug]`), collection listing routes
- 404 / 500 / maintenance pages per `docs/ERROR_PAGES.md`
- 301 redirect map from old Wix slugs (sourced from the spec 003 seed pipeline's `slug-rewrite-map.json`)
- The marquee-page content above (homepage, one flagship case study, team, AI workshop, localshoring)
- Open Graph + JSON-LD structured data for the marquee pages (deeper structured-data work is Phase 5)

## Out of scope

- Long-tail content (industry pages × 6, market landing pages × 4, remaining 6-7 case studies, services × 15). Phase 4 or post-launch.
- Authenticated admin features — spec 003 covered those.
- SEO performance tuning to launch thresholds — Phase 5 polish.
- CSP enforce / cookie-consent end-to-end / cross-browser QA — Phase 5 polish.
- Production DNS cutover — Phase 6.

## Dependencies

- **Spec 003 US6 (media S3 plugin)** — must ship before bulk photo ingest C-8 and before any content team upload work. Half-day wrap-up PR.
- **Brand strategy decisions** (`BR-4`, `BR-5`, `BR-7`) — homepage hero copy depends on Sequoyah brand story decisions; bios depend on photo shoot completion. Kenn confirmed "high political capital right now" 2026-05-31 — content lead can push on these in parallel with engineer-side template work.
- **Block library + renderers** (P2-1) — already shipped. All 32 layout blocks have React renderers; the dispatcher (`RenderBlocks.tsx` + `registry.ts`) is wired. Spec 004 consumes this, doesn't extend it (unless a marquee-page need surfaces a block gap).

## Open questions for `/speckit-specify` / `/speckit-clarify`

- Which case study is the flagship for US2? Depends on client logo permissions (C-5) and testimonial availability (C-1).
- Does the homepage drive from the `homepage` global, from a `pages` doc with slug `home`, or both with global taking precedence? Current code in `(frontend)/page.tsx` queries `pages` for slug `home` — needs reconciliation with the `homepage` global from spec 003.
- ISR vs. SSR for the marquee pages — `force-dynamic` is the spike-era pattern; spec 004 should formalize the caching strategy per page type. Reference: ARCHITECTURE.md §11.
- Lead magnet for the AI workshop campaign — what's the actual asset? Assessment, framework brief, one-pager? Decide with content lead.
