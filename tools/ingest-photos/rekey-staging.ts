/**
 * One-shot in-place re-key for the staging media bucket (spec 009 FR-005,
 * plan research R4): move every object from bare `<filename>` keys to
 * `media/<filename>`, then PATCH each media doc's stored `prefix` so the
 * generated URLs and the static-handler fallback resolve the new keys.
 *
 *   IMPORT_TOKEN=<payload-token> IMPORT_BASE_URL=https://seqtek-preview.com \
 *   AWS_PROFILE=<staging> S3_BUCKET=seqtek-media-staging \
 *     npx tsx tools/ingest-photos/rekey-staging.ts [--dry-run]
 *
 * Why in-place instead of delete + re-push (`push-to-payload.ts`): the seeded
 * media docs are referenced (team-member headshots); delete + re-push mints
 * new media IDs and orphans those relations. Moving the S3 objects and
 * patching `prefix` preserves IDs, so no relation is touched. The PATCH is
 * metadata-only — the storage plugin's afterChange uploads/deletes nothing
 * without an incoming file, and the media invalidation hook deliberately
 * no-ops for it.
 *
 * Order is load-bearing: objects move BEFORE docs are patched, so the
 * `/api/media/file/<filename>` static handler (which resolves the prefix
 * from the doc) never points at a key that doesn't exist yet.
 *
 * Idempotent: keys already under `media/` are never touched; docs already at
 * prefix `media` are skipped. Re-running after success finds nothing to do.
 * The token is never logged.
 */
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3'

import { PayloadRestClient } from '../import-case-study/client'

const MEDIA_PREFIX = 'media'

interface MediaListResponse {
  docs?: Array<{ id: string | number; filename?: string; prefix?: string | null }>
  totalPages?: number
}

function parseArgs(argv: readonly string[]): { dryRun: boolean } {
  const out = { dryRun: false }
  for (const a of argv) {
    if (a === '--dry-run') out.dryRun = true
    else throw new Error(`Unknown argument: ${a}`)
  }
  return out
}

/** CopySource requires a URI-encoded key with `/` separators preserved. */
const encodeKey = (key: string): string => key.split('/').map(encodeURIComponent).join('/')

async function listKeysToMove(s3: S3Client, bucket: string): Promise<string[]> {
  const keys: string[] = []
  let token: string | undefined
  do {
    const page = await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }),
    )
    for (const obj of page.Contents ?? []) {
      if (obj.Key && !obj.Key.startsWith(`${MEDIA_PREFIX}/`)) keys.push(obj.Key)
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined
  } while (token)
  return keys
}

async function moveObject(s3: S3Client, bucket: string, key: string): Promise<void> {
  const dest = `${MEDIA_PREFIX}/${key}`
  await s3.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${encodeKey(key)}`,
      Key: dest,
      // Preserve metadata/content-type (COPY is the default; explicit for clarity).
      MetadataDirective: 'COPY',
    }),
  )
  // Verify the copy landed before deleting the source.
  await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: dest }))
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}

async function listDocsToPatch(
  baseUrl: string,
  token: string | undefined,
): Promise<Array<{ id: string | number; filename?: string; prefix?: string | null }>> {
  const out: Array<{ id: string | number; filename?: string; prefix?: string | null }> = []
  let page = 1
  let totalPages = 1
  do {
    const params = new URLSearchParams({ limit: '100', depth: '0', page: String(page) })
    const res = await fetch(`${baseUrl}/api/media?${params.toString()}`, {
      headers: token ? { Authorization: `JWT ${token}` } : {},
    })
    if (!res.ok) throw new Error(`list media page ${page}: ${res.status} ${res.statusText}`)
    const json = (await res.json()) as MediaListResponse
    out.push(...(json.docs ?? []))
    totalPages = json.totalPages ?? 1
    page++
  } while (page <= totalPages)
  return out.filter((d) => (d.prefix ?? '') !== MEDIA_PREFIX)
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2))
  const bucket = process.env.S3_BUCKET ?? 'seqtek-media-staging'
  const baseUrl = (process.env.IMPORT_BASE_URL ?? 'https://seqtek-preview.com').replace(/\/+$/, '')
  const token = process.env.IMPORT_TOKEN
  if (!args.dryRun && !token) {
    console.error('IMPORT_TOKEN (your /admin payload-token JWT) is required to write.')
    return 1
  }

  const s3 = new S3Client({ region: process.env.S3_REGION ?? 'us-east-1' })
  console.log(`bucket: ${bucket} | api: ${baseUrl} | ${args.dryRun ? 'DRY-RUN' : 'LIVE'}`)

  // ---- Pass 1: S3 objects (originals + size variants are flat siblings) ----
  const keys = await listKeysToMove(s3, bucket)
  console.log(`${keys.length} object(s) outside ${MEDIA_PREFIX}/`)
  let moved = 0
  const errors: string[] = []
  for (const key of keys) {
    if (args.dryRun) {
      console.log(`  would move ${key} -> ${MEDIA_PREFIX}/${key}`)
      continue
    }
    try {
      await moveObject(s3, bucket, key)
      moved++
      console.log(`  moved ${key} -> ${MEDIA_PREFIX}/${key}`)
    } catch (err) {
      errors.push(`${key}: ${(err as Error).message}`)
      console.error(`  FAILED ${key}: ${(err as Error).message}`)
    }
  }

  // ---- Pass 2: media docs (only after the objects exist at the new keys) ----
  const docs = await listDocsToPatch(baseUrl, token)
  console.log(`${docs.length} media doc(s) with prefix != '${MEDIA_PREFIX}'`)
  let patched = 0
  if (errors.length > 0 && !args.dryRun) {
    console.error('skipping doc PATCH pass — fix the S3 move failures first (re-run is safe)')
  } else {
    const client = new PayloadRestClient({ baseUrl, token })
    for (const doc of docs) {
      if (args.dryRun) {
        console.log(
          `  would PATCH media/${doc.id} (${doc.filename ?? '?'}) prefix -> '${MEDIA_PREFIX}'`,
        )
        continue
      }
      try {
        await client.updateDoc('media', doc.id, { prefix: MEDIA_PREFIX }, { draft: false })
        patched++
        console.log(`  patched media/${doc.id} (${doc.filename ?? '?'})`)
      } catch (err) {
        errors.push(`media/${doc.id}: ${(err as Error).message}`)
        console.error(`  FAILED media/${doc.id}: ${(err as Error).message}`)
      }
    }
  }

  console.log(`\nDone. moved=${moved} patched=${patched} errors=${errors.length}`)
  return errors.length > 0 ? 5 : 0
}

main()
  .then((c) => process.exit(c))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
