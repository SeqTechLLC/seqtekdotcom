import type { Metadata } from 'next'

import { getSiteSettings, listCaseStudies } from '@/lib/payload'
import { buildMetadata } from '@/lib/metadata'
import { CaseStudyGrid } from '@/components/sections/CaseStudyGrid'

// spec 004 US2 (T017). Case-study listing.

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await getSiteSettings()
  return buildMetadata(null, {
    title: 'Case studies',
    description: 'Selected client engagements and outcomes.',
    siteSettings,
  })
}

export default async function CaseStudiesPage() {
  const caseStudies = await listCaseStudies()

  return (
    <div
      data-testid="case-studies-listing"
      className="mx-auto max-w-container-xl px-4 py-16 md:px-6"
    >
      <header className="mb-12">
        <h1 className="text-h1 font-bold">Case studies</h1>
        <p className="mt-4 text-body-lg text-text-secondary">
          Real engagements, real outcomes. A look at how we work.
        </p>
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
