# Contract: Migration fidelity & idempotency

Covers FR-007, SC-003, FR-013. The per-type field→`layout` composer (`src/payload/seed/compose/*`) is the migration mechanism of record.

## Inputs / Outputs

- **Input**: a published specialized record's discrete body fields (richText/array/group) read via Local API (`overrideAccess:true`).
- **Output**: the same record with its `layout` blocks array populated to an equivalent composition, written via `upsertBySlug` (Local API, `draft:true` so required-field gaps log via the migration logger, never abort).

## Guarantees

1. **Fidelity (SC-003)**: every unit of previously published body content appears in the resulting `layout` — no silent drop. Verified by `tests/int/seed/composeFidelity.int.spec.ts`: seed a record with known discrete fields → run composer → assert each source field's text/media is present in a block, and that block count/types match the documented mapping (data-model.md per type).
2. **Idempotency (SC-004/FR-007)**: running the composer twice yields identical `layout` and zero net writes on the second pass (slug-keyed upsert). Asserted in the same test.
3. **Re-runnable / seedable**: the composer is invocable per type and per slug; safe to re-run after content edits to a non-migrated field. Supports the same `--dry-run` JSON-Lines contract as `migrateFromAudit` (no writes, valid JSON to stdout).
4. **Order preserved**: block order follows the documented per-type mapping so the migrated page reads the same top-to-bottom as the retired template (visual capture comparison in quickstart.md).
5. **Expand/contract safety (R2)**: the composer reads the live (not yet dropped) body columns; the `drop_legacy_body_columns` migration runs only after the type has soaked one release.

## Failure modes

- Missing media/alt, missing testimonial relationship, parse gaps → logged via the existing migration logger error kinds (`MISSING_IMAGE`, `MISSING_ALT`, `MISSING_TESTIMONIAL`, `AUDIT_GAP`, `PARSE_ERROR`), record still written with the rest of the layout. No partial-write corruption (Local API transactional per doc).
