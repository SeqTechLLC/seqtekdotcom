import type { Metadata } from 'next'

import { listWorkshops } from '@/lib/payload'
import { buildMetadata } from '@/lib/metadata'
import { WorkshopList } from '@/components/sections/WorkshopList'

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
      {/* The grid below is a self-containering block section (px-4 md:px-6
          lg:px-8 around an `mx-auto max-w-container-xl` inner div). Wrapping it
          in a SECOND padded container inset the grid from this header by 32px
          at desktop / 16px at mobile. The header therefore uses the block's own
          container recipe rather than its own, so the two resolve to the same
          x. */}
      <header className="px-4 pt-16 md:px-6 lg:px-8">
        <div className="mx-auto max-w-container-xl">
          <h1 className="text-h1 font-bold">Workshops</h1>
          <p className="mt-4 text-body-lg text-text-secondary">
            Three working sessions. The Touchstone Workshop turns a specific problem into an
            architecture and a plan; Five Dysfunctions and Re-Alignment strengthen the team that has
            to deliver it.
          </p>
        </div>
      </header>
      <WorkshopList workshops={workshops} headingLevel="h2" />
    </div>
  )
}
