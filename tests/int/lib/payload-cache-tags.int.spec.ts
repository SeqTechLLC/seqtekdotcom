// @vitest-environment node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

// `src/lib/payload.ts` opens with `import 'server-only'`, whose default export
// throws unless the `react-server` condition is active (it isn't under
// Vitest). Mock it to an empty module so we can import the tag helpers.
vi.mock('server-only', () => ({}))

import { detailCacheTags, listCacheTags, globalCacheTags } from '../../../src/lib/payload'
import { buildRevalidatePlan } from '../../../src/payload/hooks/revalidateOnChange'

/**
 * spec 004 T009 — the KEYSTONE test. The whole ISR contract rests on the
 * cached readers' `tags` arrays matching `buildRevalidatePlan`'s output: the
 * `revalidateOnChange` afterChange hook calls `revalidateTag(...)` with the
 * plan's tags, and `revalidateTag` only busts caches that REGISTERED those
 * tags. If the reader tags and the plan tags drift apart, an editor publish
 * silently fails to invalidate and the page serves stale until the 3600s
 * fallback. This test is two independent sources of truth (the reader tag
 * helpers in `src/lib/payload.ts` vs. `buildRevalidatePlan` in the hook) that
 * MUST agree — treat any red here as a build-breaker.
 *
 * Invariants (cached-readers.md):
 *   C1 — reader tags === buildRevalidatePlan(collection, {slug}).tags
 *   C2 — collection readers query with `overrideAccess: false` (no draft leak)
 *   C4 — `getPayload({ config })` only inside `getPayloadInstance`
 */

const SLUGGED_COLLECTIONS = [
  'pages',
  'caseStudies',
  'posts',
  'services',
  'servicePillars',
  'workshops',
] as const

const GLOBALS = ['homepage', 'siteSettings', 'navigation'] as const

const asSet = (a: string[]) => new Set(a)

describe('C1 — collection detail reader tags === buildRevalidatePlan tags', () => {
  it.each(SLUGGED_COLLECTIONS)('%s detail reader matches the plan', (collection) => {
    const slug = `${collection}-fixture-slug`
    const readerTags = detailCacheTags(collection, slug)
    const planTags = buildRevalidatePlan(collection, { _status: 'published', slug }).tags
    expect(asSet(readerTags)).toEqual(asSet(planTags))
  })

  it.each(SLUGGED_COLLECTIONS)('%s list reader tag is a subset of the plan', (collection) => {
    const planTags = buildRevalidatePlan(collection, { _status: 'published', slug: 'x' }).tags
    for (const tag of listCacheTags(collection)) {
      expect(planTags).toContain(tag)
    }
  })
})

describe('C3 — global reader tags === buildRevalidatePlan tags', () => {
  it.each(GLOBALS)('%s global reader matches the plan', (globalSlug) => {
    const readerTags = globalCacheTags(globalSlug)
    const planTags = buildRevalidatePlan(globalSlug, { _status: 'published' }).tags
    expect(asSet(readerTags)).toEqual(asSet(planTags))
  })
})

describe('C1 — pins the concrete tag scheme (catches a plan refactor)', () => {
  it('caseStudies detail emits exactly [<col>_<slug>, <col>_list]', () => {
    expect(
      buildRevalidatePlan('caseStudies', { _status: 'published', slug: 'acme' }).tags.sort(),
    ).toEqual(['caseStudies_acme', 'caseStudies_list'])
    expect(detailCacheTags('caseStudies', 'acme').sort()).toEqual([
      'caseStudies_acme',
      'caseStudies_list',
    ])
  })

  it('the three globals emit exactly [<global>_list] (no per-slug tag)', () => {
    for (const g of GLOBALS) {
      expect(buildRevalidatePlan(g, { _status: 'published' }).tags).toEqual([`${g}_list`])
      expect(globalCacheTags(g)).toEqual([`${g}_list`])
    }
  })
})

const REPO_ROOT = resolve(__dirname, '../../..')

// Strip comments so the C2/C4 scans assert on actual code, not prose that
// happens to mention `draft: true` / `getPayload({ config })`.
const stripComments = (src: string): string =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

const payloadCode = stripComments(readFileSync(resolve(REPO_ROOT, 'src/lib/payload.ts'), 'utf8'))

describe('C2 — collection readers apply the published filter (overrideAccess: false)', () => {
  it('every payload.find(...) in src/lib/payload.ts passes overrideAccess: false', () => {
    const findCalls = payloadCode.match(/payload\.find\(/g) ?? []
    const overrideFalse = payloadCode.match(/overrideAccess:\s*false/g) ?? []
    expect(findCalls.length).toBeGreaterThan(0)
    // Each find() call must be paired with an overrideAccess: false in the
    // same module — no published-filter bypass that could leak drafts.
    expect(overrideFalse.length).toBeGreaterThanOrEqual(findCalls.length)
  })

  it('no reader passes draft: true (the published path never reads drafts)', () => {
    expect(payloadCode).not.toMatch(/draft:\s*true/)
  })
})

describe('C4 — getPayload({ config }) lives only in getPayloadInstance', () => {
  it('src/lib/payload.ts calls getPayload exactly once', () => {
    const calls = payloadCode.match(/getPayload\(\{/g) ?? []
    expect(calls.length).toBe(1)
  })
})
