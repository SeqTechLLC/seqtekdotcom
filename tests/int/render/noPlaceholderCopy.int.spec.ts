// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { caseStudySkeleton } from '../../../src/payload/seed/skeletons/caseStudy'
import { partnerSkeleton } from '../../../src/payload/seed/skeletons/partner'
import { teamMemberSkeleton } from '../../../src/payload/seed/skeletons/teamMember'
import { workshopSkeleton } from '../../../src/payload/seed/skeletons/workshop'

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

/** Every string a skeleton can put on a page before a human writes real copy. */
export const SKELETON_PLACEHOLDER_COPY = [
  'A short professional bio.',
  'What the client was up against, in their terms.',
  'What we built and how we approached it.',
  'The measurable outcome the work delivered.',
  'Describe the workshop: the outcome it drives and how it runs.',
  'What this partner does and why SEQTEK works with them.',
] as const

const collectText = (node: unknown, out: string[]): void => {
  if (Array.isArray(node)) return node.forEach((n) => collectText(n, out))
  if (node === null || typeof node !== 'object') return
  const record = node as Record<string, unknown>
  if (typeof record.text === 'string') out.push(record.text)
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
  const DEFERRAL = /resolves at template time|coming soon|not implemented yet|placeholder text/i

  // Read the SOURCE FILES rather than `Component.toString()`. The bundler folds
  // constants and inlines children, so a stringified component can silently
  // drop the very text this guard exists to find — verified: a reintroduced
  // deferral string was invisible to `toString()` and visible here.
  const SECTIONS_DIR = join(import.meta.dirname, '../../../src/components/sections')

  it('no block render component contains deferred-work text', () => {
    const offenders = readdirSync(SECTIONS_DIR)
      .filter((f) => f.endsWith('.tsx'))
      .filter((f) => DEFERRAL.test(readFileSync(join(SECTIONS_DIR, f), 'utf8')))
    expect(
      offenders,
      `These components print deferred-work text as page copy: ${offenders.join(', ')}. ` +
        `Resolve the data in src/lib/resolveLayout.ts instead (ROADMAP UI-2).`,
    ).toEqual([])
  })

  it('reads a non-trivial number of components, so a bad path cannot pass vacuously', () => {
    const tsx = readdirSync(SECTIONS_DIR).filter((f) => f.endsWith('.tsx'))
    expect(tsx.length).toBeGreaterThan(30)
  })
})
