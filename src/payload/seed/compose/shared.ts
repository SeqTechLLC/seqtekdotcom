import { resolve } from 'node:path'

import type { CollectionSlug, Payload } from 'payload'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { createMigrationLogger, type MigrationLogger } from '../log'
import { buildLexical } from '../showcase/lexical'
import { upsertBySlug, type UpsertResult } from '../upsert'

// ---------------------------------------------------------------------------
// Field → layout composer shared helpers (spec 010 / ADR 0009, contract
// migration-fidelity.md). The per-type composers (workshopToLayout.ts etc.)
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

export interface ComposeContext {
  logger: MigrationLogger
}

export interface RunComposerOptions {
  /** Collection whose records are composed (e.g. 'workshops'). */
  collection: CollectionSlug
  /** Per-record transform: discrete fields → ordered layout blocks. */
  compose: (record: Record<string, unknown>, ctx: ComposeContext) => LayoutBlock[]
  argv?: readonly string[]
  /** Override the Payload instance (tests pass their testcontainer-backed one). */
  payload?: Payload
  /** Override process.env for tests. */
  env?: Record<string, string | undefined>
  /** Override the migration-errors.log path (defaults to repo root). */
  logPath?: string
  stdout?: (line: string) => void
  stderr?: (line: string) => void
  /** Stable timestamp for deterministic tests. */
  now?: Date
}

export interface ComposeRunSummary {
  exitCode: number
  results: UpsertResult[]
  logger: MigrationLogger
}

const REQUIRED_ENV_KEYS = ['DATABASE_URL', 'PAYLOAD_SECRET'] as const

/**
 * Run a field→layout composer over every record of a collection. Mirrors
 * `migrateFromAudit.runSeed`'s contract: env-gated, `--dry-run` emits
 * JSON-Lines plans to stdout and performs zero writes, gaps log via the
 * shared migration logger. Published source records keep a published layout
 * (so the `RenderBlocks` route switch is non-breaking); drafts stay drafts.
 */
export async function runComposer(options: RunComposerOptions): Promise<ComposeRunSummary> {
  const env = options.env ?? process.env
  const stdout = options.stdout ?? ((line: string) => console.log(line))
  const stderr = options.stderr ?? ((line: string) => console.error(line))
  const argv = options.argv ?? process.argv.slice(2)
  const dryRun = argv.includes('--dry-run')

  const logger = createMigrationLogger(
    options.logPath ?? resolve(process.cwd(), 'migration-errors.log'),
    { dryRun, nowFn: options.now ? () => options.now! : undefined },
  )

  if (!options.payload) {
    const missing = REQUIRED_ENV_KEYS.filter((key) => !env[key])
    if (missing.length > 0) {
      stderr(`Missing required env var(s): ${missing.join(', ')}`)
      return { exitCode: 1, results: [], logger }
    }
  }

  let payload = options.payload
  if (!payload) {
    const { getPayload } = await import('payload')
    const { default: config } = await import('../../../payload.config')
    payload = await getPayload({ config: await config })
  }

  // Read published main rows (draft:false) at depth 0 so media/relations come
  // back as ids ready to drop straight into block fields. draft:false (not
  // draft:true) migrates the LIVE published content and — unlike a version-table
  // read — works for a collection that just had drafts enabled and has no
  // version snapshots yet (teamMembers, Phase E). Unpublished drafts have no
  // live body to migrate; the composer is re-runnable when they publish.
  const { docs } = await payload.find({
    collection: options.collection,
    overrideAccess: true,
    draft: false,
    depth: 0,
    limit: 1000,
    pagination: false,
  })

  const summary = dryRun ? stderr : stdout
  const results: UpsertResult[] = []
  let created = 0
  let updated = 0

  for (const record of docs as unknown as Array<Record<string, unknown>>) {
    const slug = typeof record.slug === 'string' ? record.slug : ''
    if (!slug) {
      logger.log({
        level: 'ERROR',
        kind: 'PARSE_ERROR',
        collection: options.collection,
        slug: '<empty>',
        detail: 'record has no slug; skipped',
      })
      continue
    }
    const layout = options.compose(record, { logger })
    const wasPublished = record._status === 'published'
    let result
    try {
      result = await upsertBySlug({
        payload,
        collection: options.collection,
        slug,
        data: { slug, layout },
        dryRun,
        draft: !wasPublished,
        logger,
      })
    } catch (err) {
      // A single bad record (e.g. a block field that fails validation on
      // publish) must not abort the whole migration — log and continue.
      logger.log({
        level: 'ERROR',
        kind: 'PARSE_ERROR',
        collection: options.collection,
        slug,
        detail: `compose write failed: ${(err as Error).message}`,
      })
      continue
    }
    results.push(result)
    if (result.operation === 'create') created++
    if (result.operation === 'update') updated++
    if (dryRun) {
      stdout(
        JSON.stringify({
          collection: options.collection,
          slug,
          operation: result.operation,
          blockTypes: layout.map((b) => b.blockType),
        }),
      )
    }
  }

  summary(
    `${options.collection}: ${docs.length} processed, ${created} created, ${updated} updated` +
      (dryRun ? ' (--dry-run, no writes)' : `, errors logged to ${logger.filePath}`),
  )
  return { exitCode: 0, results, logger }
}
