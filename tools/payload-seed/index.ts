/**
 * CLI: seed ANY collection or global into Payload from a JSON request file,
 * over the REST API. The generic, committed counterpart to the per-type
 * importers — see README.md for the spec format and the three directives.
 *
 *   IMPORT_TOKEN=<session-jwt> tsx tools/payload-seed/index.ts ./seed.json \
 *     [--base-url=https://seqtek-preview.com] [--draft] [--dry-run] [--allow-missing-refs]
 *
 * Auth is the caller's own /admin session JWT (Authorization: JWT <token>),
 * read by Payload's built-in JWT strategy — no API key, no schema change.
 */

import { readFile } from 'node:fs/promises'

import { PayloadRestClient } from '../payload-rest/client'

import { resolveData } from './resolve'
import { isGlobalSpec, validateSpecs, type SeedStatus } from './spec'
import { upsertSpec } from './upsert'

const DEFAULT_BASE_URL = 'http://localhost:3100'

interface CliArgs {
  file: string | null
  baseUrl: string
  draft: boolean
  dryRun: boolean
  allowMissingRefs: boolean
  help: boolean
  unknown: string[]
}

function parseArgs(argv: readonly string[], env: NodeJS.ProcessEnv): CliArgs {
  const out: CliArgs = {
    file: null,
    baseUrl: env.IMPORT_BASE_URL ?? DEFAULT_BASE_URL,
    draft: false,
    dryRun: false,
    allowMissingRefs: false,
    help: false,
    unknown: [],
  }
  for (const arg of argv) {
    if (arg === '--draft') out.draft = true
    else if (arg === '--dry-run') out.dryRun = true
    else if (arg === '--allow-missing-refs') out.allowMissingRefs = true
    else if (arg === '--help' || arg === '-h') out.help = true
    else if (arg.startsWith('--base-url=')) out.baseUrl = arg.slice('--base-url='.length)
    else if (arg.startsWith('--')) out.unknown.push(arg)
    else if (out.file === null) out.file = arg
    else out.unknown.push(arg)
  }
  return out
}

const USAGE = `Usage: tsx tools/payload-seed/index.ts <file.json> [flags]

Upserts any collection or global from a JSON request file, resolving
$ref / $file / $lexical directives at write time. Loads as PUBLISHED by
default; idempotent (collection by identity field, default "slug"). An array
of specs is processed sequentially, so earlier docs resolve as refs for later.

Flags:
  --base-url=<url>      Target origin (default: ${DEFAULT_BASE_URL}; or IMPORT_BASE_URL).
  --draft              Force every spec to draft instead of publishing.
  --dry-run            Resolve + print intended ops; no writes or uploads.
  --allow-missing-refs Downgrade an unresolved non-omittable $ref to warn + drop.
  --help, -h           Show this help and exit 0.

Environment:
  IMPORT_TOKEN         Your /admin session JWT (payload-token). Required unless
                       --dry-run. Sent as: Authorization: JWT <token>.
  IMPORT_BASE_URL      Alternative to --base-url.
`

function errln(msg: string): void {
  process.stderr.write(`${msg}\n`)
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2), process.env)

  if (args.help) {
    process.stdout.write(USAGE)
    return 0
  }
  if (args.unknown.length > 0) {
    errln(`Unknown argument(s): ${args.unknown.join(', ')}`)
    errln(USAGE)
    return 2
  }
  if (!args.file) {
    errln('Missing required <file.json> argument.')
    errln(USAGE)
    return 2
  }

  // Validate the file first so authoring mistakes surface even without a token.
  let raw: unknown
  try {
    raw = JSON.parse(await readFile(args.file, 'utf8'))
  } catch (err) {
    errln(`Failed to read/parse ${args.file}: ${describe(err)}`)
    return 1
  }

  const validated = validateSpecs(raw)
  if (!validated.ok) {
    errln(`Invalid seed file (${validated.errors.length} problem(s)):`)
    for (const e of validated.errors) errln(`  - ${e}`)
    return 1
  }

  const token = process.env.IMPORT_TOKEN
  if (!args.dryRun && !token) {
    errln('IMPORT_TOKEN is required to write. Set it to your /admin session JWT,')
    errln('or pass --dry-run to preview without authenticating.')
    return 2
  }

  const client = new PayloadRestClient({ baseUrl: args.baseUrl, token })
  const log = (m: string): void => {
    process.stdout.write(`${m}\n`)
  }
  const warn = (m: string): void => {
    process.stderr.write(`WARN ${m}\n`)
  }

  if (args.dryRun) log('dry-run — resolving specs, no writes will be performed.')

  let created = 0
  let updated = 0
  let globals = 0
  let errors = 0

  // Sequential: an earlier spec's created doc must be findable by a later $ref.
  for (let i = 0; i < validated.value.length; i++) {
    const spec = validated.value[i]
    const label = isGlobalSpec(spec) ? `global:${spec.global}` : `${spec.collection}`
    try {
      const status: SeedStatus = args.draft ? 'draft' : spec.status
      const draft = status !== 'published'
      const data = await resolveData(client, spec.data, {
        dryRun: args.dryRun,
        allowMissingRefs: args.allowMissingRefs,
        log,
        warn,
      })
      const result = await upsertSpec(client, spec, data, { draft, dryRun: args.dryRun })

      switch (result.operation) {
        case 'create':
          created += 1
          log(`created ${result.target} → ${result.id} [${status}]`)
          break
        case 'update':
          updated += 1
          log(`updated ${result.target} → ${result.id} [${status}]`)
          break
        case 'global':
          globals += 1
          log(`updated ${result.target} [${status}]`)
          break
        case 'dry-run':
          log(`[dry-run] ${result.target} [${status}]`)
          log(JSON.stringify(data, null, 2))
          break
      }
    } catch (err) {
      errors += 1
      errln(`✗ ${label}: ${describe(err)}`)
    }
  }

  log(`\nsummary: created=${created} updated=${updated} globals=${globals} errors=${errors}`)
  return errors > 0 ? 1 : 0
}

try {
  process.exitCode = await main()
} catch (err) {
  errln(`Unexpected error: ${describe(err)}`)
  process.exitCode = 1
}
