/**
 * Directive resolver for the generic seeder.
 *
 * Walks `data` depth-first (objects + arrays) and replaces directive nodes with
 * concrete values before any write happens. A directive is a plain object whose
 * SOLE key is one of:
 *
 *   { "$ref":     { collection, field?, value, createIfMissing?, omitIfMissing? } }
 *   { "$file":    { path? | url?, alt } }
 *   { "$lexical": "<prose>" }
 *
 * Resolution rules live in the module doc of each handler below. The "omit"
 * outcome (an unresolved `$ref` with `omitIfMissing`, or any unresolved
 * non-omittable `$ref` under `--allow-missing-refs`) bubbles exactly one array
 * level: dropped as a field, or dropping the enclosing array element when that
 * field sits on an object that is itself an array element.
 */

import { basename } from 'node:path'

import type { PayloadRestClient } from '../payload-rest/client'

import { textToLexical } from '../../src/payload/seed/htmlToLexical'

type DocId = string | number

/** Internal sentinel: this node resolved to "nothing — remove me". */
const OMIT = Symbol('omit')

const DIRECTIVE_KEYS = ['$ref', '$file', '$lexical'] as const
type DirectiveKey = (typeof DIRECTIVE_KEYS)[number]

export interface ResolveOptions {
  /** Resolve + read, but never upload/create. */
  dryRun: boolean
  /** Downgrade an unresolved non-omittable `$ref` from error to warn + drop. */
  allowMissingRefs: boolean
  log: (msg: string) => void
  warn: (msg: string) => void
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function directiveKeyOf(node: Record<string, unknown>): DirectiveKey | null {
  const present = DIRECTIVE_KEYS.filter((k) => k in node)
  if (present.length === 0) return null
  if (present.length > 1 || Object.keys(node).length !== 1) {
    throw new Error(
      `malformed directive: an object with ${present.join(' + ')} must contain exactly that one key`,
    )
  }
  return present[0]
}

function baseFilename(ref: { path?: string; url?: string }): string {
  if (ref.path) return basename(ref.path)
  if (ref.url) return basename(new URL(ref.url).pathname) || 'image'
  throw new Error('$file must set exactly one of "path" or "url"')
}

/**
 * `$ref` — resolve a relation by looking up a doc id.
 *   - `value` may be a string or an array of strings (first match wins — this
 *     powers ordered "featured doc with fallback" lists).
 *   - none found + `createIfMissing` → create it (published) and use the new id
 *     (find-or-create for taxonomy by title). In dry-run, no write: a
 *     placeholder string stands in.
 *   - none found + `omitIfMissing` → OMIT (drop field / enclosing array element).
 *   - none found, neither → error, unless `--allow-missing-refs` (warn + OMIT).
 */
async function resolveRef(
  client: PayloadRestClient,
  raw: unknown,
  opts: ResolveOptions,
): Promise<DocId | string | typeof OMIT> {
  if (!isObject(raw)) throw new Error('$ref value must be an object')
  const collection = raw.collection
  if (typeof collection !== 'string' || collection.length === 0) {
    throw new Error('$ref.collection must be a non-empty string')
  }
  const field = raw.field === undefined ? 'slug' : raw.field
  if (typeof field !== 'string' || field.length === 0) {
    throw new Error('$ref.field must be a non-empty string')
  }
  const values: string[] =
    typeof raw.value === 'string'
      ? [raw.value]
      : Array.isArray(raw.value) && raw.value.every((v) => typeof v === 'string')
        ? (raw.value as string[])
        : (() => {
            throw new Error('$ref.value must be a string or an array of strings')
          })()
  if (values.length === 0) throw new Error('$ref.value must not be empty')

  for (const value of values) {
    const id = await client.findIdByField(collection, field, value, { draft: true })
    if (id !== null) return id
  }

  const label = `${collection}.${field}=${values.join('|')}`

  if (raw.createIfMissing !== undefined) {
    if (!isObject(raw.createIfMissing)) {
      throw new Error('$ref.createIfMissing must be an object')
    }
    if (opts.dryRun) {
      opts.log(`would create ${collection} (createIfMissing) for unresolved ${label}`)
      return `<ref-create:${collection}:${values[0]}>`
    }
    const id = await client.createDoc(collection, raw.createIfMissing, { draft: false })
    opts.log(`created ${collection} (createIfMissing) → ${id}`)
    return id
  }

  if (raw.omitIfMissing === true) {
    opts.log(`omitting unresolved $ref ${label}`)
    return OMIT
  }

  if (opts.allowMissingRefs) {
    opts.warn(`unresolved $ref ${label} — dropped (--allow-missing-refs)`)
    return OMIT
  }

  throw new Error(
    `unresolved $ref ${label} — create it first, or set createIfMissing/omitIfMissing, or pass --allow-missing-refs`,
  )
}

/**
 * `$file` — ensure a media doc exists for an image and resolve to its id.
 * Deduped by filename first (reuse if present); in dry-run no upload happens
 * and a `<file:name>` placeholder stands in.
 */
async function resolveFile(
  client: PayloadRestClient,
  raw: unknown,
  opts: ResolveOptions,
): Promise<DocId | string> {
  if (!isObject(raw)) throw new Error('$file value must be an object')
  const path = typeof raw.path === 'string' && raw.path.length > 0 ? raw.path : undefined
  const url = typeof raw.url === 'string' && raw.url.length > 0 ? raw.url : undefined
  if ((path === undefined) === (url === undefined)) {
    throw new Error('$file must set exactly one of "path" or "url"')
  }
  if (typeof raw.alt !== 'string' || raw.alt.trim().length === 0) {
    throw new Error('$file.alt is required (media alt text is mandatory)')
  }

  const filename = baseFilename({ path, url })
  const existing = await client.findIdByField('media', 'filename', filename, { draft: false })
  if (existing !== null) {
    opts.log(`reused media "${filename}" → ${existing}`)
    return existing
  }

  if (opts.dryRun) {
    opts.log(`would upload media "${filename}" (alt: "${raw.alt}")`)
    return `<file:${filename}>`
  }

  const resolved = await client.resolveImage({ file: path, url, alt: raw.alt })
  const id = await client.uploadMedia(resolved)
  opts.log(`uploaded media "${resolved.filename}" → ${id}`)
  return id
}

/** `$lexical` — expand prose into a Lexical editor state. */
function resolveLexical(raw: unknown): unknown {
  if (typeof raw !== 'string') throw new Error('$lexical value must be a string')
  return textToLexical(raw)
}

async function resolveDirective(
  client: PayloadRestClient,
  key: DirectiveKey,
  value: unknown,
  opts: ResolveOptions,
): Promise<unknown | typeof OMIT> {
  switch (key) {
    case '$ref':
      return resolveRef(client, value, opts)
    case '$file':
      return resolveFile(client, value, opts)
    case '$lexical':
      return resolveLexical(value)
  }
}

async function resolveNode(
  client: PayloadRestClient,
  node: unknown,
  isArrayElement: boolean,
  opts: ResolveOptions,
): Promise<unknown | typeof OMIT> {
  if (Array.isArray(node)) {
    const out: unknown[] = []
    for (const el of node) {
      const r = await resolveNode(client, el, true, opts)
      if (r === OMIT) continue // drop this element
      out.push(r)
    }
    return out
  }

  if (isObject(node)) {
    const key = directiveKeyOf(node)
    if (key) return resolveDirective(client, key, node[key], opts)

    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(node)) {
      const r = await resolveNode(client, v, false, opts)
      if (r === OMIT) {
        // A field resolved to "omit". If THIS object is itself an array
        // element, bubble up and drop the whole element; otherwise just drop
        // the field and keep the object.
        if (isArrayElement) return OMIT
        continue
      }
      out[k] = r
    }
    return out
  }

  return node
}

/**
 * Resolve every directive inside a spec's `data`. The top-level `data` is an
 * object and is never itself an array element, so it always resolves to an
 * object (never OMIT).
 */
export async function resolveData(
  client: PayloadRestClient,
  data: Record<string, unknown>,
  opts: ResolveOptions,
): Promise<Record<string, unknown>> {
  const resolved = await resolveNode(client, data, false, opts)
  return resolved as Record<string, unknown>
}
