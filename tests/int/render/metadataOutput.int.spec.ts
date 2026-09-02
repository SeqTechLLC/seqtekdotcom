// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { buildMetadata, type SeoGroup } from '../../../src/lib/metadata'
import { siteSettings } from '../../../src/lib/site-content'

/**
 * Spec 011 T006 (FR-004) — metadata characterization across every
 * `buildMetadata` call site.
 *
 * US1 withdrew the `siteSettings` CMS global and moved its render-path reads
 * into the hard-coded `site-content.ts` constant. `buildMetadata` consumes two
 * of those values — `tagline` (third description fallback) and `companyName`
 * (`openGraph.siteName`) — which used to be threaded through 14 route files as
 * an argument and are now read directly.
 *
 * `visual:capture` cannot catch a metadata regression: `<meta>` tags do not
 * paint. This file is the gate. The values below were verified byte-identical
 * to the CMS global's while it was still the source (queried from
 * `site_settings` on 2026-08-24), and the equality was asserted green before
 * T013 made the swap.
 */

/** The two values the routes actually consume, as the CMS global held them. */
const COMPANY_NAME = 'SEQTEK'
const TAGLINE = 'Delivering Transformative Technologies Since 1999'

describe('site values used by buildMetadata match what the CMS global held', () => {
  it('companyName is unchanged by the relocation', () => {
    expect(siteSettings.companyName).toBe(COMPANY_NAME)
  })

  it('tagline is unchanged by the relocation', () => {
    expect(siteSettings.tagline).toBe(TAGLINE)
  })
})

describe('buildMetadata resolved output', () => {
  it('full seo group wins over every fallback', () => {
    const md = buildMetadata(
      {
        metaTitle: 'NovaMud cuts labour 30%',
        metaDescription: 'How a field-services operator returned 25% of billing time.',
        ogImage: { url: '/media/novamud-hero.webp' } as SeoGroup['ogImage'],
      },
      { title: 'NovaMud' },
    )
    expect(md.title).toBe('NovaMud cuts labour 30%')
    expect(md.description).toBe('How a field-services operator returned 25% of billing time.')
    expect(md.openGraph?.siteName).toBe(COMPANY_NAME)
    expect(md.openGraph?.images).toEqual([{ url: '/media/novamud-hero.webp' }])
    expect((md.twitter as { card?: string } | undefined)?.card).toBe('summary_large_image')
  })

  it('partial seo group falls back to the per-page description', () => {
    const md = buildMetadata(
      { metaTitle: 'Workshops', metaDescription: null, ogImage: null },
      { title: 'Workshops', description: 'Team health workshops in Tulsa.' },
    )
    expect(md.description).toBe('Team health workshops in Tulsa.')
    expect(md.openGraph?.siteName).toBe(COMPANY_NAME)
  })

  it('no seo group at all (teamMembers) still emits a description and siteName', () => {
    const md = buildMetadata(null, { title: 'Dana Dudley' })
    expect(md.title).toBe('Dana Dudley')
    expect(md.description).toBe(TAGLINE)
    expect(md.openGraph?.siteName).toBe(COMPANY_NAME)
  })

  it('homepage absolute title bypasses the layout template', () => {
    const md = buildMetadata(null, { title: 'SEQTEK', absoluteTitle: true })
    expect(md.title).toEqual({ absolute: 'SEQTEK' })
    expect(md.description).toBe(TAGLINE)
  })

  it('the tagline is the last resort before the hard-coded default', () => {
    const md = buildMetadata(
      { metaTitle: null, metaDescription: null, ogImage: null },
      { title: 'Privacy Policy' },
    )
    expect(md.description).toBe(TAGLINE)
    expect(md.openGraph).toEqual({
      title: 'Privacy Policy',
      description: TAGLINE,
      type: 'website',
      siteName: COMPANY_NAME,
    })
  })
})

/**
 * Blast-radius guard. If a new route starts calling `buildMetadata`, this fails
 * until the route is added to the list — so the refactor in T013 cannot miss a
 * call site that appeared after this test was written.
 */
describe('buildMetadata call sites are enumerated', () => {
  const FRONTEND = resolve(process.cwd(), 'src/app/(frontend)')

  const EXPECTED_CALL_SITES = [
    '[slug]/page.tsx',
    'case-studies/[slug]/page.tsx',
    'case-studies/page.tsx',
    'insights/[slug]/page.tsx',
    'insights/page.tsx',
    'page.tsx',
    'partners/[slug]/page.tsx',
    'partners/page.tsx',
    'privacy-policy/page.tsx',
    'services/[slug]/page.tsx',
    'team/[slug]/page.tsx',
    'team/page.tsx',
    'terms-of-service/page.tsx',
    'workshops/[slug]/page.tsx',
    'workshops/page.tsx',
  ]

  // Any file Next can emit metadata from, not just `page.tsx` — a
  // `generateMetadata` in a layout or a route handler counts as a call site.
  const METADATA_CAPABLE = ['page.tsx', 'layout.tsx', 'route.ts', 'route.tsx']

  const walk = (dir: string, out: string[] = []): string[] => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) walk(full, out)
      else if (METADATA_CAPABLE.includes(entry.name)) out.push(full)
    }
    return out
  }

  it('every page calling buildMetadata is listed', () => {
    const actual = walk(FRONTEND)
      .filter((f) => readFileSync(f, 'utf8').includes('buildMetadata'))
      .map((f) => relative(FRONTEND, f))
      .sort()

    expect(actual).toEqual(EXPECTED_CALL_SITES)
  })
})
