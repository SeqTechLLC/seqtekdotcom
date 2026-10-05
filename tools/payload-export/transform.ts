/**
 * Turn a document read at `depth=0` into the `data` of a seeder spec.
 *
 * Driven by the field config, not by the data: only fields the schema declares
 * are copied, so `id`, timestamps, `_status`, array and block row ids and
 * anything Payload adds on read are left behind. Every relation and upload is
 * rewritten as a directive that `tools/payload-seed` resolves in the target
 * database, because row ids mean nothing outside the database they came from.
 * That includes the ids Lexical stores inside rich text: upload and
 * relationship nodes, internal links, and the fields of rich-text blocks.
 */

import type { Block, Field } from 'payload'

export type DocId = string | number

export interface RefDirective {
  $ref: { collection: string; field?: string; value: string }
}

export interface FileDirective {
  $file: { path: string; alt: string }
}

export type Directive = RefDirective | FileDirective

export interface TransformContext {
  /** The directive for document `id` of `collection`, or null when it cannot be expressed. */
  ref: (collection: string, id: DocId) => Directive | null
  /** Rich-text blocks and inline blocks, looked up by `blockType`. */
  richTextBlocks: readonly Block[]
  warn: (msg: string) => void
}

type Data = Record<string, unknown>

const DROP = Symbol('drop')

