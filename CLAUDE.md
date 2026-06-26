# SEQTEK Company Website

Rebuild of seqtek.com from Wix → self-hosted Next.js + Payload CMS. Open-source portfolio piece.

## Stack

- Next.js 16 + React 19 (App Router, TypeScript)
- Payload CMS v3.84+ (embedded in Next.js, Postgres-backed)
- PostgreSQL (RDS in prod, Docker Compose locally)
- Tailwind v3 (config-based; v3 chosen over v4 — see `docs/decisions/0001-tailwind-v3.md`)
- AWS: EC2 + ALB + CloudFront, Docker via ECR, blue-green via ASG
- Identity: Google Workspace (`@seqtechllc.com`) via OAuth plugin (ROADMAP D-14, Phase 1 — see `docs/decisions/0002-auth-strategy.md`)

## Source of truth

Defer to these docs before re-deriving anything. Update them when decisions change.

- `docs/ARCHITECTURE.md` — system design, stack rationale, deployment
- `docs/ROADMAP.md` — current status, open decisions, phase tracker
- `docs/PROJECT_HISTORY.md` — archive of completed roadmap items (IDs preserved for traceability)
- `docs/LOCAL_DEVELOPMENT.md` — running locally
- `docs/PAYLOAD_DEVELOPMENT.md` — Payload patterns
- `docs/BLOCK_LIBRARY.md` — block/component inventory
- `docs/DESIGN_SYSTEM.md` — color, type, spacing, motion tokens; logo usage rules
- `docs/BRAND_STRATEGY_RESEARCH.md` — voice, positioning, narrative direction
- `docs/CONTENT-REQUIREMENTS.md` — content needs (incl. SEO/AICO under §8)
- `docs/CONTENT_MIGRATION.md` — Wix audit JSON → Payload migration script spec
- `docs/INTEGRATIONS.md` — HubSpot, GTM, ScoreApp, CSP, SES
- `docs/ERROR_PAGES.md` — 404, 500, maintenance, slow-request handling
- `docs/decisions/` — Architecture Decision Records (ADRs): non-obvious technical choices, options considered, trade-offs accepted, when to revisit. Read `docs/decisions/README.md` first.

## Current phase

Phase 2 (content models, spec 003) is closed — US1–US7 + media (S3) shipped across PRs #11/#13/#14/#15/#16/#17/#19. It leaves behind: 13 collections + 3 globals, the full layout + inline block library with React renderers, live preview, an audit-seed pipeline (frozen at its current shape — see ROADMAP §4), and the access-matrix invariant.

Phase 3 (spec 004) is **split**. Its _engineering_ scope — the public render foundation + all five marquee page _templates_ (homepage, case studies, team, Touchstone workshops, localshoring) — shipped in PR #21 (cached readers + ISR tag-parity per ADR 0005, error/maintenance pages, 301 redirect map, metadata/JSON-LD, dynamic sitemap; 47/47 tasks). Acceptance was template-scope, so the spec is **done, not blocked**. The marquee _content_ (copy, photos, testimonials) is carved out to a content-lead-gated track (ROADMAP §1 C-\* items) — templates are live and waiting on content, not engineers. The audit seed stays a one-shot migration tool + 301-redirect-map source, not a publish baseline. See ROADMAP §4.

Phase 5 ("Polish") is shipping in code-owned slices. **Spec 007 (P5-1)** landed the launch-hardening subset — accent-contrast sweep, full-route a11y audit, slow/hung-read timeouts (ADR 0007), and the perf proof. **Spec 008 (P5-2)** landed the GTM code/doc track in PR #31: a single SSR-safe `pushDataLayer` emitter (`src/lib/analytics/dataLayer.ts`) wiring `cta_click` + `case_study_view` conversion signals, a dormant `booking_complete` seam, the `hubspot/submit.ts` refactor onto that shared emitter, and the CAPI consent decision. Active engineering is content-independent: spec 008's external GTM-UI/staging config tail + named deferrals, the live HubSpot form, the two PR #21 review items, and the remaining Phase 5 / 5.5 launch-readiness gates. See ROADMAP §4 and PROJECT_HISTORY P5-1/P5-2.

