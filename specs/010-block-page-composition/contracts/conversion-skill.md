# Contract: `convert-to-blocks` conversion skill (FR-014, US6)

Re-runnable conversion of an **existing** page into a block `layout`. Project-committed skill at `.claude/skills/convert-to-blocks/SKILL.md`. Distinct from both the per-type seed composer (the migration mechanism of record, contracts/migration-fidelity.md) and the net-new authoring skill (contracts/authoring-skill.md).

## Input

A pointer to an existing page: a migrated Payload record (by collection+slug), a legacy Wix-audit page (audit JSON under `AUDIT_DIR`), or a hand-built page. Source content is read, not assumed.

## Output (exactly one of)

1. **A `layout` reproducing the source**: an ordered blocks array using **only** existing blocks that reproduces the source page's content (headings, prose, media, lists, CTAs, embeds). Emitted as JSON, ready to review and publish via the upsert pattern — **no bespoke page code**.
2. **A single named block gap**: when a source layout can't be expressed with existing blocks, the specific missing block — routed to the curation loop (FR-011).

## Guarantees

- **Reproduction over invention**: output reflects source content; it does not author new copy (that's the authoring skill's job).
- **Re-runnable**: idempotent for a given source — re-running produces the same `layout`; safe to re-point at future imports (e.g. the Wix audit) (FR-014).
- Never emits page/template code (SC-006); only references registered block slugs.
- For migrated records, the result is consistent with the per-type composer's mapping (data-model.md) so the two don't diverge.

## Acceptance (spec US6)

- Existing page expressible with current blocks → layout reproducing source content, no code changes.
- Source needing a capability no block provides → flags the specific missing block.
