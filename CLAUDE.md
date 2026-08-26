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

- `docs/ARCHITECTURE.md` — system design, stack rationale, deployment, promotion model (`main` → preview.seqtek.com builds once; publishing the GitHub Release promotes that same image → ww3.seqtek.com, no rebuild)
- `docs/INFRASTRUCTURE_RUNBOOK.md` — step-by-step: fresh AWS account standup, migrating an environment (with data) to another account, `seqtek.com` cutover
- `docs/ROADMAP.md` — current status, open decisions, phase tracker
- `docs/PROJECT_HISTORY.md` — archive of completed roadmap items (IDs preserved for traceability)
- `docs/LOCAL_DEVELOPMENT.md` — running locally
- `docs/PAYLOAD_DEVELOPMENT.md` — Payload patterns
- `docs/BLOCK_LIBRARY.md` — block/component inventory
- `docs/DESIGN_SYSTEM.md` — color, type, spacing, motion tokens; logo usage rules
- `docs/BRAND_STRATEGY_RESEARCH.md` — voice, positioning, narrative direction
- `docs/CONTENT-REQUIREMENTS.md` — content needs (incl. SEO/AICO under §8)
- `docs/CONTENT_MIGRATION.md` — historical: how the Wix audit was mapped into Payload. The script it specified was deleted in spec 011; kept as provenance for the 301 map and slug rewrites
- `docs/INTEGRATIONS.md` — HubSpot, GTM, ScoreApp, CSP, SES
- `docs/ERROR_PAGES.md` — 404, 500, maintenance, slow-request handling
- `docs/decisions/` — Architecture Decision Records (ADRs): non-obvious technical choices, options considered, trade-offs accepted, when to revisit. Read `docs/decisions/README.md` first.

## Current phase

**What the site is.** Two content primitives — a block-composed `Page` and a rich-text `Post` — plus typed
metadata collections that carry a block-composed body (`caseStudies`, `workshops`, `teamMembers`, `partners`,
`posts`). There are **no bespoke per-type page templates**; everything renders through the shared
`RenderBlocks` dispatcher (ADR 0009, spec 010 / PR #66). `partners` (PR #99) is the reference implementation of
the metadata-collection pattern. Media is served from CloudFront `/media/*` (ADR 0008, spec 009). Services are
the one exception and a known debt: `/services/[offering]` resolves four bare `Page` slugs through hardcoded
lookups rather than a collection — tracked as SVC-2.

**Environments.** Nothing is publicly launched. A merge to `main` builds the image and deploys
`preview.seqtek.com` (UAT, primary Fargate lane); **publishing** the GitHub Release that Release-Please prepares (as a
draft) promotes **that same already-built image** to `ww3.seqtek.com` (production, secondary lane, same stack
and account) without rebuilding — the release version is the label, the commit SHA is the artifact. Merging the
release PR itself deploys nothing. `main` is the only deployment branch. Both lanes sit behind an ALB + Cognito gate — the gate is index control, not access
control: it is what keeps search engines out until cutover. The separate staging account (`seqtek-preview.com`) was
retired 2026-08-14. `seqtek.com` still serves the old Wix site.

**Site chrome is code-owned.** Company name, tagline, phone, email, postal address, social links and both nav
trees live in `src/lib/site-content.ts` and change by deploy, not by publish (ADR 0010, spec 011 / PR #107). The
`siteSettings` and `navigation` globals were withdrawn and their tables dropped. Seven of those values are read on
the render path — two by `lib/metadata.ts`, six by the Organization JSON-LD in `lib/structured-data.ts` — and both
are pinned by tests, so edit the values freely but expect a shape change to fail `organizationLd.int.spec.ts` /
`metadataOutput.int.spec.ts`.

**What's active.** Spec 011 (Payload admin UX) US1 shipped in PR #107; US2–US6 (block picker, media thumbnails,
form legibility, slug-from-title, collection grouping) are open. The bottleneck is content throughput, not
features. `docs/ROADMAP.md` is the prioritized list of everything open; `docs/PROJECT_HISTORY.md` is the archive
of what shipped. Don't re-derive status from git history — read those two.

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

Content lives in the **database**, not in committed code, and **CD does not seed content** — a deploy ships code, never copy or media. **Tool is committed; data is gitignored.** The way to (re)load content, local or remote, is the committed generic seeder driving gitignored JSON request files:

- **The tool** — `tools/payload-seed` (`npm run payload:seed -- <file.json>`). Upserts any collection or global from a JSON request file over REST, idempotent by an identity field (default `slug`). Directives resolved at write time: `$ref` (relation by slug/field → id, with array fallback / `createIfMissing` / `omitIfMissing`), `$file` (media upload-or-reuse by filename → id), `$lexical` (prose → editorState). An array of specs runs in order, so earlier docs resolve as later refs. `IMPORT_BASE_URL` (default `http://localhost:3100`; the deployed lanes are `https://preview.seqtek.com` / `https://ww3.seqtek.com`) + `IMPORT_TOKEN` (an `/admin` `payload-token` JWT the site owner mints — the deployed lanes have no direct DB access, so REST-with-a-token is the only path; a Cognito-gated lane also needs `IMPORT_COOKIE`, PR #102). `--dry-run` previews; keep the token **out of the repo** (gitleaks blocks it regardless). The shared REST client lives at `tools/payload-rest/client.ts`. **Don't commit remote-push scripts** — the runner is committed once and generic; the data is not.
- **The data** — gitignored `docs/content-drafts/*.json`, **one file per collection or global** (`pages`, `case-studies`, `posts`, `workshops`, `team`, `partners`, `testimonials`, `categories`, `industries`, `services`, `service-pillars`, `global-*`). These are the real marketing content (kept out of the public repo). Local dev and the deployed lanes use the SAME files via `IMPORT_BASE_URL`. Reconciled against staging 2026-08-11 and verified portable — no row IDs, every relation a `$ref` (58 docs, 84 refs, 0 unresolved). Load order and the three known staging data defects are in `docs/content-drafts/README.md`; the fresh-environment sequence is `INFRASTRUCTURE_RUNBOOK.md` §2.2. Pre-spec-010 files that carried legacy body fields but no `layout` (seeding them renders an empty body and reports success) are in `docs/content-drafts/_archive/`.

**Test fixtures are committed and generic, separate from real content.** `src/payload/seed/showcase` (`npm run seed:showcase`) builds 1-2 of every block type for the visual/showcase capture; `tests/e2e/helpers/seedInScopeRoutes.ts` seeds minimal generic fixtures for the a11y/in-scope routes. Tests never depend on the gitignored real content. The local dev server (`:3100`) runs different code — don't pull or mutate it mid-session; run your own server on a free port.

<!-- SPECKIT START -->

For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/011-payload-admin-ux/plan.md`.

<!-- SPECKIT END -->
