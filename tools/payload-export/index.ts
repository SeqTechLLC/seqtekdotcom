/**
 * CLI: export a Payload database over REST into seeder request files that
 * `tools/payload-seed` loads back. See README.md.
 *
 *   IMPORT_TOKEN=<session-jwt> tsx tools/payload-export/index.ts <out-dir> \
 *     [--base-url=https://ww3.seqtek.com] [--only=services,homepage]
 */

import { config as loadEnv } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { PayloadRestClient } from '../payload-rest/client'

// Same as the seeder: the gated lanes need IMPORT_COOKIE, which lives in `.env.local`.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../')
loadEnv({ path: path.join(repoRoot, '.env.local'), quiet: true })
loadEnv({ path: path.join(repoRoot, '.env'), quiet: true })

import { collections } from '../../src/collections'
import { Homepage } from '../../src/globals/Homepage'
import { richTextBlocks, richTextInlineBlocks } from '../../src/payload/blocks/inline'
import { exportContent } from './run'

const DEFAULT_BASE_URL = 'http://localhost:3100'

const USAGE = `Usage: tsx tools/payload-export/index.ts <out-dir> [flags]

Writes one seeder request file per collection and global, numbered in load
order, and the media they reference under <out-dir>/media/. Relations become
$ref, media becomes $file. Run it from the directory you will seed from: $file
paths are relative to it.

Flags:
  --base-url=<url>   Source origin (default: ${DEFAULT_BASE_URL}; or IMPORT_BASE_URL).
  --only=<a,b>       Write only these collections or globals.
  --help, -h         Show this help and exit 0.

Environment:
  IMPORT_TOKEN       Your /admin session JWT. Without it, drafts are not exported.
  IMPORT_COOKIE      Gate cookie for a lane behind the ALB sign-in.
  IMPORT_TIMEOUT_MS  Per-request timeout, default 60000.
`

function errln(msg: string): void {
  process.stderr.write(`${msg}\n`)
}

async function main(): Promise<number> {
  let outDir: string | null = null
  let baseUrl = process.env.IMPORT_BASE_URL ?? DEFAULT_BASE_URL
  let only: string[] = []
  for (const arg of process.argv.slice(2)) {
    if (arg === '--help' || arg === '-h') {
      process.stdout.write(USAGE)
      return 0
    } else if (arg.startsWith('--base-url=')) baseUrl = arg.slice('--base-url='.length)
    else if (arg.startsWith('--only='))
      only = arg.slice('--only='.length).split(',').filter(Boolean)
    else if (arg.startsWith('--') || outDir !== null) {
      errln(`Unexpected argument: ${arg}\n\n${USAGE}`)
      return 2
    } else outDir = arg
  }
  if (outDir === null) {
    errln(USAGE)
    return 2
  }

  const timeoutMs = Number(process.env.IMPORT_TIMEOUT_MS ?? 60_000)
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    errln(`IMPORT_TIMEOUT_MS must be a positive number of milliseconds`)
    return 2
  }
  const client = new PayloadRestClient({
    baseUrl,
    token: process.env.IMPORT_TOKEN,
    cookie: process.env.IMPORT_COOKIE,
    timeoutMs,
  })
  if (!client.hasToken) errln('No IMPORT_TOKEN: reading as a visitor, so drafts are not exported.')

  const summary = await exportContent({
    client,
    config: {
      collections,
      globals: [Homepage],
      richTextBlocks: [...richTextBlocks, ...richTextInlineBlocks],
    },
    outDir: path.resolve(outDir),
    only,
    cwd: process.cwd(),
    log: (msg) => process.stdout.write(`${msg}\n`),
    warn: (msg) => errln(`warn: ${msg}`),
  })
  process.stdout.write(`exported from ${baseUrl}: warnings=${summary.warnings}\n`)
  return 0
}

main().then(
  (code) => {
    process.exitCode = code
  },
  (err: unknown) => {
    errln(err instanceof Error ? err.message : String(err))
    process.exitCode = 1
  },
)
