import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getServicePillarBySlug, getSiteSettings, listServices } from '@/lib/payload'
import { buildMetadata } from '@/lib/metadata'
import { ServiceCards } from '@/components/sections/ServiceCards'
import type { Service } from '@/payload-types'

// spec 004 Phase 8 (T031). Service pillar landing — the pillar's child
// services. `services.pillar` is the source of truth (no child array on the
// pillar — data-model §5), so we filter the published services by pillar slug.
//
// Dynamically rendered (no generateStaticParams) — layout CSP nonce forces
// dynamic rendering (Constitution §IV, ADR 0005); data ISR-cached via the
// unstable_cache readers.
export const revalidate = 3600

interface Props {
  params: Promise<{ pillar: string }>
}

const pillarSlugOf = (service: Service): string | undefined =>
  service.pillar && typeof service.pillar === 'object' && 'slug' in service.pillar
    ? (service.pillar.slug ?? undefined)
    : undefined

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pillar: pillarSlug } = await params
  const [pillar, siteSettings] = await Promise.all([
    getServicePillarBySlug(pillarSlug),
    getSiteSettings(),
  ])
  if (!pillar) return {}
  return buildMetadata(pillar.seo, { title: pillar.title, siteSettings })
}

export default async function ServicePillarPage({ params }: Props) {
  const { pillar: pillarSlug } = await params
  const [pillar, allServices] = await Promise.all([
    getServicePillarBySlug(pillarSlug),
    listServices(),
  ])
  if (!pillar) notFound()

  const children = allServices.filter((s) => pillarSlugOf(s) === pillarSlug)

  return (
    <div data-testid="service-pillar" className="mx-auto max-w-container-xl px-4 py-16 md:px-6">
      <header className="mb-12">
        <h1 className="text-h1 font-bold">{pillar.title}</h1>
      </header>
      <ServiceCards source="manual" manualItems={children} headingLevel="h2" />
    </div>
  )
}
