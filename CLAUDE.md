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

Phase 3 (spec 004) is **split**. Its _engineering_ scope — the public render foundation + all five marquee page _templates_ (homepage, case studies, team, Touchstone workshops, localshoring) — shipped in PR #21 (cached readers + ISR tag-parity per ADR 0005, error/maintenance pages, 301 redirect map, metadata/JSON-LD, dynamic sitemap; 47/47 tasks). Acceptance was template-scope, so the spec is **done, not blocked**. The marquee _content_ (copy, photos, testimonials) is carved out to a content-lead-gated track (ROADMAP §1 C-\* items) — templates are live and waiting on content, not engineers. Active engineering is now content-independent: the Phase 5 "Deferred from spec 004" follow-ups (accent-contrast sweep, slow-request handling, live HubSpot form, the two PR #21 review items). The audit seed stays a one-shot migration tool + 301-redirect-map source, not a publish baseline. See ROADMAP §4.

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
`specs/006-consent-privacy-compliance/plan.md`.

<!-- SPECKIT END -->
