/**
 * CLI: ROADMAP K8 — the broken-link and broken-image sweep.
 *
 *   npm run sweep -- [--base-url=https://preview.seqtek.com] [--external]
 *                    [--json=sweep.json] [--max-pages=200] [--fail-on=links,images]
 *
 * Crawls every internal link from `/`, seeded additionally from the site's own
 * `/sitemap.xml` so orphaned documents are reached too, at desktop and mobile,
 * and reports:
 *
 *   - routes that do not return 200, naming the page that links to them
 *   - <img> elements that are laid out but never painted (naturalWidth === 0)
 *   - placeholder copy and repo-internal references in rendered text
 *   - <img> elements with no alt attribute
 *   - external links (only with --external; they are slow and flaky)
 *
 * A gated lane needs its session:
 *
 *   SWEEP_COOKIE='AWSELBAuthSessionCookie-0=…; AWSELBAuthSessionCookie-1=…'
 *
 * Exit code is 0 unless --fail-on names a category that has findings, so the
 * default run is a report and CI adoption is a flag, not a rewrite.
 */

import { writeFile } from 'node:fs/promises'

import { CATEGORIES, parseArgs, USAGE } from './args'
import { DEFAULT_VIEWPORTS, sweep } from './crawl'
import { categorise, countsByCategory, format } from './report'

const main = async (): Promise<number> => {
  const args = parseArgs(process.argv.slice(2), process.env)

  if (args.help) {
    console.log(USAGE)
    return 0
  }
  if (args.unknown.length > 0) {
    console.error(`unknown argument(s): ${args.unknown.join(', ')}\n\n${USAGE}`)
    return 2
  }
  if (!Number.isFinite(args.maxPages) || args.maxPages < 1) {
    console.error('--max-pages must be a positive number')
    return 2
  }
  // An empty value is the residue of the typo shape: `--fail-on=` parses to
  // zero categories and zero unknowns, so the gate is armed against nothing and
  // the run is green. The realistic vector is an unset workflow variable
  // (`--fail-on=${SWEEP_CATEGORIES}`), not a hand slip.
  if (args.failOnEmpty) {
    console.error(`--fail-on was given no categories\nvalid: ${CATEGORIES.join(', ')}, or "all"`)
    return 2
  }
  if (args.unknownCategories.length > 0) {
    console.error(
      `--fail-on: not a category: ${args.unknownCategories.join(', ')}\n` +
        `valid: ${CATEGORIES.join(', ')}, or "all"`,
    )
    return 2
  }
  // Otherwise the gate is armed against a check that never runs, and passes
  // for that reason — the silent-success failure this tool is about. `all` is
  // a shorthand, not a request for `external` specifically, so it drops the
  // category it cannot run instead of refusing to start.
  if (args.failOn.includes('external') && !args.checkExternal) {
    if (!args.failOnAll) {
      console.error('--fail-on=external needs --external, or it can never fire')
      return 2
    }
    args.failOn = args.failOn.filter((category) => category !== 'external')
    console.error('note: --fail-on=all excludes `external`, which needs --external')
  }

  const report = await sweep({
    baseUrl: args.baseUrl.replace(/\/$/, ''),
    viewports: DEFAULT_VIEWPORTS,
    cookieHeader: process.env.SWEEP_COOKIE,
    maxPages: args.maxPages,
    checkExternal: args.checkExternal,
    onProgress: (route, index, total) => {
      process.stderr.write(`\r[${index}/${total}] ${route.padEnd(60).slice(0, 60)}`)
    },
  })
  process.stderr.write(`\r${''.padEnd(80)}\r`)

  const found = categorise(report)
  console.log(format(report, found))

  if (args.json) {
    await writeFile(args.json, JSON.stringify({ report, found }, null, 2))
    console.log(`\nreport written to ${args.json}`)
  }

  const counts = countsByCategory(found)
  const failed = args.failOn.filter((category) => counts[category] > 0)
  if (failed.length > 0) {
    console.error(`\nfailing on: ${failed.map((c) => `${c} (${counts[c]})`).join(', ')}`)
    return 1
  }
  return 0
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(error)
    process.exit(1)
  },
)
