/**
 * Argument parsing, split out of `index.ts` so it can be tested: importing
 * `index.ts` would run the CLI, which is the point of `index.ts`.
 */
import type { Category } from './report'

export const DEFAULT_BASE_URL = 'http://localhost:3100'
export const CATEGORIES: readonly Category[] = [
  'links',
  'images',
  'placeholders',
  'alt',
  'external',
  'redirects',
]

export interface CliArgs {
  baseUrl: string
  json: string | null
  maxPages: number
  checkExternal: boolean
  failOn: Category[]
  help: boolean
  unknown: string[]
}

export const USAGE = `sweep — ROADMAP K8 broken-link + broken-image sweep

  npm run sweep -- [options]

  --base-url=<url>     default ${DEFAULT_BASE_URL}, or $SWEEP_BASE_URL
  --external           also check external links (slow)
  --json=<path>        write the full report as JSON
  --max-pages=<n>      crawl ceiling, default 300
  --fail-on=<list>     exit 1 if any named category has findings
                       (${CATEGORIES.join(', ')}; "all" for every one)
  --help

  $SWEEP_COOKIE is sent with every request, for a Cognito-gated lane.`

export const parseArgs = (argv: readonly string[], env: NodeJS.ProcessEnv): CliArgs => {
  const out: CliArgs = {
    baseUrl: env.SWEEP_BASE_URL ?? DEFAULT_BASE_URL,
    json: null,
    maxPages: 300,
    checkExternal: false,
    failOn: [],
    help: false,
    unknown: [],
  }

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') out.help = true
    else if (arg === '--external') out.checkExternal = true
    else if (arg.startsWith('--base-url=')) out.baseUrl = arg.slice('--base-url='.length)
    else if (arg.startsWith('--json=')) out.json = arg.slice('--json='.length)
    else if (arg.startsWith('--max-pages=')) out.maxPages = Number(arg.slice('--max-pages='.length))
    else if (arg.startsWith('--fail-on=')) {
      const raw = arg.slice('--fail-on='.length)
      out.failOn =
        raw === 'all'
          ? [...CATEGORIES]
          : raw
              .split(',')
              .map((s) => s.trim())
              .filter((s): s is Category => (CATEGORIES as readonly string[]).includes(s))
    } else out.unknown.push(arg)
  }

  return out
}