Staging runs at `https://seqtek-preview.com` on Postgres 18.3. Production cutover to `seqtek.com` remains deferred to launch readiness.

## Conventions

- **Conventional Commits** — `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `style:`, `perf:`, `ci:`, `build:`. Scope optional, e.g. `feat(payload): ...`.
- **Branches** — `spike/*` for spikes, `feat/*` for features, `fix/*` for fixes. `main` is stable.
- **Public repo** — no secrets committed. `.env.local` only. Pre-commit gitleaks (per Phase 1 plan).
- **TypeScript strict mode**, no `any`. ESLint + Prettier enforced in CI.
- **Tooling and scripts** live in subdirectories, not the repo root.
- **Private SEQTEK assets** (brand kit PDF, trademarked logos, Wix content audit) are kept outside this repo. By convention they live at `~/projects/seqtek-internal/brandkit/` and `~/projects/seqtek-internal/audit/` (sibling directories). The seed script reads `AUDIT_DIR` env var; design-system docs reference brand assets by name without committing them.

## Visual verification (required for UI changes)

Any change that affects rendered output must be **looked at**, not just type-checked. A green `tsc`, passing E2E, or "it renders" is NOT visual verification — and don't claim a page was visually checked unless you actually opened the screenshot and judged it.

The repo has a Playwright capture harness. Run it against the local mirror (or any base URL):

```
PLAYWRIGHT_BASE_URL=http://localhost:3100 npm run visual:capture
```

This captures, into `tests/e2e/visual/screenshots/` (gitignored, overwritten each run):

- **Every real public page** — `tests/e2e/visual/pages.e2e.spec.ts` → `screenshots/pages/<route>-<desktop|mobile>.png`. Add new routes to its `ROUTES` list as pages ship.
- **Every block in isolation** — `showcase.e2e.spec.ts` → `screenshots/showcase/` (needs `npm run seed:showcase` first).

The expectation: open the PNGs for **every page your change touches**, at both viewports, and judge them like the live site — legibility, sizing, spacing, alignment, against the old seqtek.com where a reference exists. For pixel-level layout complaints, also measure boxes (`getBoundingClientRect`) at the reported viewport rather than reasoning from CSS classes.

## Content loading & deploys

Content lives in the **database**, not in committed code, and **CD does not seed content** — a deploy ships code, never copy or media. There are **no committed remote-push scripts** (don't add one; don't frame `npm run …:remote` as a deploy step). The single way to (re)load content, local or remote, is the **gitignored** `docs/content-drafts/*-api.mts` REST seeders:

- **Environment-parameterized:** `IMPORT_BASE_URL` (default `http://localhost:3100`; staging `https://seqtek-preview.com`) + `IMPORT_TOKEN` (an `/admin` `payload-token` JWT, ~2h expiry, that the site owner mints and hands over — staging/prod have no direct DB access, so REST-with-a-token is the only path). The same script runs against local or staging; `--dry-run` previews without writes. Keep the token **outside the repo**; never commit it (gitleaks blocks it regardless).
- **Builders that tests also import** (e.g. `src/payload/seed/services/layouts.ts`, consumed by `tests/e2e/helpers/seedInScopeRoutes.ts`) stay **committed** as the single source of truth so test / local / staging never drift; only the gitignored runner imports them. Local-API fixture seeders (`seed:showcase`) are for dev/test artifacts, not marketing content.

**To load content onto staging:** work from a worktree off `origin/main` (so the committed builders the seeder imports are present), `mkdir -p docs/content-drafts` (it's gitignored, so absent in a fresh worktree) and copy the seeder in from the main checkout, `--dry-run` with the token, run live, then verify the public routes (HTTP 200 + the 301/308 redirect map) and **look at** the rendered pages (`PLAYWRIGHT_BASE_URL=https://seqtek-preview.com`). The local checkout's running dev server (`:3100`) runs different code — don't pull or mutate it mid-session; run your own server on a free port.

<!-- SPECKIT START -->

For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/010-block-page-composition/plan.md`.

<!-- SPECKIT END -->
