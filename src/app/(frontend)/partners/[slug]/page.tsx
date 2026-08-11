import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { getPartnerBySlug, getSiteSettings } from '@/lib/payload'
import { getDraftBySlug } from '@/lib/preview'
import { buildMetadata } from '@/lib/metadata'
import { breadcrumbLd } from '@/lib/structured-data'
import { JsonLd } from '@/components/seo/JsonLd'
import { PreviewBanner } from '@/components/layout/PreviewBanner'
import { RenderBlocks } from '@/components/sections/RenderBlocks'
import { Button } from '@/components/ui/Button'
import type { Partner } from '@/payload-types'

// ADR 0009 Option C: a partner is a Page + typed metadata. The slug resolves
// straight off the `partners` collection — deliberately NOT a hardcoded slug
// whitelist like `/services/[offering]`, so publishing a new partner needs no
// code change or deploy. Body renders through RenderBlocks.
//
// The `<h1>` comes from the layout's hero block, NOT from a route-owned header:
// the seeded partner bodies lead with a hero, so an `<h1>{partner.name}</h1>`
// here would be a second one. `partnerSkeleton` therefore leads with a hero so
// admin-created partners get an h1 too.
//
// Same cached-read-then-draftMode ordering as the other detail routes
// (draftMode() before unstable_cache throws DYNAMIC_SERVER_USAGE under ISR).
export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [partner, siteSettings] = await Promise.all([getPartnerBySlug(slug), getSiteSettings()])
  if (!partner) return {}
  return buildMetadata(partner.seo, { title: partner.name, siteSettings })
}

export default async function PartnerPage({ params }: Props) {
  const { slug } = await params
  // Cached published read FIRST, then the dynamic draft check (order matters).
  const published = await getPartnerBySlug(slug)
  const { isEnabled: isDraft } = await draftMode()
  const partner = isDraft
    ? ((await getDraftBySlug<Partner>('partners', slug)) ?? published)
    : published
  if (!partner) notFound()

  // payload-types Partner['layout'] is the RenderBlocks-compatible shape.
  const layout = (partner.layout ?? []) as never
  // `logo` + `url` are the typed metadata the index card uses; this is where
  // they earn their keep on the detail page (Button renders external hrefs as
  // target=_blank + rel="noopener noreferrer").
  const logo = partner.logo && typeof partner.logo === 'object' ? partner.logo : null

  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Partners', path: '/partners' },
          { name: partner.name, path: `/partners/${slug}` },
        ])}
      />
      {isDraft && <PreviewBanner />}
      <article data-testid="partner" data-partner={slug}>
        <RenderBlocks blocks={layout} />
        {partner.url ? (
          <aside className="px-4 pb-16 md:px-6 lg:px-8">
            <div className="mx-auto flex max-w-prose flex-col items-center gap-6 rounded-md border border-border-subtle bg-surface-elevated p-8 text-center sm:flex-row sm:justify-between sm:text-left">
              {logo?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo.url}
                  alt={logo.alt ?? partner.name}
                  className="h-12 w-auto object-contain"
                />
              ) : null}
              <Button
                href={partner.url}
                variant="ghost"
                // spec 008 US3: every CTA on the site emits `cta_click` through
                // the shared emitter. An outbound partner click is a conversion
                // signal like any other, so it routes through TrackedCtaLink
                // rather than rendering a bare anchor.
                cta={{ ctaId: 'partner-site', location: 'partner-detail' }}
                data-testid="partner-site-link"
              >
                Visit {partner.name}
              </Button>
            </div>
          </aside>
        ) : null}
      </article>
    </>
  )
}
