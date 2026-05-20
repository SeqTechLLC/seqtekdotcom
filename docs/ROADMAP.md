# SEQTEK Website — Roadmap & Status Tracker

**Last updated:** 2026-05-20 (Phase 1 progress — D-1 tokens, base layout, CSP, health endpoint all archived to PROJECT_HISTORY § P1)

> **Convention:** When a Phase 1 implementation item ships, _move_ it out of this file (don't just check it off) and add a `P1-*` row to [`PROJECT_HISTORY.md`](./PROJECT_HISTORY.md). The roadmap stays a short punch list of what's _open_; history carries the audit trail.

**Status:** Phase 1 — implementation

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

---

## 2. Design & engineering open work

| ID   | Task                                                                                                       | Status | Notes                                                                                                                                                                                                                |
| ---- | ---------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DS-1 | TestimonialCarousel — autoplay vs manual-only decision                                                     | 🟡     | Confirm during D-3 wireframe pass; accessibility implications                                                                                                                                                        |
| DS-2 | Homepage hero size — `text-display-xl` (61px) vs `text-display` (49px)                                     | 🟡     | Depends on hero copy draft (CONTENT-REQUIREMENTS §4)                                                                                                                                                                 |
| DS-3 | Lexical rich-text styling — validate `@tailwindcss/typography` matches design system                       | 🟡     | Validate during Phase 1; may need a `prose-seqtek` override class                                                                                                                                                    |
| D-3  | 5 archetype wireframes (Home, About, Service Pillar, Service Detail, Case Study)                           | 🟡     | Excalidraw or Figma; block-order sketches                                                                                                                                                                            |
| D-14 | Google OAuth SSO for `/admin` via `@authsmith/payload-auth-plugin`, restricted to `@seqtechllc.com` domain | 🟡     | Replaces email/password as primary admin auth. Add plugin + `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` to Parameter Store. Update ARCHITECTURE.md §6. Eliminates D-5 dependency. Implement in Phase 1 after Task 1.x. |

---

## 3. Doc fixes

| ID  | Fix                                                                                                                                                                                                                                                 | Status | Notes                                                                                                                                                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-6 | AICO baseline — `llms.txt` + `llms-full.txt` route, `.md` alternatives for content pages, differentiated `robots.txt` per AI crawler, CloudFront cache rules tuned for crawler traffic, byline + last-updated metadata on Insights and Case Studies | 🟡     | Spec lives in ARCHITECTURE.md §14 (crawl mechanics) and CONTENT-REQUIREMENTS.md §8 (citation/schema layer). Implement in Phase 2 alongside structured data. AICO is treated as a sub-discipline of SEO — no new term being coined publicly. |

---

## 4. Implementation phases

Carrying over the structure from ARCHITECTURE.md §11 with refinements from this planning pass.

### Phase 1 — Foundation (1-2 weeks)

Completed items live in [`PROJECT_HISTORY.md` § Phase 1 implementation (P1)](./PROJECT_HISTORY.md). Open items only below.

- [ ] CDK app: VPC, ALB, ASG, RDS, S3, ECR, CloudFront, ACM, Parameter Store, IAM, CloudWatch alarms
- [ ] Dockerfile multi-stage + ECR repository (Dockerfile exists at repo root from D-13; ECR repo creation + push pipeline still open)
- [ ] GitHub Actions CI/CD with blue-green deploys via `cdk diff` on PR and `cdk deploy` on merge
- [ ] HubSpot + GTM in root layout with nonce-aware loading
- [ ] Test pipeline workflow: Vitest + Playwright + axe-core + Lighthouse CI on GitHub Actions (the typecheck/lint workflow already runs — see P1-2)

### Phase 2 — Content models (1 week)

- [ ] All Payload collections per ARCHITECTURE.md §2
- [ ] All globals
- [ ] Block library (`Pages.layout`, inline blocks for richText) per BLOCK_LIBRARY.md
- [ ] Admin panel functional with role-based access
- [ ] Live preview wired up for `posts`, `case-studies`, `pages`, `services`
- [ ] Seed script: `audit/` JSON → Payload (per D-8)
- [ ] Initial admin user creation flow

### Phase 3 — Core pages (2-3 weeks)

- [ ] Homepage
- [ ] About section (4 pages)
- [ ] Services overview + 3 pillars + 15 services
- [ ] Case studies listing + 8 detail pages
- [ ] Contact + booking page

### Phase 4 — Content & blog (1-2 weeks)

- [ ] Blog listing + posts + categories + author pages
- [ ] Touchstone Workshops landing + 3 detail pages
- [ ] Assessment landing page
- [ ] Industry pages (6)
- [ ] Market landing pages (4)

### Phase 5 — Polish (1-2 weeks)

- [ ] SEO: structured data (JSON-LD), dynamic sitemap, meta tags
- [ ] Accessibility audit (axe + manual screen reader pass)
- [ ] Performance optimization until Lighthouse CI passes ARCHITECTURE.md §7 thresholds
- [ ] 301 redirects from old Wix URLs (per INTEGRATIONS.md §9)
- [ ] Cookie consent flow end-to-end test (HubSpot ↔ GTM bridge)
- [ ] CSP promoted from report-only to enforcing
- [ ] Cross-browser/device QA (Chrome, Safari, Firefox; iOS, Android)
- [ ] Error pages (404/500/maintenance)

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
- [ ] **Sign-off captured in writing** — leadership approvals recorded (Google Doc, signed email, or equivalent) so decisions don't get re-litigated post-launch

### Phase 6 — Launch (1 week)

- [ ] DNS cutover (low-traffic window)
- [ ] Monitor errors/performance (CloudWatch + Search Console)
- [ ] Google Search Console: submit sitemap, verify redirects
- [ ] CloudFront cache behavior validation
- [ ] Backup verification (RDS snapshot test restore)
- [ ] Post-launch redirect crawl (Screaming Frog or similar)

---

## 5. Risks to watch

1. **Content production lag.** Engineering can build with placeholder content; launch requires real content. Per CONTENT-REQUIREMENTS §7, this is the bottleneck. Start C-1, C-2, C-3 in week 1.
2. **Bleeding-edge stack.** Next 16 + React 19 + Payload 3.84+. Tailwind v4 was evaluated and rejected during the spike — see ADR `docs/decisions/0001-tailwind-v3.md`. The combo is now validated end-to-end (D-13 ✅); if a future minor-version bump breaks the combo, downgrade Next first (don't downgrade Payload — that's the constraint).
3. **CDK learning curve.** If the engineer hasn't shipped CDK before, add 1-2 weeks to Phase 1.
4. **CSP report-only oversight.** Easy to leave running in report-only past launch and never enforce. Calendar a hard date to flip enforce in Phase 5.
