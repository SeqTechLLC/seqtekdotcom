# SEQTEK Website — Roadmap & Status Tracker

**Last updated:** 2026-05-14
**Status:** Pre-implementation planning

Single source of truth for what's open, what's blocked, what's next on the website rebuild. Keep current. When something moves status, edit this file in the same commit.

## Status legend

- 🔴 **Blocked** — waiting on a person or external dependency
- 🟡 **Open** — defined, not started
- 🟢 **In progress**
- ✅ **Done**

---

## 1. Open decisions (waiting on humans)

### Branding & narrative

| ID | Decision | Status | Owner | Notes |
|---|---|---|---|---|
| BR-1 | Sequoyah heritage in brand narrative — keep, drop, or layered approach | 🔴 | Leadership | Recommended: SEQTEK as mark (surface), Sequoyah as story depth (`/about/our-story`, Touchstone). See R-1/R-2/R-3 research. |
| BR-2 | Body font — Avenir (paid) vs free substitute for web | 🔴 | Marketing | Avenir is paid; can't ship in a public repo. Recommend DM Sans, Inter, or Nunito Sans for web; reserve Avenir for print. |
| BR-3 | Canonical physical address — Sapulpa (brand kit) vs Tulsa (content doc) | 🔴 | Operations | Affects footer, contact page, `LocalBusiness` structured data. |
| BR-4 | Core values — rewrite from aspirational to behavioral (per Lencioni) | 🟡 | Content lead | Brand kit values are aspirational ("Be excellent in everything we do"). Not launch-blocking; do before About pages publish. |
| BR-5 | Canonical company stats (years/projects/lives) — pick one set | 🔴 | Leadership | Current site has two conflicting sets. Blocks any stats-bar content. |
| BR-6 | Cherokee Nation courtesy outreach (optional) | 🟡 | Leadership | Depends on BR-1. Not required — Sequoyah is a public historical figure and Oklahoma is full of institutions named after him. Nice-to-have goodwill gesture; could yield a positive PR story if leadership chooses. Not a launch gate. |
| BR-7 | Photo shoot scope — leadership only, or leadership + extended team (6-8) | 🟡 | Leadership | Affects team page design. Recommend extended team per Hinge research. |

### Content collection (long lead time — start now)

| ID | Item | Status | Owner |
|---|---|---|---|
| C-1 | Testimonial re-collection with full attribution (target 12-15) | 🟡 | Content lead |
| C-2 | Professional photo shoot (headshots + candids + office) | 🟡 | Content lead |
| C-3 | Leadership interviews (Hank, Dana, Brent) — bios + story + timeline | 🟡 | Content lead |
| C-4 | Founder video — Hank tells origin story (3-5 min, professionally shot) | 🟡 | Content lead |
| C-5 | Client logo permission verification | 🟡 | Content lead |

---

## 2. Research tasks

| ID | Task | Owner | Output |
|---|---|---|---|
| R-1 | Hinge Research Institute studies on professional services branding and "Visible Experts" | TBD | Brief: which differentiators drive lead quality |
| R-2 | Origin-story B2B consulting case studies (5-10 firms with strong narratives) | TBD | Comparable patterns and what worked |
| R-3 | Oklahoma businesses honoring Native heritage in their branding — patterns and tone | TBD | Reference set: how comparable Oklahoma firms have handled this well |
| R-4 | B2B trust signal research for professional services sites | TBD | Synthesis informing design system + content decisions |
| R-5 | Edelman Trust Barometer 2024+2025 — B2B sections | TBD | Citation-ready stats for leadership presentation |
| R-6 | Competitor brand audit — 5-8 comparable regional firms | TBD | Differentiation gap analysis |

---

## 3. Design & engineering open work

| ID | Task | Status | Output |
|---|---|---|---|
| D-1 | Design system extension — type scale, color ramps, spacing, radius, shadow, motion tokens | 🟡 | `docs/DESIGN_SYSTEM.md` with Tailwind v4 `@theme` block |
| D-2 | Component / block inventory | ✅ | `docs/BLOCK_LIBRARY.md` |
| D-3 | 5 archetype wireframes (Home, About, Service Pillar, Service Detail, Case Study) | 🟡 | Excalidraw or Figma; block-order sketches |
| D-4 | ARCHITECTURE.md updates: Testing Strategy + CDK Infrastructure sections | 🟡 | New §12 (Testing), §13 (Infrastructure as Code) |
| D-5 | Email/SMTP for Payload (auth + password reset) — SES integration spec | 🟡 | Add to INTEGRATIONS.md |
| D-6 | CSP rollout mechanism — report endpoint + promote-to-enforce trigger | 🟡 | Spec in INTEGRATIONS.md |
| D-7 | S3 → CloudFront origin auth — recommend private bucket + Origin Access Control | 🟡 | Update ARCHITECTURE.md §5 |
| D-8 | Migration script field-mapping spec (audit JSON → Payload collections) | 🟡 | New `docs/CONTENT_MIGRATION.md` |
| D-9 | Auth/roles workflow — draft/publish/scheduled-publish permissions | 🟡 | Update ARCHITECTURE.md §6 |
| D-10 | GTM consent bridge — implement `__hs_opt_in_consent` trigger | 🟡 | GTM container JSON + INTEGRATIONS.md detail |
| D-11 | Form submission failure UX (retry/queue/error states) | 🟡 | Add to INTEGRATIONS.md §1.2 |
| D-12 | Error pages — 404 + 500 + maintenance mode designs | 🟡 | Wireframe + copy |
| D-13 | Stack spike: scaffold exact versions and verify build (Phase 1 Task 1.0) | 🟡 | Pinned `package.json` + working hello-world commit |

