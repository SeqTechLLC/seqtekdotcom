import { readFileSync } from 'node:fs'

import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '../../../src/payload.config'
import { runSeed } from '../../../src/payload/seed/migrateFromAudit'
import {
  FIXTURE_EXPECTED_CASE_SLUGS,
  FIXTURE_EXPECTED_PAGE_SLUGS,
  writeAuditFixture,
} from '../../helpers/seedFixtures'

/**
 * T092 / SC-004 / FR-030: run the seed twice against the same testcontainer
 * Postgres and assert row counts equal across runs. The same is also true
 * for the two globals — content updates in place but no extra rows are
 * created.
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
  await payload.delete({ collection: 'posts', where: {}, overrideAccess: true })
  fixture.cleanup()
})

const stdout: string[] = []
const stderr: string[] = []
const captureStdout = (line: string) => stdout.push(line)
const captureStderr = (line: string) => stderr.push(line)

describe('seed idempotency (T092 / SC-004 / FR-030)', () => {
  it('two consecutive runs produce equal row counts across collections', async () => {
    const first = await runSeed({
      argv: [],
      auditDir: fixture.auditDir,
      logPath: fixture.logPath,
      payload,
      stdout: captureStdout,
      stderr: captureStderr,
    })
    expect(first.exitCode).toBe(0)

    const countsAfterFirst = await collectCounts(payload)

    stdout.length = 0
    stderr.length = 0
    const second = await runSeed({
      argv: [],
      auditDir: fixture.auditDir,
      logPath: fixture.logPath,
      payload,
      stdout: captureStdout,
      stderr: captureStderr,
    })
    expect(second.exitCode).toBe(0)

    const countsAfterSecond = await collectCounts(payload)
    expect(countsAfterSecond).toEqual(countsAfterFirst)

    // And the second pass is all `update`, no `create`.
    for (const result of second.results) {
      expect(result.operation).toBe('update')
    }

    // The fixture-driven counts: 2 case studies, 4 pages, 2 posts.
    expect(countsAfterSecond.caseStudies).toBeGreaterThanOrEqual(2)
    expect(countsAfterSecond.pages).toBeGreaterThanOrEqual(4)
    expect(countsAfterSecond.posts).toBeGreaterThanOrEqual(2)

    // Log file is appended on both runs — proves writes happened — but the
    // collection-level row counts above are the load-bearing assertion.
    const log = readFileSync(fixture.logPath, 'utf8')
    expect(log.split('\n').filter(Boolean).length).toBeGreaterThan(0)
  })
})

async function collectCounts(p: Payload) {
  const caseStudies = await p.count({ collection: 'caseStudies', overrideAccess: true })
  const pages = await p.count({ collection: 'pages', overrideAccess: true })
  const posts = await p.count({ collection: 'posts', overrideAccess: true })
  return {
    caseStudies: caseStudies.totalDocs,
    pages: pages.totalDocs,
    posts: posts.totalDocs,
  }
}
