import type { Metadata } from 'next'

import { listCaseStudies } from '@/lib/payload'
import { buildMetadata } from '@/lib/metadata'
import { CaseStudyGrid } from '@/components/sections/CaseStudyGrid'
import { Container } from '@/components/ui/Container'

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
      {/* The grid below is a self-containering block section, so wrapping it in
          a second padded container would inset it from this header. The header
          therefore takes the SAME shell as the block — `ui/Container`, which
          reads `SHELL_RAIL` — rather than restating the recipe. Restating it is
          what left these five headers at container-lg when the blocks moved to
          container-xl, putting every h1 128px right of its own grid (ADR
          0012). */}
      <header className="pt-16">
        <Container>
          <h1 className="text-h1 font-bold">Case studies</h1>
          <p className="mt-4 text-body-lg text-text-secondary">
            Real engagements, real outcomes. A look at how we work.
          </p>
        </Container>
      </header>
      <CaseStudyGrid manualItems={caseStudies} limit={caseStudies.length} headingLevel="h2" />
    </div>
  )
}
