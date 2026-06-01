import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { getPageBySlug, getSiteSettings, publishedSlugsFor } from '@/lib/payload'
import { getDraftBySlug } from '@/lib/preview'
import { buildMetadata } from '@/lib/metadata'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbLd } from '@/lib/structured-data'
import { PreviewBanner } from '@/components/layout/PreviewBanner'
import { RenderBlocks } from '@/components/sections/RenderBlocks'
import type { Page } from '@/payload-types'

// spec 004 US5 (T025). The generic `pages` route (Shape A) — render the page's
// `layout` blocks array through `RenderBlocks` (the showcase pattern,
// generalized). `pages` are flat at `/[slug]` (research §D5), so `/about` and
// `/localshoring` are both `pages` docs served here. ISR + dynamicParams.

export const revalidate = 3600
export const dynamicParams = true

// Top-level segments owned by dedicated static routes — never serve them via
// the generic pages route (Next gives the static route priority anyway; this
// just keeps them out of the prebuilt manifest).
const RESERVED_SLUGS = new Set([
  'case-studies',
  'insights',
  'services',
  'touchstone-workshops',
  'team',
])

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const slugs = await publishedSlugsFor('pages')
  return slugs.filter((slug) => !RESERVED_SLUGS.has(slug)).map((slug) => ({ slug }))
}

const readPage = async (slug: string, isDraft: boolean): Promise<Page | null> =>
  isDraft ? getDraftBySlug<Page>('pages', slug) : getPageBySlug(slug)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { isEnabled: isDraft } = await draftMode()
  const [page, siteSettings] = await Promise.all([readPage(slug, isDraft), getSiteSettings()])
  if (!page) return {}
  return buildMetadata(page.seo, { title: page.title, siteSettings })
}

export default async function GenericPage({ params }: Props) {
  const { slug } = await params
  const { isEnabled: isDraft } = await draftMode()
  const page = await readPage(slug, isDraft)
  if (!page) notFound()

  // payload-types Page['layout'] is the RenderBlocks-compatible shape.
  const layout = (page.layout ?? []) as never

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
