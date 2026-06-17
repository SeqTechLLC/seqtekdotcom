#!/usr/bin/env node
// @ts-check
/**
 * check-stale-overrides — flag `package.json#overrides` entries that are no
 * longer load-bearing.
 *
 * Core definition: an override is STALE iff removing it from package.json and
 * regenerating the lockfile keeps the production security audit clean — nothing
 * it was suppressing comes back. The gate is the one CI enforces in
 * `.github/workflows/ci.yml`: `npm audit --omit=dev --audit-level=high`. An
 * override is LOAD-BEARING when removing it reintroduces a high+ advisory
 * (because the upstream dependency's published range still forces a vulnerable
 * version).
 *
 * Isolation: every scenario is resolved and audited in a THROWAWAY temp
 * directory seeded with the (possibly modified) package.json, the committed
 * package-lock.json, and .npmrc. This:
 *   - never touches the real repo (pristine by construction — no mutate/restore),
 *   - is deterministic and independent of the local node_modules state
 *     (`npm install --package-lock-only` in the repo would be skewed by whatever
 *     is currently installed),
 *   - mirrors the real workflow: drop the override, `npm install`, audit. npm
 *     preserves already-satisfied locked versions, so a still-vulnerable lock is
 *     only downgraded when the upstream range no longer admits the safe version.
 *
 * Baseline + diffing: the baseline is the committed lockfile audited with every
 * override in place. A verdict is judged relative to it — an override is
 * load-bearing iff removing it introduces a high+ advisory NOT already in the
 * baseline. So a pre-existing advisory (e.g. a stale lockfile failing CI on its
 * own) can't mask an override's own contribution, and a dirty baseline is itself
 * surfaced as "CI is red right now".
 *
 * Per-PACKAGE grouping: a package can be pinned in several scopes (e.g.
 * `payload > ws` AND `happy-dom > ws`). Because npm dedupes to one installed
 * copy, removing one scope alone often leaves the package pinned by the other —
 * a one-at-a-time test would call each "stale" when the SET is jointly required.
 * So all scopes of a package are removed together: "do we still need to pin this
 * package at all?"
 *
 * `$`-referenced specs (e.g. `"tsx": "$tsx"`) are workspace version-sync pins,
 * not security overrides, and are reported as `skipped`, never analyzed.
 *
 * The human "why this exists / when to remove it" context lives in a sibling
 * `package.json#_overridesNotes` map keyed by the overridden package name. The
 * script merges those notes into its report; advisory IDs are read live from the
 * audit, never hand-maintained.
 *
 * Outputs (default: alongside this script; change with --out-dir):
 *   - report.json   machine-readable result (consumed by deps-hygiene.yml)
 *   - report.md     GitHub-issue-ready body
 * Progress goes to stderr; the report.json path goes to stdout.
 *
 * Flags:
 *   --out-dir <dir>    where to write report.json / report.md (default: this dir)
 *   --fail-on-stale    exit 1 when any stale override is found (default: exit 0)
 */

import { spawnSync } from 'node:child_process'
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  copyFileSync,
  existsSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(SCRIPT_DIR, '..', '..')
const PKG_PATH = join(REPO_ROOT, 'package.json')
const LOCK_PATH = join(REPO_ROOT, 'package-lock.json')
const NPMRC_PATH = join(REPO_ROOT, '.npmrc')
const AUDIT_GATE = 'npm audit --omit=dev --audit-level=high'

// ---- args --------------------------------------------------------------

function parseArgs(argv) {
  const opts = { outDir: SCRIPT_DIR, failOnStale: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--out-dir') opts.outDir = resolve(argv[++i])
    else if (a === '--fail-on-stale') opts.failOnStale = true
    else if (a === '--help' || a === '-h') {
      process.stdout.write(
        'Usage: node check-stale-overrides.mjs [--out-dir <dir>] [--fail-on-stale]\n',
      )
      process.exit(0)
    } else {
      log(`warning: ignoring unknown argument "${a}"`)
    }
  }
  return opts
}

// ---- small helpers -----------------------------------------------------

/** @param {string} msg */
function log(msg) {
  process.stderr.write(`${msg}\n`)
}

