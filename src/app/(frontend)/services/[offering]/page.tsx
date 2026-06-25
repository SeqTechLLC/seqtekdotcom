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

// feat/services-restructure (ADR 0009). The four-offering IA: each peer offering
// is a block-composed Page looked up by a known slug. Workshops is NOT here —
// it lives at /workshops and the offering cards/funnel CTAs link there.
//
// Body data is ISR-cached via the unstable_cache reader; the layout CSP nonce
// forces dynamic rendering (ADR 0005), so the cached published read comes FIRST,
// then the dynamic draft check (draftMode() before unstable_cache throws
// DYNAMIC_SERVER_USAGE under ISR).
//
// Dynamically rendered (no generateStaticParams) — the shared (frontend) layout
// reads the per-request CSP nonce via headers(), which forces dynamic rendering;
// declaring generateStaticParams makes Next attempt static generation and the
// layout's headers() then throws DYNAMIC_SERVER_USAGE (a 500) on any on-demand /
// not-found path (ADR 0005 Addendum). Data is still ISR-cached via the
// unstable_cache reader (revalidate 3600 + tag invalidation); only the HTML
// render is per-request, which the nonce requires anyway.
export const revalidate = 3600

// offering URL segment → the known Page slug the seeder writes.
const OFFERING_TO_SLUG: Record<string, string> = {
  localshoring: 'service-localshoring',
  'ai-integration': 'service-ai-integration',
  'digital-transformation': 'service-digital-transformation',
}

const OFFERING_TITLE: Record<string, string> = {
  localshoring: 'Localshoring',
  'ai-integration': 'AI Integration',
  'digital-transformation': 'Digital Transformation',
}

interface Props {
  params: Promise<{ offering: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { offering } = await params
  const pageSlug = OFFERING_TO_SLUG[offering]
  if (!pageSlug) return {}
  const [page, siteSettings] = await Promise.all([getPageBySlug(pageSlug), getSiteSettings()])
  if (!page) return {}
  return buildMetadata(page.seo, { title: page.title, siteSettings })
}

export default async function ServiceOfferingPage({ params }: Props) {
  const { offering } = await params
  const pageSlug = OFFERING_TO_SLUG[offering]
  if (!pageSlug) notFound()

  // Cached published read FIRST, then the dynamic draft check (order matters).
  const published = await getPageBySlug(pageSlug)
  const { isEnabled: isDraft } = await draftMode()
  const page = isDraft ? ((await getDraftBySlug<Page>('pages', pageSlug)) ?? published) : published
  if (!page) notFound()

  // payload-types Page['layout'] is the RenderBlocks-compatible shape.
  const layout = (page.layout ?? []) as never

  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Services', path: '/services' },
          { name: OFFERING_TITLE[offering] ?? page.title, path: `/services/${offering}` },
        ])}
      />
      {isDraft && <PreviewBanner />}
      <article data-testid="service-offering" data-offering={offering}>
        <RenderBlocks blocks={layout} />
      </article>
    </>
  )
}
