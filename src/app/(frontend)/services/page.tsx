import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { getPageBySlug, getSiteSettings } from '@/lib/payload'
import { getDraftBySlug } from '@/lib/preview'
import { buildMetadata } from '@/lib/metadata'
import { breadcrumbLd } from '@/lib/structured-data'
import { JsonLd } from '@/components/seo/JsonLd'
import { PreviewBanner } from '@/components/layout/PreviewBanner'
import { RenderBlocks } from '@/components/sections/RenderBlocks'
import type { Page } from '@/payload-types'

// feat/services-restructure (ADR 0009). Services overview is now a block-composed
// Page (slug `service-overview`) rendered via RenderBlocks — the hand-rendered
// ServicePillarCards header template is retired along with the pillar routes.
export const revalidate = 3600

const OVERVIEW_SLUG = 'service-overview'

export async function generateMetadata(): Promise<Metadata> {
  const [page, siteSettings] = await Promise.all([getPageBySlug(OVERVIEW_SLUG), getSiteSettings()])
  if (!page) {
    return buildMetadata(null, {
      title: 'Services',
      description:
        'How we help: workshops, localshoring, AI integration, and digital transformation.',
      siteSettings,
    })
  }
  return buildMetadata(page.seo, { title: page.title, siteSettings })
}

export default async function ServicesPage() {
  // Cached published read FIRST, then the dynamic draft check (order matters).
  const published = await getPageBySlug(OVERVIEW_SLUG)
  const { isEnabled: isDraft } = await draftMode()
  const page = isDraft
    ? ((await getDraftBySlug<Page>('pages', OVERVIEW_SLUG)) ?? published)
    : published
  if (!page) notFound()

  const layout = (page.layout ?? []) as never

  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Services', path: '/services' },
        ])}
      />
      {isDraft && <PreviewBanner />}
      <article data-testid="services-overview">
        <RenderBlocks blocks={layout} />
      </article>
    </>
  )
}
