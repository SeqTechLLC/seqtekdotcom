// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { caseStudySkeleton } from '../../../src/payload/seed/skeletons/caseStudy'
import { industrySkeleton } from '../../../src/payload/seed/skeletons/industry'
import { partnerSkeleton } from '../../../src/payload/seed/skeletons/partner'
import { teamMemberSkeleton } from '../../../src/payload/seed/skeletons/teamMember'
import { workshopSkeleton } from '../../../src/payload/seed/skeletons/workshop'
import { SKELETON_PLACEHOLDER_COPY } from '../helpers/skeletonPlaceholderCopy'

/**
 * ROADMAP UI-2 / UI-3 — the "developer text reaches public copy" class.
 *
 * Two separate leaks, same shape:
 *   UI-2  four blocks rendered "Source: latest (resolves at template time)" as
 *         body copy whenever an author picked a non-manual source.
 *   UI-3  `layout` defaults to a skeleton whose body reads as finished prose
 *         ("A short professional bio."), and six published `/team/[slug]` pages
 *         served exactly that.
 *
 * This file is the standing guard for both. It does NOT hit a database — it
 * asserts on the source: no render component may contain deferred-work text,
 * and every skeleton's placeholder strings are enumerated here so the K8 sweep
 * (and any future publish check) has one authoritative list to grep rendered
 * HTML against. Adding a placeholder to a skeleton without adding it here is
 * the failure this catches.
 */

export { SKELETON_PLACEHOLDER_COPY } from '../helpers/skeletonPlaceholderCopy'

/** Fields on a block (not a lexical node) that carry human-readable copy. */
const COPY_FIELDS = [
  'text',
  'subheadline',
  'headline',
  // `heading` is a live field name (workshopSkeleton). Nothing is missed today
  // only because its values carry no `.` or `:` and the SENTENCE gate drops
  // them — a future skeleton putting a sentence there would reopen exactly the
  // blindness this list was widened to close.
  'heading',
  'body',
  'description',
  'label',
] as const

const collectText = (node: unknown, out: string[]): void => {
  if (Array.isArray(node)) return node.forEach((n) => collectText(n, out))
  if (node === null || typeof node !== 'object') return
  const record = node as Record<string, unknown>
  // `text` is the lexical node's field, but a skeleton also carries plain
  // string copy on the block itself — `subheadline`, `body`, `description`.
  // Collecting only `text` made the industry skeleton's `subheadline`
  // placeholder invisible to a guard whose docstring calls itself complete.
  for (const key of COPY_FIELDS) {
    if (typeof record[key] === 'string') out.push(record[key] as string)
  }
  Object.values(record).forEach((v) => collectText(v, out))
}

const skeletonText = (blocks: Array<Record<string, unknown>>): string[] => {
  const out: string[] = []
  collectText(blocks, out)
  return out
}

describe('UI-3 — the skeleton placeholder inventory stays complete', () => {
  const skeletons = {
    teamMember: teamMemberSkeleton(),
    caseStudy: caseStudySkeleton(),
    workshop: workshopSkeleton(),
    partner: partnerSkeleton(),
    industry: industrySkeleton(),
  }

  // Headings are structural scaffolding an editor fills under; the sentences
  // are the part that reads as finished copy if published untouched.
  const SENTENCE = /[.:]/

  for (const [name, blocks] of Object.entries(skeletons)) {
    it(`${name}: every sentence-like placeholder is listed in SKELETON_PLACEHOLDER_COPY`, () => {
      const unlisted = skeletonText(blocks)
        .filter((t) => SENTENCE.test(t))
        .filter(
          (t) =>
            !SKELETON_PLACEHOLDER_COPY.includes(t as (typeof SKELETON_PLACEHOLDER_COPY)[number]),
        )
      expect(
        unlisted,
        `${name} skeleton grew placeholder copy that nothing tracks. Add it to ` +
          `SKELETON_PLACEHOLDER_COPY so the broken-link/image sweep (K8) can catch it ` +
          `on a published page:\n  ${unlisted.join('\n  ')}`,
      ).toEqual([])
    })
  }
})

describe('UI-2 — no render component defers work to a string on the page', () => {
  // The exact shape that shipped: a component printing its own unimplemented
  // state instead of rendering, e.g. `Source: {source} (resolves at template time)`.
  const DEFERRAL = /resolves at template time|coming soon|not implemented yet/i

  // Recursive: `sections/` is flat today, but a future subdirectory would
  // otherwise escape the scan silently — and the vacuity check below counts
  // the same listing, so it would not catch that either.
  //
  // Read the SOURCE FILES rather than `Component.toString()`. The bundler folds
  // constants and inlines children, so a stringified component can silently
  // drop the very text this guard exists to find — verified: a reintroduced
  // deferral string was invisible to `toString()` and visible here.
  const SECTIONS_DIR = join(import.meta.dirname, '../../../src/components/sections')

  it('no block render component contains deferred-work text', () => {
    const offenders = readdirSync(SECTIONS_DIR, { recursive: true, encoding: 'utf8' })
      .filter((f) => f.endsWith('.tsx'))
      .filter((f) => DEFERRAL.test(readFileSync(join(SECTIONS_DIR, f), 'utf8')))
    expect(
      offenders,
      `These components print deferred-work text as page copy: ${offenders.join(', ')}. ` +
        `Resolve the data in src/lib/resolveLayout.ts instead (ROADMAP UI-2).`,
    ).toEqual([])
  })

  it('reads a non-trivial number of components, so a bad path cannot pass vacuously', () => {
    const tsx = readdirSync(SECTIONS_DIR, { recursive: true, encoding: 'utf8' }).filter((f) =>
      f.endsWith('.tsx'),
    )
    expect(tsx.length).toBeGreaterThan(30)
  })
})
