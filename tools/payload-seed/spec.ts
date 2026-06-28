/**
 * Spec format + shape validation for the generic Payload seeder.
 *
 * A seed file is one spec or an array of specs. Each spec upserts a single
 * collection document (idempotent by an identity field, default `slug`) or a
 * global. Field values may carry directives (`$ref` / `$file` / `$lexical`)
 * resolved at write time — directive shapes are validated lazily in
 * `resolve.ts`, since `data` is free-form per collection. This module only
 * validates the spec envelope, collecting every problem in one pass (mirrors
 * `validateInput` in tools/import-case-study/types.ts).
 */

export type SeedStatus = 'published' | 'draft'

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
  if (value === 'published' || value === 'draft') return value
  errors.push(`${path}.status must be "published" or "draft"`)
  return 'published'
}

function validateOne(raw: unknown, path: string, errors: string[]): SeedSpec | null {
  if (!isObject(raw)) {
    errors.push(`${path} must be an object`)
    return null
  }

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
