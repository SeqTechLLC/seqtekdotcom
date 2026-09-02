/**
 * CLI: seed ANY collection or global into Payload from a JSON request file,
 * over the REST API. The generic, committed counterpart to the per-type
 * importers — see README.md for the spec format and the three directives.
 *
 *   IMPORT_TOKEN=<session-jwt> tsx tools/payload-seed/index.ts ./seed.json \
 *     [--base-url=https://seqtek-preview.com] [--draft] [--dry-run] [--allow-missing-refs] [--json] [--check-orphans]
 *
 * Auth is the caller's own /admin session JWT (Authorization: JWT <token>),
 * read by Payload's built-in JWT strategy — no API key, no schema change.
 */

import { readFile } from 'node:fs/promises'

import { PayloadRestClient, PayloadRestError } from '../payload-rest/client'

import { preflight } from './preflight'
import { resolveData } from './resolve'
import { isGlobalSpec, validateSpecs, type SeedStatus, resolveStatus } from './spec'
import { upsertSpec } from './upsert'

const DEFAULT_BASE_URL = 'http://localhost:3100'

interface CliArgs {
  file: string | null
  baseUrl: string
  draft: boolean
  dryRun: boolean
  allowMissingRefs: boolean
  json: boolean
  checkOrphans: boolean
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
    json: false,
    checkOrphans: false,
    help: false,
    unknown: [],
  }
  for (const arg of argv) {
    if (arg === '--draft') out.draft = true
    else if (arg === '--dry-run') out.dryRun = true
    else if (arg === '--allow-missing-refs') out.allowMissingRefs = true
    else if (arg === '--json') out.json = true
    else if (arg === '--check-orphans') out.checkOrphans = true
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
                       (Per-spec, "status" also accepts "unpublished", which
                       takes an already-published document DOWN — plain
                       "draft" only stages a version and leaves it live.
                       --draft does NOT override "unpublished": forcing it to
                       "draft" would leave that document live, which is the
                       thing "unpublished" exists to prevent.)
  --dry-run            Resolve + print intended ops; no writes or uploads.
  --allow-missing-refs Downgrade an unresolved non-omittable $ref to warn + drop.
  --help, -h           Show this help and exit 0.

Environment:
  IMPORT_TOKEN         Your /admin session JWT (payload-token). Required unless
                       --dry-run. Sent as: Authorization: JWT <token>.
  IMPORT_BASE_URL      Alternative to --base-url.
  --json               Emit a single JSON result object on stdout (human log
                       moves to stderr), for unattended callers.
  --check-orphans      After writing, warn about PUBLISHED docs in the touched
                       collections that this file does not mention. The seeder
                       only ever writes what it is given, so a doc removed from
                       a file stays live — this is what makes that visible.

  IMPORT_TIMEOUT_MS    Per-request timeout, default 60000. A gated lane reached
                       without its cookie stalls rather than refusing, so this
                       is what turns a hang into an error.
  IMPORT_COOKIE        Raw Cookie header for a target behind an auth proxy
                       (e.g. "AWSELBAuthSessionCookie-0=...; ...-1=..."). Only
                       needed for gated environments; unset for local/staging.
`

function errln(msg: string): void {
  process.stderr.write(`${msg}\n`)
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/**
 * Emit a machine-readable failure and return its exit code. The early exits —
 * unreadable file, bad envelope, bad directives, missing token — are the MOST
 * likely outcomes for an unattended caller, and they used to write nothing to
 * stdout at all: a `--json` consumer got an empty stream for the commonest
 * case, which defeats the point of the flag.
 */
function jsonFailure(
  json: boolean,
  stage: 'read' | 'envelope' | 'directives' | 'auth',
  errors: string[],
  code: number,
): number {
  if (json) {
    process.stdout.write(
      JSON.stringify({ ok: false, stage, errors, counts: null, results: [] }, null, 2) + '\n',
    )
  }
  return code
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
    const msg = `Failed to read/parse ${args.file}: ${describe(err)}`
    errln(msg)
    return jsonFailure(args.json, 'read', [msg], 1)
  }

  const validated = validateSpecs(raw)
  if (!validated.ok) {
    errln(`Invalid seed file (${validated.errors.length} problem(s)):`)
    for (const e of validated.errors) errln(`  - ${e}`)
    return jsonFailure(args.json, 'envelope', validated.errors, 1)
  }

  // Directive STRUCTURE, before anything is written and before the token is
  // even required. `validateSpecs` above covers the envelope; this covers what
  // is inside `data`, which used to be checked per-spec inside the resolver —
  // so a malformed $file in spec 19 was found after 18 documents had landed.
  const pre = await preflight(validated.value, process.cwd())
  if (pre.errors.length > 0) {
    errln(`Invalid directives (${pre.errors.length} problem(s)) — nothing was written:`)
    for (const e of pre.errors) errln(`  - ${e}`)
    return jsonFailure(args.json, 'directives', pre.errors, 2)
  }

  const token = process.env.IMPORT_TOKEN
  if (!args.dryRun && !token) {
    errln('IMPORT_TOKEN is required to write. Set it to your /admin session JWT,')
    errln('or pass --dry-run to preview without authenticating.')
    return jsonFailure(args.json, 'auth', ['IMPORT_TOKEN is required to write'], 2)
  }

  const client = new PayloadRestClient({
    baseUrl: args.baseUrl,
    token,
    cookie: process.env.IMPORT_COOKIE,
    timeoutMs: Number(process.env.IMPORT_TIMEOUT_MS) || undefined,
  })
  // With --json, stdout carries the result object and nothing else, so the
  // human log moves to stderr rather than corrupting the parse.
  const log = (m: string): void => {
    if (args.json) process.stderr.write(`${m}\n`)
    else process.stdout.write(`${m}\n`)
  }
  const warn = (m: string): void => {
    process.stderr.write(`WARN ${m}\n`)
  }

  if (args.dryRun) log('dry-run — resolving specs, no writes will be performed.')

  let created = 0
  let updated = 0
  let globals = 0
  let errors = 0

  // Identities this run would create, so a dry-run can resolve intra-file
  // `$ref`s instead of reporting them as failures.
  // Identity → the index of the spec that creates it, so the resolver can tell
  // a BACKWARD ref (resolvable) from a FORWARD one (which really does fail).
  const plannedIdentities = new Map<string, number>()
  validated.value.forEach((spec, i) => {
    if (isGlobalSpec(spec)) return
    const key = `${spec.collection}:${spec.identity}:${String(spec.data[spec.identity])}`
    // First writer wins: if two specs share an identity the earlier one creates
    // it and the later one updates it.
    if (!plannedIdentities.has(key)) plannedIdentities.set(key, i)
  })

  // Every spec's outcome, for `--json`. An unattended caller needs to assert on
  // a result, not scrape log lines.
  const results: Array<{
    target: string
    operation: 'create' | 'update' | 'global' | 'dry-run' | 'error'
    id?: string | number
    wouldBe?: 'create' | 'update' | 'unknown'
    status?: SeedStatus
    error?: string
  }> = []
  let aborted: string | null = null

  // Sequential: an earlier spec's created doc must be findable by a later $ref.
  for (let i = 0; i < validated.value.length; i++) {
    const spec = validated.value[i]
    // Label carries the IDENTITY, not just the collection. `✗ caseStudies`
    // across a 7-doc file says nothing about which document failed; the
    // identity value is the only thing that lets a caller act on the message.
    const label = isGlobalSpec(spec)
      ? `global:${spec.global}`
      : `${spec.collection}:${String(spec.data[spec.identity] ?? '?')}`
    try {
      const status: SeedStatus = resolveStatus(args.draft, spec.status)
      const data = await resolveData(client, spec.data, {
        dryRun: args.dryRun,
        allowMissingRefs: args.allowMissingRefs,
        plannedIdentities,
        specIndex: i,
        log,
        warn,
      })
      const result = await upsertSpec(client, spec, data, { status, dryRun: args.dryRun })

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
          log(`[dry-run] would ${result.wouldBe ?? 'unknown'} ${result.target} [${status}]`)
          if (!args.json) log(JSON.stringify(data, null, 2))
          break
      }
      results.push({
        target: result.target,
        operation: result.operation,
        id: 'id' in result ? result.id : undefined,
        wouldBe: result.wouldBe,
        status,
      })
    } catch (err) {
      errors += 1
      const message = describe(err)
      errln(`✗ ${label}: ${message}`)
      results.push({ target: label, operation: 'error', error: message })

      // Auth failures are not per-document problems — the credential is dead
      // for the whole run. Continuing turns one expired token into N identical
      // failures against a remote lane, and buries the real cause in noise.
      const status = err instanceof PayloadRestError ? err.status : undefined
      if (status === 401 || status === 403) {
        aborted =
          `authentication failed (HTTP ${status}). IMPORT_TOKEN is an /admin session JWT and ` +
          `expires in about two hours — mint a fresh one. Stopped at spec ${i + 1} of ` +
          `${validated.value.length}; earlier specs were applied and re-running is safe ` +
          `(every write is an idempotent upsert).`
        errln(`\n✗ aborting: ${aborted}`)
        break
      }
    }
  }

  // Orphans: published documents this file does NOT mention. The seeder cannot
  // retire them (it only writes what it is given), so the least it can do is
  // say they are there. Opt-in, because a partial file — seeding one document
  // on purpose — would otherwise report every other document as an orphan.
  const orphans: Array<{ collection: string; identity: string; values: string[] }> = []
  if (args.checkOrphans && !args.dryRun && aborted === null) {
    // Keyed by collection AND identity field. Keying by collection alone took
    // the identity from whichever spec came first, so a file that upserted one
    // collection by two different fields would compare values gathered from one
    // against values read from the other.
    const byTarget = new Map<
      string,
      { collection: string; identity: string; values: Set<string> }
    >()
    for (const spec of validated.value) {
      if (isGlobalSpec(spec)) continue
      const key = `${spec.collection}::${spec.identity}`
      const entry = byTarget.get(key) ?? {
        collection: spec.collection,
        identity: spec.identity,
        values: new Set<string>(),
      }
      entry.values.add(String(spec.data[spec.identity]))
      byTarget.set(key, entry)
    }
    for (const { collection, identity, values } of byTarget.values()) {
      try {
        const live = await client.listPublishedFieldValues(collection, identity)
        const extra = live.filter((v) => !values.has(v))
        if (extra.length > 0) {
          orphans.push({ collection, identity, values: extra })
          warn(
            `${collection}: ${extra.length} published doc(s) not in this file — ` +
              `${extra.slice(0, 10).join(', ')}${extra.length > 10 ? ', …' : ''}. ` +
              `The seeder never retires; add a spec with "status": "unpublished" to take one down.`,
          )
        }
      } catch (err) {
        warn(`orphan check failed for ${collection}: ${describe(err)}`)
      }
    }
  }

  if (args.json) {
    // stdout only, single object, nothing else on the stream — so a caller can
    // pipe it straight into a parser.
    process.stdout.write(
      JSON.stringify(
        {
          ok: errors === 0 && aborted === null,
          dryRun: args.dryRun,
          baseUrl: args.baseUrl,
          counts: { created, updated, globals, errors, total: validated.value.length },
          aborted,
          orphans,
          results,
        },
        null,
        2,
      ) + '\n',
    )
  } else {
    log(`\nsummary: created=${created} updated=${updated} globals=${globals} errors=${errors}`)
  }
  return errors > 0 || aborted !== null ? 1 : 0
}

try {
  process.exitCode = await main()
} catch (err) {
  errln(`Unexpected error: ${describe(err)}`)
  process.exitCode = 1
}
