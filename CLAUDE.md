# SEQTEK Company Website

Rebuild of seqtek.com from Wix → self-hosted Next.js + Payload CMS. Open-source portfolio piece.

## Stack

- Next.js 16 + React 19 (App Router, TypeScript)
- Payload CMS v3.84+ (embedded in Next.js, Postgres-backed)
- PostgreSQL (RDS in prod, Docker Compose locally)
- Tailwind v4 (CSS-first `@theme`)
- AWS: EC2 + ALB + CloudFront, Docker via ECR, blue-green via ASG
- Identity: Google Workspace (`@seqtechllc.com`) via OAuth plugin (planned post-spike — see ROADMAP D-14)

## Source of truth

Defer to these docs before re-deriving anything. Update them when decisions change.

- `docs/ARCHITECTURE.md` — system design, stack rationale, deployment
- `docs/ROADMAP.md` — current status, open decisions, phase tracker
- `docs/LOCAL_DEVELOPMENT.md` — running locally
- `docs/PAYLOAD_DEVELOPMENT.md` — Payload patterns
- `docs/BLOCK_LIBRARY.md` — block/component inventory
- `docs/CONTENT-REQUIREMENTS.md` — content needs
- `docs/INTEGRATIONS.md` — HubSpot, GTM, ScoreApp, CSP
- `docs/decisions/` — Architecture Decision Records (ADRs): non-obvious technical choices, options considered, trade-offs accepted, when to revisit. Read `docs/decisions/README.md` first.

## Current phase

Pre-implementation. Branch `spike/stack-validation` proves the Next 16 + React 19 + Payload 3.84+ + Tailwind v4 combo builds (ROADMAP D-13 / Phase 1 Task 1.0). Phase 1 proper begins after spike merges.

## Conventions

- **Conventional Commits** — `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `style:`, `perf:`, `ci:`, `build:`. Scope optional, e.g. `feat(payload): ...`.
- **Branches** — `spike/*` for spikes, `feat/*` for features, `fix/*` for fixes. `main` is stable.
- **Public repo** — no secrets committed. `.env.local` only. Pre-commit gitleaks (per Phase 1 plan).
- **TypeScript strict mode**, no `any`. ESLint + Prettier enforced in CI.
- **Tooling and scripts** live in subdirectories, not the repo root.
