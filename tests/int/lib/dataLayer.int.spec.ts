import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { pushDataLayer } from '../../../src/lib/analytics/dataLayer'

/**
 * spec 008 US3 (T014) — the shared dataLayer emitter is SSR-safe and produces
 * the documented event shapes (data-model §A, contracts/datalayer-events.md,
 * INV-1/INV-4). The form_submission_* shapes (INV-3) stay covered by
 * hubspot-submit.int.spec.ts, which now exercises the same emitter.
 *
 * Authored FIRST: with no `src/lib/analytics/dataLayer.ts` present the import
 * fails to resolve → red, until T015 lands the module.
 */
describe('pushDataLayer (analytics dataLayer emitter)', () => {
  beforeEach(() => {
    // jsdom provides window; reset the dataLayer between cases.
    window.dataLayer = []
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('pushes the cta_click shape verbatim onto window.dataLayer (D1)', () => {
    pushDataLayer({
      event: 'cta_click',
      ctaId: 'header-cta',
      label: 'Book a Call',
      location: 'header',
      href: '/contact',
    })

    expect(window.dataLayer).toEqual([
      {
        event: 'cta_click',
        ctaId: 'header-cta',
        label: 'Book a Call',
        location: 'header',
        href: '/contact',
      },
    ])
  })

  it('pushes the case_study_view shape (D2)', () => {
    pushDataLayer({ event: 'case_study_view', slug: 'legacy-platform', title: 'Legacy Platform' })

    expect(window.dataLayer?.at(-1)).toEqual({
      event: 'case_study_view',
      slug: 'legacy-platform',
      title: 'Legacy Platform',
    })
  })

  it('pushes the booking_complete shape (D3 seam)', () => {
    pushDataLayer({ event: 'booking_complete', meetingUrl: 'https://meetings.hubspot.com/seqtek' })

    expect(window.dataLayer?.at(-1)).toEqual({
      event: 'booking_complete',
      meetingUrl: 'https://meetings.hubspot.com/seqtek',
    })
  })

  it('initializes window.dataLayer when it is absent (no throw)', () => {
    delete (window as { dataLayer?: unknown }).dataLayer
    pushDataLayer({ event: 'cta_click', ctaId: 'x', label: 'X', location: 'footer' })

    expect(window.dataLayer).toHaveLength(1)
  })

  it('is SSR-safe: a no-op when window is undefined (INV-4)', () => {
    vi.stubGlobal('window', undefined)

    expect(() =>
      pushDataLayer({ event: 'cta_click', ctaId: 'x', label: 'X', location: 'footer' }),
    ).not.toThrow()
  })
})
