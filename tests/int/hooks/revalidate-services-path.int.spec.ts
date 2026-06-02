// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { buildRevalidatePlan } from '../../../src/payload/hooks/revalidateOnChange'

/**
 * spec 004 T034 — pins the drift-#1 fix (research §D4). `buildRevalidatePlan`
 * for `services` must emit the NESTED detail + pillar paths
 * (`/services/[pillar]/[slug]` + `/services/[pillar]`), while the cache TAGS
 * stay unchanged (`services_${slug}` / `services_list`) so the keystone
 * tag-parity invariant (C1) still holds.
 */

describe('buildRevalidatePlan(services) — nested path', () => {
  it('emits nested detail + pillar paths when `pillar` is a populated object', () => {
    const plan = buildRevalidatePlan('services', {
      _status: 'published',
      slug: 'cloud-migration',
      pillar: { slug: 'modernization' },
    })
    expect(plan.paths).toContain('/services/modernization/cloud-migration')
    expect(plan.paths).toContain('/services/modernization')
  })

  it('accepts an injected `pillarSlug` (the afterChange hook path)', () => {
    const plan = buildRevalidatePlan('services', {
      _status: 'published',
      slug: 'svc',
      pillarSlug: 'data',
    })
    expect(plan.paths).toContain('/services/data/svc')
    expect(plan.paths).toContain('/services/data')
  })

  it('keeps the tag scheme unchanged (keystone C1 parity)', () => {
    const plan = buildRevalidatePlan('services', {
      _status: 'published',
      slug: 'svc',
      pillarSlug: 'data',
    })
    expect(plan.tags.sort()).toEqual(['services_list', 'services_svc'])
  })

  it('falls back to the flat path only when the pillar cannot be resolved', () => {
    const plan = buildRevalidatePlan('services', { _status: 'published', slug: 'svc' })
    expect(plan.paths).toContain('/services/svc')
    expect(plan.paths).not.toContain('/services/undefined/svc')
  })

  it('handles a slug rename with the same pillar (old + new nested paths)', () => {
    const plan = buildRevalidatePlan(
      'services',
      { _status: 'published', slug: 'new', pillarSlug: 'ops' },
      { _status: 'published', slug: 'old' },
    )
    expect(plan.paths).toContain('/services/ops/new')
    expect(plan.paths).toContain('/services/ops/old')
  })

  it('busts BOTH pillars when a service moves pillars (PR #21 review follow-up)', () => {
    // previousDoc carries the OLD pillar slug (the afterChange hook enriches it
    // when the pillar relationship changes). Without this, the stale
    // `/services/old-pillar/...` paths would survive until the 3600s fallback.
    const plan = buildRevalidatePlan(
      'services',
      { _status: 'published', slug: 'svc', pillarSlug: 'new-pillar' },
      { _status: 'published', slug: 'svc', pillarSlug: 'old-pillar' },
    )
    expect(plan.paths).toContain('/services/new-pillar/svc')
    expect(plan.paths).toContain('/services/new-pillar')
    expect(plan.paths).toContain('/services/old-pillar/svc')
    expect(plan.paths).toContain('/services/old-pillar')
    // tags stay slug-based — keystone C1 parity is unaffected by the pillar move
    expect(plan.tags.sort()).toEqual(['services_list', 'services_svc'])
  })
})
