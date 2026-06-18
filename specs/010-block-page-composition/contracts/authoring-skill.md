# Contract: `compose-page` authoring skill (FR-010, US3)

Net-new page authoring from the existing block library. A project-committed skill at `.claude/skills/compose-page/SKILL.md` (frontmatter: `name`, `description`, `argument-hint`, `user-invocable: true`, matching the existing speckit skill format).

## Input

A page brief in natural language (purpose, sections, audience), optionally a target collection (page / workshop / case study / service / team / homepage).

## Output (exactly one of)

1. **A valid `layout`**: an ordered blocks array using **only** existing registered blocks (BLOCK_LIBRARY §5), each block's fields populated, honoring the reading-column rule (DESIGN_SYSTEM §11.4) and the per-type default skeleton (R4) where applicable. Emitted as JSON ready to paste/seed via the Local API upsert pattern — **no bespoke page code**.
2. **A single named block gap**: when the brief needs a capability no block provides, the specific missing block (name + why) — routed to the block-curation loop (FR-011), not hand-coded.

## Guarantees

- Never emits React/template code for a page (SC-006: the only code path is a new/fixed block).
- Only references slugs present in `registry.ts`; an unknown need is reported as a gap, never invented.
- Consumes the current BLOCK_LIBRARY catalog (§5/§6) and AICO metadata needs (CONTENT-REQUIREMENTS §8) for content-collection/SEO blocks.

## Acceptance (spec US3)

- Brief expressible with existing blocks → valid layout, no code changes.
- Brief needing a missing capability → flags the specific missing block.
