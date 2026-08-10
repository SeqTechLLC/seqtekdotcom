#!/usr/bin/env node
// @ts-check
/**
 * audit-diff — the per-PR production audit gate, differential.
 *
 * WHY THIS EXISTS
 *
 * `npm audit` reads LIVE advisory data. The old gate (`npm audit --omit=dev
 * --audit-level=high`, run directly in CI) therefore answered "is the world's
 * advisory state clean right now?" — not "is this pull request safe?". Those
 * are different questions, and conflating them turned every open PR red
 * whenever an unrelated advisory was published overnight. Three PRs in one week
 * (#88, #89, #90) were blocked by advisories in dependencies they never
 * touched.
 *
 * So the gate asks the narrower, actually-actionable question:
 *
 *     does THIS diff introduce a high+ production advisory that main does not
 *     already have?
 *
 * Advisories already present on the base branch are reported as warnings and do
 * NOT fail the PR. They are main's problem, and main's problem is tracked by
 * the scheduled job in `.github/workflows/deps-hygiene.yml`, which files a
 * tracking issue. That split is deliberate: PR CI gates the diff, the schedule
 * gates the repo. Losing the second half would let main rot silently — if you
 * are removing one of these, remove both or neither.
 *
 * HOW
 *
 * Both sides are resolved and audited in throwaway temp dirs (see
 * `tools/npm-audit/audit.mjs`), seeded from a (package.json, package-lock.json)
 * pair — HEAD's from the working tree, base's read out of git with `git show`.
 * Nothing depends on the local node_modules, so the comparison is stable.
 *
 * FAIL-CLOSED
 *
 * If the base side cannot be established (missing ref, shallow clone that never
 * fetched the base commit, unparseable lockfile), the tool does NOT quietly
 * pass. It falls back to the absolute gate — any high+ advisory fails — and
 * says loudly that it did so. A gate that silently degrades to "always green"
 * is worse than no gate.
 *
 * MODES
 *   (default)     differential: fail only on advisories introduced vs --base
 *   --absolute    audit HEAD alone; write a report; exit 0 (reporter, not gate)
 *
 * FLAGS
 *   --base <ref>       git ref to compare against (default: origin/main)
 *   --out-dir <dir>    write audit.json / audit.md here (default: no files)
 *   --json             print the machine-readable result to stdout
 *   --help
 *
 * EXIT CODES
 *   0  no introduced high+ advisories (or --absolute)
 *   1  introduced high+ advisories, or fail-closed fallback found high+
 *   2  the tool itself failed (bad args, npm/registry error)
 */

import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { auditTree, isHighPlus, AUDIT_GATE } from '../npm-audit/audit.mjs'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(SCRIPT_DIR, '..', '..')
const PKG_PATH = join(REPO_ROOT, 'package.json')
const LOCK_PATH = join(REPO_ROOT, 'package-lock.json')
const NPMRC_PATH = join(REPO_ROOT, '.npmrc')

/** @param {string} msg */
const log = (msg) => process.stderr.write(`${msg}\n`)

function parseArgs(argv) {
  const opts = {
    base: 'origin/main',
    outDir: /** @type {string|null} */ (null),
    json: false,
    absolute: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--base') opts.base = argv[++i]
    else if (a === '--out-dir') opts.outDir = resolve(argv[++i])
    else if (a === '--json') opts.json = true
    else if (a === '--absolute') opts.absolute = true
    else if (a === '--help' || a === '-h') {
      process.stdout.write(
        'Usage: node audit-diff.mjs [--base <ref>] [--absolute] [--out-dir <dir>] [--json]\n',
      )
      process.exit(0)
    } else log(`warning: ignoring unknown argument "${a}"`)
  }
  return opts
}

/** Read a path out of a git ref. Returns null when the ref or path is absent. */
function gitShow(ref, path) {
  const res = spawnSync('git', ['show', `${ref}:${path}`], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  return res.status === 0 ? (res.stdout ?? null) : null
}

/** @param {Array<any>} advisories */
function formatList(advisories) {
  return advisories
    .map((a) => `  - ${a.severity.toUpperCase()} ${a.name}: ${a.title}\n    ${a.url ?? '(no url)'}`)
    .join('\n')
}

/** GitHub-issue-ready body for the scheduled reporter. */
function toMarkdown(advisories, { base, mode }) {
  const lines = []
  lines.push('## Production dependency audit')
  lines.push('')
  lines.push(`Gate: \`${AUDIT_GATE}\` · mode: \`${mode}\`${base ? ` · base: \`${base}\`` : ''}`)
  lines.push('')
  if (!advisories.length) {
    lines.push('**No high or critical advisories in the production dependency tree.**')
    return `${lines.join('\n')}\n`
  }
  lines.push(`**${advisories.length} high+ advisory(ies) in production dependencies.**`)
  lines.push('')
  lines.push('| Severity | Package | Advisory | Affected range |')
  lines.push('| --- | --- | --- | --- |')
  for (const a of advisories) {
    const link = a.url ? `[${a.title}](${a.url})` : a.title
    lines.push(`| ${a.severity} | \`${a.name}\` | ${link} | \`${a.range ?? '?'}\` |`)
  }
  lines.push('')
  lines.push(
    'These are present on the default branch, so they do not block pull requests ' +
      '(see `tools/audit-diff`). Clearing them is its own piece of work: bump the ' +
      'dependency if a patched version exists, add a `package.json#overrides` pin ' +
      'if the parent pins a vulnerable version exactly, or move to a parent release ' +
      'that dropped the dependency.',
  )
  return `${lines.join('\n')}\n`
}

