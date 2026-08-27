import type { Block, CollectionConfig, Field } from 'payload'

import { collections } from '../../../src/collections'
import { buildLexical } from '../../../src/payload/seed/showcase/lexical'

/**
 * Builds renderable block data straight from a block's own field config, so
 * the output-contract gate never carries a hand-written fixture that can drift
 * from the schema it is meant to be testing.
 *
 * The gate works by DIFFERENCE: render a block, change exactly one control,
 * render again, and require the HTML to move. Everything here therefore comes
 * in two variants — variant 0 is the baseline, variant 1 is "the author typed
 * something else" — and every value is derived from the field's dotted path so
 * two fields never collide on the same string.
 *
 * Related documents are built from the REAL collection configs rather than
 * from a literal in this file. That matters: a renderer reading a field its
 * collection does not have (`locations.state`, `servicePillars.tagline`) gets
 * `undefined` here exactly as it does in production, instead of a stub
 * inventing the field and quietly making a dead branch look alive.
 */

/** Rows per array field / documents per hasMany relationship. Four is enough
 *  for a `limit` of 2 vs 3 to change what renders. */
const ROWS = 4

type AnyField = Field & {
  name?: string
  fields?: Field[]
  options?: Array<string | { value: string; label?: unknown }>
  relationTo?: string | string[]
  hasMany?: boolean
  required?: boolean
}

export type Variant = 0 | 1

/** variant 0 / variant 1 word pairs, so a perturbed value is obviously different. */
const WORD: Record<Variant, string> = { 0: 'Alpha', 1: 'Bravo' }

const collectionBySlug = new Map<string, CollectionConfig>(
  collections.map((c) => [String(c.slug), c]),
)

export const selectOptions = (field: Field): string[] => {
  const options = (field as AnyField).options ?? []
  return options.map((o) => (typeof o === 'string' ? o : o.value))
}

/**
 * Payload generates the upload shape (url, sizes, dimensions); it is not
 * authored in `src/collections/Media.ts`, so it is written out here. The two
 * variants differ in every URL so a swapped image moves the srcset too.
 */
const mediaDoc = (variant: Variant, index = 0): Record<string, unknown> => {
  const stem = `${WORD[variant].toLowerCase()}-${index}`
  const size = (name: string, format: 'webp' | 'jpeg', width: number) => [
    `${name}_${format}`,
    { url: `/media/${stem}-${name}.${format}`, width },
  ]
  return {
    id: 900 + index + variant * 10,
    url: `/media/${stem}.jpg`,
    alt: `${WORD[variant]} image ${index}`,
    filename: `${stem}.jpg`,
    mimeType: 'image/jpeg',
    width: 1600,
    height: 900,
    caption: `${WORD[variant]} caption ${index}`,
    sizes: Object.fromEntries([
      size('mobile', 'webp', 640),
      size('mobile', 'jpeg', 640),
      size('tablet', 'webp', 1024),
      size('tablet', 'jpeg', 1024),
      size('desktop', 'webp', 1600),
      size('desktop', 'jpeg', 1600),
    ]),
  }
}

/**
 * A URL the renderers will actually accept. Each host is the one its block
 * checks for; everything else gets a plain absolute https URL, because a
 * site-relative path fails `Embed`'s protocol check.
 */
function url(name: string, variant: Variant, path: string): string {
  const tag = WORD[variant].toLowerCase()
  switch (name) {
    case 'videoUrl':
      return `https://www.youtube-nocookie.com/embed/${tag}`
    case 'embedUrl':
      return `https://www.openstreetmap.org/export/embed.html?bbox=${variant}`
    case 'meetingUrl':
      return `https://meetings.hubspot.com/${tag}`
    case 'fileUrl':
      return `/media/${tag}-guide.pdf`
    default:
      return `https://example.com/${tag}-${path.replace(/\./g, '-')}`
  }
}

/**
 * A scalar for a collection field. Deliberately dumber than the block-level
 * synthesizer: related docs only need to render, not to be perturbed.
 */
function collectionScalar(field: AnyField, variant: Variant, index: number): unknown {
  const label = `${WORD[variant]} ${field.name} ${index}`
  switch (field.type) {
    case 'text':
    case 'textarea':
      return field.name === 'slug' ? `${WORD[variant].toLowerCase()}-${index}` : label
    case 'number':
      return index + 1
    case 'checkbox':
      return index === 0
    case 'date':
      return `2026-0${(index % 9) + 1}-15T00:00:00.000Z`
    case 'select':
      return selectOptions(field)[0]
    case 'email':
      return `${WORD[variant].toLowerCase()}${index}@example.com`
    case 'upload':
      return mediaDoc(variant, index)
    case 'richText':
      return buildLexical([{ kind: 'p', text: label }])
    case 'relationship':
      // Shallow on purpose — one level of relations is all any renderer walks,
      // and following them would recurse without a natural floor.
      return field.hasMany ? [700 + index] : 700 + index
    default:
      return undefined
  }
}

