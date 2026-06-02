import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { getWorkshopBySlug, getSiteSettings } from '@/lib/payload'
import { getDraftBySlug } from '@/lib/preview'
import { buildMetadata } from '@/lib/metadata'
import { breadcrumbLd } from '@/lib/structured-data'
import { JsonLd } from '@/components/seo/JsonLd'
import { PreviewBanner } from '@/components/layout/PreviewBanner'
import { RichText } from '@/components/richText/RichText'
import { WorkshopInquiryForm } from '@/components/forms/WorkshopInquiryForm'
import { DownloadCard } from '@/components/sections/DownloadCard'
import type { Workshop } from '@/payload-types'

// spec 004 US4 (T022) + spec 005. Workshop campaign landing (Shape B). The
// Workshop Inquiry form is the live (half-wired) custom form — provisioned GUID
// in NEXT_PUBLIC_HUBSPOT_WORKSHOP_FORM_ID (INTEGRATIONS.md §1.2). It runs the
// full client lifecycle now; live submit activates once the env var is set.

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
  const testimonial = isRelObject(workshop.testimonial) ? workshop.testimonial : null

  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Touchstone workshops', path: '/touchstone-workshops' },
          { name: workshop.title, path: `/touchstone-workshops/${slug}` },
        ])}
      />
      {isDraft && <PreviewBanner />}

      <article
        data-testid="workshop-detail"
        className="mx-auto max-w-container-lg px-4 py-16 md:px-6"
      >
        <header className="mb-12">
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

        {workshop.description ? (
          <section data-testid="workshop-description" className="mb-12">
            <h2 className="mb-4 text-h3 font-semibold">What it is</h2>
            <RichText data={workshop.description} />
          </section>
        ) : null}

        {workshop.format ? (
          <section data-testid="workshop-format" className="mb-12">
            <h2 className="mb-4 text-h3 font-semibold">Format</h2>
            <RichText data={workshop.format} />
          </section>
        ) : null}

        {workshop.audience ? (
          <section data-testid="workshop-audience" className="mb-12">
            <h2 className="mb-4 text-h3 font-semibold">Who it is for</h2>
            <RichText data={workshop.audience} />
          </section>
        ) : null}

        {testimonial?.quote ? (
          <section data-testid="workshop-testimonial" className="mb-12">
            <blockquote className="border-l-4 border-accent pl-6 text-body-lg italic text-text-secondary">
              <p>&ldquo;{testimonial.quote}&rdquo;</p>
              {testimonial.personName ? (
                <footer className="mt-4 text-small not-italic text-text-muted">
                  {testimonial.personName}
                  {testimonial.company ? `, ${testimonial.company}` : ''}
                </footer>
              ) : null}
            </blockquote>
          </section>
        ) : null}

        <div className="grid grid-cols-1 gap-8 border-t border-border-subtle pt-12 md:grid-cols-2">
          <section data-testid="download-card">
            <DownloadCard
              title="AI Strategy Field Guide"
              description="A short framework for sequencing AI initiatives by value and feasibility."
              formId="workshop-inquiry"
              fileUrl="/downloads/ai-strategy-field-guide.pdf"
            />
          </section>
          <section data-testid="hubspot-form">
            <h2 className="text-h2 font-bold">Request this workshop</h2>
            <p className="mt-3 text-body-lg text-text-secondary">
              Tell us about your team and we will follow up with dates.
            </p>
            <div className="mt-6">
              <WorkshopInquiryForm />
            </div>
          </section>
        </div>
      </article>
    </>
  )
}
