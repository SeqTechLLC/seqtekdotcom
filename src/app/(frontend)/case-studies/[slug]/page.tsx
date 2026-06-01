import type { Metadata } from 'next'
import Link from 'next/link'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { getCaseStudyBySlug, getSiteSettings, publishedSlugsFor } from '@/lib/payload'
import { getDraftBySlug } from '@/lib/preview'
import { buildMetadata } from '@/lib/metadata'
import { breadcrumbLd } from '@/lib/structured-data'
import { JsonLd } from '@/components/seo/JsonLd'
import { PreviewBanner } from '@/components/layout/PreviewBanner'
import { RichText } from '@/components/richText/RichText'
import type { CaseStudy } from '@/payload-types'

// spec 004 US2 (T016). Bespoke structured template (Shape B) over the
// `caseStudies` collection — it has no `layout` blocks array, so we compose
// the discrete fields. route-render.md algorithm + invariants R1–R6.

export const revalidate = 3600
export const dynamicParams = true

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const slugs = await publishedSlugsFor('caseStudies')
  return slugs.map((slug) => ({ slug }))
}

const readCaseStudy = async (slug: string, isDraft: boolean): Promise<CaseStudy | null> =>
  isDraft ? getDraftBySlug<CaseStudy>('caseStudies', slug) : getCaseStudyBySlug(slug)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { isEnabled: isDraft } = await draftMode()
  const [doc, siteSettings] = await Promise.all([readCaseStudy(slug, isDraft), getSiteSettings()])
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
  const { isEnabled: isDraft } = await draftMode()
  const caseStudy = await readCaseStudy(slug, isDraft)
  if (!caseStudy) notFound()

  const testimonial = isRelObject(caseStudy.testimonial) ? caseStudy.testimonial : null
  const related = (caseStudy.relatedCaseStudies ?? []).filter(isRelObject).slice(0, 3)
  const industry = isRelObject(caseStudy.industry) ? caseStudy.industry : null

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

      <article data-testid="case-study" className="mx-auto max-w-container-lg px-4 py-16 md:px-6">
        <header className="mb-12">
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

        {caseStudy.problem ? (
          <section data-testid="case-study-problem" className="mb-12">
            <h2 className="mb-4 text-h3 font-semibold">The problem</h2>
            <RichText data={caseStudy.problem} />
          </section>
        ) : null}

        {caseStudy.solution ? (
          <section data-testid="case-study-solution" className="mb-12">
            <h2 className="mb-4 text-h3 font-semibold">The solution</h2>
            <RichText data={caseStudy.solution} />
          </section>
        ) : null}

        {caseStudy.impact ? (
          <section data-testid="case-study-impact" className="mb-12">
            <h2 className="mb-4 text-h3 font-semibold">The impact</h2>
            <RichText data={caseStudy.impact} />
          </section>
        ) : null}

        {caseStudy.metrics?.length ? (
          <section data-testid="case-study-metrics" className="mb-12">
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {caseStudy.metrics.map((metric) => (
                <div key={metric.id ?? metric.label} className="border-l-2 border-accent pl-4">
                  <dd className="text-h2 font-bold text-accent">{metric.number}</dd>
                  <dt className="mt-1 text-body text-text-secondary">{metric.label}</dt>
                  {metric.context ? (
                    <p className="mt-1 text-small text-text-muted">{metric.context}</p>
                  ) : null}
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {testimonial?.quote ? (
          <section data-testid="case-study-testimonial" className="mb-12">
            <blockquote className="border-l-4 border-accent pl-6 text-body-lg italic text-text-secondary">
              <p>&ldquo;{testimonial.quote}&rdquo;</p>
              {testimonial.personName ? (
                <footer className="mt-4 text-small not-italic text-text-muted">
                  {testimonial.personName}
                  {testimonial.personTitle ? `, ${testimonial.personTitle}` : ''}
                  {testimonial.company ? `, ${testimonial.company}` : ''}
                </footer>
              ) : null}
            </blockquote>
          </section>
        ) : null}

        {related.length ? (
          <section data-testid="case-study-related" className="border-t border-border-subtle pt-8">
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
