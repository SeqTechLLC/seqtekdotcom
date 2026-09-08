import type { Metadata } from 'next'

import { listWorkshops } from '@/lib/payload'
import { buildMetadata } from '@/lib/metadata'
import { WorkshopList } from '@/components/sections/WorkshopList'
import { Container } from '@/components/ui/Container'

// spec 004 US4 (T023). Workshop listing.

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(null, {
    title: 'Workshops',
    description:
      'Three facilitated workshops: the Touchstone Workshop for a specific technical problem, Five Dysfunctions and Re-Alignment for the team that has to solve it.',
  })
}

export default async function WorkshopsPage() {
  const workshops = await listWorkshops()

  return (
    <div data-testid="workshops-listing">
      {/* The grid below is a self-containering block section, so wrapping it in
          a second padded container would inset it from this header. The header
          therefore takes the SAME shell as the block — `ui/Container`, which
          reads `SHELL_RAIL` — rather than restating the recipe. Restating it is
          what left these five headers at container-lg when the blocks moved to
          container-xl, putting every h1 128px right of its own grid (ADR
          0012). */}
      <header className="pt-16">
        <Container>
          <h1 className="text-h1 font-bold">Workshops</h1>
          <p className="mt-4 text-body-lg text-text-secondary">
            Three working sessions. The Touchstone Workshop turns a specific problem into an
            architecture and a plan; Five Dysfunctions and Re-Alignment strengthen the team that has
            to deliver it.
          </p>
        </Container>
      </header>
      <WorkshopList workshops={workshops} headingLevel="h2" />
    </div>
  )
}
