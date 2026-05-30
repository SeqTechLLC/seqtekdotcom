import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

export type MigrationErrorLevel = 'INFO' | 'WARN' | 'ERROR'

/**
 * Closed enum of gap kinds the seed pipeline can surface. Tests assert one
 * line per kind per record after a fresh run (T096 / SC-011) so adding a
 * new kind here is the same as adding a new content-gap category — update
 * `docs/CONTENT_MIGRATION.md` §11 in the same PR.
 */
export type MigrationErrorKind =
  | 'MISSING_IMAGE'
  | 'MISSING_ALT'
  | 'MISSING_TESTIMONIAL'
  | 'CONTENT_MISMATCH'
  | 'STATS_CONFLICT'
  | 'ADDRESS_DISCREPANCY'
  | 'TECH_CLEANUP'
  | 'PARSE_ERROR'
  | 'AUDIT_GAP'

export interface MigrationErrorEntry {
  level: MigrationErrorLevel
  kind: MigrationErrorKind
  collection: string
  slug: string
  detail: string
}

export interface MigrationLoggerOptions {
  /** When true, entries are collected in memory but not written to disk. */
  dryRun?: boolean
  /** Override the clock for deterministic tests. */
  nowFn?: () => Date
}

export interface MigrationLogger {
  log(entry: MigrationErrorEntry): void
  entries(): readonly MigrationErrorEntry[]
  filePath: string
  dryRun: boolean
}

/**
 * Append-only structured-log writer per R-16. One line per gap, format:
 * `${timestamp} ${level} ${kind} ${collection}/${slug} ${detail}`.
 */
export function createMigrationLogger(
  filePath: string,
  options: MigrationLoggerOptions = {},
): MigrationLogger {
  const absolute = resolve(filePath)
  const dryRun = options.dryRun ?? false
  const now = options.nowFn ?? (() => new Date())
  if (!dryRun) {
    mkdirSync(dirname(absolute), { recursive: true })
  }
  const collected: MigrationErrorEntry[] = []

  return {
    filePath: absolute,
    dryRun,
    log(entry) {
      collected.push(entry)
      if (dryRun) return
      const detail = entry.detail.replace(/\s+/g, ' ').trim()
      const line = `${now().toISOString()} ${entry.level} ${entry.kind} ${entry.collection}/${entry.slug} ${detail}\n`
      appendFileSync(absolute, line, 'utf8')
    },
    entries() {
      return collected
    },
  }
}
