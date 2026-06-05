import type { Metadata } from 'next'

import { getSiteSettings, listWorkshops } from '@/lib/payload'
import { buildMetadata } from '@/lib/metadata'
import { WorkshopList } from '@/components/sections/WorkshopList'

// spec 004 US4 (T023). Workshop listing.

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await getSiteSettings()
  return buildMetadata(null, {
    title: 'Touchstone workshops',
    description: 'Working sessions that turn ambition into a sequenced, fundable plan.',
    siteSettings,
  })
}

export default async function WorkshopsPage() {
  const workshops = await listWorkshops()

  return (
    <div data-testid="workshops-listing" className="mx-auto max-w-container-xl px-4 py-16 md:px-6">
      <header className="mb-12">
        <h1 className="text-h1 font-bold">Touchstone workshops</h1>
        <p className="mt-4 text-body-lg text-text-secondary">
          Facilitated sessions that move teams from AI ambition to an actionable plan.
        </p>
      </header>
      <WorkshopList workshops={workshops} headingLevel="h2" />
    </div>
  )
}
