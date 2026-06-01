import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { getServiceBySlug, getSiteSettings, listServices } from '@/lib/payload'
import { getDraftBySlug } from '@/lib/preview'
import { buildMetadata } from '@/lib/metadata'
import { breadcrumbLd } from '@/lib/structured-data'
import { JsonLd } from '@/components/seo/JsonLd'
import { PreviewBanner } from '@/components/layout/PreviewBanner'
import { RichText } from '@/components/richText/RichText'
import type { Service } from '@/payload-types'

// spec 004 Phase 8 (T032). Service detail at the NESTED URL
// `/services/[pillar]/[slug]` (drift #1 / research §D4). Shape B.

export const revalidate = 3600
export const dynamicParams = true

interface Props {
  params: Promise<{ pillar: string; slug: string }>
}

const pillarSlugOf = (service: Service): string | undefined =>
  service.pillar && typeof service.pillar === 'object' && 'slug' in service.pillar
    ? (service.pillar.slug ?? undefined)
    : undefined

export async function generateStaticParams(): Promise<Array<{ pillar: string; slug: string }>> {
  const services = await listServices()
  return services
    .map((s) => ({ pillar: pillarSlugOf(s), slug: s.slug }))
    .filter((p): p is { pillar: string; slug: string } => Boolean(p.pillar && p.slug))
}

const readService = async (slug: string, isDraft: boolean): Promise<Service | null> =>
  isDraft ? getDraftBySlug<Service>('services', slug) : getServiceBySlug(slug)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { isEnabled: isDraft } = await draftMode()
  const [service, siteSettings] = await Promise.all([readService(slug, isDraft), getSiteSettings()])
  if (!service) return {}
  return buildMetadata(service.seo, { title: service.title, siteSettings })
}

export default async function ServiceDetailPage({ params }: Props) {
  const { pillar: pillarSlug, slug } = await params
  const { isEnabled: isDraft } = await draftMode()
  const service = await readService(slug, isDraft)
  // notFound if the slug doesn't resolve OR the pillar in the URL doesn't match
  // the service's actual pillar (no duplicate-content under the wrong pillar).
  if (!service || pillarSlugOf(service) !== pillarSlug) notFound()

  const pillar = service.pillar && typeof service.pillar === 'object' ? service.pillar : null

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
        <header className="mb-12">
          <h1 className="text-h1 font-bold" data-testid="service-title">
            {service.title}
          </h1>
        </header>

        {service.description ? (
          <section data-testid="service-description" className="mb-12">
            <h2 className="mb-4 text-h3 font-semibold">Overview</h2>
            <RichText data={service.description} />
          </section>
        ) : null}

        {service.approach ? (
          <section data-testid="service-approach" className="mb-12">
            <h2 className="mb-4 text-h3 font-semibold">Our approach</h2>
            <RichText data={service.approach} />
          </section>
        ) : null}

        {service.deliverables?.length ? (
          <section data-testid="service-deliverables" className="mb-12">
            <h2 className="mb-4 text-h3 font-semibold">Deliverables</h2>
            <ul className="list-disc space-y-2 pl-6 text-body text-text-secondary">
              {service.deliverables.map((d) => (
                <li key={d.id ?? d.label}>{d.label}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {service.faq?.length ? (
          <section data-testid="service-faq" className="border-t border-border-subtle pt-8">
            <h2 className="mb-4 text-h3 font-semibold">FAQ</h2>
            <dl className="space-y-6">
              {service.faq.map((item) => (
                <div key={item.id ?? item.question}>
                  <dt className="text-body font-semibold">{item.question}</dt>
                  {item.answer ? (
                    <dd className="mt-2 text-text-secondary">
                      <RichText data={item.answer} withProse={false} />
                    </dd>
                  ) : null}
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </article>
    </>
  )
}
