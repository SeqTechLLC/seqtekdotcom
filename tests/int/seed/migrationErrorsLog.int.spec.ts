import { readFileSync } from 'node:fs'

import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '../../../src/payload.config'
import { runSeed } from '../../../src/payload/seed/migrateFromAudit'
import {
  FIXTURE_EXPECTED_CASE_SLUGS,
  FIXTURE_EXPECTED_PAGE_SLUGS,
  FIXTURE_EXPECTED_POST_SLUGS,
  writeAuditFixture,
} from '../../helpers/seedFixtures'

/**
 * T096 / SC-011 / FR-032: a fresh seed run enumerates every known
 * content gap from `docs/CONTENT_MIGRATION.md` §11 in
 * `migration-errors.log`. Each line follows the R-16 format
 * `${timestamp} ${level} ${kind} ${collection}/${slug} ${detail}`.
 */

let payload: Payload
const fixture = writeAuditFixture()

beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

afterAll(async () => {
  for (const slug of FIXTURE_EXPECTED_CASE_SLUGS) {
    await payload.delete({
      collection: 'caseStudies',
      where: { slug: { equals: slug } },
      overrideAccess: true,
    })
  }
  for (const slug of FIXTURE_EXPECTED_PAGE_SLUGS) {
    await payload.delete({
      collection: 'pages',
      where: { slug: { equals: slug } },
      overrideAccess: true,
    })
  }
  await payload.delete({
    collection: 'posts',
    where: { slug: { in: [...FIXTURE_EXPECTED_POST_SLUGS] } },
    overrideAccess: true,
  })
  fixture.cleanup()
})

describe('migration-errors.log (T096 / SC-011 / FR-032)', () => {
  it('captures every CONTENT_MIGRATION §11 gap category after a fresh run', async () => {
    const summary = await runSeed({
      argv: [],
      auditDir: fixture.auditDir,
      logPath: fixture.logPath,
      payload,
      stdout: () => {},
      stderr: () => {},
      now: new Date('2026-05-30T12:00:00.000Z'),
    })
    expect(summary.exitCode).toBe(0)

    const log = readFileSync(fixture.logPath, 'utf8').trim()
    const lines = log.split('\n').filter(Boolean)
    expect(lines.length).toBeGreaterThan(0)

    // R-16 format: ISO-8601 timestamp LEVEL KIND collection/slug detail...
    const lineRe =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z (INFO|WARN|ERROR) [A-Z_]+ [^/\s]+\/\S+ .+$/
    for (const line of lines) {
      expect(line, `line did not match R-16: ${line}`).toMatch(lineRe)
    }

    // Required gap categories per CONTENT_MIGRATION §11.
    const requiredKinds = [
      'CONTENT_MISMATCH', // driving-innovation → healthcare-ux-redesign
      'MISSING_TESTIMONIAL', // all 8 case studies
      'STATS_CONFLICT', // homepage vs about
      'TECH_CLEANUP', // tech tags need cleanup
      'ADDRESS_DISCREPANCY', // privacy policy address discrepancy
      'MISSING_IMAGE', // every record's image fields
    ] as const

    for (const kind of requiredKinds) {
      expect(
        lines.some((line) => line.includes(` ${kind} `)),
        `expected ${kind} log line`,
      ).toBe(true)
    }

    // CONTENT_MISMATCH specifically must reference the rewritten slug
    // (healthcare-ux-redesign), not the source slug
    // (driving-innovation-case-study).
    expect(
      lines.find((line) => line.includes(' CONTENT_MISMATCH '))?.includes('healthcare-ux-redesign'),
    ).toBe(true)
  })
})
