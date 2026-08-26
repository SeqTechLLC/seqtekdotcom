/**
 * ALB health check endpoint (ARCHITECTURE.md §8).
 *
 * Verifies the Postgres connection by issuing a cheap `count` against the
 * users collection through Payload's existing connection pool — no extra
 * pg client, no transitive-dep imports. Returns 200 when the round-trip
 * succeeds; 503 when it fails so the ALB can stop routing to the instance.
 *
 * Also reports what is running, by all three of its names. They describe ONE
 * artifact — the same ECR digest carries every one of them as a tag:
 *
 *   version  `0.4.0-build.3`  this build's number, BAKED at build time. The
 *                             number you pick from when choosing what to
 *                             release; present on every build.
 *   commit   `ede1ba4`        the exact commit, BAKED. Immutable identity.
 *   release  `v0.4.0`         the release that promoted this image, applied at
 *                             promotion as RUNTIME metadata. Null on a lane
 *                             that has not been released — notably UAT, which
 *                             normally runs ahead of any release.
 *
 * `release` deliberately does not fall back to `version`: claiming a release a
 * lane never received is worse than reporting none.
 *
 * This endpoint is exempt from the Cognito gate, so treat all three as public.
 *
 * Per ERROR_PAGES.md §4 this endpoint must keep returning 200 in
 * maintenance mode so the ALB doesn't start replacing instances during a
 * planned outage. The maintenance-mode short-circuit therefore lives in
 * `src/proxy.ts` (future task) and must allow `/api/health` through.
 */

import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

type HealthBody = {
  status: 'ok' | 'unhealthy'
  version: string
  release: string | null
  commit: string
  uptime: number
  db: 'ok' | 'unreachable'
  timestamp: string
  responseTimeMs: number
}

const NO_STORE: HeadersInit = { 'cache-control': 'no-store' }

// Read once at module load — neither changes while the process lives.
const COMMIT = process.env.BUILD_COMMIT || 'unknown'
const VERSION = process.env.BUILD_VERSION || 'dev'
const RELEASE = process.env.RELEASE_VERSION || null

export async function GET(): Promise<Response> {
  const start = Date.now()
  let db: HealthBody['db'] = 'unreachable'
  let httpStatus = 503

  try {
    const payload = await getPayload({ config: await config })
    await payload.count({ collection: 'users', overrideAccess: true })
    db = 'ok'
    httpStatus = 200
  } catch (error) {
    console.error(
      JSON.stringify({
        type: 'health_check_failed',
        ts: new Date().toISOString(),
        message: error instanceof Error ? error.message : String(error),
      }),
    )
  }

  const body: HealthBody = {
    status: db === 'ok' ? 'ok' : 'unhealthy',
    version: VERSION,
    release: RELEASE,
    commit: COMMIT,
    uptime: process.uptime(),
    db,
    timestamp: new Date().toISOString(),
    responseTimeMs: Date.now() - start,
  }

  return Response.json(body, { status: httpStatus, headers: NO_STORE })
}
