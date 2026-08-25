/**
 * ALB health check endpoint (ARCHITECTURE.md §8).
 *
 * Verifies the Postgres connection by issuing a cheap `count` against the
 * users collection through Payload's existing connection pool — no extra
 * pg client, no transitive-dep imports. Returns 200 when the round-trip
 * succeeds; 503 when it fails so the ALB can stop routing to the instance.
 *
 * Also reports the two identities of whatever is running. `commit` is BAKED
 * into the image at build time, so it describes the container actually running
 * rather than what a task definition claims. `release` is the version label
 * attached when that image was promoted (`RELEASE_VERSION`, runtime metadata),
 * and is null on a lane that has not been released — notably the UAT lane,
 * which normally runs AHEAD of any release.
 *
 * They are two names for one artifact, not two build mechanisms: the same ECR
 * digest carries both the commit SHA and the `vX.Y.Z` tag. Deliberately no
 * fallback between them — reporting a build-time version number on an
 * unreleased lane claims a release it never received.
 *
 * This endpoint is exempt from the Cognito gate, so treat both as public.
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
    release: RELEASE,
    commit: COMMIT,
    uptime: process.uptime(),
    db,
    timestamp: new Date().toISOString(),
    responseTimeMs: Date.now() - start,
  }

  return Response.json(body, { status: httpStatus, headers: NO_STORE })
}
