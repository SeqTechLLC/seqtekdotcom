import type { Field } from 'payload'

/**
 * Spec 011 T005 — flatten a Payload config's field tree to leaf field paths.
 *
 * Two tests need the same walk and must agree on what "a field" is:
 *   - T008 `fieldConsumerRegistry.int.spec.ts` (FR-008) — every leaf must be
 *     registered as reaching the rendered site.
 *   - T044 `adminMetadata.int.spec.ts` (FR-018/FR-019) — every leaf must have
 *     a written label, and non-obvious ones must have help text.
 *
 * If the two walked the tree differently, a field could satisfy one gate and
 * be invisible to the other. Hence one flattener.
 *
 * Container fields (`group`, `array`, `tabs`, `row`, `collapsible`, `blocks`)
 * are descended into, not emitted — only leaves are yielded. `row` and
 * `collapsible` are presentational and contribute no path segment; `group`,
 * `array` and `blocks` do.
 */

export interface FlatField {
  /** Dotted path, e.g. `pages.seo.metaTitle` or `hero.cta.label`. */
  path: string
  field: Field
  /** Which collection, global, or block this leaf was reached through. */
  entity: string
}

/** Field types that hold other fields rather than a value of their own. */
const CONTAINER_TYPES = new Set(['group', 'array', 'row', 'collapsible', 'tabs', 'blocks'])

/** Presentational containers that do not contribute a path segment. */
const TRANSPARENT_TYPES = new Set(['row', 'collapsible'])

/** Payload-managed fields that no author declares and no registry should demand. */
const IGNORED_TYPES = new Set(['ui'])

function hasName(field: Field): field is Field & { name: string } {
  return 'name' in field && typeof (field as { name?: unknown }).name === 'string'
}

function childFields(field: Field): Field[] {
  if ('fields' in field && Array.isArray(field.fields)) return field.fields as Field[]
  return []
}

function walk(fields: Field[], entity: string, prefix: string, out: FlatField[]): void {
  for (const field of fields) {
    if (IGNORED_TYPES.has(field.type)) continue

    // Tabs hold their fields on `tabs[]`, not on `fields`.
    if (field.type === 'tabs') {
      const tabs = (field as unknown as { tabs?: Array<{ name?: string; fields: Field[] }> }).tabs
      for (const tab of tabs ?? []) {
        // A named tab nests its fields; an unnamed one is presentational.
        const next = tab.name ? joinPath(prefix, tab.name) : prefix
        walk(tab.fields, entity, next, out)
      }
      continue
    }

    // Blocks fan out per block type; each block's slug becomes a path segment
    // so two blocks with a `heading` field are distinguishable.
    if (field.type === 'blocks') {
      const base = hasName(field) ? joinPath(prefix, field.name) : prefix
      const blocks = (field as unknown as { blocks?: Array<{ slug: string; fields: Field[] }> })
        .blocks
      for (const block of blocks ?? []) {
        walk(block.fields, entity, joinPath(base, block.slug), out)
      }
      continue
    }

    if (CONTAINER_TYPES.has(field.type)) {
      const next =
        TRANSPARENT_TYPES.has(field.type) || !hasName(field) ? prefix : joinPath(prefix, field.name)
      walk(childFields(field), entity, next, out)
      continue
    }

    if (!hasName(field)) continue
    out.push({ path: joinPath(prefix, field.name), field, entity })
  }
}

function joinPath(prefix: string, segment: string): string {
  return prefix ? `${prefix}.${segment}` : segment
}

/** Flatten one entity's field list. `entity` is used as the path root. */
export function flattenFields(fields: Field[], entity: string): FlatField[] {
  const out: FlatField[] = []
  walk(fields, entity, entity, out)
  return out
}

/**
 * Flatten a whole sanitised Payload config — every collection and every global.
 * Blocks are reached through the collections that mount them, so a block used
 * in two collections yields a leaf under each; callers that want block fields
 * once should dedupe on the block-slug-and-below suffix.
 */
export function flattenConfig(config: {
  collections: Array<{ slug: string; fields: Field[] }>
  globals: Array<{ slug: string; fields: Field[] }>
}): FlatField[] {
  return [
    ...config.collections.flatMap((c) => flattenFields(c.fields, c.slug)),
    ...config.globals.flatMap((g) => flattenFields(g.fields, g.slug)),
  ]
}
