import type { Metadata } from 'next'
import Link from 'next/link'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { getCaseStudyBySlug, getSiteSettings } from '@/lib/payload'
import { getDraftBySlug } from '@/lib/preview'
import { buildMetadata } from '@/lib/metadata'
import { breadcrumbLd } from '@/lib/structured-data'
import { JsonLd } from '@/components/seo/JsonLd'
import { PreviewBanner } from '@/components/layout/PreviewBanner'
import { RenderBlocks } from '@/components/sections/RenderBlocks'
import { ResponsiveImage } from '@/components/ui/ResponsiveImage'
import { TrackView } from '@/components/analytics/TrackView'
import type { CaseStudy } from '@/payload-types'

// spec 004 US2 + spec 010 (ADR 0009): the case-study body is block-composed and
// rendered via RenderBlocks. Kept metadata (industry eyebrow, title, subtitle,
// heroImage, related) stays on the route; the deprecated body fields
// (problem/solution/impact/metrics/technologies/testimonial) live in `layout`.

// Dynamically rendered (no generateStaticParams): the layout's per-request CSP
// nonce forces dynamic rendering (Constitution §IV, ADR 0005). Data is ISR-
// cached via the unstable_cache readers (revalidate 3600 + tag invalidation).
export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

// Published-only metadata — no draftMode() before the cached read (avoids the
// DYNAMIC_SERVER_USAGE bail under ISR; see the page body note).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [doc, siteSettings] = await Promise.all([getCaseStudyBySlug(slug), getSiteSettings()])
  if (!doc) return {}
  return buildMetadata(doc.seo, {
    title: doc.title,
    description: doc.subtitle,
    siteSettings,
  })
}

const isRelObject = <T,>(value: T | string | number | null | undefined): value is T =>
  typeof value === 'object' && value !== null

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params
  // Cached published read FIRST, then the dynamic draft check (order matters —
  // draftMode() before unstable_cache throws DYNAMIC_SERVER_USAGE under ISR).
  const published = await getCaseStudyBySlug(slug)
  const { isEnabled: isDraft } = await draftMode()
  const caseStudy = isDraft
    ? ((await getDraftBySlug<CaseStudy>('caseStudies', slug)) ?? published)
    : published
  if (!caseStudy) notFound()

  const related = (caseStudy.relatedCaseStudies ?? []).filter(isRelObject).slice(0, 3)
  const industry = isRelObject(caseStudy.industry) ? caseStudy.industry : null
  // payload-types CaseStudy['layout'] is the RenderBlocks-compatible shape.
  const layout = (caseStudy.layout ?? []) as never

  // Reading column for the route-owned header + related footer (DESIGN_SYSTEM
  // §11.4). The body blocks own their own widths/centering (FR-009).
  const readingCol = 'mx-auto max-w-prose'

  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Case studies', path: '/case-studies' },
          { name: caseStudy.title, path: `/case-studies/${slug}` },
        ])}
      />
      {isDraft && <PreviewBanner />}
      {/* Fire-once case_study_view (spec 008 US3, contract D2). */}
      <TrackView slug={slug} title={caseStudy.title} />

      <article data-testid="case-study" className="mx-auto max-w-container-lg px-4 py-16 md:px-6">
        <header className={`${readingCol} mb-12`}>
          {industry?.title ? (
            <p className="text-small font-semibold uppercase tracking-wide text-text-muted">
              {industry.title}
            </p>
          ) : null}
          <h1 className="mt-2 text-h1 font-bold" data-testid="case-study-title">
            {caseStudy.title}
          </h1>
          {caseStudy.subtitle ? (
            <p className="mt-4 text-body-lg text-text-secondary">{caseStudy.subtitle}</p>
          ) : null}
        </header>

        {isRelObject(caseStudy.heroImage) ? (
          <ResponsiveImage
            media={caseStudy.heroImage}
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="mb-12 aspect-[16/9] w-full rounded-lg border border-border-subtle object-cover shadow-sm"
            loading="eager"
            fetchPriority="high"
          />
        ) : null}

        <RenderBlocks blocks={layout} />

        {related.length ? (
          <section
            data-testid="case-study-related"
            className={`${readingCol} border-t border-border-subtle pt-8`}
          >
            <h2 className="mb-4 text-h4 font-semibold">Related work</h2>
            <ul className="flex flex-col gap-2">
              {related.map((rel) => (
                <li key={rel.id}>
                  <Link
                    className="text-link underline hover:text-link-hover"
                    href={`/case-studies/${rel.slug}`}
                  >
                    {rel.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </>
  )
}
