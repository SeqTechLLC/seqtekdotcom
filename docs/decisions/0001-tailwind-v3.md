# 0001. Use Tailwind CSS v3, not v4 or plain CSS

**Status:** Accepted
**Date:** 2026-05-14

## Context

ARCHITECTURE.md originally pinned Tailwind v4. During the stack spike (ROADMAP D-13) we revisited the styling layer for two reasons:

1. **AI tooling gap with v4.** Tailwind v4 (Q1 2025) was a significant rewrite: `tailwind.config.js` deprecated in favor of CSS-first `@theme`, several utility names changed (`bg-gradient-to-*` → `bg-linear-to-*`, `shadow-sm` → `shadow-xs`, etc.), `@tailwind` directives replaced. AI assistants trained on the v3 corpus produce v3-shaped code that silently fails or compiles to nothing in v4. Community has shipped explicit mitigation skill files; the existence of those tools confirms the problem is widespread, not anecdotal.

2. **Tailwind Labs business contraction.** On 2026-01-06 Tailwind Labs cut their engineering team from 4 to 1 (~75% of technical staff) on ~80% sales drop, attributed to AI changing how developers learn and produce code. This doesn't kill the framework — open source is open source — but the growth phase is over and active stewardship is uncertain.

This is a marketing site (~50-100 pages), heavy on CMS-driven Lexical content rendering, light on bespoke UI, solo-dev, with a finalized brand kit ready to become design tokens. Build window is 2-3 months. Performance bottleneck is fonts + images + ISR, not CSS engine speed.

## Options considered

- **Tailwind v4** — Future-proof in shape, 5-10x faster builds. Material AI-assistance cost and dev/prod inconsistency reports (GitHub #16176, community downgrade write-ups). With Tailwind Labs at 1 engineer, the "v4 ecosystem will keep maturing" thesis has weakened.
- **Tailwind v3** — Feature-frozen but feature-complete. Massive AI training corpus, near-zero friction. Typography plugin handles Lexical prose styling. Easy mechanical migration to plain CSS later if needed.
- **Plain CSS Modules + design tokens + small utility set** — Zero framework dependency. AI writes CSS extremely well (largest corpus). Most durable choice. ~20-30% more code per component during build.
- **UnoCSS** — Tailwind-syntax-compatible engine, actively developed by Anthony Fu's team. Smaller ecosystem, less battle-tested for marketing sites at this scale. Feels like hedging the Tailwind hedge.

## Decision

Use **Tailwind v3** (`^3.4`). The argument against v3 is "what if Tailwind stalls" — but the answer is "migrate to plain CSS Modules in ~1 week, because utility classes convert mechanically." Hedging a one-week problem with a six-month durability tax is a bad trade for a 2-3 month build window. v4 was originally pinned without validating AI compatibility; this decision corrects that under current information.

Use `@tailwindcss/typography` plugin for Lexical content prose styling. Design tokens (D-1) go in `tailwind.config.js`, not v4-style `@theme`.

## Consequences

- **Gain:** AI assistance works without correction tax. Massive corpus of examples (shadcn/ui v3 patterns, headless UI examples, blog posts) directly applies. Typography plugin solves Lexical prose styling out of the box.
- **Gain:** Easy exit ramp. If Tailwind v3 stops being viable, utility classes are mechanically convertible to CSS Modules + custom properties.
- **Cost:** No future Tailwind features. v3 is feature-complete but frozen. New CSS features (subgrid, anchor positioning, etc.) require hand-rolled utilities.
- **Cost:** Modern browser features that v4 makes ergonomic (`color-mix()`, `@property`) require manual CSS layers in v3.
- **Cost:** Eventual migration if v3 ecosystem decays beyond usefulness. Estimated effort: ~1 week of mechanical conversion.

## Revisit when

- Tailwind Labs' direction clarifies (positive: re-staff, sustained v4 development; negative: project archived or forked) — check at 12 months (2027-05).
- We hit a styling requirement v3 can't meet ergonomically (e.g., heavy use of container queries, native nesting, modern color spaces) — at that point evaluate v4 readiness vs migrating to plain CSS Modules.
- AI assistants reach reliable v4 generation accuracy (probably 12-18 months out given current corpus inertia).
