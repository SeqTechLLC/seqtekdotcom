import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { getIndustryBySlug } from '@/lib/payload'
import { getDraftBySlug } from '@/lib/preview'
import { buildMetadata } from '@/lib/metadata'
import { breadcrumbLd } from '@/lib/structured-data'
import { JsonLd } from '@/components/seo/JsonLd'
import { PreviewBanner } from '@/components/layout/PreviewBanner'
import { RenderBlocks } from '@/components/sections/RenderBlocks'
import { resolveLayout } from '@/lib/resolveLayout'
import type { Industry } from '@/payload-types'

// ROADMAP IND-1. An industry is a Page + typed metadata (ADR 0009 Option C),
// the same shape `partners` established: the slug resolves straight off the
// `industries` collection, so publishing a new industry needs no code change.
//
// This route is what un-hid the collection's `description`, `relevantServices`,
// `clientLogos` and `seo.*` groups — they were `admin.hidden` under INERT-1
// precisely because nothing consumed them.
//
// Publish state is the lever for an industry that exists only to TAG case
// studies and should not have a page of its own: the read below is
// published-only, so a draft industry keeps working as a taxonomy target while
// its URL 404s. That is the answer IND-1 needed for Hogan's vertical before it
// was settled as Leadership and Training.
//
// The `<h1>` comes from the layout's hero block, not from a route-owned header
// (the `/partners/[slug]` shape) — so `industrySkeleton` leads with a hero.
//
// Same cached-read-then-draftMode ordering as the other detail routes
// (draftMode() before unstable_cache throws DYNAMIC_SERVER_USAGE under ISR).
export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const industry = await getIndustryBySlug(slug)
  if (!industry) return {}
  return buildMetadata(industry.seo, { title: industry.title })
}

export default async function IndustryPage({ params }: Props) {
  const { slug } = await params
  // Cached published read FIRST, then the dynamic draft check (order matters).
  const published = await getIndustryBySlug(slug)
  const { isEnabled: isDraft } = await draftMode()
  const industry = isDraft
    ? ((await getDraftBySlug<Industry>('industries', slug)) ?? published)
    : published
  if (!industry) notFound()

  // ROADMAP UI-2: collection-backed blocks resolve their items here, before the
  // layout reaches the synchronous RenderBlocks dispatcher. That is what lets an
  // industry page carry a `case-study-grid` set to `by-industry` and have it
  // fill itself from whatever is tagged to this industry.
  const layout = (await resolveLayout(industry.layout as never)) as never

  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: industry.title, path: `/industries/${slug}` },
        ])}
      />
      {isDraft && <PreviewBanner />}
      <article data-testid="industry" data-industry={slug}>
        <RenderBlocks blocks={layout} />
      </article>
    </>
  )
}
