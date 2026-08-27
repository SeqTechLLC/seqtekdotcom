import type { Block, CollectionConfig, Field, GlobalConfig } from 'payload'

/**
 * Spec 011 — a field-tree walker shared by the admin-metadata contract tests.
 *
 * Payload's config is a tree: `group`, `array`, `row`, `collapsible`, `tabs`
 * and `blocks` all nest further fields, and the properties the C4 contract
 * cares about (`label`, `admin.description`, `admin.condition`) live on the
 * leaves. Walking that tree in each spec by hand is how a whole branch gets
 * silently skipped, so it is written once here.
 *
 * `path` is dotted and uses the field names Payload itself uses, so a failure
 * message names something greppable. Presentational containers with no name
 * (`row`, unnamed `collapsible`, unnamed `tabs`) do not contribute a segment,
 * matching how Payload flattens them into the parent's data shape.
 */
export interface FlatField {
  /** `collection:pages`, `global:homepage`, `block:hero` */
  entity: string
  /** dotted data path, e.g. `seo.ogImage` */
  path: string
  /** the field config itself */
  field: Field
  /** every named ancestor field, outermost first */
  ancestors: Field[]
  /**
   * True when this field, or any container above it, sets `admin.hidden`.
   * The authoring contract only binds controls an editor can actually see —
   * ROADMAP INERT-1 hides four collections' unrouted metadata rather than
   * dropping the columns, and holding hidden fields to a help-text rule would
   * be writing sentences nobody can read.
   */
  hidden: boolean
}

type AnyField = Field & {
  name?: string
  fields?: Field[]
  tabs?: { name?: string; fields: Field[] }[]
  blocks?: Block[]
}

/** Field types that hold other fields rather than a value of their own. */
const CONTAINER_TYPES = new Set(['group', 'array', 'row', 'collapsible', 'tabs', 'blocks'])

export const isContainer = (field: Field): boolean => CONTAINER_TYPES.has(field.type)

/**
 * Payload adds these itself (auth, versions, uploads). They are never authored
 * in `src/`, so holding them to the authoring contract would fail on config
 * the project does not own.
 *
 * `sessions` in particular is injected by `sanitizeCollection` **into the
 * shared `Users` config object**, so whether the walk sees it depends on
 * whether some earlier test in the same Vitest process built a Payload config.
 * Left out, this file passes alone and fails in the full suite.
 */
const AUTH_OWNED = new Set([
  'email',
  'resetPasswordToken',
  'resetPasswordExpiration',
  'salt',
  'hash',
  'loginAttempts',
  'lockUntil',
  'sessions',
  'enableAPIKey',
  'apiKey',
  'apiKeyIndex',
  '_verified',
  '_verificationToken',
])

/** Injected on every collection regardless of auth. */
const ALWAYS_OWNED = new Set(['_status', 'updatedAt', 'createdAt'])

/**
 * Auth names are only Payload's on the auth collection. Matching them
 * everywhere excluded `teamMembers.email`, an authored field, from the
 * contract — silently, because the walk skipped the whole subtree.
 */
const isPayloadOwned = (name: string, entity: string): boolean =>
  ALWAYS_OWNED.has(name) || (entity === 'collection:users' && AUTH_OWNED.has(name))

interface WalkOptions {
  /**
   * Descend into `blocks` fields. Off by default: the block registries are
   * walked once directly, so following every `layout` field would visit each
   * block once per collection that embeds it.
   */
  descendIntoBlocks?: boolean
}

const isHidden = (field: Field): boolean =>
  Boolean((field as { admin?: { hidden?: boolean } }).admin?.hidden)

function walk(
  fields: Field[] | undefined,
  entity: string,
  path: string,
  ancestors: Field[],
  options: WalkOptions,
  hidden = false,
): FlatField[] {
  const found: FlatField[] = []
  for (const raw of fields ?? []) {
    const field = raw as AnyField
    const name = 'name' in field ? field.name : undefined
    if (name && isPayloadOwned(name, entity)) continue
    const here = name ? (path ? `${path}.${name}` : name) : path

    const hiddenHere = hidden || isHidden(raw)

    if (field.type === 'tabs') {
      for (const tab of field.tabs ?? []) {
        found.push(
          ...walk(
            tab.fields,
            entity,
            tab.name ? (path ? `${path}.${tab.name}` : tab.name) : path,
            ancestors,
            options,
            hiddenHere,
          ),
        )
      }
      continue
    }

    if (isContainer(field)) {
      // A named container is itself a field an editor reads a label for.
      if (name) found.push({ entity, path: here, field: raw, ancestors, hidden: hiddenHere })
      if (field.type === 'blocks') {
        if (options.descendIntoBlocks) {
          for (const block of field.blocks ?? []) {
            found.push(...walk(block.fields, `block:${block.slug}`, '', [], options, hiddenHere))
          }
        }
        continue
      }
      found.push(
        ...walk(
          field.fields,
          entity,
          here,
          name ? [...ancestors, raw] : ancestors,
          options,
          hiddenHere,
        ),
      )
      continue
    }

    if (!name) continue
    found.push({ entity, path: here, field: raw, ancestors, hidden: hiddenHere })
  }
  return found
}

export const flattenCollection = (
  collection: CollectionConfig,
  options: WalkOptions = {},
): FlatField[] => walk(collection.fields, `collection:${collection.slug}`, '', [], options)

export const flattenGlobal = (global: GlobalConfig, options: WalkOptions = {}): FlatField[] =>
  walk(global.fields, `global:${global.slug}`, '', [], options)

export const flattenBlock = (block: Block, options: WalkOptions = {}): FlatField[] =>
  walk(block.fields, `block:${block.slug}`, '', [], options)

/** Every authored leaf and named container across the whole config. */
export function flattenAll(
  collections: CollectionConfig[],
  globals: GlobalConfig[],
  blocks: Block[],
  options: WalkOptions = {},
): FlatField[] {
  return [
    ...collections.flatMap((c) => flattenCollection(c, options)),
    ...globals.flatMap((g) => flattenGlobal(g, options)),
    ...blocks.flatMap((b) => flattenBlock(b, options)),
  ]
}
