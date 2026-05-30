import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'

import { getPayload, type Payload } from 'payload'

import config from '../../payload.config'
import type { Homepage, SiteSetting } from '../../payload-types'

import { createMigrationLogger, type MigrationLogger } from './log'
import { parseCaseStudies } from './parsers/caseStudies'
import { parseHomepage } from './parsers/homepage'
import { parsePages } from './parsers/pages'
import { parsePosts } from './parsers/posts'
import { parseSiteSettings } from './parsers/siteSettings'
import { upsertBySlug, type UpsertResult } from './upsert'

/**
 * Seed CLI entry per `contracts/seed-cli.md`. Idempotent: re-running
 * upserts existing rows by slug rather than creating duplicates (FR-030,
 * SC-004). Reads audit JSON from `AUDIT_DIR` (default
 * `~/projects/seqtek-internal/audit`). Writes content gaps to
 * `./migration-errors.log` per R-16; dry-run prints planned upserts to
 * stdout as JSON-Lines and performs no writes.
 */

interface ParsedArgs {
  dryRun: boolean
  collection: CollectionFilter | null
  recrawlImages: boolean
  help: boolean
  unknown: string[]
}

type CollectionFilter = 'caseStudies' | 'pages' | 'posts' | 'homepage' | 'siteSettings'

const VALID_COLLECTION_FILTERS: ReadonlyArray<CollectionFilter> = [
  'caseStudies',
  'pages',
  'posts',
  'homepage',
  'siteSettings',
]

function parseArgs(argv: readonly string[]): ParsedArgs {
  const out: ParsedArgs = {
    dryRun: false,
    collection: null,
    recrawlImages: false,
    help: false,
    unknown: [],
  }
  for (const arg of argv) {
    if (arg === '--dry-run') out.dryRun = true
    else if (arg === '--recrawl-images') out.recrawlImages = true
    else if (arg === '--help' || arg === '-h') out.help = true
    else if (arg.startsWith('--collection=')) {
      const value = arg.slice('--collection='.length) as CollectionFilter
      if (!VALID_COLLECTION_FILTERS.includes(value)) {
        out.unknown.push(arg)
      } else {
        out.collection = value
      }
    } else if (arg.length > 0) {
      out.unknown.push(arg)
    }
  }
  return out
}

const USAGE = `Usage: npx tsx src/payload/seed/migrateFromAudit.ts [flags]

Flags:
  --dry-run             Print planned upserts as JSON-Lines; perform no writes.
  --collection=<name>   Limit to one of: ${VALID_COLLECTION_FILTERS.join(', ')}.
  --recrawl-images      Enable the per-record image download/upload path (R-10).
  --help, -h            Show this help and exit 0.

Environment:
  AUDIT_DIR             Path to Wix audit JSON (default: ~/projects/seqtek-internal/audit).
  DATABASE_URL          Postgres connection string (required unless --dry-run).
  PAYLOAD_SECRET        Payload's signing secret (required unless --dry-run).
  S3_BUCKET             Optional; falls back to local FS storage when unset.
`

const REQUIRED_ENV_KEYS = ['DATABASE_URL', 'PAYLOAD_SECRET'] as const

export interface SeedRunSummary {
  exitCode: number
  results: UpsertResult[]
  logger: MigrationLogger
  collectionsProcessed: CollectionFilter[]
}

export interface RunSeedOptions {
  argv?: readonly string[]
  /** Override the audit directory (defaults to env / canonical home path). */
  auditDir?: string
  /** Override the migration-errors.log path (defaults to repo root). */
  logPath?: string
  /** Override the Payload instance (tests pass their testcontainer-backed one). */
  payload?: Payload
  /** Override process.env for tests. */
  env?: Record<string, string | undefined>
  stdout?: (line: string) => void
  stderr?: (line: string) => void
  /** Stable timestamp for deterministic tests. */
  now?: Date
}

function defaultAuditDir(env: Record<string, string | undefined>): string {
  const raw = env.AUDIT_DIR
  if (!raw) return resolve(homedir(), 'projects/seqtek-internal/audit')
  if (raw === '~') return homedir()
  if (raw.startsWith('~/')) return resolve(homedir(), raw.slice(2))
  return resolve(raw)
}

function readJson<T>(path: string): T {
  const raw = readFileSync(path, 'utf8')
  return JSON.parse(raw) as T
}

