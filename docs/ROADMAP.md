# SEQTEK Website — Roadmap & Status Tracker

**Last updated:** 2026-05-20
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

| ID   | Decision                                                                 | Status | Owner        | Notes                                                                                                                                                                                                                                 |
| ---- | ------------------------------------------------------------------------ | ------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-1 | Sequoyah heritage in brand narrative — keep, drop, or layered approach   | 🔴     | Leadership   | Research-backed recommendation in `BRAND_STRATEGY_RESEARCH.md`: SEQTEK as surface mark, Sequoyah as opt-in depth on `/about`, one homepage link, explicit cultural-acknowledgement line. Awaiting leadership sign-off.                |
| BR-2 | Body font — Avenir (paid) vs free substitute for web                     | 🔴     | Marketing    | Avenir is paid; can't ship in a public repo. Recommend DM Sans, Inter, or Nunito Sans for web; reserve Avenir for print.                                                                                                              |
| BR-3 | Canonical physical address — Sapulpa (brand kit) vs Tulsa (content doc)  | 🔴     | Operations   | Affects footer, contact page, `LocalBusiness` structured data. Confirmed in source data: current privacy policy claims Sapulpa in body but Tulsa in footer — inconsistency exists in production today.                                |
| BR-4 | Core values — rewrite from aspirational to behavioral (per Lencioni)     | 🟡     | Content lead | Brand kit values are aspirational ("Be excellent in everything we do"). Not launch-blocking; do before About pages publish.                                                                                                           |
| BR-5 | Canonical company stats (years/projects/lives) — pick one set            | 🔴     | Leadership   | Both stat sets confirmed in source data: homepage `20+`/`411+`/`8221+` vs about `25+`/`500+`/`10,000+`. Migration script imports both verbatim and flags for resolution rather than pre-selecting. Blocks any stats-bar content.      |
| BR-6 | Cherokee Nation courtesy outreach (optional)                             | 🟡     | Leadership   | Depends on BR-1. Not required — Sequoyah is a public historical figure and Oklahoma is full of institutions named after him. Nice-to-have goodwill gesture; could yield a positive PR story if leadership chooses. Not a launch gate. |
| BR-7 | Photo shoot scope — leadership only, or leadership + extended team (6-8) | 🟡     | Leadership   | Affects team page design. Recommend extended team per Hinge research.                                                                                                                                                                 |

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

- [x] **Task 1.0 (gates everything):** Stack spike. Scaffolded Next 16.2.3 + Payload 3.84 + Postgres 16 + Tailwind v3.4 + Lexical, with admin login, Lexical authoring, and public render verified by Playwright against both dev and a Docker container. Versions pinned in `package.json`. → D-13 ✅, S3 fallback deferred to Task 1.x
- [ ] Next.js + Payload + Tailwind scaffold from spike
- [ ] CDK app: VPC, ALB, ASG, RDS, S3, ECR, CloudFront, ACM, Parameter Store, IAM, CloudWatch alarms
- [ ] Dockerfile multi-stage + ECR repository
- [ ] GitHub Actions CI/CD with blue-green deploys via `cdk diff` on PR and `cdk deploy` on merge
- [ ] Base layout components (Header, Footer, Navigation, MobileNav)
- [ ] CSP middleware in report-only mode + report endpoint
- [ ] HubSpot + GTM in root layout with nonce-aware loading
- [ ] Health endpoint + CloudWatch alarms wired up
- [ ] Testing scaffold: Vitest, Playwright, axe-core, Lighthouse CI in GitHub Actions
- [x] gitleaks pre-commit hook + GitHub Actions secret scan job (`gitleaks/gitleaks-action@v2`) on push/PR
- [x] Quality CI workflow (`.github/workflows/ci.yml`): typecheck + lint + format:check on push to any branch + PR to main; lint-staged on pre-commit. Test pipeline (Vitest + Playwright + axe + Lighthouse) still pending — separate workflow tracked at line above
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
- [ ] 301 redirects from old Wix URLs (per INTEGRATIONS.md §9)
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

## 5. Risks to watch

1. **Content production lag.** Engineering can build with placeholder content; launch requires real content. Per CONTENT-REQUIREMENTS §7, this is the bottleneck. Start C-1, C-2, C-3 in week 1.
2. **Sequoyah decision deadlock (BR-1).** Affects About pages, homepage hero, brand tone, design system illustrations. Block on a _written_ decision from leadership, not consensus.
3. **Bleeding-edge stack.** Next 16 + React 19 + Payload 3.84+. Tailwind v4 was evaluated and rejected during the spike — see ADR `docs/decisions/0001-tailwind-v3.md`. The combo is now validated end-to-end (D-13 ✅); if a future minor-version bump breaks the combo, downgrade Next first (don't downgrade Payload — that's the constraint).
4. **CDK learning curve.** If the engineer hasn't shipped CDK before, add 1-2 weeks to Phase 1.
5. **Font licensing surprise.** Resolve BR-2 before Phase 1 styling work or every component restyles when the font swaps.
6. **CSP report-only oversight.** Easy to leave running in report-only past launch and never enforce. Calendar a hard date to flip enforce in Phase 5.
