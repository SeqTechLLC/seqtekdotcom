# ADR 0012 — One source of truth for shell geometry

**Status:** Accepted
**Date:** 2026-09-05
**Supersedes nothing. Constrains:** ADR 0009 (block-first composition)

## Context

ADR 0009 says blocks own their layout — no bespoke per-type page templates.
That is right, and it stays. But it was implemented as _every block re-derives
the shell_, which is a different thing, and the difference cost us six review
rounds on one PR.

Measured on `main` before this change, across 46 block components:

|                                                                      |     |
| -------------------------------------------------------------------- | --- |
| Hand-wrote `px-4 md:px-6 lg:px-8`                                    | 46  |
| Hand-wrote `mx-auto max-w-container-*`                               | 44  |
| Used the `Container` primitive that already described the same model | 0   |

`Container` existed the whole time. Its own docblock said "same model as the
section components". Only the header, the footer and two static pages used it —
and they passed `size="lg"` explicitly, which is a _second_ statement of the
rail width.

Geometry derived from the shell was then hand-computed per block against a
number that appeared nowhere: `sizes` crossovers, reading-measure caps. So
moving the rail from `container-lg` to `container-xl` was a 44-file change that
silently invalidated roughly 46 derivations at once. The defects then arrived
one per review round, each looking like an isolated mistake:

- `Gallery` served one `sizes` string to its 2-, 3- and 4-column options. The
  2-up case has no `lg:` override, so its cell is 628px at 1440 — 1256 device px
  at DPR 2, needing the 1600w rung — while `33vw` declared 950 and the browser
  chose 1024w and upscaled.
- `Image` served one string to four boxes differing by ~2x, keyed to the widest,
  so the default variant over-requested for a 768px box.
- Five blocks rendered editor prose at ~160ch against §11.4's 65ch hard rule.
- Two attempts to fix those introduced fresh defects, because the correct form
  of a measure cap is not visible at the call site.

None of these are block bugs. They are one bug: the shell is a fact stated 46
times, and a restated fact cannot be checked.

## Decision

Three owners replace the 46 restatements.

**`src/lib/layoutGeometry.ts` — the numbers.** Rail caps, padding steps, the
media derivative ladder, the grid gaps. `SHELL_RAIL` is _the_ rail, as one
constant. `gridSizes()` and `boxSizes()` **derive** a `sizes` attribute from a
grid's own column counts and gap rather than asking an author to compute one.

**`src/components/ui/Section.tsx` — the shell.** A block declares what it is
(padding rhythm, background, border, rail) and Section owns how that becomes
CSS. `Container` is the same shell for page chrome, and defaults to the same
`SHELL_RAIL`.

**`src/components/ui/ReadingColumn.tsx` — the measure.** §11.4 as a component,
including the clause a bare `max-w-prose` at a call site never conveys: the
heading goes inside, with its body, and the column is centred unless a grid has
already positioned it.

Two tests make it a floor rather than a sweep:

- `tests/int/lib/layoutGeometry.int.spec.ts` resolves each derived `sizes`
  string the way a browser does — first match wins — at 15 viewports and 2 DPRs,
  and asserts the selected derivative is the one the real cell needs. It carries
  witnesses for the strings that actually shipped.
- `tests/int/layout/shellOwnership.int.spec.ts` fails any block that restates
  the rail, restates the section padding, or types a literal `sizes`.

## Consequences

**Moving the shell is one line.** The `container-lg` → `container-xl` change
that took 44 files and six review rounds is now an edit to `SHELL_RAIL`, and the
geometry suite re-checks every derived string against the ladder automatically.

**A stale `sizes` fails a test instead of a review.** Reading those strings told
six reviewers nothing, twice including the author. Resolving them is mechanical.

**Blocks give up some local freedom.** A block that genuinely needs a shell
outside Section's vocabulary must extend Section rather than hand-roll — that is
the point, and the guard enforces it. Escape hatches exist and are narrow:
`className` for a background not in the vocabulary (`Content`'s `bg-accent/5`,
`CtaSection`'s WCAG-driven `bg-accent-strong`), `padding="none"` for a one-off
rhythm, and `bleed` for full-bleed children that must sit outside the rail.

**What this does not solve.** Vertical rhythm is still four ad-hoc values rather
than the documented `section-tight/default/spacious` scale — `DESIGN_SYSTEM.md`
§4 describes responsive padding the code has never used. Section names the three
tokens but maps them to the flat values in the tree, so the divergence is now in
one file instead of 46. Reconciling it is a deliberate visual change and belongs
in its own PR.

## Revisit when

A block needs a rail the vocabulary cannot express, or the vertical rhythm
reconciliation lands and Section's padding map should become responsive.
