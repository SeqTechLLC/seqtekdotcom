# SEQTEK Website

Open-source rebuild of [seqtek.com](https://www.seqtek.com), moving from Wix to a self-hosted Next.js + Payload CMS
stack on AWS. Public as a portfolio piece showing the stack choices, architectural reasoning and process behind a real
marketing site rebuild.

**Status:** active development; nothing is publicly launched. UAT runs at `preview.seqtek.com` and production at
`ww3.seqtek.com`, both behind an ALB + Cognito gate. The cutover to `seqtek.com` is gated on content, not
engineering. [`docs/ROADMAP.md`](docs/ROADMAP.md) is what's open; [`docs/PROJECT_HISTORY.md`](docs/PROJECT_HISTORY.md)
is what shipped.

## Stack

- **Next.js 16** (App Router, RSC) + **React 19** + **TypeScript** (strict)
- **Payload CMS v3** embedded in the Next app, backed by **Postgres**
- **Tailwind v3** ([why not v4](docs/decisions/0001-tailwind-v3.md))
- **AWS**: ECS Fargate behind an ALB and CloudFront, images in ECR, RDS Postgres, S3 media with Origin Access Control
- `/admin` sign-in through **Google Workspace**, restricted to SEQTEK's two domains ([why](docs/decisions/0002-auth-strategy.md))

## Where to look

- [`CLAUDE.md`](CLAUDE.md) — the one-page brief for someone (or something) joining the project
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design, deployment, security model
- [`docs/decisions/`](docs/decisions/) — Architecture Decision Records: the _why_ behind non-obvious choices
- [`docs/BLOCK_LIBRARY.md`](docs/BLOCK_LIBRARY.md) — the thirteen layout blocks
- [`docs/PAYLOAD_DEVELOPMENT.md`](docs/PAYLOAD_DEVELOPMENT.md) — project rules for Payload collections and blocks
- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) — colour, type, spacing, motion and logo usage

## Running locally

```bash
git clone git@github.com:SeqTechLLC/seqtekdotcom.git && cd seqtekdotcom
npm install
cp .env.example .env.local    # PAYLOAD_SECRET, plus GOOGLE_CLIENT_ID/SECRET for /admin
docker compose up -d          # Postgres on :5433
PAYLOAD_DISABLE_PUSH=true npm run payload migrate
PAYLOAD_DISABLE_PUSH=true npm run dev   # site on :3100, admin at :3100/admin
```

Setup, content loading and troubleshooting: [`docs/LOCAL_DEVELOPMENT.md`](docs/LOCAL_DEVELOPMENT.md).

## Quality gates

A pre-commit hook (`.husky/pre-commit`) runs gitleaks and lint-staged. CI (`.github/workflows/ci.yml`) runs on pull
requests to `main`; a job whose paths did not change is skipped, and the rest must pass to merge:

- typecheck, lint, format, an importMap check, and a differential audit of production dependencies;
- Vitest integration tests against a real Postgres;
- Playwright end-to-end tests with axe accessibility checks and Lighthouse budgets;
- a gitleaks scan of the full history;
- CDK synth with assertion tests, and actionlint.

## License and content notes

This repo holds two kinds of material, licensed differently (see [`LICENSE`](LICENSE)):

- **Code** (everything except the paths below) is **MIT**. Fork, learn, adapt.
- **Strategic content** (`docs/CONTENT-REQUIREMENTS.md`) is **All Rights Reserved**. Read it for reference; don't reuse
  the substance.
- The brand-standards PDF and the content audit are not committed. The logos in `public/brand/` are.
- **SEQTEK** and the SEQTEK marks are trademarks of SeqTech, LLC. If you fork to deploy a running copy, replace the
  branding.
