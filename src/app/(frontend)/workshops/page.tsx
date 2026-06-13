import type { Metadata } from 'next'

import { getSiteSettings, listWorkshops } from '@/lib/payload'
import { buildMetadata } from '@/lib/metadata'
import { WorkshopList } from '@/components/sections/WorkshopList'

// spec 004 US4 (T023). Workshop listing.

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await getSiteSettings()
  return buildMetadata(null, {
    title: 'Workshops',
    description:
      'Three facilitated workshops: the Touchstone Workshop for a specific technical problem, Five Dysfunctions and Re-Alignment for the team that has to solve it.',
    siteSettings,
  })
}

export default async function WorkshopsPage() {
  const workshops = await listWorkshops()

  return (
    <div data-testid="workshops-listing" className="mx-auto max-w-container-lg px-4 py-16 md:px-6">
      <header className="mb-12">
        <h1 className="text-h1 font-bold">Workshops</h1>
        <p className="mt-4 text-body-lg text-text-secondary">
          Three working sessions. The Touchstone Workshop turns a specific problem into an
          architecture and a plan; Five Dysfunctions and Re-Alignment strengthen the team that has
          to deliver it.
        </p>
      </header>
      <WorkshopList workshops={workshops} headingLevel="h2" />
    </div>
  )
}
