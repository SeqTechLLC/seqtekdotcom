import type { Metadata } from 'next'

import { listPartners } from '@/lib/payload'
import { buildMetadata } from '@/lib/metadata'
import { breadcrumbLd } from '@/lib/structured-data'
import { JsonLd } from '@/components/seo/JsonLd'
import { PartnerGrid } from '@/components/sections/PartnerGrid'

// ADR 0009: the index is generated from `partners` collection metadata (logo,
// summary, order), so publishing a partner adds its card here automatically.

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(null, {
    title: 'Partners',
    description:
      'Technology partners SEQTEK works with to deliver outcomes for Midwest organizations.',
  })
}

export default async function PartnersPage() {
  const partners = await listPartners()

  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Partners', path: '/partners' },
        ])}
      />
      <div data-testid="partners-listing">
        {/* The grid below is a self-containering block section (px-4 md:px-6
          lg:px-8 around an `mx-auto max-w-container-lg` inner div). Wrapping it
          in a SECOND padded container inset the grid from this header by 32px
          at desktop / 16px at mobile. The header therefore uses the block's own
          container recipe rather than its own, so the two resolve to the same
          x. */}
        <header className="px-4 pt-16 md:px-6 lg:px-8">
          <div className="mx-auto max-w-container-lg">
            <h1 className="text-h1 font-bold">Partners</h1>
            <p className="mt-4 text-body-lg text-text-secondary">
              Platforms we have vetted and stand behind, so our clients get the right tool without
              starting the search from scratch.
            </p>
          </div>
        </header>
        <PartnerGrid items={partners} headingLevel="h2" />
      </div>
    </>
  )
}
