// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { organizationLd } from '../../../src/lib/structured-data'

/**
 * Spec 011 T007 (FR-004) — the gate that stops US1 from silently gutting the
 * homepage's `Organization` schema.
 *
 * The spec as first drafted said Site Settings fed **two** values into rendered
 * output. It feeds **seven**. `buildMetadata` consumes `tagline` and
 * `companyName`; `organizationLd` additionally consumes `email`, `phone`, the
 * whole `address` (as a `PostalAddress`) and the `socialLinks` (as `sameAs`).
 *
 * Withdrawing the global while relocating only the metadata pair would have
 * dropped the postal address, telephone, email and social profiles from every
 * homepage render — invisible to `visual:capture`, invisible to a typecheck,
 * and a direct contradiction of the cutover step added in PR #105 that exists
 * to make that address emit at all.
 *
 * `EXPECTED` below was captured from the **CMS global** while it was still the
 * source (verified 2026-08-24 against the `site_settings` table), and asserted
 * identical before and after T014 swapped the source to the code-owned
 * constant. It is the contract: this object is what the homepage emits.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://seqtek-preview.com'

const EXPECTED = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'SEQTEK',
  url: SITE_URL,
  description: 'Delivering Transformative Technologies Since 1999',
  email: 'contact@seqtek.com',
  telephone: '(918) 493-7200',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '12 N Cheyenne Ave.',
    addressLocality: 'Tulsa',
    addressRegion: 'OK',
    postalCode: '74103',
    addressCountry: 'US',
  },
  sameAs: ['https://www.linkedin.com/company/seqtek', 'https://www.facebook.com/seqtek/'],
}

describe('organizationLd — the seven relocated values', () => {
  it('emits the complete expected object', () => {
    expect(organizationLd()).toEqual(EXPECTED)
  })

  it.each([
    ['name', 'name'],
    ['description (tagline)', 'description'],
    ['email', 'email'],
    ['telephone', 'telephone'],
    ['address', 'address'],
    ['sameAs', 'sameAs'],
  ])('%s is present and non-empty', (_label, key) => {
    const out = organizationLd() as Record<string, unknown>
    expect(out[key], `Organization JSON-LD lost "${key}"`).toBeTruthy()
  })

  it('the postal address carries all four parts', () => {
    const address = (organizationLd() as Record<string, unknown>).address as Record<string, string>
    expect(address.streetAddress).toBe('12 N Cheyenne Ave.')
    expect(address.addressLocality).toBe('Tulsa')
    expect(address.addressRegion).toBe('OK')
    expect(address.postalCode).toBe('74103')
  })

  it('an empty twitterUrl is filtered out of sameAs rather than emitted blank', () => {
    const sameAs = (organizationLd() as Record<string, unknown>).sameAs as string[]
    expect(sameAs).toHaveLength(2)
    expect(sameAs.every((u) => u.startsWith('https://'))).toBe(true)
  })

  it('emits materially more than the bare minimum', () => {
    // Guards against a future refactor quietly reducing this to name + url,
    // which is exactly the regression the seven-consumer correction caught.
    const out = organizationLd() as Record<string, unknown>
    expect(Object.keys(out).length).toBeGreaterThanOrEqual(9)
    expect(out).not.toEqual({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'SEQTEK',
      url: SITE_URL,
    })
  })

  it('youtubeUrl is deliberately NOT in sameAs', () => {
    // The code constant carries one; the CMS global had no column for it.
    // Adding it would be an output change, and T014 was a relocation.
    const sameAs = (organizationLd() as Record<string, unknown>).sameAs as string[]
    expect(sameAs.some((u) => u.includes('youtube'))).toBe(false)
  })
})