export async function runSeed(options: RunSeedOptions = {}): Promise<SeedRunSummary> {
  const env = options.env ?? process.env
  const stdout = options.stdout ?? ((line: string) => console.log(line))
  const stderr = options.stderr ?? ((line: string) => console.error(line))

  const args = parseArgs(options.argv ?? process.argv.slice(2))
  if (args.help) {
    stdout(USAGE)
    return {
      exitCode: 0,
      results: [],
      logger: createMigrationLogger(
        options.logPath ?? resolve(process.cwd(), 'migration-errors.log'),
        { dryRun: true },
      ),
      collectionsProcessed: [],
    }
  }
  if (args.unknown.length > 0) {
    stderr(`Unknown flag(s): ${args.unknown.join(', ')}\n${USAGE}`)
    return {
      exitCode: 2,
      results: [],
      logger: createMigrationLogger(
        options.logPath ?? resolve(process.cwd(), 'migration-errors.log'),
        { dryRun: true },
      ),
      collectionsProcessed: [],
    }
  }

  if (!args.dryRun) {
    const missing = REQUIRED_ENV_KEYS.filter((key) => !env[key])
    if (missing.length > 0 && !options.payload) {
      stderr(`Missing required env var(s): ${missing.join(', ')}`)
      return {
        exitCode: 1,
        results: [],
        logger: createMigrationLogger(
          options.logPath ?? resolve(process.cwd(), 'migration-errors.log'),
          { dryRun: true },
        ),
        collectionsProcessed: [],
      }
    }
  }

  const auditDir = options.auditDir ?? defaultAuditDir(env)
  if (!existsSync(auditDir)) {
    stderr(`Audit directory not found: ${auditDir}`)
    return {
      exitCode: 1,
      results: [],
      logger: createMigrationLogger(
        options.logPath ?? resolve(process.cwd(), 'migration-errors.log'),
        { dryRun: true },
      ),
      collectionsProcessed: [],
    }
  }

  const logger = createMigrationLogger(
    options.logPath ?? resolve(process.cwd(), 'migration-errors.log'),
    { dryRun: args.dryRun, nowFn: options.now ? () => options.now! : undefined },
  )

  if (args.recrawlImages) {
    stderr(
      '--recrawl-images requested; Phase 2 ships the flag wiring only — image re-crawl execution lands post-Phase-2 (R-10).',
    )
  }

  const payload = options.payload ?? (await getPayload({ config: await config }))

  const filter = args.collection
  const collectionsProcessed: CollectionFilter[] = []
  const results: UpsertResult[] = []

  // Case studies
  if (!filter || filter === 'caseStudies') {
    const path = resolve(auditDir, 'case-studies-content.json')
    try {
      const raw = readJson<Record<string, string>>(path)
      const parsed = parseCaseStudies(raw, { logger, now: options.now })
      collectionsProcessed.push('caseStudies')
      let created = 0
      let updated = 0
      for (const doc of parsed) {
        const result = await upsertBySlug({
          payload,
          collection: 'caseStudies',
          slug: doc.slug,
          data: {
            slug: doc.slug,
            title: doc.title,
            subtitle: doc.subtitle,
            problem: doc.problem,
            solution: doc.solution,
            impact: doc.impact,
            client: doc.client,
            technologies: doc.technologies,
            metrics: doc.metrics,
            publishedAt: doc.publishedAt,
          },
          dryRun: args.dryRun,
          logger,
        })
        results.push(result)
        if (result.operation === 'create') created++
        if (result.operation === 'update') updated++
        if (args.dryRun) stdout(JSON.stringify({ ...result, collection: 'caseStudies' }))
      }
      stdout(
        `caseStudies: ${parsed.length} processed, ${created} created, ${updated} updated, ${parsed.length - created - updated} skipped`,
      )
    } catch (err) {
      stderr(`caseStudies parse failed at ${path}: ${(err as Error).message}`)
      return { exitCode: 3, results, logger, collectionsProcessed }
    }
  }

  // Pages
  if (!filter || filter === 'pages') {
    const pagesPath = resolve(auditDir, 'case-studies.json')
    const retryPath = resolve(auditDir, 'retry-content.json')
    let activePath = pagesPath
    try {
      const pagesAudit = readJson<Record<string, string>>(pagesPath)
      activePath = retryPath
      const retryAudit = existsSync(retryPath) ? readJson<Record<string, string>>(retryPath) : {}
      const parsed = parsePages({ pagesAudit, retryAudit, logger, now: options.now })
      collectionsProcessed.push('pages')
      let created = 0
      let updated = 0
      for (const doc of parsed) {
        const result = await upsertBySlug({
          payload,
          collection: 'pages',
          slug: doc.slug,
          data: {
            slug: doc.slug,
            title: doc.title,
            publishedAt: doc.publishedAt,
            hero: doc.hero,
            layout: doc.layout,
          },
          dryRun: args.dryRun,
          logger,
        })
        results.push(result)
        if (result.operation === 'create') created++
        if (result.operation === 'update') updated++
        if (args.dryRun) stdout(JSON.stringify({ ...result, collection: 'pages' }))
      }
      stdout(
        `pages: ${parsed.length} processed, ${created} created, ${updated} updated, ${parsed.length - created - updated} skipped`,
      )
    } catch (err) {
      stderr(`pages parse failed at ${activePath}: ${(err as Error).message}`)
      return { exitCode: 3, results, logger, collectionsProcessed }
    }
  }

  // Homepage (global)
  if (!filter || filter === 'homepage') {
    const path = resolve(auditDir, 'page-content.json')
    try {
      const all = readJson<Record<string, string>>(path)
      const homeBody = all['/']
      if (!homeBody) throw new Error('homepage entry "/" missing from page-content.json')
      const data = parseHomepage({ homepageContent: homeBody, logger })
      collectionsProcessed.push('homepage')
      if (args.dryRun) {
        stdout(JSON.stringify({ collection: 'homepage', operation: 'update', data }))
      } else {
        await payload.updateGlobal({
          slug: 'homepage',
          data: data as Partial<Homepage>,
          overrideAccess: true,
          draft: true,
        })
      }
      stdout('homepage: 1 processed, 1 updated')
    } catch (err) {
      stderr(`homepage parse failed at ${path}: ${(err as Error).message}`)
      return { exitCode: 3, results, logger, collectionsProcessed }
    }
  }

  // Posts (after homepage so dryRun output groups blog stubs near homepage prose)
  if (!filter || filter === 'posts') {
    const path = resolve(auditDir, 'page-content.json')
    try {
      const all = readJson<Record<string, string>>(path)
      const blogBody = all['/blog-old'] ?? ''
      const parsed = parsePosts({ blogPageContent: blogBody, logger, now: options.now })
      collectionsProcessed.push('posts')
      let created = 0
      let updated = 0
      for (const doc of parsed) {
        const result = await upsertBySlug({
          payload,
          collection: 'posts',
          slug: doc.slug,
          data: {
            slug: doc.slug,
            title: doc.title,
            excerpt: doc.excerpt,
            content: doc.content,
            publishedAt: doc.publishedAt,
          },
          dryRun: args.dryRun,
          logger,
        })
        results.push(result)
        if (result.operation === 'create') created++
        if (result.operation === 'update') updated++
        if (args.dryRun) stdout(JSON.stringify({ ...result, collection: 'posts' }))
      }
      stdout(
        `posts: ${parsed.length} processed, ${created} created, ${updated} updated, ${parsed.length - created - updated} skipped`,
      )
    } catch (err) {
      stderr(`posts parse failed at ${path}: ${(err as Error).message}`)
      return { exitCode: 3, results, logger, collectionsProcessed }
    }
  }

  // SiteSettings (global)
  if (!filter || filter === 'siteSettings') {
    try {
      const data = parseSiteSettings({ logger })
      collectionsProcessed.push('siteSettings')
      if (args.dryRun) {
        stdout(JSON.stringify({ collection: 'siteSettings', operation: 'update', data }))
      } else {
        await payload.updateGlobal({
          slug: 'siteSettings',
          data: data as Partial<SiteSetting>,
          overrideAccess: true,
          draft: true,
        })
      }
      stdout('siteSettings: 1 processed, 1 updated')
    } catch (err) {
      stderr(`siteSettings update failed: ${(err as Error).message}`)
      return { exitCode: 4, results, logger, collectionsProcessed }
    }
  }

  stdout(
    `Done. ${args.dryRun ? 'No writes performed (--dry-run).' : `Errors logged to ${logger.filePath}`}`,
  )
  return { exitCode: 0, results, logger, collectionsProcessed }
}

// CLI bootstrap — skipped when imported as a module by tests.
const invokedDirectly = (() => {
  const entry = process.argv[1]
  if (!entry) return false
  return entry.endsWith('migrateFromAudit.ts') || entry.endsWith('migrateFromAudit.js')
})()

if (invokedDirectly) {
  runSeed()
    .then((summary) => {
      process.exit(summary.exitCode)
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
