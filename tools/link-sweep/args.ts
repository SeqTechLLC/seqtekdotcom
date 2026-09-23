/**
 * Argument parsing, split out of `index.ts` so it can be tested: importing
 * `index.ts` would run the CLI, which is the point of `index.ts`.
 */
import { DEFAULT_THIN_COPY_THRESHOLD } from './checks'
import type { Category } from './report'

export const DEFAULT_BASE_URL = 'http://localhost:3100'

export const CATEGORIES = [
  'links',
  'images',
  'placeholders',
  'alt',
  'external',
  'redirects',
  'style',
  'thin',
] as const

/**
 * Compile-time completeness. `readonly Category[]` accepted any SUBSET, so a
 * category added to the union and to `countsByCategory` (which is
 * enforced, via `Record<Category, number>`) but forgotten here would compile,
 * and `--fail-on=all` would expand to a list quietly narrower than the word
 * promises.
 */
type UnlistedCategory = Exclude<Category, (typeof CATEGORIES)[number]>
const _everyCategoryIsListed: UnlistedCategory extends never ? true : never = true
void _everyCategoryIsListed

/**
 * Categories `--fail-on=all` deliberately leaves out. Not "cannot run" —
 * `thin` runs fine; it is that its findings are for a person to read, so
 * gating the shorthand on it makes the shorthand useless.
 */
export const NON_GATING_CATEGORIES: readonly Category[] = ['thin']

export interface CliArgs {
  baseUrl: string
  json: string | null
  maxPages: number
  checkExternal: boolean
  /** Rendered `<main>` chars below which a route is reported as thin. */
  thinThreshold: number
  /** Substrings whose routes are skipped, e.g. the local showcase fixtures. */
  exclude: string[]
  failOn: Category[]
  /** `--fail-on` names that are not categories. A typo must not disarm a gate. */
  unknownCategories: string[]
  /** `--fail-on=all` rather than a hand-written list — see `index.ts`. */
  failOnAll: boolean
  /** `--fail-on=` with nothing after it. Refused, rather than gating on nothing. */
  failOnEmpty: boolean
  help: boolean
  unknown: string[]
}

export const USAGE = `sweep — ROADMAP K8 broken-link + broken-image sweep

  npm run sweep -- [options]

  --base-url=<url>     default ${DEFAULT_BASE_URL}, or $SWEEP_BASE_URL
  --external           also check external links (slow)
  --json=<path>        write the full report as JSON
  --max-pages=<n>      crawl ceiling, default 300
  --thin-threshold=<n> rendered <main> chars below which a route is reported
                       as thin, default ${DEFAULT_THIN_COPY_THRESHOLD}
  --exclude=<parts>    skip routes containing any of these, comma separated.
                       Locally: --exclude=showcase- drops the seeded fixtures
  --fail-on=<list>     exit 1 if any named category has findings
                       (${CATEGORIES.join(', ')}). An unrecognised name is an
                       error, not a silent no-op. "all" is every category that
                       can run: it drops \`external\` unless --external is set,
                       where naming \`external\` yourself is refused instead,
                       and always drops \`thin\`, which reports a measurement
                       rather than a defect. Name \`thin\` to gate on it.
  --help

  $SWEEP_COOKIE is sent with every request, for a Cognito-gated lane.`

export const parseArgs = (argv: readonly string[], env: NodeJS.ProcessEnv): CliArgs => {
  const out: CliArgs = {
    baseUrl: env.SWEEP_BASE_URL ?? DEFAULT_BASE_URL,
    json: null,
    maxPages: 300,
    checkExternal: false,
    thinThreshold: DEFAULT_THIN_COPY_THRESHOLD,
    exclude: [],
    failOn: [],
    unknownCategories: [],
    failOnAll: false,
    failOnEmpty: false,
    help: false,
    unknown: [],
  }

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') out.help = true
    else if (arg === '--external') out.checkExternal = true
    else if (arg.startsWith('--base-url=')) out.baseUrl = arg.slice('--base-url='.length)
    else if (arg.startsWith('--json=')) out.json = arg.slice('--json='.length)
    else if (arg.startsWith('--max-pages=')) out.maxPages = Number(arg.slice('--max-pages='.length))
    else if (arg.startsWith('--exclude='))
      out.exclude = arg
        .slice('--exclude='.length)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    else if (arg.startsWith('--thin-threshold='))
      out.thinThreshold = Number(arg.slice('--thin-threshold='.length))
    else if (arg.startsWith('--fail-on=')) {
      const raw = arg.slice('--fail-on='.length)
      if (raw === 'all') {
        out.failOnAll = true
        // `thin` is a MEASUREMENT, not a verdict: listing routes and /contact
        // sit near the threshold by nature, so a literal `all` would keep this
        // shorthand red on a healthy site and train people to ignore it.
        // Naming `thin` explicitly still gates on it. (`external` is dropped
        // in `index.ts` instead, because that one depends on --external.)
        out.failOn = CATEGORIES.filter((category) => !NON_GATING_CATEGORIES.includes(category))
      } else {
        // Unrecognised names are COLLECTED, not dropped. Silently discarding
        // them let `--fail-on=iamges` arm the gate against nothing and exit 0
        // — the silent-success failure this whole tool exists to catch, in the
        // one flag whose job is to catch it.
        const names = raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
        out.failOnEmpty = names.length === 0
        out.failOn = names.filter((s): s is Category =>
          (CATEGORIES as readonly string[]).includes(s),
        )
        out.unknownCategories = names.filter((s) => !(CATEGORIES as readonly string[]).includes(s))
      }
    } else out.unknown.push(arg)
  }

  return out
}
