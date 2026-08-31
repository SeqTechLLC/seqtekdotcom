import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { getServiceBySlug } from '@/lib/payload'
import { getDraftBySlug } from '@/lib/preview'
import { buildMetadata } from '@/lib/metadata'
import { breadcrumbLd } from '@/lib/structured-data'
import { JsonLd } from '@/components/seo/JsonLd'
import { PreviewBanner } from '@/components/layout/PreviewBanner'
import { RenderBlocks } from '@/components/sections/RenderBlocks'
import { resolveLayout } from '@/lib/resolveLayout'
import type { Service } from '@/payload-types'

// ROADMAP SVC-2 (ADR 0009). Replaces the `[offering]` route, which resolved
// four bare `Page` slugs through hardcoded `OFFERING_TO_SLUG` / `OFFERING_TITLE`
// lookups — so a fifth offering meant editing four lists and deploying, which
// the ADR's own rule says only creating or fixing a *block* should require.
// Everything here now derives from the collections, like every other type.
//
// ONE COLLECTION, THREE TIERS, ONE FLAT NAMESPACE. An axis page ("What We
// Do"), a group page and a service all live at `/services/<slug>` and all
// resolve here. That is deliberate: a leaf cross-listed under two groups — or
// under both axes — must resolve to ONE address, so the namespace cannot be
// per-group, and nesting a leaf under its group would hand it two URLs the
// moment anything is cross-listed. Cross-listing means one page and two links
// to it, never two pages; this flat namespace IS that rule, in routing.
//
// An earlier cut of this split the tiers across `services` and `servicePillars`,
// which left slug uniqueness BETWEEN them unenforced — a collision silently made
// one page unreachable and a precedence rule here picked the winner. One
// collection makes that a unique index instead of a convention, so this route
// has no precedence logic to get wrong.
//
export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const doc = await getServiceBySlug(slug)
  if (!doc) return {}
  return buildMetadata(doc.seo, { title: doc.title })
}

export default async function ServicesSlugPage({ params }: Props) {
  const { slug } = await params
  // Cached published read FIRST, then the dynamic draft check (order matters).
  const published = await getServiceBySlug(slug)
  const { isEnabled: isDraft } = await draftMode()
  const doc = isDraft ? ((await getDraftBySlug<Service>('services', slug)) ?? published) : published
  if (!doc) notFound()
  // ROADMAP UI-2: collection-backed blocks get their items filled in here,
  // before the layout reaches the synchronous RenderBlocks dispatcher.
  const layout = (await resolveLayout(doc.layout as never)) as never

  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Services', path: '/services' },
          { name: doc.title, path: `/services/${slug}` },
        ])}
      />
      {isDraft && <PreviewBanner />}
      <article data-testid="service" data-service={slug} data-tier={doc.tier}>
        <RenderBlocks blocks={layout} />
      </article>
    </>
  )
}
