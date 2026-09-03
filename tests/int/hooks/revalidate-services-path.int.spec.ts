// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { buildRevalidatePlan } from '../../../src/payload/hooks/revalidateOnChange'

/**
 * ROADMAP SVC-2. This spec used to pin the nested `/services/[pillar]/[slug]`
 * paths, including the "service moved pillars, so bust the OLD pillar too"
 * case. That IA was retired in PR #79 and its last machinery — `resolvePillarSlug`,
 * `pillarIdOf`, `enrichServiceDoc` and the extra Payload fetch each service save
 * paid for — went with the `servicePillars` merge.
 *
 * What replaces it is the invariant that matters now: every tier is flat, so a
 * save busts its own page and nothing else. There is no index path to bust —
 * `/services` is a redirect, not a rendered route.
 */
describe('buildRevalidatePlan(services) — one flat namespace', () => {
  it('busts the service page, and not the retired /services index', () => {
    const plan = buildRevalidatePlan('services', { slug: 'change-management' })
    expect(plan.paths).toContain('/services/change-management')
    // `/services` is a redirect now, not a rendered route — nothing to bust.
    expect(plan.paths).not.toContain('/services')
  })

  it('emits no nested pillar path for any tier', () => {
    for (const tier of ['axis', 'group', 'leaf'] as const) {
      const plan = buildRevalidatePlan('services', { slug: 'strategy', tier })
      expect(plan.paths.filter((p) => p.startsWith('/services/'))).toEqual(['/services/strategy'])
    }
  })

  it('ignores a legacy `pillar` value rather than routing on it', () => {
    // A doc still carrying the dropped relation must not resurrect the nested
    // path — the field is gone from the schema, but old payloads exist.
    const plan = buildRevalidatePlan('services', {
      slug: 'data-engineering',
      pillar: { slug: 'technology-data' },
    })
    expect(plan.paths).not.toContain('/services/technology-data/data-engineering')
    expect(plan.paths).toContain('/services/data-engineering')
  })

  it('tags the collection list and the document', () => {
    const plan = buildRevalidatePlan('services', { slug: 'agentic-ai' })
    expect(plan.tags).toContain('services_list')
    expect(plan.tags).toContain('services_agentic-ai')
  })
})