function main() {
  const opts = parseArgs(process.argv.slice(2))

  if (!existsSync(PKG_PATH)) {
    log('error: no package.json at the repo root')
    process.exit(2)
  }
  const headPkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'))
  const headLock = existsSync(LOCK_PATH) ? readFileSync(LOCK_PATH, 'utf8') : undefined

  let head
  try {
    head = auditTree({ pkgJson: headPkg, lockText: headLock, npmrcPath: NPMRC_PATH })
  } catch (err) {
    log(`error: auditing HEAD failed — ${err instanceof Error ? err.message : String(err)}`)
    process.exit(2)
  }
  const headHigh = head.advisories.filter(isHighPlus)

  const write = (advisories, meta) => {
    if (!opts.outDir) return
    mkdirSync(opts.outDir, { recursive: true })
    writeFileSync(
      join(opts.outDir, 'audit.json'),
      `${JSON.stringify({ ...meta, advisories }, null, 2)}\n`,
    )
    writeFileSync(join(opts.outDir, 'audit.md'), toMarkdown(advisories, meta))
  }

  // ---- absolute mode: report on HEAD alone, never fail -------------------
  if (opts.absolute) {
    write(headHigh, { mode: 'absolute', base: null, count: headHigh.length })
    if (headHigh.length) {
      log(`${headHigh.length} high+ advisory(ies) in the production tree:`)
      log(formatList(headHigh))
    } else {
      log('no high+ advisories in the production tree.')
    }
    if (opts.json) process.stdout.write(`${JSON.stringify(headHigh, null, 2)}\n`)
    process.exit(0)
  }

  // ---- differential mode -------------------------------------------------
  const basePkgText = gitShow(opts.base, 'package.json')
  const baseLockText = gitShow(opts.base, 'package-lock.json')

  if (!basePkgText) {
    // FAIL-CLOSED. Do not degrade to "green"; degrade to the old absolute gate.
    log(`error: could not read package.json from base ref "${opts.base}".`)
    log('       In CI this usually means the base commit was never fetched')
    log('       (actions/checkout defaults to a shallow, single-commit clone).')
    log(`       Falling back to the ABSOLUTE gate: \`${AUDIT_GATE}\`.`)
    write(headHigh, { mode: 'absolute-fallback', base: opts.base, count: headHigh.length })
    if (headHigh.length) {
      log(`\n${headHigh.length} high+ advisory(ies) in the production tree:`)
      log(formatList(headHigh))
      process.exit(1)
    }
    log('\nno high+ advisories in the production tree.')
    process.exit(0)
  }

  let base
  try {
    base = auditTree({
      pkgJson: JSON.parse(basePkgText),
      lockText: baseLockText ?? undefined,
      npmrcPath: NPMRC_PATH,
    })
  } catch (err) {
    log(`error: auditing base "${opts.base}" failed — ${err instanceof Error ? err.message : err}`)
    log(`       Falling back to the ABSOLUTE gate: \`${AUDIT_GATE}\`.`)
    write(headHigh, { mode: 'absolute-fallback', base: opts.base, count: headHigh.length })
    process.exit(headHigh.length ? 1 : 0)
  }

  const baseIds = new Set(base.advisories.filter(isHighPlus).map((a) => a.id))
  const introduced = headHigh.filter((a) => !baseIds.has(a.id))
  const preExisting = headHigh.filter((a) => baseIds.has(a.id))

  write(introduced, {
    mode: 'differential',
    base: opts.base,
    count: introduced.length,
    preExisting: preExisting.length,
  })

  log(`base (${opts.base}): ${baseIds.size} high+ advisory(ies)`)
  log(`head:              ${headHigh.length} high+ advisory(ies)`)
  log('')

  if (preExisting.length) {
    log(`${preExisting.length} pre-existing advisory(ies) — present on the base branch, NOT`)
    log('blocking this PR. Tracked by the scheduled audit in deps-hygiene.yml:')
    log(formatList(preExisting))
    log('')
  }

  if (opts.json) process.stdout.write(`${JSON.stringify({ introduced, preExisting }, null, 2)}\n`)

  if (introduced.length) {
    log(`FAIL — this change introduces ${introduced.length} high+ advisory(ies):`)
    log(formatList(introduced))
    log('')
    log('These are not on the base branch, so this diff brought them in — most')
    log('often a dependency bump or a removed `package.json#overrides` pin.')
    process.exit(1)
  }

  log('PASS — this change introduces no new high+ production advisories.')
  process.exit(0)
}

main()
