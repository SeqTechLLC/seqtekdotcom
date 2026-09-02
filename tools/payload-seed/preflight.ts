/**
 * Pre-flight: walk every spec's data for directive STRUCTURE before the driver
 * opens its loop, with no network calls.
 *
 * Why this exists. `validateSpecs` checked the envelope (collection, identity,
 * data, status) up front, but every directive shape check lived inside the
 * resolver — which runs per spec, interleaved with writes. So a malformed
 * `$file` in spec 19 of 20 was discovered *after* eighteen documents had been
 * written, and the README's promise that "authoring mistakes surface even
 * without a token" was only half true. Nothing about these checks needs a
 * server: they are shape, not existence.
 *
 * The distinction this file draws, and keeps drawing:
 *
 *   - STRUCTURE — is `$ref.collection` a non-empty string, does `$file` set
 *     exactly one of path/url, does `$file.alt` exist, is `$lexical` a string.
 *     Knowable offline. Belongs here, before the first write.
 *   - EXISTENCE — does that slug resolve, is that media already uploaded.
 *     Needs the server. Stays in the resolver.
 *
 * Local `$file.path` is the one existence check that IS offline, so it is done
 * here too: a missing asset is the most common authoring mistake after a typo,
 * and finding it after a partial write helps nobody.
 */

import { access } from 'node:fs/promises'
import { isAbsolute, resolve as resolvePath } from 'node:path'

import type { SeedSpec } from './spec'
import { isGlobalSpec } from './spec'

const DIRECTIVE_KEYS = ['$ref', '$file', '$lexical'] as const
type DirectiveKey = (typeof DIRECTIVE_KEYS)[number]

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

/** Local `$file.path` values found while walking, for the disk check below. */
interface Found {
  path: string
  where: string
}

function checkRef(node: Record<string, unknown>, where: string, errors: string[]): void {
  const raw = node.$ref
  if (!isObject(raw)) {
    errors.push(`${where}: $ref value must be an object`)
    return
  }
  if (!isNonEmptyString(raw.collection)) {
    errors.push(`${where}: $ref.collection must be a non-empty string`)
  }
  if (!isNonEmptyString(raw.field)) {
    errors.push(`${where}: $ref.field must be a non-empty string`)
  }
  const value = raw.value
  const values = Array.isArray(value) ? value : [value]
  if (values.length === 0) {
    errors.push(`${where}: $ref.value must not be empty`)
  }
  for (const v of values) {
    if (typeof v !== 'string' && typeof v !== 'number') {
      errors.push(`${where}: $ref.value must be a string/number or an array of them`)
      break
    }
  }
  if (raw.createIfMissing !== undefined && !isObject(raw.createIfMissing)) {
    errors.push(`${where}: $ref.createIfMissing must be an object`)
  }
  if (raw.createIfMissing !== undefined && raw.omitIfMissing === true) {
    errors.push(`${where}: $ref sets both createIfMissing and omitIfMissing — use one`)
  }
}

function checkFile(
  node: Record<string, unknown>,
  where: string,
  errors: string[],
  found: Found[],
): void {
  const raw = node.$file
  if (!isObject(raw)) {
    errors.push(`${where}: $file value must be an object`)
    return
  }
  const hasPath = isNonEmptyString(raw.path)
  const hasUrl = isNonEmptyString(raw.url)
  if (hasPath === hasUrl) {
    errors.push(`${where}: $file must set exactly one of "path" or "url"`)
  }
  if (!isNonEmptyString(raw.alt)) {
    errors.push(`${where}: $file.alt is required (media alt text is mandatory)`)
  }
  if (hasUrl) {
    try {
      new URL(raw.url as string)
    } catch {
      errors.push(`${where}: $file.url is not a valid URL`)
    }
  }
  if (hasPath) found.push({ path: raw.path as string, where })
}

function walk(node: unknown, where: string, errors: string[], found: Found[]): void {
  if (Array.isArray(node)) {
    node.forEach((child, i) => walk(child, `${where}[${i}]`, errors, found))
    return
  }
  if (!isObject(node)) return

  const present = DIRECTIVE_KEYS.filter((k) => k in node)
  if (present.length > 0) {
    // Same rule the resolver enforces: a directive object carries exactly the
    // one key, so `{ "$ref": {...}, "note": "..." }` is an error rather than a
    // silent misparse.
    if (present.length > 1 || Object.keys(node).length !== 1) {
      errors.push(
        `${where}: malformed directive — an object with ${present.join(' + ')} must contain exactly that one key`,
      )
      return
    }
    const key = present[0] as DirectiveKey
    if (key === '$ref') checkRef(node, where, errors)
    else if (key === '$file') checkFile(node, where, errors, found)
    else if (key === '$lexical' && typeof node.$lexical !== 'string') {
      errors.push(`${where}: $lexical value must be a string`)
    }
    return
  }

  for (const [k, v] of Object.entries(node)) walk(v, `${where}.${k}`, errors, found)
}

export interface PreflightResult {
  errors: string[]
}

/**
 * Check every spec's directives for structure, and every local `$file.path`
 * for existence on disk. Collects ALL problems rather than throwing on the
 * first, so one run tells the author everything to fix.
 *
 * `baseDir` resolves relative `$file.path` values the same way the resolver
 * does — relative to the process cwd.
 */
export async function preflight(specs: SeedSpec[], baseDir: string): Promise<PreflightResult> {
  const errors: string[] = []
  const found: Found[] = []

  specs.forEach((spec, i) => {
    const label = isGlobalSpec(spec)
      ? `specs[${i}] global:${spec.global}`
      : `specs[${i}] ${spec.collection}:${String(spec.data[spec.identity] ?? '?')}`
    walk(spec.data, `${label}.data`, errors, found)
  })

  // Deduplicate: one missing asset referenced by six documents is one problem,
  // and six copies of it buries the other five.
  const seen = new Map<string, string[]>()
  for (const f of found) {
    const abs = isAbsolute(f.path) ? f.path : resolvePath(baseDir, f.path)
    const list = seen.get(abs) ?? []
    list.push(f.where)
    seen.set(abs, list)
  }
  await Promise.all(
    [...seen.entries()].map(async ([abs, wheres]) => {
      try {
        await access(abs)
      } catch {
        const extra = wheres.length > 1 ? ` (referenced by ${wheres.length} specs)` : ''
        errors.push(`${wheres[0]}: $file.path does not exist on disk: ${abs}${extra}`)
      }
    }),
  )

  return { errors }
}
