import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { getWorkshopBySlug, getSiteSettings } from '@/lib/payload'
import { getDraftBySlug } from '@/lib/preview'
import { buildMetadata } from '@/lib/metadata'
import { breadcrumbLd } from '@/lib/structured-data'
import { JsonLd } from '@/components/seo/JsonLd'
import { PreviewBanner } from '@/components/layout/PreviewBanner'
import { RenderBlocks } from '@/components/sections/RenderBlocks'
import type { Workshop } from '@/payload-types'

// spec 004 US4 + spec 010 (ADR 0009): the workshop body is block-composed and
// rendered through RenderBlocks — no bespoke per-field template survives. Typed
// metadata (title, facilitator, slug, SEO, JSON-LD) stays on the route; the
// body (description/format/audience/deliverables/photos/video/testimonial/CTA)
// lives in `layout` and is editor-rearrangeable with no deploy.

// Dynamically rendered (no generateStaticParams) — layout CSP nonce forces
// dynamic rendering (Constitution §IV, ADR 0005); data ISR-cached via the
// unstable_cache readers.
export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

// Published-only metadata — no draftMode() before the cached read (avoids the
// DYNAMIC_SERVER_USAGE bail under ISR; see the page body note).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [doc, siteSettings] = await Promise.all([getWorkshopBySlug(slug), getSiteSettings()])
  if (!doc) return {}
  return buildMetadata(doc.seo, { title: doc.title, siteSettings })
}

const isRelObject = <T,>(value: T | string | number | null | undefined): value is T =>
  typeof value === 'object' && value !== null

export default async function WorkshopPage({ params }: Props) {
  const { slug } = await params
  // Cached published read FIRST, then the dynamic draft check (order matters —
  // draftMode() before unstable_cache throws DYNAMIC_SERVER_USAGE under ISR).
  const published = await getWorkshopBySlug(slug)
  const { isEnabled: isDraft } = await draftMode()
  const workshop = isDraft
    ? ((await getDraftBySlug<Workshop>('workshops', slug)) ?? published)
    : published
  if (!workshop) notFound()

  const facilitator = isRelObject(workshop.facilitator) ? workshop.facilitator : null
  // payload-types Workshop['layout'] is the RenderBlocks-compatible shape.
  const layout = (workshop.layout ?? []) as never

  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Workshops', path: '/workshops' },
          { name: workshop.title, path: `/workshops/${slug}` },
        ])}
      />
      {isDraft && <PreviewBanner />}

      <article data-testid="workshop-detail" className="py-16">
        {/* Reading column: the header sits in a centered 65ch measure; the body
            blocks own their own widths/centering (DESIGN_SYSTEM §11.4, FR-009). */}
        <header className="mx-auto mb-4 max-w-prose px-4 md:px-6">
          <h1 className="text-h1 font-bold" data-testid="workshop-title">
            {workshop.title}
          </h1>
          {facilitator?.name ? (
            <p className="mt-4 text-body text-text-secondary">
              Facilitated by {facilitator.name}
              {facilitator.title ? `, ${facilitator.title}` : ''}
            </p>
          ) : null}
        </header>

        <RenderBlocks blocks={layout} />
      </article>
    </>
  )
}