function isObject(value: unknown): value is Data {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** A relation value at `depth=0` is an id; tolerate a populated document too. */
function idOf(value: unknown): DocId | null {
  if (typeof value === 'string' || typeof value === 'number') return value
  if (isObject(value) && (typeof value.id === 'string' || typeof value.id === 'number')) {
    return value.id
  }
  return null
}

function relationTo(
  target: string,
  value: unknown,
  ctx: TransformContext,
  path: string,
): Directive | typeof DROP {
  const id = idOf(value)
  const directive = id === null ? null : ctx.ref(target, id)
  if (directive === null) {
    ctx.warn(`${path}: dropped a relation to ${target} ${String(id)} that does not resolve`)
    return DROP
  }
  return directive
}

function exportRelation(
  field: Extract<Field, { type: 'relationship' | 'upload' }>,
  value: unknown,
  ctx: TransformContext,
  path: string,
): unknown {
  const one = (v: unknown): unknown => {
    if (!Array.isArray(field.relationTo)) return relationTo(field.relationTo, v, ctx, path)
    // Polymorphic: `{ relationTo, value }`.
    if (!isObject(v) || typeof v.relationTo !== 'string') {
      ctx.warn(`${path}: dropped a polymorphic relation with no relationTo`)
      return DROP
    }
    const directive = relationTo(v.relationTo, v.value, ctx, path)
    return directive === DROP ? DROP : { relationTo: v.relationTo, value: directive }
  }

  if (value === null || value === undefined) return value
  if (field.hasMany) {
    return Array.isArray(value) ? value.map(one).filter((v) => v !== DROP) : value
  }
  const out = one(value)
  return out === DROP ? null : out
}

/** Rich-text block fields keep `id`, `blockName` and `blockType`: Lexical stores them in the node. */
function exportBlockRow(
  blocks: readonly Block[],
  row: unknown,
  ctx: TransformContext,
  path: string,
  keep: readonly string[],
): unknown {
  if (!isObject(row)) return row
  const block = blocks.find((b) => b.slug === row.blockType)
  if (!block) {
    ctx.warn(`${path}: block "${String(row.blockType)}" is not in the config; copied as is`)
    return row
  }
  const out: Data = {}
  for (const key of keep) if (row[key] !== undefined && row[key] !== null) out[key] = row[key]
  return { ...out, ...exportFields(block.fields, row, ctx, `${path}.${block.slug}`) }
}

function exportLexicalNode(node: unknown, ctx: TransformContext, path: string): unknown[] {
  if (!isObject(node)) return [node]
  const out: Data = { ...node }

  if (Array.isArray(node.children)) {
    out.children = node.children.flatMap((child) => exportLexicalNode(child, ctx, path))
  }

  if (
    (node.type === 'upload' || node.type === 'relationship') &&
    typeof node.relationTo === 'string'
  ) {
    const directive = relationTo(node.relationTo, node.value, ctx, `${path} (${node.type} node)`)
    if (directive === DROP) return []
    out.value = directive
  }

  if ((node.type === 'link' || node.type === 'autolink') && isObject(node.fields)) {
    const doc = node.fields.doc
    if (
      node.fields.linkType === 'internal' &&
      isObject(doc) &&
      typeof doc.relationTo === 'string'
    ) {
      const directive = relationTo(doc.relationTo, doc.value, ctx, `${path} (internal link)`)
      // A link to a document that is gone keeps its text and loses the link.
      if (directive === DROP) return Array.isArray(out.children) ? out.children : []
      out.fields = { ...node.fields, doc: { ...doc, value: directive } }
    }
  }

  if ((node.type === 'block' || node.type === 'inlineBlock') && isObject(node.fields)) {
    out.fields = exportBlockRow(ctx.richTextBlocks, node.fields, ctx, path, [
      'id',
      'blockName',
      'blockType',
    ])
  }

  return [out]
}

export function exportLexical(state: unknown, ctx: TransformContext, path: string): unknown {
  if (!isObject(state) || !isObject(state.root)) return state
  const [root] = exportLexicalNode(state.root, ctx, path)
  return { ...state, root }
}

function exportValue(field: Field, value: unknown, ctx: TransformContext, path: string): unknown {
  if (value === null || value === undefined) return value
  switch (field.type) {
    case 'group':
      return isObject(value) ? exportFields(field.fields, value, ctx, path) : value
    case 'array':
      return Array.isArray(value)
        ? value.map((row) => (isObject(row) ? exportFields(field.fields, row, ctx, path) : row))
        : value
    case 'blocks':
      return Array.isArray(value)
        ? value.map((row) =>
            exportBlockRow(
              (field.blockReferences ?? field.blocks).filter(
                (b): b is Block => typeof b !== 'string',
              ),
              row,
              ctx,
              path,
              ['blockType', 'blockName'],
            ),
          )
        : value
    case 'relationship':
    case 'upload':
      return exportRelation(field, value, ctx, path)
    case 'richText':
      return exportLexical(value, ctx, path)
    default:
      return value
  }
}

/** The schema's fields, read from `data`. Presentational containers share their parent's data. */
export function exportFields(
  fields: readonly Field[],
  data: Data,
  ctx: TransformContext,
  path: string,
): Data {
  const out: Data = {}
  for (const field of fields) {
    if (field.type === 'ui' || field.type === 'join') continue
    if (field.type === 'row' || field.type === 'collapsible') {
      Object.assign(out, exportFields(field.fields, data, ctx, path))
      continue
    }
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        if ('name' in tab && tab.name) {
          const value = data[tab.name]
          if (isObject(value))
            out[tab.name] = exportFields(tab.fields, value, ctx, `${path}.${tab.name}`)
        } else {
          Object.assign(out, exportFields(tab.fields, data, ctx, path))
        }
      }
      continue
    }
    if (!('name' in field) || !field.name) {
      // An unnamed group is presentational, like a row.
      if (field.type === 'group') Object.assign(out, exportFields(field.fields, data, ctx, path))
      continue
    }
    if (field.virtual) continue
    // Absent means unreadable or hidden; writing it back would clear it.
    if (!(field.name in data)) continue
    out[field.name] = exportValue(field, data[field.name], ctx, `${path}.${field.name}`)
  }
  return out
}

/**
 * Collections a document's own fields point at, for ordering the files a
 * restore loads. Relations inside blocks are left out: any layout can point at
 * any collection, so they say nothing about order, and the second load pass
 * resolves them.
 */
export function relationTargets(fields: readonly Field[], into = new Set<string>()): Set<string> {
  for (const field of fields) {
    if (field.type === 'relationship' || field.type === 'upload') {
      for (const t of [field.relationTo].flat()) into.add(t)
    } else if (field.type === 'tabs') {
      for (const tab of field.tabs) relationTargets(tab.fields, into)
    } else if (field.type !== 'blocks' && 'fields' in field && Array.isArray(field.fields)) {
      relationTargets(field.fields, into)
    }
  }
  return into
}
