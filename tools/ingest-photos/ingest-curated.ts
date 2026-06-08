/**
 * Ingest a CURATED image set into the Media collection using the real alt text
 * from its `manifest.json` (companion to the C-8 catalog work). Unlike
 * `index.ts` (bulk normalize + folder-derived placeholder alt), this uploads a
 * hand-picked, already-normalized set with proper, accessibility-ready alt.
 *
 *   npx tsx tools/ingest-photos/ingest-curated.ts --dir <curated-dir> [--dry-run]
 *
 * The curated dir must contain the image files + a `manifest.json` array of
 * { curated, source, kind, slot, people, alt }. Idempotent: skips a file whose
 * filename already exists in the media collection, so re-runs are safe.
 *
 * Env (from .env.local for local, or exported for staging — see
 * STAGING_INGEST.md): DATABASE_URL, PAYLOAD_SECRET required for a real run;
 * S3_BUCKET + S3_REGION route uploads to S3, else local filesystem.
 */
import { config as loadEnv } from 'dotenv'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../')
loadEnv({ path: path.join(repoRoot, '.env.local') })
loadEnv({ path: path.join(repoRoot, '.env') })

interface ManifestEntry {
  curated: string
  source: string
  kind: string
  slot: string
  people: string[]
  alt: string
}

function mimeFor(file: string): string {
  const ext = path.extname(file).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.avif') return 'image/avif'
  return 'application/octet-stream'
}

function parseArgs(argv: readonly string[]): { dir?: string; dryRun: boolean; help: boolean } {
  const out = { dir: undefined as string | undefined, dryRun: false, help: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dry-run') out.dryRun = true
    else if (a === '--help' || a === '-h') out.help = true
    else if (a.startsWith('--dir=')) out.dir = path.resolve(a.slice('--dir='.length))
    else if (a === '--dir' && argv[i + 1]) out.dir = path.resolve(argv[++i])
    else throw new Error(`Unknown argument: ${a}`)
  }
  return out
}

const USAGE = `Usage: npx tsx tools/ingest-photos/ingest-curated.ts --dir <curated-dir> [--dry-run]

Uploads the curated set (with manifest.json alt text) into the media collection.
--dry-run validates the manifest + files and prints the plan (no DB needed).`

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    console.log(USAGE)
    return 0
  }
  if (!args.dir) {
    console.error('Missing required --dir=<curated-dir>\n' + USAGE)
    return 2
  }
  const manifestPath = path.join(args.dir, 'manifest.json')
  if (!existsSync(manifestPath)) {
    console.error(`manifest.json not found in ${args.dir}`)
    return 2
  }
  const entries = JSON.parse(readFileSync(manifestPath, 'utf8')) as ManifestEntry[]

  // Validate every file exists before doing any writes.
  const missing = entries.filter((e) => !existsSync(path.join(args.dir!, e.curated)))
  if (missing.length > 0) {
    console.error(`Missing ${missing.length} file(s):`)
    for (const m of missing) console.error(`  - ${m.curated}`)
    return 3
  }
  console.log(`manifest: ${entries.length} files in ${args.dir}`)

  if (args.dryRun) {
    for (const e of entries) {
      console.log(`  [plan] ${e.curated} (${e.kind}/${e.slot}) alt="${e.alt}"`)
    }
    console.log('dry-run — no writes performed.')
    return 0
  }

  if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
    console.error('Missing required env: DATABASE_URL and/or PAYLOAD_SECRET')
    return 1
  }

  const { getPayload } = await import('payload')
  const { default: config } = await import('../../src/payload.config')
  const payload = await getPayload({ config: await config })

  let created = 0
  let skipped = 0
  const errors: string[] = []
  for (const e of entries) {
    try {
      const existing = await payload.find({
        collection: 'media',
        where: { filename: { equals: e.curated } },
        limit: 1,
        overrideAccess: true,
      })
      if (existing.totalDocs > 0) {
        skipped++
        console.log(`  skip (exists) ${e.curated}`)
        continue
      }
      const buf = readFileSync(path.join(args.dir, e.curated))
      const caption = `[curated:${e.slot}]${e.people.length ? ' ' + e.people.join(', ') : ''}`
      const doc = await payload.create({
        collection: 'media',
        data: { alt: e.alt, caption },
        file: { data: buf, mimetype: mimeFor(e.curated), name: e.curated, size: buf.length },
        overrideAccess: true,
      })
      created++
      console.log(`  uploaded ${e.curated} → media ${doc.id}`)
    } catch (err) {
      const msg = (err as Error).message
      errors.push(`${e.curated}: ${msg}`)
      console.error(`  FAILED ${e.curated}: ${msg}`)
    }
  }
  console.log(`\nDone. created=${created} skipped=${skipped} errors=${errors.length}`)
  return errors.length > 0 ? 5 : 0
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
