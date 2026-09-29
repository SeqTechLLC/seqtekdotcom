# 0012. One source of truth for shell geometry

**Status:** Accepted
**Date:** 2026-09-05
**Constrains:** ADR 0009

## Context

ADR 0009 has blocks own their layout. It was implemented as every block re-deriving the page shell: 46 block components
hand-wrote the section padding, 44 the rail width, and none used the existing `Container` primitive. Geometry derived from
the shell (responsive image `sizes`, reading-measure caps) was hand-computed per block against a number that appeared
nowhere. Moving the rail from `container-lg` to `container-xl` was a 44-file change that invalidated those derivations,
and the defects it caused (images fetched at the wrong size, prose at 160ch against the 65ch rule) surfaced one per
review round.

## Options considered

- **Fix each block** — leaves the shell stated 46 times.
- **Three owners, and tests that fail a restatement** — chosen.

## Decision

- `src/lib/layoutGeometry.ts` holds the numbers: `SHELL_RAIL`, the padding steps, the media derivative ladder and the
  grid gaps. `gridSizes()` and `boxSizes()` derive a `sizes` attribute from a grid's own columns and gap.
- `src/components/ui/Section.tsx` is the shell: a block declares its padding rhythm, background, border and rail, and
  Section renders them. `Container` is the same shell for page chrome and defaults to `SHELL_RAIL`.
- `src/components/ui/ReadingColumn.tsx` is the reading measure (`DESIGN_SYSTEM.md` §11.4): the heading sits inside with
  its body, and the column is centred unless a grid positions it.

`tests/int/lib/layoutGeometry.int.spec.ts` resolves each derived `sizes` string as a browser does, at 15 viewports and 2
DPRs, importing the constants from the block modules rather than re-typing them.
`tests/int/layout/shellOwnership.int.spec.ts` fails any block that restates the rail or the section padding or types a
literal `sizes`, and any route file under `src/app/(frontend)` that names a `container-*` token.

## Consequences

- Moving the shell is one edit to `SHELL_RAIL`, re-checked by the geometry suite.
- A stale `sizes` fails a test instead of a review.
- Route chrome uses `Container` too; a deliberately narrow column is `<Container size="md">`.
- A block that needs a shell outside Section's vocabulary extends Section. The escape hatches are `className` for a
  background, `padding="none"`, and `bleed` for full-bleed children.
- Section maps `tight`, `default` and `spacious` to flat padding values. A responsive vertical rhythm would be a
  deliberate visual change (ROADMAP P4).

## Revisit when

A block needs a rail the vocabulary cannot express, or the vertical rhythm becomes responsive.
