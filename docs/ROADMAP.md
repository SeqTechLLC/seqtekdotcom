# SEQTEK Website — Roadmap & Status Tracker

**Last updated:** 2026-05-31 (Phase 2 substantially closed — spec 003 US1–US5 shipped (PRs #11/#13/#14/#15/#16), DB migration collapse + Postgres 16 → 18 bump shipped (#17), staging healthy on PG 18.3. US6 — media via S3 plugin — is the only remaining wrap-up item and the prereq for content-team uploads. **Strategic pivot 2026-05-31:** freeze further audit-seed investment; treat the seed pipeline as a one-shot migration tool + 301-redirect-map source, not a publish baseline. Phase 3 retargeted at marquee pages first — homepage wired to Payload, flagship case study, team page, Touchstone AI workshop campaign, localshoring story. Spec 004 opens as the home for the engineering side of that work.)

> **Convention:** When a Phase implementation item ships, _move_ it out of this file (don't just check it off) and add a `P{N}-*` row to [`PROJECT_HISTORY.md`](./PROJECT_HISTORY.md). The roadmap stays a short punch list of what's _open_; history carries the audit trail.

**Status:** Phase 2 wrap-up (003 US6) + Phase 3 (spec 004 — marquee pages) starting

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

| ID   | Task                                                                                 | Status | Notes                                                             |
| ---- | ------------------------------------------------------------------------------------ | ------ | ----------------------------------------------------------------- |
| DS-1 | TestimonialCarousel — autoplay vs manual-only decision                               | 🟡     | Confirm during D-3 wireframe pass; accessibility implications     |
| DS-2 | Homepage hero size — `text-display-xl` (61px) vs `text-display` (49px)               | 🟡     | Depends on hero copy draft (CONTENT-REQUIREMENTS §4)              |
| DS-3 | Lexical rich-text styling — validate `@tailwindcss/typography` matches design system | 🟡     | Validate during Phase 1; may need a `prose-seqtek` override class |
| D-3  | 5 archetype wireframes (Home, About, Service Pillar, Service Detail, Case Study)     | 🟡     | Excalidraw or Figma; block-order sketches                         |

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

### Phase 3 — Public render foundation + marquee pages (spec 004) (3-4 weeks)

The pivot. Tech-first, content-second per Kenn 2026-05-31. Block library is comprehensive; what's missing is the public-render wiring + the marquee-page content. Reference: `specs/004-*/spec.md` once stubbed.

**Tech (engineer-driven, days):**

- [ ] **Homepage template** — replace the spike `(frontend)/page.tsx` placeholder with a Payload-driven template that fetches the `homepage` global and renders its block array through `RenderBlocks`. Highest-traffic URL — proves the loop end-to-end.
- [ ] **Generic `/[slug]` page route** for `pages` collection (about-section pages, etc.) via `RenderBlocks` dispatcher
- [ ] **Collection detail routes** — `/case-studies/[slug]`, `/insights/[slug]`, `/services/[pillar]/[slug]`, `/touchstone-workshops/[slug]`. Same pattern, different fetch.
- [ ] **Collection listing routes** — `/case-studies`, `/insights`, `/services`, `/team`, `/touchstone-workshops`
- [ ] **404 / 500 / maintenance pages** per `docs/ERROR_PAGES.md` (D-12 was the spec; render now lands the pages)
- [ ] **301 redirect map** from old Wix slugs (the seed pipeline produced the source-of-truth mapping; wire it via `next.config.ts` redirects or middleware)

**Marquee content (content-lead-driven, weeks — drives the order):**

- [ ] **Homepage** — hero copy + brand teaser + stats bar + featured case study + workshop CTA. Source: `BRAND_STRATEGY_RESEARCH.md` + `VALUES_REWRITE.md`. Depends on Sequoyah brand story draft (C-3) + hero copy decision (DS-2).
- [ ] **One flagship case study** — pick the strongest current engagement, rewrite specifically (not generically), get client headshot + named quote (C-1, C-7). One great case study beats 8 generic ones.
- [ ] **Team page** — upload existing photos (C-8 once US6 ships), draft 3 leadership bios + 5-6 team bios (C-3). This humanizes the firm immediately.
- [ ] **Localshoring story page** — your differentiator vs. nearshore / offshore. Rewrite from existing.
- [ ] **Touchstone AI workshop landing** — the active marketing campaign destination. Includes workshop description, agenda, registration CTA, supporting blog post links.

### Phase 4 — Campaign content expansion (2-3 weeks)

The supporting content for the active AI workshop marketing push, plus filling out the case study library in batches.

- [ ] **3-5 supporting blog posts** for the AI workshop campaign (insights / thought-leadership pieces that map to workshop topics)
- [ ] **Lead magnet** — downloadable resource for the AI campaign (one-pager, assessment, framework brief — TBD with content lead)
- [ ] **Additional case studies (4-6)** — batched, each one specifically rewritten with real outcomes + testimonials (C-1, C-7)
- [ ] **Service pillar pages (3)** — rewrite from existing audit content; less marquee than homepage but core to the buyer journey
- [ ] **Mission/Vision/Values + About landing** — leadership-alignment-dependent (BR-4, BR-5)
- [ ] **Insights blog listing + categories + author pages** (uses `posts` + `teamMembers` + `categories`)

### Phase 5 — Polish (1-2 weeks)

- [ ] SEO: structured data (JSON-LD), dynamic sitemap, meta tags
- [ ] AICO baseline (F-6) — `llms.txt` + `llms-full.txt`, `.md` alternatives, crawler-aware caching
- [ ] Accessibility audit (axe + manual screen reader pass) on the marquee + campaign pages
- [ ] Performance optimization until Lighthouse CI passes ARCHITECTURE.md §7 thresholds
- [ ] Cookie consent flow end-to-end test (HubSpot ↔ GTM bridge)
- [ ] CSP promoted from report-only to enforcing
- [ ] Cross-browser/device QA (Chrome, Safari, Firefox; iOS, Android)
- [ ] Long-tail content — industry pages (6) and market landing pages (4) per the original Phase 4 list, if leadership/SEO priorities still call for them at this point

**Deferred from spec 004 (Phase 3) — explicitly tracked, not dropped:**

- [ ] **Slow-request / hung-request handling** (ERROR_PAGES.md §5) — the 5s Payload-call `Promise.race` timeout + client-side form timeout. Not load-bearing for marquee render; lands in Phase 5 polish.
- [ ] **Live HubSpot Forms API integration** (research §D10) — spec 004 ships only the Phase-2 placeholder `hubspot-form` block. The live custom React form → `api.hsforms.com`, the Zod submit state machine, GTM `dataLayer` events, and the CSP-nonce + consent wiring are a follow-up, gated on the Workshop Inquiry Form GUID (INTEGRATIONS.md §1.2 "TBD") + lead-magnet asset decision.
- [ ] **CSP enforce, cookie-consent E2E, cross-browser/device QA, performance tuning** — already listed above; spec 004 keeps CSP report-only and Lighthouse Performance budgets at `warn` (a11y/best-practices/SEO gate now).

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