/** Run npm in `cwd`, capturing output without throwing. */
function npm(args, cwd) {
  const res = spawnSync('npm', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  return { status: res.status ?? 1, stdout: res.stdout ?? '', stderr: res.stderr ?? '' }
}

/**
 * Flatten the overrides tree into leaf entries. A leaf is reached when the value
 * is a string (the version spec); nested objects scope the override to a
 * dependency path (npm's nested-override syntax).
 * @returns {Array<{path: string[], pkg: string, spec: string}>}
 */
function flattenOverrides(overrides, prefix = []) {
  const leaves = []
  for (const [key, val] of Object.entries(overrides ?? {})) {
    const path = [...prefix, key]
    if (typeof val === 'string') leaves.push({ path, pkg: key, spec: val })
    else if (val && typeof val === 'object') leaves.push(...flattenOverrides(val, path))
  }
  return leaves
}

/** Deep clone of `overrides` with every leaf in `paths` removed and any
 * now-empty parent objects pruned. */
function withoutOverrides(overrides, paths) {
  const clone = structuredClone(overrides)
  for (const path of paths) {
    let node = clone
    for (let i = 0; i < path.length - 1; i++) node = node[path[i]]
    delete node[path[path.length - 1]]
    for (let i = path.length - 2; i >= 0; i--) {
      let parent = clone
      for (let j = 0; j < i; j++) parent = parent[path[j]]
      const key = path[i]
      if (parent[key] && typeof parent[key] === 'object' && Object.keys(parent[key]).length === 0) {
        delete parent[key]
      }
    }
  }
  return clone
}

/** Deduped advisories (any severity) from `npm audit --json`.
 * @returns {Array<{id, name, title, url, severity, range}>} */
function extractAdvisories(auditJson) {
  const found = new Map()
  for (const entry of Object.values(auditJson?.vulnerabilities ?? {})) {
    for (const via of entry?.via ?? []) {
      if (via && typeof via === 'object' && via.title) {
        const id = via.url || `${via.name}:${via.title}`
        if (!found.has(id)) {
          found.set(id, {
            id,
            name: via.name,
            title: via.title,
            url: via.url ?? null,
            severity: via.severity ?? entry.severity ?? 'unknown',
            range: via.range ?? null,
          })
        }
      }
    }
  }
  return [...found.values()]
}

const isHighPlus = (a) => a.severity === 'high' || a.severity === 'critical'

/**
 * Resolve + audit a scenario in an isolated temp dir. `removedPaths` is the set
 * of override leaf-paths to drop ([] = baseline, every override in place).
 * Seeds the temp dir with package.json (minus removed overrides), the committed
 * lockfile, and .npmrc, then `npm install --package-lock-only` (preserve) +
 * `npm audit`. Throws on a fatal npm/parse error; the caller records it.
 * @returns {{advisories: Array, counts: object}}
 */
function auditScenario(basePkg, removedPaths) {
  const dir = mkdtempSync(join(tmpdir(), 'stale-overrides-'))
  try {
    const candidate = structuredClone(basePkg)
    if (removedPaths.length) {
      const next = withoutOverrides(basePkg.overrides ?? {}, removedPaths)
      if (Object.keys(next).length === 0) delete candidate.overrides
      else candidate.overrides = next
    }
    writeFileSync(join(dir, 'package.json'), `${JSON.stringify(candidate, null, 2)}\n`)
    if (existsSync(LOCK_PATH)) copyFileSync(LOCK_PATH, join(dir, 'package-lock.json'))
    if (existsSync(NPMRC_PATH)) copyFileSync(NPMRC_PATH, join(dir, '.npmrc'))

    // --ignore-scripts: we only want lockfile resolution; the repo's `prepare`
    // (husky) lifecycle would fail in this dependency-less temp dir anyway.
    const relock = npm(
      [
        'install',
        '--package-lock-only',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--no-progress',
      ],
      dir,
    )
    if (relock.status !== 0)
      throw new Error(`relock failed (exit ${relock.status}): ${relock.stderr.trim().slice(-500)}`)

    const audit = npm(['audit', '--omit=dev', '--json'], dir)
    const json = JSON.parse(audit.stdout) // throws on unparseable output
    return { advisories: extractAdvisories(json), counts: json?.metadata?.vulnerabilities ?? {} }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

// ---- main --------------------------------------------------------------

const opts = parseArgs(process.argv.slice(2))

const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'))
const notes = pkg._overridesNotes ?? {}
const leaves = flattenOverrides(pkg.overrides)

const result = {
  generatedAt: new Date().toISOString(),
  auditGate: AUDIT_GATE,
  repoRoot: REPO_ROOT,
  // Committed lockfile + all overrides. Also the "is CI red right now?" signal.
  baseline: { clean: true, highPlusAdvisories: [], counts: {} },
  overridesChecked: 0,
  stale: [],
  loadBearing: [],
  skipped: [],
  errors: [],
  orphanNotes: [],
}

// Baseline: committed lockfile audited with every override in place.
let baselineHighIds = new Set()
try {
  const base = auditScenario(pkg, [])
  result.baseline.counts = base.counts
  result.baseline.highPlusAdvisories = base.advisories.filter(isHighPlus)
  baselineHighIds = new Set(result.baseline.highPlusAdvisories.map((a) => a.id))
  result.baseline.clean = baselineHighIds.size === 0
  log(
    result.baseline.clean
      ? 'baseline: clean (committed lockfile + all overrides passes the CI audit gate)'
      : `baseline: CI gate FAILING — ${baselineHighIds.size} high+ prod advisor${baselineHighIds.size === 1 ? 'y' : 'ies'} with all overrides in place (${[...baselineHighIds].join(', ')})`,
  )
} catch (e) {
  log(`warning: baseline audit failed (${e.message}); verdicts assume a clean baseline`)
}
log('')

// Group leaves by overridden package; analyze each group as a whole.
const groups = new Map()
for (const leaf of leaves) {
  if (leaf.spec.startsWith('$')) {
    log(
      `skip   ${leaf.path.join(' > ')} (= ${leaf.spec}) — version-sync reference, not a security override`,
    )
    result.skipped.push({
      ...leaf,
      reason: 'version-sync reference',
      note: notes[leaf.pkg] ?? null,
    })
    continue
  }
  if (!groups.has(leaf.pkg)) groups.set(leaf.pkg, [])
  groups.get(leaf.pkg).push(leaf)
}

for (const [pkgName, members] of groups) {
  const note = notes[pkgName] ?? null
  const paths = members.map((m) => m.path)
  const specs = [...new Set(members.map((m) => m.spec))]
  const meta = {
    pkg: pkgName,
    paths: paths.map((p) => p.join(' > ')),
    specs,
    scopes: members.length,
    note,
  }
  result.overridesChecked++
  log(`check  ${pkgName} (${meta.paths.join(', ')}; pinned ${specs.join(', ')}) …`)

  let withoutIt
  try {
    withoutIt = auditScenario(pkg, paths)
  } catch (e) {
    log(`  error: ${e.message}`)
    result.errors.push({ ...meta, detail: e.message })
    continue
  }

  // Only advisories NOT already in the baseline are attributable to removing
  // this package's override(s).
  const introduced = withoutIt.advisories.filter((a) => !baselineHighIds.has(a.id))
  const introducedHigh = introduced.filter(isHighPlus)
  const entry = {
    ...meta,
    suppressesHighPlus: introducedHigh,
    suppressesLower: introduced.filter((a) => !isHighPlus(a)),
    vulnCounts: withoutIt.counts,
  }

  if (introducedHigh.length === 0) {
    log('  STALE — removing all scope(s) introduces no new high+ prod advisory beyond the baseline')
    result.stale.push(entry)
  } else {
    log(
      `  load-bearing — suppresses ${introducedHigh.length} high+ prod advisor${introducedHigh.length === 1 ? 'y' : 'ies'} (${introducedHigh.map((a) => a.id).join(', ')})`,
    )
    result.loadBearing.push(entry)
  }
}

// Notes with no matching live override (e.g. queued for an unmerged PR).
// `_`-prefixed keys (e.g. `_doc`) are documentation, not package notes.
result.orphanNotes = Object.keys(notes).filter(
  (k) => !k.startsWith('_') && !leaves.some((l) => l.pkg === k),
)

// ---- write reports -----------------------------------------------------

mkdirSync(opts.outDir, { recursive: true })
const jsonPath = join(opts.outDir, 'report.json')
writeFileSync(jsonPath, `${JSON.stringify(result, null, 2)}\n`)
writeFileSync(join(opts.outDir, 'report.md'), renderMarkdown(result))

log('')
log(
  `summary: ${result.overridesChecked} checked · ${result.stale.length} stale · ` +
    `${result.loadBearing.length} load-bearing · ${result.skipped.length} skipped · ${result.errors.length} errors`,
)
process.stdout.write(`${jsonPath}\n`)

if (opts.failOnStale && result.stale.length > 0) process.exit(1)
process.exit(0)

// ---- markdown ----------------------------------------------------------

function renderMarkdown(r) {
  const lines = []
  const staleN = r.stale.length
  const n = r.overridesChecked
  const advLink = (a) => (a.url ? `[${a.name}](${a.url})` : a.name)
  const scopeText = (e) => e.paths.map((p) => `\`${p}\``).join(', ')

  lines.push('## Dependency override hygiene')
  lines.push('')
  let summary
  if (staleN > 0) {
    summary = `**${staleN} \`package.json\` override${staleN === 1 ? ' appears' : 's appear'} stale** — removing ${staleN === 1 ? 'it' : 'each'} keeps the CI audit gate clean.`
  } else if (n === 0) {
    summary = 'No security overrides to check (only version-sync references / skips).'
  } else if (n === 1) {
    summary =
      'The 1 checked override is still load-bearing — it cannot be removed without a high+ production advisory appearing.'
  } else {
    summary = `All ${n} checked overrides are still load-bearing — none can be removed without a high+ production advisory appearing.`
  }
  lines.push(summary)
  lines.push('')
  lines.push(
    `_An override is **stale** iff removing it and regenerating the lockfile keeps \`${r.auditGate}\` clean. Generated by \`.github/workflows/deps-hygiene.yml\` / \`tools/check-stale-overrides\`. Last checked: ${r.generatedAt}._`,
  )
  lines.push('')

  if (!r.baseline.clean) {
    const ids = r.baseline.highPlusAdvisories.map(advLink)
    lines.push('> [!CAUTION]')
    lines.push(
      `> **The CI audit gate is failing right now**, independently of override staleness: ${r.baseline.highPlusAdvisories.length} high+ production advisor${r.baseline.highPlusAdvisories.length === 1 ? 'y' : 'ies'} present with all overrides in place — ${ids.join(', ')}. Usually a stale lockfile (\`npm update\` the affected package) or a missing override. The per-package verdicts below isolate each override's own contribution and remain valid.`,
    )
    lines.push('')
  }

  if (staleN > 0) {
    lines.push('### Stale — candidates for removal')
    lines.push('')
    lines.push(
      '| Package (scopes) | Pinned | Removal trigger (from `_overridesNotes`) | Still suppresses (below gate) |',
    )
    lines.push('| --- | --- | --- | --- |')
    for (const e of r.stale) {
      const subGate = e.suppressesLower.length
        ? e.suppressesLower.map((a) => `${a.severity}: ${a.name}`).join('; ')
        : '— (fully clean)'
      lines.push(
        `| ${scopeText(e)} | \`${e.specs.join(', ')}\` | ${e.note ?? '_(none recorded)_'} | ${subGate} |`,
      )
    }
    lines.push('')
    lines.push(
      '> Stale is judged against the **high+** gate CI enforces, removing every scope of the package at once. A "still suppresses" entry means the override also clears a lower-severity advisory below that gate — keep it if you want a fully clean audit, otherwise it is safe to drop (after refreshing the lockfile).',
    )
    lines.push('')
  }

  if (r.loadBearing.length) {
    lines.push('### Load-bearing — keep')
    lines.push('')
    for (const e of r.loadBearing) {
      const ids = e.suppressesHighPlus.map(advLink)
      const scopeNote = e.scopes > 1 ? ` _(pinned in ${e.scopes} scopes; jointly required)_` : ''
      lines.push(
        `- ${scopeText(e)} (\`${e.specs.join(', ')}\`) — suppresses ${ids.join(', ') || 'high+ advisories'}${scopeNote}${e.note ? ` · _${e.note}_` : ''}`,
      )
    }
    lines.push('')
  }

  if (r.skipped.length) {
    lines.push('### Skipped')
    lines.push('')
    for (const e of r.skipped)
      lines.push(`- \`${e.path.join(' > ')}\` (\`${e.spec}\`) — ${e.reason}`)
    lines.push('')
  }

  if (r.orphanNotes.length) {
    lines.push('### Notes without a live override')
    lines.push('')
    lines.push(
      `\`_overridesNotes\` documents ${r.orphanNotes.map((k) => `\`${k}\``).join(', ')} but no matching override is in \`overrides\` yet (e.g. queued for an unmerged PR). Backfill or prune.`,
    )
    lines.push('')
  }

  if (r.errors.length) {
    lines.push('### Errors')
    lines.push('')
    for (const e of r.errors)
      lines.push(
        `- \`${e.pkg}\` (${e.paths.join(', ')}) — ${e.detail ?? 'failed'} (see workflow logs)`,
      )
    lines.push('')
  }

  return `${lines.join('\n')}\n`
}
