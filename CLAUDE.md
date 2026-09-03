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
- `docs/ROADMAP.md` — what is still open, in priority order. Open items only; nothing that has shipped
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
`RenderBlocks` dispatcher (ADR 0009). `partners` is the reference implementation of the metadata-collection
pattern. Media is served from CloudFront `/media/*` (ADR 0008). `services` is one collection carrying a `tier`
of `leaf | group | axis`, all rendering through `/services/[slug]`.

**Environments.** Nothing is publicly launched. A merge to `main` builds the image and deploys
`preview.seqtek.com` (UAT, primary Fargate lane); **publishing** the GitHub Release that Release-Please prepares
promotes **that same already-built image** to `ww3.seqtek.com` (production, secondary lane, same stack and
account) without rebuilding. Merging the release PR itself deploys nothing. `main` is the only deployment
branch. Both lanes sit behind an ALB + Cognito gate — index control, not access control: it is what keeps
search engines out until cutover. `seqtek.com` still serves the old Wix site.

**Site chrome is code-owned.** Company name, tagline, phone, email, postal address, social links and both nav
trees live in `src/lib/site-content.ts` and change by deploy, not by publish (ADR 0010). Seven of those values
are read on the render path and pinned by tests, so edit the values freely but expect a shape change to fail
`organizationLd.int.spec.ts` / `metadataOutput.int.spec.ts`.

**The bottleneck is content throughput, not features.** `docs/ROADMAP.md` is everything open;
`docs/PROJECT_HISTORY.md` is the archive. Don't re-derive status from git history — read those two.

**Stack constraint.** Next 16 + React 19 + Payload 3.84+ on Postgres 18.3. If a minor bump breaks the combo,
**downgrade Next first**, not Payload.

## Conventions

- **Conventional Commits** — `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `style:`, `perf:`, `ci:`, `build:`. Scope optional, e.g. `feat(payload): ...`.
- **Branches** — `spike/*` for spikes, `feat/*` for features, `fix/*` for fixes. `main` is stable.
- **Docs ride with the code that changed them.** A doc update caused by, explaining, or invalidated by a code
  change goes in the **same PR** as that code, as its own commit. Standalone docs-only PRs are for docs with no
  related code in flight — a meeting note, a decision that arrived from a person, an ADR ahead of
  implementation. (Docs-only merges deploy nothing: `deploy.yml` sets `paths-ignore: docs/**`.)
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
- **Every block as a bare element** — `blockPreviews.e2e.spec.ts` → `screenshots/block-previews/`. These are the
  source for the committed admin block-picker previews; `npm run block:thumbnails` turns them into
  `public/block-previews/*.webp` (ADR 0011). Only needed when a block's design changes.

The seeded showcase renders media through `serverURL`, which defaults to `http://localhost:3100` — capture from a
server on **that** port or every image in the capture is a broken-image alt string.

The expectation: open the PNGs for **every page your change touches**, at both viewports, and judge them like the live site — legibility, sizing, spacing, alignment, against the old seqtek.com where a reference exists. For pixel-level layout complaints, also measure boxes (`getBoundingClientRect`) at the reported viewport rather than reasoning from CSS classes.

## Content loading & deploys

Content lives in the **database**, not in committed code, and **CD does not seed content** — a deploy ships
code, never copy or media. **Tool is committed; data is gitignored.**

- **The tool** — `tools/payload-seed` (`npm run payload:seed -- <file.json>`). Upserts any collection or global
  from a JSON request file over REST, idempotent by an identity field (default `slug`). Directives resolved at
  write time: `$ref` (relation by slug/field → id), `$file` (media upload-or-reuse by filename → id),
  `$lexical` (prose → editorState). An array of specs runs in order, so earlier docs resolve as later refs.
  `IMPORT_BASE_URL` (default `http://localhost:3100`; the lanes are `https://preview.seqtek.com` /
  `https://ww3.seqtek.com`) + `IMPORT_TOKEN` (an `/admin` `payload-token` JWT the site owner mints — the lanes
  have no direct DB access, so REST-with-a-token is the only path; a Cognito-gated lane also needs
  `IMPORT_COOKIE`). `--dry-run` previews. Keep the token out of the repo. The shared REST client is
  `tools/payload-rest/client.ts`. **Don't commit remote-push scripts** — the runner is generic; the data is not.
- **The data** — `docs/content-drafts/` is a symlink to the private sibling repo `website-content`
  (`~/projects/seqtek-internal/website-content`), gitignored here because this repo is public. One JSON file per
  collection or global. Its README covers load order, known defects and how to recreate the symlink. The tool
  stays here because it is coupled to `src/` (`resolve.ts` imports `textToLexical`; `payload-rest/client.ts`
  mirrors `src/collections/Media.ts`) and its tests live in this repo's Vitest suite.

**Content state and lane state are not documented here.** No test pins either and neither lives in this repo,
so check the file through the symlink, or check the lane.

**Test fixtures are committed and generic, separate from real content.** `src/payload/seed/showcase`
(`npm run seed:showcase`) builds 1-2 of every block type for the visual capture;
`tests/e2e/helpers/seedInScopeRoutes.ts` seeds minimal fixtures for the a11y routes. Tests never depend on the
gitignored real content. The local dev server (`:3100`) runs different code — don't pull or mutate it
mid-session; run your own server on a free port.

<!-- SPECKIT START -->

For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/011-payload-admin-ux/plan.md`.

<!-- SPECKIT END -->
