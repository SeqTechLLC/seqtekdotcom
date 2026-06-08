/**
 * CLI entry for the photo-library ingest (ROADMAP C-8).
 *
 *   npx tsx tools/ingest-photos/index.ts --dry-run [--limit=40]
 *   npx tsx tools/ingest-photos/index.ts --mode=all --env-label=local
 *
 * Reads DATABASE_URL + PAYLOAD_SECRET from .env.local (same as seed:showcase).
 * S3 is used automatically when S3_BUCKET/S3_REGION are set; otherwise Payload
 * falls back to local filesystem storage under `media/`.
 */
import { config as loadEnv } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { runIngest, type IngestOptions, type IngestSummary, type MediaUploader } from './ingest'
import type { OutputFormat } from './convert'
import type { NormalizeMode } from './types'

const filename = fileURLToPath(import.meta.url)
const toolDir = path.dirname(filename)
const repoRoot = path.resolve(toolDir, '../../')

// Load env BEFORE importing payload.config (which reads PAYLOAD_SECRET /
// DATABASE_URL at module-eval time).
loadEnv({ path: path.join(repoRoot, '.env.local') })
loadEnv({ path: path.join(repoRoot, '.env') })

interface Args {
  dryRun: boolean
  mode: NormalizeMode
  limit?: number
  sourceDir: string
  outDir?: string
  outFormat: OutputFormat
  maxEdge?: number
  envLabel: string
  manifestPath?: string
  help: boolean
}

function parseArgs(argv: readonly string[]): Args {
  const args: Args = {
    dryRun: false,
    mode: 'all',
    sourceDir: path.resolve(repoRoot, '../photos'),
    outFormat: 'keep',
    envLabel: 'local',
    help: false,
  }
  for (const arg of argv) {
    if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--help' || arg === '-h') args.help = true
    else if (arg === '--mode=all') args.mode = 'all'
    else if (arg === '--mode=minimal') args.mode = 'minimal'
    else if (arg === '--out-format=jpeg') args.outFormat = 'jpeg'
    else if (arg === '--out-format=webp') args.outFormat = 'webp'
    else if (arg === '--out-format=keep') args.outFormat = 'keep'
    else if (arg.startsWith('--max-edge='))
      args.maxEdge = Number.parseInt(arg.slice('--max-edge='.length), 10)
    else if (arg.startsWith('--limit='))
      args.limit = Number.parseInt(arg.slice('--limit='.length), 10)
    else if (arg.startsWith('--source='))
      args.sourceDir = path.resolve(arg.slice('--source='.length))
    else if (arg.startsWith('--out=')) args.outDir = path.resolve(arg.slice('--out='.length))
    else if (arg.startsWith('--env-label=')) args.envLabel = arg.slice('--env-label='.length)
    else if (arg.startsWith('--manifest='))
      args.manifestPath = path.resolve(arg.slice('--manifest='.length))
    else throw new Error(`Unknown argument: ${arg}`)
  }
  return args
}

const USAGE = `Usage: npx tsx tools/ingest-photos/index.ts [flags]

Flags:
  --dry-run            Classify + convert in memory, print the plan, write nothing.
  --mode=all|minimal   all (default): cap 2400px, strip EXIF, HEIC/jfif→WebP, PNG stays PNG.
                       minimal: convert HEIC/jfif, downscale only >25MB, pass the rest through.
  --limit=N            Process only the first N files (sampling / local validation).
  --source=PATH        Photo archive root (default: ../photos).
  --out=PATH           Write normalized files here (mirroring folders) instead of
                       uploading. Browseable curation copy — no DB / Payload needed.
  --out-format=FMT     keep (default) | jpeg | webp. Force one format for all files
                       (e.g. jpeg for a small vision/description set).
  --max-edge=N         Override the longest-edge cap (default 2400; e.g. 1280 for vision).
  --env-label=LABEL    Scopes the dedup manifest filename (default: local).
  --manifest=PATH      Override the manifest path.
  --help, -h           Show this help.

Env (from .env.local): DATABASE_URL, PAYLOAD_SECRET required for an upload run
                       (not needed for --dry-run or --out). S3_BUCKET + S3_REGION
                       → S3 storage; otherwise local FS.`

function printSummary(summary: IngestSummary, log: (m: string) => void): void {
  log('')
  log('── Ingest summary ──────────────────────────────')
  log(`  discovered:       ${summary.totalDiscovered}`)
  log(`  processed:        ${summary.processed}`)
  log(`  uploaded:         ${summary.uploaded}`)
  log(`  planned (dry):    ${summary.planned}`)
  log(`  skipped (dup):    ${summary.skippedExisting}`)
  log(`  by disposition:   ${JSON.stringify(summary.byDisposition)}`)
  log(
    `  bytes in → out:   ${(summary.bytesIn / 1048576).toFixed(1)}MB → ${(summary.bytesOut / 1048576).toFixed(1)}MB`,
  )
  log(`  errors:           ${summary.errors.length}`)
  for (const e of summary.errors.slice(0, 20)) log(`    ✗ ${e.relPath}: ${e.message}`)
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    console.log(USAGE)
    return 0
  }
  if (args.limit !== undefined && (!Number.isInteger(args.limit) || args.limit <= 0)) {
    console.error('--limit must be a positive integer')
    return 2
  }

  // Out-runs and upload-runs get distinct manifests — sharing one would let a
  // disk run mark hashes "seen" and make a later upload run skip them.
  const manifestPath =
    args.manifestPath ??
    path.join(toolDir, `.manifest.${args.envLabel}${args.outDir ? '-disk' : ''}.json`)

  const opts: IngestOptions = {
    sourceDir: args.sourceDir,
    mode: args.mode,
    dryRun: args.dryRun,
    manifestPath,
    outDir: args.outDir,
    outFormat: args.outFormat,
    maxEdge: args.maxEdge,
    limit: args.limit,
    log: (m) => console.log(m),
    warn: (m) => console.warn(m),
  }

  // Dry-run and disk-output runs need no DB / Payload.
  if (args.dryRun || args.outDir) {
    const summary = await runIngest(null, opts)
    printSummary(summary, (m) => console.log(m))
    return summary.errors.length > 0 ? 5 : 0
  }

  if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
    console.error(
      'Missing required env: DATABASE_URL and/or PAYLOAD_SECRET (set them in .env.local)',
    )
    return 1
  }

  // Dynamic import so payload.config evaluates AFTER dotenv has loaded.
  const { getPayload } = await import('payload')
  const { default: config } = await import('../../src/payload.config')
  const payload = await getPayload({ config: await config })

  const uploader: MediaUploader = {
    create: async (createArgs) => {
      const doc = await payload.create({
        collection: 'media',
        data: createArgs.data,
        file: createArgs.file,
        overrideAccess: true,
      })
      return { id: doc.id }
    },
  }

  const summary = await runIngest(uploader, opts)
  printSummary(summary, (m) => console.log(m))
  return summary.errors.length > 0 ? 5 : 0
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
