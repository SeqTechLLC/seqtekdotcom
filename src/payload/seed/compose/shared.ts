import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { buildLexical } from '../showcase/lexical'

// ---------------------------------------------------------------------------
// Field → layout composer shared helpers (spec 010 / ADR 0009).
//
// spec 011 T019a retired the migration RUNNER that used to live here; what
// remains are the pure block-building helpers the per-type composers use, and
// the composers themselves are now reference mappings (used by the
// `convert-to-blocks` skill) rather than a live migration path.
// Historical context: the per-type composers (workshopToLayout.ts etc.)
// are the migration mechanism of record: they read a record's discrete body
// fields and write an equivalent `layout` blocks array via `upsertBySlug`,
// idempotent + slug-keyed, with a `--dry-run` JSON-Lines plan.
// ---------------------------------------------------------------------------

/** A saved Payload layout block (carries `blockType`). */
export type LayoutBlock = Record<string, unknown> & { blockType: string }

export { buildLexical }

/**
 * Extract a relationship/upload id from a value that may be a populated doc
 * (depth > 0), a bare id, or null. The composers read at depth 0, so this
 * mostly normalizes the id type, but it stays defensive for either shape.
 */
export function relId(value: unknown): string | number | null {
  if (value == null) return null
  if (typeof value === 'string' || typeof value === 'number') return value
  if (typeof value === 'object' && 'id' in (value as Record<string, unknown>)) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'string' || typeof id === 'number' ? id : null
  }
  return null
}

/** A Lexical state is non-empty when its root has at least one child node. */
export function hasRichText(value: unknown): value is SerializedEditorState {
  const root = (value as { root?: { children?: unknown[] } } | null | undefined)?.root
  return Array.isArray(root?.children) && root!.children!.length > 0
}

/** A Lexical heading node (matches the seed `buildLexical` heading shape). */
const headingNode = (text: string, tag: 'h2' | 'h3' | 'h4'): Record<string, unknown> => ({
  type: 'heading',
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  tag,
  children: [{ type: 'text', version: 1, detail: 0, format: 0, mode: 'normal', style: '', text }],
})

/**
 * Prepend a section heading to an existing richText body, returning a new
 * Lexical state. Lets the composer preserve the section headers the retired
 * templates rendered above each prose field ("What it is", "Format", …).
 */
export function prependHeading(
  body: SerializedEditorState,
  heading: string,
  tag: 'h2' | 'h3' | 'h4' = 'h2',
): SerializedEditorState {
  const root = (body as unknown as { root: { children: unknown[]; [k: string]: unknown } }).root
  return {
    root: { ...root, children: [headingNode(heading, tag), ...root.children] },
  } as unknown as SerializedEditorState
}

/**
 * Wrap an existing richText body in a `content` block. Returns null when the
 * body is empty so the composer simply omits the block (no empty sections).
 * An optional `heading` is prepended to the body so the section header the
 * retired template rendered above the prose survives the migration.
 */
export function contentBlock(
  body: unknown,
  opts: {
    heading?: string
    width?: 'narrow' | 'standard' | 'wide'
    background?: 'none' | 'subtle' | 'accent'
  } = {},
): LayoutBlock | null {
  if (!hasRichText(body)) return null
  const finalBody = opts.heading ? prependHeading(body, opts.heading) : body
  return {
    blockType: 'content',
    width: opts.width ?? 'standard',
    background: opts.background ?? 'none',
    body: finalBody,
  }
}

/**
 * Build a `content` block from a plain-text string by lifting it into a
 * single-paragraph Lexical state (reuses the seed `buildLexical` helper).
 * Used for fields that are plain text/textarea rather than richText.
 */
export function textContentBlock(text: string | null | undefined): LayoutBlock | null {
  if (!text || text.trim().length === 0) return null
  return {
    blockType: 'content',
    width: 'standard',
    background: 'none',
    body: buildLexical([{ kind: 'p', text: text.trim() }]),
  }
}

// ---------------------------------------------------------------------------
// CLI runner — shared across every per-type composer
// ---------------------------------------------------------------------------

// spec 011 T019a: `ComposeContext`, `RunComposerOptions`, `runComposer`,
// `RunGlobalComposerOptions` and `runGlobalComposer` were removed here.
//
// They were the spec-010 expand/contract MIGRATION runner: read a record's
// legacy body columns, compose an equivalent `layout`, write it back. Spec 011
// dropped those columns (FR-007), so the runner has no input left — it reads
// fields the schema no longer has and composes an empty layout. Keeping it
// would be the same looks-wired-but-isn't trap this feature exists to remove,
// and a deploy step in the runbook that silently no-ops is worse than none.
//
// The PURE composers (`composeWorkshopLayout` and friends) survive: they map a
// plain record shape to blocks with no database involved, and the
// `convert-to-blocks` skill still uses them as its reference mapping.
