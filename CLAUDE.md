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

Phase 2 (content models, spec 003) is wrapping up — US1–US5 shipped across PRs #11/#13/#14/#15/#16, plus PR #17 (DB migration collapse + Postgres 16 → 18 bump). Phase 2 leaves behind: 13 collections + 3 globals, 32 layout blocks + 8 inline blocks with full React renderers, live preview, an audit-seed pipeline (frozen at its current shape — see ROADMAP §4), and a 185-cell access-matrix invariant. Spec 003 US6 (media via S3 plugin) is the only remaining wrap-up item and the prereq for content-team uploads.

Phase 3 (spec 004 — public page templates + marquee pages) is the active pivot. Strategic shift away from "faithful Wix replica" toward "high-craft marquee pages first": homepage wired to Payload, flagship case study, team page, AI workshop campaign, localshoring story. The audit seed stays as a one-shot migration tool + 301-redirect-map source, not a publish baseline. See ROADMAP §4 for the current phase sequence.

Staging runs at `https://seqtek-preview.com` on Postgres 18.3. Production cutover to `seqtek.com` remains deferred to launch readiness.

## Conventions

- **Conventional Commits** — `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `style:`, `perf:`, `ci:`, `build:`. Scope optional, e.g. `feat(payload): ...`.
- **Branches** — `spike/*` for spikes, `feat/*` for features, `fix/*` for fixes. `main` is stable.
- **Public repo** — no secrets committed. `.env.local` only. Pre-commit gitleaks (per Phase 1 plan).
- **TypeScript strict mode**, no `any`. ESLint + Prettier enforced in CI.
- **Tooling and scripts** live in subdirectories, not the repo root.
- **Private SEQTEK assets** (brand kit PDF, trademarked logos, Wix content audit) are kept outside this repo. By convention they live at `~/projects/seqtek-internal/brandkit/` and `~/projects/seqtek-internal/audit/` (sibling directories). The seed script reads `AUDIT_DIR` env var; design-system docs reference brand assets by name without committing them.

<!-- SPECKIT START -->

For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/003-phase-2-content-models/plan.md`.

<!-- SPECKIT END -->
