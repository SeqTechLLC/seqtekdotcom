/**
 * ALB health check endpoint (ARCHITECTURE.md §8).
 *
 * Verifies the Postgres connection by issuing a cheap `count` against the
 * users collection through Payload's existing connection pool — no extra
 * pg client, no transitive-dep imports. Returns 200 when the round-trip
 * succeeds; 503 when it fails so the ALB can stop routing to the instance.
 *
 * Also reports build provenance (`version` + `commit`), baked into the
 * image at build time via Dockerfile ARGs so the response describes the
 * container that is actually running, not what a task definition claims.
 * `version` is package.json's semantic version, which release-please bumps
 * — between releases it lags the code, so `commit` is what disambiguates.
 * This endpoint is deliberately exempt from the Cognito gate, so treat both
 * as public.
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
  commit: string
  uptime: number
  db: 'ok' | 'unreachable'
  timestamp: string
  responseTimeMs: number
}

const NO_STORE: HeadersInit = { 'cache-control': 'no-store' }

// Read once at module load — these are baked ENV, they cannot change while
// the process lives. Empty means a local/dev build with no ARGs passed.
const VERSION = process.env.BUILD_VERSION || 'dev'
const COMMIT = process.env.BUILD_COMMIT || 'unknown'

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
    commit: COMMIT,
    uptime: process.uptime(),
    db,
    timestamp: new Date().toISOString(),
    responseTimeMs: Date.now() - start,
  }

  return Response.json(body, { status: httpStatus, headers: NO_STORE })
}
