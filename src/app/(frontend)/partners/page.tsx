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
      <div data-testid="partners-listing" className="mx-auto max-w-container-lg px-4 py-16 md:px-6">
        <header className="mb-12">
          <h1 className="text-h1 font-bold">Partners</h1>
          <p className="mt-4 text-body-lg text-text-secondary">
            Platforms we have vetted and stand behind, so our clients get the right tool without
            starting the search from scratch.
          </p>
        </header>
        <PartnerGrid items={partners} headingLevel="h2" />
      </div>
    </>
  )
}
