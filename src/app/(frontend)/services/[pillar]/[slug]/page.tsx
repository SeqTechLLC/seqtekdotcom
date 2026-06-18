import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { getServiceBySlug, getSiteSettings } from '@/lib/payload'
import { getDraftBySlug } from '@/lib/preview'
import { buildMetadata } from '@/lib/metadata'
import { breadcrumbLd } from '@/lib/structured-data'
import { JsonLd } from '@/components/seo/JsonLd'
import { PreviewBanner } from '@/components/layout/PreviewBanner'
import { RenderBlocks } from '@/components/sections/RenderBlocks'
import type { Service } from '@/payload-types'

// spec 004 + spec 010 (ADR 0009). Service detail at the NESTED URL
// `/services/[pillar]/[slug]`; the body is block-composed via RenderBlocks.
// Nested URL + pillar-match guard + breadcrumb + pillar-move revalidation
// (revalidateOnChange) are preserved; only the body fields became `layout`.

// Dynamically rendered (no generateStaticParams) — layout CSP nonce forces
// dynamic rendering (Constitution §IV, ADR 0005); data ISR-cached via the
// unstable_cache readers.
export const revalidate = 3600

interface Props {
  params: Promise<{ pillar: string; slug: string }>
}

const pillarSlugOf = (service: Service): string | undefined =>
  service.pillar && typeof service.pillar === 'object' && 'slug' in service.pillar
    ? (service.pillar.slug ?? undefined)
    : undefined

// Published-only metadata — no draftMode() before the cached read (avoids the
// DYNAMIC_SERVER_USAGE bail under ISR; see the page body note).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [service, siteSettings] = await Promise.all([getServiceBySlug(slug), getSiteSettings()])
  if (!service) return {}
  return buildMetadata(service.seo, { title: service.title, siteSettings })
}

export default async function ServiceDetailPage({ params }: Props) {
  const { pillar: pillarSlug, slug } = await params
  // Cached published read FIRST, then the dynamic draft check (order matters —
  // draftMode() before unstable_cache throws DYNAMIC_SERVER_USAGE under ISR).
  const published = await getServiceBySlug(slug)
  const { isEnabled: isDraft } = await draftMode()
  const service = isDraft
    ? ((await getDraftBySlug<Service>('services', slug)) ?? published)
    : published
  // notFound if the slug doesn't resolve OR the pillar in the URL doesn't match
  // the service's actual pillar (no duplicate-content under the wrong pillar).
  if (!service || pillarSlugOf(service) !== pillarSlug) notFound()

  const pillar = service.pillar && typeof service.pillar === 'object' ? service.pillar : null
  // payload-types Service['layout'] is the RenderBlocks-compatible shape.
  const layout = (service.layout ?? []) as never

  // Reading column for the route-owned header (DESIGN_SYSTEM §11.4). Body blocks
  // own their own widths/centering (FR-009).
  const readingCol = 'mx-auto max-w-prose'

  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Services', path: '/services' },
          ...(pillar?.title ? [{ name: pillar.title, path: `/services/${pillarSlug}` }] : []),
          { name: service.title, path: `/services/${pillarSlug}/${slug}` },
        ])}
      />
      {isDraft && <PreviewBanner />}

      <article
        data-testid="service-detail"
        className="mx-auto max-w-container-lg px-4 py-16 md:px-6"
      >
        <header className={`${readingCol} mb-4`}>
          <h1 className="text-h1 font-bold" data-testid="service-title">
            {service.title}
          </h1>
        </header>

        <RenderBlocks blocks={layout} />
      </article>
    </>
  )
}
