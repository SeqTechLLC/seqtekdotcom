// @ts-check
/**
 * Shared npm-audit primitives.
 *
 * Extracted from `tools/check-stale-overrides` so the differential PR gate
 * (`tools/audit-diff`) and the stale-override checker agree — byte for byte —
 * on two things that must never drift apart:
 *
 *   1. WHAT COUNTS as an advisory (`extractAdvisories` + `isHighPlus`), and
 *   2. HOW a tree is audited (`auditTree`): resolve + audit in a THROWAWAY temp
 *      dir seeded with a package.json / package-lock.json pair, never the repo.
 *
 * The isolation matters. `npm audit` in the repo reads the installed
 * node_modules, so its answer depends on whatever happens to be on disk. Every
 * function here is a pure function of the (package.json, package-lock.json)
 * pair it is handed, which is what makes "HEAD vs base" a meaningful diff
 * rather than a race against the local install state.
 */

import { spawnSync } from 'node:child_process'
import { writeFileSync, mkdtempSync, rmSync, copyFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

/** The gate CI enforces; kept as one string so docs and errors can quote it. */
export const AUDIT_GATE = 'npm audit --omit=dev --audit-level=high'

/**
 * Run npm in `cwd`, capturing output without throwing.
 * @param {string[]} args
 * @param {string} cwd
 */
export function npm(args, cwd) {
  const res = spawnSync('npm', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  return { status: res.status ?? 1, stdout: res.stdout ?? '', stderr: res.stderr ?? '' }
}

/**
 * Deduped advisories (any severity) from `npm audit --json`.
 *
 * Keyed by advisory URL when present (the GHSA permalink is the only stable
 * identifier — titles get reworded and version ranges widen as new affected
 * releases are found), falling back to `name:title`.
 * @param {any} auditJson
 * @returns {Array<{id: string, name: string, title: string, url: string|null, severity: string, range: string|null}>}
 */
export function extractAdvisories(auditJson) {
  const found = new Map()
  for (const entry of Object.values(auditJson?.vulnerabilities ?? {})) {
    for (const via of /** @type {any} */ (entry)?.via ?? []) {
      if (via && typeof via === 'object' && via.title) {
        const id = via.url || `${via.name}:${via.title}`
        if (!found.has(id)) {
          found.set(id, {
            id,
            name: via.name,
            title: via.title,
            url: via.url ?? null,
            severity: via.severity ?? /** @type {any} */ (entry).severity ?? 'unknown',
            range: via.range ?? null,
          })
        }
      }
    }
  }
  return [...found.values()]
}

/** @param {{severity: string}} a */
export const isHighPlus = (a) => a.severity === 'high' || a.severity === 'critical'

/**
 * Resolve + audit one (package.json, package-lock.json) pair in an isolated
 * temp dir.
 *
 * `npm install --package-lock-only` refreshes resolution without touching
 * node_modules; npm preserves already-locked versions that still satisfy their
 * ranges, so this reports what the COMMITTED lockfile actually installs — not
 * what a greenfield install would pick.
 *
 * @param {object} opts
 * @param {object} opts.pkgJson        parsed package.json to audit
 * @param {string} [opts.lockText]     package-lock.json contents (omit to resolve fresh)
 * @param {string} [opts.npmrcPath]    .npmrc to copy in (registry config)
 * @returns {{advisories: Array<any>, relockFailed: boolean, stderr: string}}
 */
export function auditTree({ pkgJson, lockText, npmrcPath }) {
  const dir = mkdtempSync(join(tmpdir(), 'npm-audit-'))
  try {
    writeFileSync(join(dir, 'package.json'), `${JSON.stringify(pkgJson, null, 2)}\n`)
    if (lockText) writeFileSync(join(dir, 'package-lock.json'), lockText)
    if (npmrcPath && existsSync(npmrcPath)) copyFileSync(npmrcPath, join(dir, '.npmrc'))

    // --ignore-scripts: we only want lockfile resolution, and the repo's
    // `prepare` (husky) lifecycle would fail in this dependency-less temp dir.
    const relock = npm(
      ['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund'],
      dir,
    )
    const audit = npm(['audit', '--omit=dev', '--json'], dir)

    let parsed
    try {
      parsed = JSON.parse(audit.stdout)
    } catch {
      throw new Error(
        `could not parse \`npm audit --json\` output:\n${audit.stderr || audit.stdout}`,
      )
    }
    return {
      advisories: extractAdvisories(parsed),
      relockFailed: relock.status !== 0,
      stderr: relock.stderr,
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}
