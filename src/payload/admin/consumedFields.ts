/**
 * Spec 011 (FR-008) — the field-consumer registry.
 *
 * Every entity-own leaf field in the Payload config must appear here with a
 * one-line claim of where its value surfaces on the rendered site, in page
 * metadata, or in an editorial workflow. A field with no honest answer gets
 * deleted, not an entry.
 *
 * Enforced by `tests/int/fieldConsumerRegistry.int.spec.ts`. Block fields are
 * not listed: they are consumed structurally through `RenderBlocks` and the
 * section registry, which that test verifies mechanically.
 */

/** Payload-managed field trees no author declares and no reviewer should have to claim. */
export const EXEMPT_PREFIXES: string[] = [
  'payload-locked-documents',
  'payload-preferences',
  'payload-migrations',
  'payload-kv',
]

export const CONSUMED_FIELDS: Record<string, string> = {}
