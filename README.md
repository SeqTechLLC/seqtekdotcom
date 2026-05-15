# SEQTEK Website

Open-source rebuild of [seqtek.com](https://www.seqtek.com) — moving from Wix to a self-hosted Next.js + Payload CMS stack on AWS. Public as a portfolio piece showing the stack choices, architectural reasoning, and process behind a real production marketing site rebuild.

**Status:** Phase 1 — implementation in progress. The stack-validation spike is merged; collection schemas, content migration, and frontend block library are next. See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the live status board.

## Stack

- **Next.js 16** (App Router, RSC) + **React 19** + **TypeScript** (strict)
- **Payload CMS v3.84+** embedded in the Next app, **Postgres** backed
- **Tailwind v3** ([why not v4](docs/decisions/0001-tailwind-v3.md))
- **Lexical** rich-text editor (Payload v3 default)
- **AWS** for everything: EC2 + ALB + CloudFront, Docker via ECR, blue-green via ASG, RDS for Postgres, S3 for media (with Origin Access Control)
- Auth via **Google Workspace OAuth** restricted to `@seqtechllc.com` ([why](docs/decisions/0002-auth-strategy.md))

## Where to look

If you're reading this as a reference rather than running it:

- [`CLAUDE.md`](CLAUDE.md) — the one-page TL;DR for someone (or something) joining the project
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — what's done, what's next, what's blocked
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design, deployment, security model
- [`docs/PAYLOAD_DEVELOPMENT.md`](docs/PAYLOAD_DEVELOPMENT.md) — Payload v3 patterns, hooks, access control, live preview
- [`docs/decisions/`](docs/decisions/) — Architecture Decision Records (the _why_ behind non-obvious choices)
- [`docs/BLOCK_LIBRARY.md`](docs/BLOCK_LIBRARY.md) — content block inventory and composition rules
- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) — color, typography, spacing, motion, and logo usage tokens

## Running locally

```bash
git clone git@github.com:SeqTechLLC/seqtekdotcom.git
cd seqtekdotcom
npm install
cp .env.example .env.local      # set PAYLOAD_SECRET (openssl rand -hex 32)
docker compose up -d            # Postgres on :5432
npm run dev                     # site on :3100, admin at :3100/admin
```

Full setup, env vars, and troubleshooting in [`docs/LOCAL_DEVELOPMENT.md`](docs/LOCAL_DEVELOPMENT.md).

## Quality gates

| Gate                 | Where                                                                  | Runs                                  |
| -------------------- | ---------------------------------------------------------------------- | ------------------------------------- |
| Secret scan          | Pre-commit (gitleaks) + CI                                             | Every commit; gates merge             |
| Lint + format        | Pre-commit (lint-staged) + CI (`npm run lint`, `npm run format:check`) | Staged files locally; full repo in CI |
| Typecheck            | CI (`npm run typecheck`)                                               | Every push                            |
| Conventional Commits | Commit message convention                                              | Enforced by review                    |

The pre-commit hook lives in `.husky/pre-commit` and runs gitleaks → lint-staged. CI runs in `.github/workflows/ci.yml` on push to any branch and PR to `main`.

## License & content notes

This repo contains two categories of material, licensed differently — see [`LICENSE`](LICENSE):

- **Code** (everything except the proprietary paths called out below) — **MIT**. Fork, learn, adapt.
- **Strategic content** — `docs/CONTENT-REQUIREMENTS.md`, `docs/BRAND_STRATEGY_RESEARCH.md`, future `src/content/` — **All Rights Reserved**. Read for reference; don't reuse the substance in your own work.
- **Brand assets** (logos, brand-standards PDF, content audit) are intentionally **not committed** to this repo. They live in a private sibling directory; see [`CLAUDE.md`](CLAUDE.md).
- **SEQTEK** and the SEQTEK marks are trademarks of SeqTech, LLC. If you fork to deploy a running copy, replace the branding.
