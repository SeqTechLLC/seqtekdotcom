import type { Metadata } from 'next'

import { listPartners } from '@/lib/payload'
import { buildMetadata } from '@/lib/metadata'
import { breadcrumbLd } from '@/lib/structured-data'
import { JsonLd } from '@/components/seo/JsonLd'
import { PartnerGrid } from '@/components/sections/PartnerGrid'
import { Container } from '@/components/ui/Container'

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
        {/* The grid below is a self-containering block section, so wrapping it in
          a second padded container would inset it from this header. The header
          therefore takes the SAME shell as the block — `ui/Container`, which
          reads `SHELL_RAIL` — rather than restating the recipe. Restating it is
          what left these five headers at container-lg when the blocks moved to
          container-xl, putting every h1 128px right of its own grid (ADR
          0012). */}
        <header className="pt-16">
          <Container>
            <h1 className="text-h1 font-bold">Partners</h1>
            <p className="mt-4 text-body-lg text-text-secondary">
              Platforms we have vetted and stand behind, so our clients get the right tool without
              starting the search from scratch.
            </p>
          </Container>
        </header>
        <PartnerGrid items={partners} headingLevel="h2" />
      </div>
    </>
  )
}
