# SEQTEK Website — Project History

Archive of completed roadmap items, moved out of `ROADMAP.md` once finished. Roadmap stays a short list of what's open; history stays here for traceability. IDs preserved so old commits and cross-references still resolve.

Entries are listed roughly in completion order within each section.

---

## Research (R)

| ID  | Task                                                                                     | Output                                                               | Closed  |
| --- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------- |
| R-1 | Hinge Research Institute studies on professional services branding and "Visible Experts" | Synthesized in `BRAND_STRATEGY_RESEARCH.md` §2                       | 2026-05 |
| R-2 | Origin-story B2B consulting case studies (5-10 firms with strong narratives)             | Ten-firm table in `BRAND_STRATEGY_RESEARCH.md` §3                    | 2026-05 |
| R-3 | Oklahoma businesses honoring Native heritage in their branding — patterns and tone       | `BRAND_STRATEGY_RESEARCH.md` §4 (with flagged thin-finding caveats)  | 2026-05 |
| R-4 | B2B trust signal research for professional services sites                                | `BRAND_STRATEGY_RESEARCH.md` §5 — consolidated citations             | 2026-05 |
| R-5 | Edelman Trust Barometer 2024+2025 — B2B sections                                         | Cited within `BRAND_STRATEGY_RESEARCH.md` §5                         | 2026-05 |
| R-6 | Competitor brand audit — 5-8 comparable regional firms                                   | Ten-firm audit + positioning gaps in `BRAND_STRATEGY_RESEARCH.md` §6 | 2026-05 |

---

## Design & engineering (D)

| ID   | Task                                                                                      | Output                                                                                                                                                                                                                                                                                                                                                                                                     | Closed  |
| ---- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| D-1  | Design system extension — type scale, color ramps, spacing, radius, shadow, motion tokens | `docs/DESIGN_SYSTEM.md` — major-third type scale, ramps from brand seeds, AA floor / AAA hero contrast, logo usage rules. Token reference written in v4 `@theme` syntax; v3 `tailwind.config.mjs` translation is a Phase 1 task.                                                                                                                                                                           | 2026-05 |
| D-2  | Component / block inventory                                                               | `docs/BLOCK_LIBRARY.md`                                                                                                                                                                                                                                                                                                                                                                                    | 2026-05 |
| D-4  | ARCHITECTURE.md updates: Testing Strategy + CDK Infrastructure sections                   | §12 (Testing) + §13 (Infrastructure as Code) added                                                                                                                                                                                                                                                                                                                                                         | 2026-05 |
| D-5  | Email/SMTP for Payload (auth + password reset) — SES integration spec                     | New INTEGRATIONS.md §6 Transactional Email (AWS SES) — SDK approach, bounce alarm at 5%, env vars added. **Scope note:** Password-reset use becomes moot once D-14 (Google SSO) ships, but SES is still required for any future transactional email.                                                                                                                                                       | 2026-05 |
| D-6  | CSP rollout mechanism — report endpoint + promote-to-enforce trigger                      | INTEGRATIONS.md §8 Rollout mechanism subsection — `/api/csp-report`, CloudWatch metric filter, 5-item promote checklist                                                                                                                                                                                                                                                                                    | 2026-05 |
| D-7  | S3 → CloudFront origin auth — private bucket + Origin Access Control                      | New "Media Storage — S3 + CloudFront with OAC" subsection added to ARCHITECTURE.md §5                                                                                                                                                                                                                                                                                                                      | 2026-05 |
| D-8  | Migration script field-mapping spec (audit JSON → Payload collections)                    | `docs/CONTENT_MIGRATION.md` — per-collection field mapping, plain-text segmentation strategy, idempotency design                                                                                                                                                                                                                                                                                           | 2026-05 |
| D-9  | Auth/roles workflow — draft/publish/scheduled-publish permissions                         | Permissions matrix + scheduled-publish design added to ARCHITECTURE.md §6                                                                                                                                                                                                                                                                                                                                  | 2026-05 |
| D-10 | GTM consent bridge — implement `__hs_opt_in_consent` trigger                              | INTEGRATIONS.md §2.2 Implementation subsection — bridge `<script>` snippet, `infra/gtm/container.json` versioning, consent reqs on pixel tags                                                                                                                                                                                                                                                              | 2026-05 |
| D-11 | Form submission failure UX (retry/queue/error states)                                     | INTEGRATIONS.md §1.2 Failure handling — state machine, error-class table, dataLayer events, mailto fallback                                                                                                                                                                                                                                                                                                | 2026-05 |
| D-12 | Error pages — 404 + 500 + maintenance mode designs                                        | `docs/ERROR_PAGES.md` — 404, 500, maintenance, slow-request handling with tracking + a11y                                                                                                                                                                                                                                                                                                                  | 2026-05 |
| D-13 | Stack spike: scaffold exact versions and verify build (Phase 1 Task 1.0)                  | Stack validated on `spike/stack-validation`: Next 16.2.3 + React 19.2.4 + Payload 3.84 + Postgres 16 + Tailwind v3.4 + Lexical. Playwright smoke passes against both dev (`:3100`) and a Docker container (`:3200`, 327MB image). Spike-only: `force-dynamic` on the homepage so `docker build` doesn't need DB/secrets — Phase 1 switches to ISR. Pinned versions are now load-bearing in `package.json`. | 2026-05 |

