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
// This route consumes the collection's `seo` group, which is why that one is
// no longer `admin.hidden` under INERT-1. `description`, `relevantServices` and
// `clientLogos` stay hidden: the page renders `layout` blocks only, so nothing
// reads them yet. Un-hide each in the change that ships its consumer.
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
  // Same condition as the page body below: a published industry with no
  // `layout` is 404, so it must not emit that industry's real title and
  // canonical URL on the 404 response.
  if (!industry || !(industry.layout ?? []).length) return {}
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
  // Not just "does the document exist": `layout` arrived in an ADDITIVE
  // migration, so an industry created before it is published with an empty
  // body — and `RenderBlocks` returns nothing for an empty array, which would
  // serve a 200 with no `<h1>` and no content. The five pre-IND-1 rows are in
  // exactly that state until the seed retires them, and the seed cannot run
  // before the deploy because it writes a column this migration creates.
  if (!industry || !(industry.layout ?? []).length) notFound()

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
          // Unlike `/services/[slug]`, which omits its section crumb because
          // `/services` is a 301 the nav never links, `/industries` is a real
          // destination and a top-level nav item — so this keeps the
          // Home > Section > Item shape every other detail route uses.
          { name: 'Industries', path: '/industries' },
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