/** One document of `slug`, shaped by that collection's real field config. */
export function relatedDoc(slug: string, variant: Variant, index: number): Record<string, unknown> {
  const doc: Record<string, unknown> = { id: `${slug}-${variant}-${index}` }
  const collection = collectionBySlug.get(slug)
  if (!collection) return doc
  for (const raw of collection.fields) {
    const field = raw as AnyField
    if (!field.name) continue
    // `layout` is a whole block tree and no renderer reads it off a related
    // doc; `meta`/group nesting is likewise never walked from a card.
    if (field.type === 'blocks' || field.type === 'group' || field.type === 'array') continue
    if ((field as { admin?: { hidden?: boolean } }).admin?.hidden) continue
    const value = collectionScalar(field, variant, index)
    if (value !== undefined) doc[field.name] = value
  }
  return doc
}

export interface SynthesizeOptions {
  /**
   * Fill only fields the schema marks `required`. This is the "an author saved
   * the block the moment Payload let them" payload — the state that produced
   * the placeholder sentences this gate exists to ban.
   */
  requiredOnly?: boolean
  /** Dotted paths whose value comes from variant 1 instead of variant 0. */
  perturb?: string[]
  /** Dotted path → literal value, applied last. Used to walk a select's options. */
  overrides?: Record<string, unknown>
}

function valueFor(
  field: AnyField,
  path: string,
  variant: Variant,
  options: SynthesizeOptions,
): unknown {
  switch (field.type) {
    case 'text':
    case 'textarea': {
      const name = field.name ?? ''
      // Several renderers hold a URL to an allow-list before they will embed
      // it (Hero's video hosts, Map's OSM/Google-maps check, Embed's https
      // check) and draw a refusal notice otherwise. A generic sentinel fails
      // every one of those, which would make three wired controls look inert.
      if (/url$/i.test(name)) return url(name, variant, path)
      if (name === 'videoId') return `${WORD[variant].toLowerCase()}VideoId`
      return `${WORD[variant]} ${path}`
    }
    case 'number':
      return variant === 0 ? 2 : 3
    case 'checkbox':
      return variant === 1
    case 'date':
      return variant === 0 ? '2026-01-15T00:00:00.000Z' : '2026-07-04T00:00:00.000Z'
    case 'select': {
      const opts = selectOptions(field)
      return opts[variant] ?? opts[0]
    }
    case 'richText':
      return buildLexical([{ kind: 'p', text: `${WORD[variant]} ${path}` }])
    case 'upload':
      return mediaDoc(variant)
    case 'relationship': {
      const target = Array.isArray(field.relationTo) ? field.relationTo[0] : field.relationTo
      if (!target) return undefined
      if (!field.hasMany) return relatedDoc(target, variant, variant === 0 ? 0 : 1)
      return Array.from({ length: ROWS }, (_, i) => relatedDoc(target, variant, i))
    }
    default:
      return undefined
  }
}

function build(
  fields: Field[],
  prefix: string,
  options: SynthesizeOptions,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const perturbed = new Set(options.perturb ?? [])

  for (const raw of fields) {
    const field = raw as AnyField
    if (!field.name) {
      // `row` / unnamed `collapsible` flatten into the parent's data shape.
      if (field.fields) Object.assign(out, build(field.fields, prefix, options))
      continue
    }
    const path = prefix ? `${prefix}.${field.name}` : field.name
    // A required subfield of an optional parent is only required once the
    // parent exists, so requiredOnly follows the parent's requiredness.
    if (options.requiredOnly && !field.required) continue

    if (field.type === 'group') {
      out[field.name] = build(field.fields ?? [], path, options)
      continue
    }
    if (field.type === 'array') {
      out[field.name] = Array.from({ length: ROWS }, (_, i) => ({
        id: `${path}-${i}`,
        // Only row 0 carries the perturbation: changing every row at once
        // would also pass for a renderer that only ever draws the first.
        ...build(field.fields ?? [], path, i === 0 ? options : { ...options, perturb: [] }),
      }))
      continue
    }

    const variant: Variant = perturbed.has(path) ? 1 : 0
    const value = valueFor(field, path, variant, options)
    if (value !== undefined) out[field.name] = value
  }

  // Overrides are dotted and applied after the walk so a caller can set a
  // nested select without rebuilding the tree.
  for (const [path, value] of Object.entries(options.overrides ?? {})) {
    if (!path.startsWith(prefix)) continue
    const rest = (prefix ? path.slice(prefix.length + 1) : path).split('.')
    if (rest.length !== 1) continue
    out[rest[0]] = value
  }
  return out
}

/** Block data ready to spread onto its registered React component. */
export function synthesizeBlock(
  block: Block,
  options: SynthesizeOptions = {},
): Record<string, unknown> {
  const data = build(block.fields, '', options)
  // A nested override (`primaryCta.variant`) is applied here, after the tree
  // exists, rather than threaded through every recursion.
  for (const [path, value] of Object.entries(options.overrides ?? {})) {
    const parts = path.split('.')
    if (parts.length < 2) continue
    let cursor: Record<string, unknown> = data
    for (const key of parts.slice(0, -1)) {
      const next = cursor[key]
      if (typeof next !== 'object' || next === null) break
      cursor = next as Record<string, unknown>
    }
    cursor[parts[parts.length - 1]] = value
  }
  return { ...data, blockType: block.slug }
}