---

## 4. Doc fixes

| ID | Fix | Status |
|---|---|---|
| F-1 | INTEGRATIONS.md §10 — remove "Amplify Console" reference; replace with CloudFront + ACM | 🟡 |
| F-2 | CONTENT-REQUIREMENTS.md — mark Mission/Vision/Values as resolved (in brand kit), note core values still need behavioral rewrite | 🟡 |
| F-3 | ARCHITECTURE.md — pin Next/React/Payload/Tailwind versions after D-13 spike | 🟡 |
| F-4 | INTEGRATIONS.md — CSP `frame-src` allowlist must include `meetings.hubspot.com` and `*.hubspotusercontent.com` | 🟡 |
| F-5 | CONTENT-REQUIREMENTS.md §1.E — bump WCAG citation to 2.2 AA throughout (mixed 2.1/2.2 today) | 🟡 |

---

## 5. Implementation phases

Carrying over the structure from ARCHITECTURE.md §11 with refinements from this planning pass.

### Phase 1 — Foundation (1-2 weeks)

- [ ] **Task 1.0 (gates everything):** Stack spike. Scaffold Next 16 + Payload 3.84+ + Postgres + Tailwind v4 + Lexical + S3 fallback. Verify Docker standalone build. Pin all versions. → D-13
- [ ] Next.js + Payload + Tailwind scaffold from spike
- [ ] CDK app: VPC, ALB, ASG, RDS, S3, ECR, CloudFront, ACM, Parameter Store, IAM, CloudWatch alarms
- [ ] Dockerfile multi-stage + ECR repository
- [ ] GitHub Actions CI/CD with blue-green deploys via `cdk diff` on PR and `cdk deploy` on merge
- [ ] Base layout components (Header, Footer, Navigation, MobileNav)
- [ ] CSP middleware in report-only mode + report endpoint
- [ ] HubSpot + GTM in root layout with nonce-aware loading
- [ ] Health endpoint + CloudWatch alarms wired up
- [ ] Testing scaffold: Vitest, Playwright, axe-core, Lighthouse CI in GitHub Actions
- [ ] gitleaks pre-commit hook + CI check
- [ ] Apply design tokens from D-1 to Tailwind config

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
- [ ] 301 redirects from old Wix URLs (per INTEGRATIONS.md §8)
- [ ] Cookie consent flow end-to-end test (HubSpot ↔ GTM bridge)
- [ ] CSP promoted from report-only to enforcing
- [ ] Cross-browser/device QA (Chrome, Safari, Firefox; iOS, Android)
- [ ] Error pages (404/500/maintenance)

### Phase 6 — Launch (1 week)

- [ ] DNS cutover (low-traffic window)
- [ ] Monitor errors/performance (CloudWatch + Search Console)
- [ ] Google Search Console: submit sitemap, verify redirects
- [ ] CloudFront cache behavior validation
- [ ] Backup verification (RDS snapshot test restore)
- [ ] Post-launch redirect crawl (Screaming Frog or similar)

---

## 6. Risks to watch

1. **Content production lag.** Engineering can build with placeholder content; launch requires real content. Per CONTENT-REQUIREMENTS §7, this is the bottleneck. Start C-1, C-2, C-3 in week 1.
2. **Sequoyah decision deadlock (BR-1).** Affects About pages, homepage hero, brand tone, design system illustrations. Block on a *written* decision from leadership, not consensus.
3. **Bleeding-edge stack.** Next 16 + React 19 + Payload 3.84+ + Tailwind v4. Verify in Phase 1 Task 1.0 before committing. If any combo is broken, downgrade Next or Tailwind first (don't downgrade Payload — that's the constraint).
4. **CDK learning curve.** If the engineer hasn't shipped CDK before, add 1-2 weeks to Phase 1.
5. **Font licensing surprise.** Resolve BR-2 before Phase 1 styling work or every component restyles when the font swaps.
6. **CSP report-only oversight.** Easy to leave running in report-only past launch and never enforce. Calendar a hard date to flip enforce in Phase 5.
