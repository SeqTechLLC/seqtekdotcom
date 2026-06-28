/**
 * CLI: import a single case study into Payload over the REST API.
 *
 *   IMPORT_TOKEN=<session-jwt> tsx tools/import-case-study/index.ts ./study.json \
 *     [--base-url=https://seqtek-preview.com] [--publish] [--dry-run]
 *
 * Auth is the caller's own /admin session JWT (see README). The tool never
 * touches the auth collection and adds no standing secret. See README.md for
 * the JSON shape and how to grab the token.
 */

import { readFile } from 'node:fs/promises'

import { PayloadRestClient } from '../payload-rest/client'
import { importCaseStudy } from './importer'
import { validateInput } from './types'

const DEFAULT_BASE_URL = 'http://localhost:3100'

interface CliArgs {
  file: string | null
  baseUrl: string
  publish: boolean
  dryRun: boolean
  help: boolean
  unknown: string[]
}

function parseArgs(argv: readonly string[], env: NodeJS.ProcessEnv): CliArgs {
  const out: CliArgs = {
    file: null,
    baseUrl: env.IMPORT_BASE_URL ?? DEFAULT_BASE_URL,
    publish: false,
    dryRun: false,
    help: false,
    unknown: [],
  }
  for (const arg of argv) {
    if (arg === '--publish') out.publish = true
    else if (arg === '--dry-run') out.dryRun = true
    else if (arg === '--help' || arg === '-h') out.help = true
    else if (arg.startsWith('--base-url=')) out.baseUrl = arg.slice('--base-url='.length)
    else if (arg.startsWith('--')) out.unknown.push(arg)
    else if (out.file === null) out.file = arg
    else out.unknown.push(arg)
  }
  return out
}

const USAGE = `Usage: tsx tools/import-case-study/index.ts <file.json> [flags]

Imports one case study (with hero image, prose, relations) over the Payload
REST API, idempotently by slug. Lands as a DRAFT by default.

Flags:
  --base-url=<url>   Target origin (default: ${DEFAULT_BASE_URL}; or IMPORT_BASE_URL).
  --publish          Publish on import instead of leaving a draft.
  --dry-run          Resolve + assemble and print the payload; perform no writes.
  --help, -h         Show this help and exit 0.

Environment:
  IMPORT_TOKEN       Your /admin session JWT (payload-token cookie). Required
                     unless --dry-run. Sent as: Authorization: JWT <token>.
  IMPORT_BASE_URL    Alternative to --base-url.
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

  const validated = validateInput(raw)
  if (!validated.ok) {
    errln(`Invalid case study (${validated.errors.length} problem(s)):`)
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
  try {
    const result = await importCaseStudy(client, validated.value, {
      publish: args.publish,
      dryRun: args.dryRun,
      log: (m) => process.stdout.write(`${m}\n`),
      warn: (m) => process.stderr.write(`WARN ${m}\n`),
    })
    if (result.operation !== 'dry-run') {
      const origin = args.baseUrl.replace(/\/+$/, '')
      process.stdout.write(
        `\n${result.operation} ok — "${result.slug}" [${result.status}]\n` +
          `${origin}/admin/collections/caseStudies/${result.id}\n`,
      )
    }
    return 0
  } catch (err) {
    errln(`Import failed: ${describe(err)}`)
    return 1
  }
}

try {
  process.exitCode = await main()
} catch (err) {
  errln(`Unexpected error: ${describe(err)}`)
  process.exitCode = 1
}
