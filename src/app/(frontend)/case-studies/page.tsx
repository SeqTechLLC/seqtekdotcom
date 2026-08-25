import type { Metadata } from 'next'

import { listCaseStudies } from '@/lib/payload'
import { buildMetadata } from '@/lib/metadata'
import { CaseStudyGrid } from '@/components/sections/CaseStudyGrid'

// spec 004 US2 (T017). Case-study listing.

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(null, {
    title: 'Case studies',
    description: 'Selected client engagements and outcomes.',
  })
}

export default async function CaseStudiesPage() {
  const caseStudies = await listCaseStudies()

  return (
    <div data-testid="case-studies-listing">
      {/* The grid below is a self-containering block section (px-4 md:px-6
          lg:px-8 around an `mx-auto max-w-container-lg` inner div). Wrapping it
          in a SECOND padded container inset the grid from this header by 32px
          at desktop / 16px at mobile. The header therefore uses the block's own
          container recipe rather than its own, so the two resolve to the same
          x. */}
      <header className="px-4 pt-16 md:px-6 lg:px-8">
        <div className="mx-auto max-w-container-lg">
          <h1 className="text-h1 font-bold">Case studies</h1>
          <p className="mt-4 text-body-lg text-text-secondary">
            Real engagements, real outcomes. A look at how we work.
          </p>
        </div>
      </header>
      <CaseStudyGrid
        source="manual"
        manualItems={caseStudies}
        limit={caseStudies.length}
        headingLevel="h2"
      />
    </div>
  )
}
