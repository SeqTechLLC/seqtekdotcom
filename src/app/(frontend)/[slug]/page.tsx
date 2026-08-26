import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { getPageBySlug } from '@/lib/payload'
import { getDraftBySlug } from '@/lib/preview'
import { buildMetadata } from '@/lib/metadata'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbLd } from '@/lib/structured-data'
import { PreviewBanner } from '@/components/layout/PreviewBanner'
import { RenderBlocks } from '@/components/sections/RenderBlocks'
import { resolveLayout } from '@/lib/resolveLayout'
import type { Page } from '@/payload-types'

// spec 004 US5 (T025). The generic `pages` route (Shape A) — render the page's
// `layout` blocks array through `RenderBlocks` (the showcase pattern,
// generalized). `pages` are flat at `/[slug]` (research §D5), so `/our-story`
// and `/localshoring` are both `pages` docs served here.
//
// Dynamically rendered (no generateStaticParams): the shared layout reads the
// per-request CSP nonce via `headers()`, which forces dynamic rendering (Next
// CSP docs) — Constitution §IV wins over static prerender. DATA is still
// ISR-cached through the `unstable_cache` readers (revalidate 3600 + on-demand
// tag invalidation), so the caching/revalidation contract holds; only the HTML
// render is per-request (required for the nonce anyway). Published slugs are
// still enumerated for the sitemap via `publishedSlugsFor` (research §D6 note,
// ADR 0005). Not `force-dynamic` — the spike pattern this spec retires.

export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [page] = await Promise.all([getPageBySlug(slug)])
  if (!page) return {}
  return buildMetadata(page.seo, { title: page.title })
}

export default async function GenericPage({ params }: Props) {
  const { slug } = await params
  const { isEnabled: isDraft } = await draftMode()
  const page = isDraft
    ? ((await getDraftBySlug<Page>('pages', slug)) ?? (await getPageBySlug(slug)))
    : await getPageBySlug(slug)
  if (!page) notFound()

  // payload-types Page['layout'] is the RenderBlocks-compatible shape.
  // ROADMAP UI-2: collection-backed blocks (team-grid, post-list,
  // case-study-grid, service-cards) get their items filled in here, before
  // the layout reaches the synchronous RenderBlocks dispatcher.
  const layout = (await resolveLayout(page.layout as never)) as never

  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: page.title, path: `/${slug}` },
        ])}
      />
      {isDraft && <PreviewBanner />}
      <article data-testid="page" data-page-slug={slug}>
        <RenderBlocks blocks={layout} />
      </article>
    </>
  )
}
