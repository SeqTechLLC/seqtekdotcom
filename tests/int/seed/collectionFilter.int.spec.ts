import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '../../../src/payload.config'
import { runSeed } from '../../../src/payload/seed/migrateFromAudit'
import { FIXTURE_EXPECTED_POST_SLUGS, writeAuditFixture } from '../../helpers/seedFixtures'

/**
 * T095 / FR-033: `--collection=<name>` narrows the seed to a single
 * collection. Verified by running with `--collection=posts` and asserting
 * no caseStudies / pages were touched.
 */

let payload: Payload
const fixture = writeAuditFixture()

beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

afterAll(async () => {
  await payload.delete({
    collection: 'posts',
    where: { slug: { in: [...FIXTURE_EXPECTED_POST_SLUGS] } },
    overrideAccess: true,
  })
  fixture.cleanup()
})

describe('seed --collection=<name> (T095 / FR-033)', () => {
  it('--collection=posts only writes posts, leaves everything else untouched', async () => {
    const before = await snapshot(payload)
    const summary = await runSeed({
      argv: ['--collection=posts'],
      auditDir: fixture.auditDir,
      logPath: fixture.logPath,
      payload,
      stdout: () => {},
      stderr: () => {},
    })
    expect(summary.exitCode).toBe(0)
    expect(summary.collectionsProcessed).toEqual(['posts'])

    const after = await snapshot(payload)
    expect(after.caseStudies).toBe(before.caseStudies)
    expect(after.pages).toBe(before.pages)
    expect(after.posts).toBeGreaterThan(before.posts)
  })

  it('--collection=unknown exits 2 with a usage message', async () => {
    const stderr: string[] = []
    const summary = await runSeed({
      argv: ['--collection=services'],
      auditDir: fixture.auditDir,
      logPath: fixture.logPath,
      payload,
      stdout: () => {},
      stderr: (line) => stderr.push(line),
    })
    expect(summary.exitCode).toBe(2)
    expect(stderr.some((line) => line.includes('Unknown flag'))).toBe(true)
  })
})

async function snapshot(p: Payload) {
  const c = await p.count({ collection: 'caseStudies', overrideAccess: true })
  const pg = await p.count({ collection: 'pages', overrideAccess: true })
  const po = await p.count({ collection: 'posts', overrideAccess: true })
  return { caseStudies: c.totalDocs, pages: pg.totalDocs, posts: po.totalDocs }
}
