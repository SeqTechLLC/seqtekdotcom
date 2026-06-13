import type { Metadata } from 'next'

import { getSiteSettings, listServicePillars } from '@/lib/payload'
import { buildMetadata } from '@/lib/metadata'
import { ServicePillarCards } from '@/components/sections/ServicePillarCards'

// spec 004 Phase 8 (T030). Services overview — the pillar cards. Replaces the
// spike force-dynamic placeholder at this path.

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await getSiteSettings()
  return buildMetadata(null, {
    title: 'Services',
    description: 'How we help: strategy, delivery, and modernization across our practice areas.',
    siteSettings,
  })
}

export default async function ServicesPage() {
  const pillars = await listServicePillars()

  return (
    <div data-testid="services-overview" className="mx-auto max-w-container-lg px-4 py-16 md:px-6">
      <header className="mb-12">
        <h1 className="text-h1 font-bold">Services</h1>
        <p className="mt-4 text-body-lg text-text-secondary">
          Practice areas built around one delivery model.
        </p>
      </header>
      <ServicePillarCards pillars={pillars} headingLevel="h2" />
    </div>
  )
}