---

## Doc fixes (F)

| ID  | Fix                                                                                                                             | Notes                                                               | Closed  |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------- |
| F-1 | INTEGRATIONS.md §11 (was §10) — remove "Amplify Console" reference; replace with CloudFront + ACM                               | —                                                                   | 2026-05 |
| F-2 | CONTENT-REQUIREMENTS.md — mark Mission/Vision/Values as resolved (in brand kit), note core values still need behavioral rewrite | —                                                                   | 2026-05 |
| F-3 | ARCHITECTURE.md — pin Next/React/Payload/Tailwind versions after D-13 spike                                                     | Key Packages table now shows concrete pins from `package.json`      | 2026-05 |
| F-4 | CSP `frame-src` allowlist — add `meetings.hubspot.com` and `*.hubspotusercontent.com`                                           | Synced across INTEGRATIONS.md §8 (was §7) and ARCHITECTURE.md §6    | 2026-05 |
| F-5 | CONTENT-REQUIREMENTS.md §1.E — bump WCAG citation to 2.2 AA throughout (mixed 2.1/2.2 today)                                    | Audit found the doc was already consistent at 2.2 — no edits needed | 2026-05 |

---

## Branding & narrative (BR)

| ID   | Decision                                     | Output                                                                                                                                                                                                                                                                                                                                                                | Closed     |
| ---- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| BR-1 | Sequoyah heritage in brand narrative         | Lean-in / layered approach accepted. Decision and Touchstone connection captured in `docs/decisions/0003-sequoyah-brand-narrative.md`; full research case in `BRAND_STRATEGY_RESEARCH.md` §1, §3, §4, §7. SEQTEK stays the surface mark; homepage carries one depth sentence; `/about/our-story` carries the full narrative + cultural-acknowledgement line.          | 2026-05-20 |
| BR-2 | Body font — Avenir (paid) vs free substitute | **Nunito Sans** selected as the open-source Avenir analogue (humanist warmth, similar terminals, SIL OFL licensed, self-hostable). Applied to `docs/DESIGN_SYSTEM.md` §3 and §14 token reference. Avenir Book retained for print materials per the brand kit.                                                                                                         | 2026-05-20 |
| BR-3 | Canonical physical address                   | **12 N Cheyenne Ave., Tulsa, OK 74103** (phone 918-493-7200). Current footer / contact / `/our-services` / `/workshops` address is canonical; the privacy policy's "201 E Hobson Ave, Sapulpa, OK 74066" body text is stale and must be corrected when the privacy policy is migrated into Payload. Flag for editor follow-up at import time per `CONTENT_MIGRATION`. | 2026-05-20 |

---

## Notes on what is NOT here

- **Implementation phase progress** (Phase 1 checklist line items like the gitleaks hook, CI workflow) lives in `ROADMAP.md` until the phase fully closes, then moves here as one phase-level entry. Per-task churn inside an active phase stays in the roadmap so it's visible.
- **ADRs** (`docs/decisions/`) are their own append-only log — they don't need a copy here. Reference them by number when relevant.
