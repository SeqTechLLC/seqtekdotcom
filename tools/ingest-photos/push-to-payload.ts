/**
 * Push a CURATED image set to a live Payload instance over the REST API using a
 * session JWT — no DB / S3 / SSM access needed (the running app does the writes
 * via its instance profile). Reuses the shared PayloadRestClient.
 *
 *   IMPORT_TOKEN=<payload-token> IMPORT_BASE_URL=https://seqtek-preview.com \
 *     npx tsx tools/ingest-photos/push-to-payload.ts --dir <curated-dir> [--dry-run]
 *
 * Idempotent: skips a curated file whose filename already exists in media.
 * Writes `<dir>/staging-media-ids.json` (curated filename -> media id) so the
 * page-population step can wire photos by reference.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { PayloadRestClient } from '../payload-rest/client'

interface Entry {
  curated: string
  source: string
  kind: string
  slot: string
  people: string[]
  alt: string
}

function parseArgs(argv: readonly string[]): { dir?: string; dryRun: boolean } {
  const out = { dir: undefined as string | undefined, dryRun: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dry-run') out.dryRun = true
    else if (a.startsWith('--dir=')) out.dir = path.resolve(a.slice('--dir='.length))
    else if (a === '--dir' && argv[i + 1]) out.dir = path.resolve(argv[++i])
    else throw new Error(`Unknown argument: ${a}`)
  }
  return out
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2))
  if (!args.dir) {
    console.error('Missing --dir=<curated-dir>')
    return 2
  }
  const manifestPath = path.join(args.dir, 'manifest.json')
  if (!existsSync(manifestPath)) {
    console.error(`manifest.json not found in ${args.dir}`)
    return 2
  }
  const entries = JSON.parse(readFileSync(manifestPath, 'utf8')) as Entry[]
  const baseUrl = process.env.IMPORT_BASE_URL ?? 'http://localhost:3100'
  const token = process.env.IMPORT_TOKEN
  if (!args.dryRun && !token) {
    console.error('IMPORT_TOKEN (your /admin payload-token JWT) is required to write.')
    return 1
  }
  console.log(
    `target: ${baseUrl} | ${entries.length} curated files | ${args.dryRun ? 'DRY-RUN' : 'LIVE'}`,
  )
  const client = new PayloadRestClient({ baseUrl, token })

  const idMap: Record<string, string | number> = {}
  let uploaded = 0
  let skipped = 0
  const errors: string[] = []
  for (const e of entries) {
    const file = path.join(args.dir, e.curated)
    if (!existsSync(file)) {
      errors.push(`${e.curated}: file missing`)
      continue
    }
    try {
      const existing = await client.findIdByField('media', 'filename', e.curated, { draft: false })
      if (existing !== null) {
        idMap[e.curated] = existing
        skipped++
        console.log(`  skip (exists ${existing}) ${e.curated}`)
        continue
      }
      if (args.dryRun) {
        console.log(`  would upload ${e.curated} (alt: "${e.alt}")`)
        continue
      }
      const resolved = await client.resolveImage({ file, alt: e.alt })
      const id = await client.uploadMedia(resolved)
      idMap[e.curated] = id
      uploaded++
      console.log(`  uploaded ${e.curated} -> media ${id}`)
    } catch (err) {
      const msg = (err as Error).message
      errors.push(`${e.curated}: ${msg}`)
      console.error(`  FAILED ${e.curated}: ${msg}`)
    }
  }
  if (!args.dryRun) {
    writeFileSync(
      path.join(args.dir, 'staging-media-ids.json'),
      `${JSON.stringify(idMap, null, 2)}\n`,
    )
  }
  console.log(
    `\nDone. uploaded=${uploaded} skipped=${skipped} mapped=${Object.keys(idMap).length} errors=${errors.length}`,
  )
  for (const er of errors.slice(0, 20)) console.error(`  ✗ ${er}`)
  return errors.length > 0 ? 5 : 0
}

main()
  .then((c) => process.exit(c))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
