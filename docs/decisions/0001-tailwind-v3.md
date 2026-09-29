# 0001. Use Tailwind CSS v3, not v4 or plain CSS

**Status:** Accepted
**Date:** 2026-05-14

## Context

The stack spike (D-13) revisited the styling layer. Tailwind v4 replaced `tailwind.config.js` with CSS-first
`@theme`, renamed utilities (`shadow-sm` → `shadow-xs`, `bg-gradient-to-*` → `bg-linear-to-*`) and replaced the
`@tailwind` directives. AI assistants trained on the v3 corpus produce v3 code that fails silently under v4. This is a
marketing site: CMS-driven prose, little bespoke UI, one developer.

## Options considered

- **Tailwind v4** — faster builds, but a real AI-assistance cost and reported dev/prod inconsistencies
  (tailwindlabs/tailwindcss#16176).
- **Tailwind v3** — feature-complete and frozen, with a large corpus; the typography plugin styles Lexical prose.
- **CSS Modules with design tokens** — no framework, at roughly 20–30% more code per component.
- **UnoCSS** — Tailwind-compatible syntax with a smaller ecosystem.

## Decision

Tailwind v3 (`^3.4`) with `@tailwindcss/typography`. Design tokens live in `tailwind.config.mjs`. If v3 stops being
viable, utility classes convert mechanically to CSS Modules.

## Consequences

- AI assistance works without correction, and the typography plugin handles Lexical prose.
- No new Tailwind features; newer CSS (`color-mix()`, `@property`, container queries) needs hand-written layers.
- Moving off v3 later is a mechanical conversion, estimated at about a week.

## Revisit when

A styling need v3 cannot meet ergonomically, or AI assistants generate v4 reliably.
