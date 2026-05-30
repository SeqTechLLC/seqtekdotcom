import { existsSync } from 'node:fs'

import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '../../../src/payload.config'
import { runSeed } from '../../../src/payload/seed/migrateFromAudit'
import { writeAuditFixture } from '../../helpers/seedFixtures'

/**
 * T094 / FR-033: `--dry-run` prints planned upserts to stdout and writes
 * nothing — no DB rows, no migration-errors.log file. Compares pre/post
 * row counts to assert zero writes against the testcontainer Postgres.
 */

let payload: Payload
const fixture = writeAuditFixture()

beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

afterAll(() => {
  fixture.cleanup()
})

describe('seed --dry-run (T094 / FR-033)', () => {
  it('emits JSON-Lines stdout and performs zero writes', async () => {
    const before = await snapshot(payload)
    const stdout: string[] = []
    const stderr: string[] = []

    const summary = await runSeed({
      argv: ['--dry-run'],
      auditDir: fixture.auditDir,
      logPath: fixture.logPath,
      payload,
      stdout: (line) => stdout.push(line),
      stderr: (line) => stderr.push(line),
    })
    expect(summary.exitCode).toBe(0)
    expect(summary.logger.dryRun).toBe(true)

    const after = await snapshot(payload)
    expect(after).toEqual(before)

    // migration-errors.log is not written on dry-run.
    expect(existsSync(fixture.logPath)).toBe(false)

    // At least one JSON-Lines plan per processed collection.
    const jsonLines = stdout.filter((line) => line.trim().startsWith('{'))
    expect(jsonLines.length).toBeGreaterThan(0)
    for (const line of jsonLines) {
      expect(() => JSON.parse(line)).not.toThrow()
    }

    // A summary line ends the run; "Done." is the marker.
    expect(stdout.some((line) => line.startsWith('Done.'))).toBe(true)
  })
})

async function snapshot(p: Payload) {
  const c = await p.count({ collection: 'caseStudies', overrideAccess: true })
  const pg = await p.count({ collection: 'pages', overrideAccess: true })
  const po = await p.count({ collection: 'posts', overrideAccess: true })
  return { caseStudies: c.totalDocs, pages: pg.totalDocs, posts: po.totalDocs }
}
