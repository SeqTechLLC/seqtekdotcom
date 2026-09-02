/**
 * Spec format + shape validation for the generic Payload seeder.
 *
 * A seed file is one spec or an array of specs. Each spec upserts a single
 * collection document (idempotent by an identity field, default `slug`) or a
 * global. Field values may carry directives (`$ref` / `$file` / `$lexical`)
 * resolved at write time — directive shapes are validated lazily in
 * `resolve.ts`, since `data` is free-form per collection. This module only
 * validates the spec envelope, collecting every problem in one pass (mirrors
 * `validateInput` in the case-study importer, retired in spec 011).
 */

/**
 * `published`   — write and publish (the default).
 * `draft`       — write with `?draft=true`: stages a draft VERSION and leaves an
 *                 already-published document live. Use to stage an edit for review.
 * `unpublished` — write `_status: 'draft'` WITHOUT `?draft=true`: takes a live
 *                 document down (and creates a new one unpublished). The seeder
 *                 could not do this before — see PROJECT_HISTORY P5-29.
 */
export type SeedStatus = 'published' | 'draft' | 'unpublished'

/** Upsert one collection document, idempotent by `data[identity]`. */
export interface CollectionSpec {
  collection: string
  /** Field used to find an existing doc (default `slug`). */
  identity: string
  data: Record<string, unknown>
  status: SeedStatus
}

/** Update one global. */
export interface GlobalSpec {
  global: string
  data: Record<string, unknown>
  status: SeedStatus
}

export type SeedSpec = CollectionSpec | GlobalSpec

/** A spec is a global iff it carries a `global` key. */
export function isGlobalSpec(spec: SeedSpec): spec is GlobalSpec {
  return 'global' in spec
}

export type ValidationResult = { ok: true; value: SeedSpec[] } | { ok: false; errors: string[] }

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function parseStatus(value: unknown, path: string, errors: string[]): SeedStatus {
  if (value === undefined || value === null) return 'published'
  if (value === 'published' || value === 'draft' || value === 'unpublished') return value
  errors.push(`${path}.status must be "published", "draft" or "unpublished"`)
  return 'published'
}

/** Levenshtein distance, capped small — only used to spot key typos. */
function editDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  const cur = new Array<number>(b.length + 1).fill(0)
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j]
  }
  return prev[b.length]
}

const KNOWN_KEYS = ['collection', 'global', 'identity', 'data', 'status'] as const

/**
 * Unknown top-level keys are IGNORED by design — `docs/content-drafts` files
 * park editorial notes beside `collection`, and `_note` documents a spec in
 * place. That tolerance has one sharp edge: a typo in a REAL key is also
 * ignored, silently. `"stauts": "unpublished"` does not retire a document, it
 * publishes it, because `parseStatus(undefined)` returns 'published'.
 *
 * So: an unknown key close enough to a real one to be a typo is an ERROR; a key
 * that resembles nothing is left alone. This keeps the escape hatch open while
 * closing the case where the file says one thing and the tool does another.
 */
function checkKeyTypos(raw: Record<string, unknown>, path: string, errors: string[]): void {
  for (const key of Object.keys(raw)) {
    if ((KNOWN_KEYS as readonly string[]).includes(key)) continue
    if (key.startsWith('_')) continue // documented escape hatch, e.g. `_note`
    for (const known of KNOWN_KEYS) {
      if (editDistance(key.toLowerCase(), known) <= 2) {
        errors.push(
          `${path}.${key} is not a known key and looks like a typo for "${known}". ` +
            `Rename it, or prefix it with "_" if it is deliberate metadata.`,
        )
        break
      }
    }
  }
}

function validateOne(raw: unknown, path: string, errors: string[]): SeedSpec | null {
  if (!isObject(raw)) {
    errors.push(`${path} must be an object`)
    return null
  }

  checkKeyTypos(raw, path, errors)

  // A `global` key marks this as a global spec; otherwise it's a collection.
  if ('global' in raw) {
    if (!isNonEmptyString(raw.global)) {
      errors.push(`${path}.global must be a non-empty string`)
    }
    if (!isObject(raw.data)) {
      errors.push(`${path}.data must be an object`)
    }
    if ('collection' in raw) {
      errors.push(`${path} has both "global" and "collection" — use exactly one`)
    }
    const status = parseStatus(raw.status, path, errors)
    if (!isNonEmptyString(raw.global) || !isObject(raw.data)) return null
    return { global: raw.global, data: raw.data, status }
  }

  if (!isNonEmptyString(raw.collection)) {
    errors.push(`${path}.collection must be a non-empty string (or set "global")`)
  }
  if (!isObject(raw.data)) {
    errors.push(`${path}.data must be an object`)
  }
  let identity = 'slug'
  if (raw.identity !== undefined && raw.identity !== null) {
    if (isNonEmptyString(raw.identity)) identity = raw.identity
    else errors.push(`${path}.identity must be a non-empty string`)
  }
  // The identity value must be present in data for idempotent upsert.
  if (isObject(raw.data)) {
    const idVal = raw.data[identity]
    if (idVal === undefined || idVal === null || idVal === '') {
      errors.push(`${path}.data.${identity} is required (the upsert identity value)`)
    } else if (typeof idVal !== 'string' && typeof idVal !== 'number') {
      errors.push(`${path}.data.${identity} must be a string or number`)
    }
  }
  const status = parseStatus(raw.status, path, errors)
  if (!isNonEmptyString(raw.collection) || !isObject(raw.data)) return null
  return { collection: raw.collection, identity, data: raw.data, status }
}

/**
 * Validate untrusted parsed JSON into an ordered list of specs. A bare object
 * is treated as a single-element list. Collects all problems before returning.
 */
export function validateSpecs(raw: unknown): ValidationResult {
  const errors: string[] = []
  const specs: SeedSpec[] = []

  const items = Array.isArray(raw) ? raw : [raw]
  if (Array.isArray(raw) && raw.length === 0) {
    return { ok: false, errors: ['spec array is empty — nothing to seed'] }
  }

  items.forEach((item, i) => {
    const path = Array.isArray(raw) ? `specs[${i}]` : 'spec'
    const spec = validateOne(item, path, errors)
    if (spec) specs.push(spec)
  })

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, value: specs }
}

/**
 * Resolve a spec's publish state against the global `--draft` flag.
 *
 * `--draft` forces publishing OFF. It must NOT also force UNPUBLISHING off.
 * Collapsing an `unpublished` spec into `draft` writes with `?draft=true`,
 * which stages a version and leaves the live document UP — the exact failure
 * the third state exists to close (P5-29), reached through the flag instead of
 * the file. An `unpublished` spec is already not publishing anything, so
 * `--draft` has nothing to force there.
 */
export const resolveStatus = (forceDraft: boolean, specStatus: SeedStatus): SeedStatus =>
  forceDraft && specStatus !== 'unpublished' ? 'draft' : specStatus
