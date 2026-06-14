import type { Metadata } from 'next'
import { draftMode } from 'next/headers'

import { getHomepage, getPayloadInstance, getSiteSettings, listPosts } from '@/lib/payload'
import { buildMetadata } from '@/lib/metadata'
import { organizationLd } from '@/lib/structured-data'
import { JsonLd } from '@/components/seo/JsonLd'
import { PreviewBanner } from '@/components/layout/PreviewBanner'
import { HomepageHero } from '@/components/sections/HomepageHero'
import { StatsBar } from '@/components/sections/StatsBar'
import { FeaturedCaseStudy } from '@/components/sections/FeaturedCaseStudy'
import { BrandTeaser } from '@/components/sections/BrandTeaser'
import { ClientLogoGrid } from '@/components/sections/ClientLogoGrid'
import { FeaturedTestimonials } from '@/components/sections/FeaturedTestimonials'
import { PostList } from '@/components/sections/PostList'
import { CtaSection } from '@/components/sections/CtaSection'
import type { Homepage } from '@/payload-types'

// spec 004 US1 (T012/T013). Drive `/` from the `homepage` GLOBAL — a bespoke
// composition mapping its structured fields to the existing section components
// (research §D3). This retires the spike placeholder + the `pages`-slug-`home`
// query (drift #2). ISR per ARCHITECTURE.md §3 — no `force-dynamic`.

export const revalidate = 3600

// Draft preview (admin live-preview enables draft mode and loads `/`). Read the
// latest draft directly — `unstable_cache` is bypassed under draft mode anyway,
// but the explicit draft + overrideAccess lift the published filter.
async function readDraftHomepage(): Promise<Homepage> {
  const payload = await getPayloadInstance()
  return (await payload.findGlobal({
    slug: 'homepage',
    draft: true,
    overrideAccess: true,
    depth: 2,
  })) as Homepage
}

export async function generateMetadata(): Promise<Metadata> {
  // The `homepage` global has no `seo` group (data-model §5) — source metadata
  // from `siteSettings`.
  const siteSettings = await getSiteSettings()
  const companyName = siteSettings?.companyName ?? 'SEQTEK'
  const tagline = siteSettings?.tagline ?? undefined
  return buildMetadata(null, {
    title: tagline ? `${companyName}: ${tagline}` : companyName,
    description: tagline,
    siteSettings,
    absoluteTitle: true,
  })
}

export default async function HomePage() {
  // Cached published reads FIRST, then the dynamic draft check — keeps the
  // unstable_cache reads out of a dynamic scope (DYNAMIC_SERVER_USAGE guard).
  const [publishedHomepage, siteSettings, latestPosts] = await Promise.all([
    getHomepage(),
    getSiteSettings(),
    listPosts(),
  ])
  const { isEnabled: isDraft } = await draftMode()
  const homepage = isDraft ? await readDraftHomepage() : publishedHomepage

  const hero = homepage?.hero
  const brandTeaser = homepage?.brandTeaser

  return (
    <>
      <JsonLd data={organizationLd(siteSettings)} />
      {isDraft && <PreviewBanner />}

      <div data-testid="homepage" data-homepage="true">
        <section data-testid="hero">
          <HomepageHero
            headline={hero?.headline ?? siteSettings?.companyName ?? 'SEQTEK'}
            subheadline={hero?.subheadline}
            backgroundImage={hero?.backgroundImage}
            primaryCta={hero?.cta}
          />
        </section>

        {homepage?.stats?.length ? (
          <section data-testid="stats">
            <StatsBar source="inline" items={homepage.stats} />
          </section>
        ) : null}

        {homepage?.featuredCaseStudy ? (
          <section data-testid="featured-case-study">
            <FeaturedCaseStudy heading="Featured work" caseStudy={homepage.featuredCaseStudy} />
          </section>
        ) : null}

        {brandTeaser?.headline ? (
          <section data-testid="brand-teaser">
            <BrandTeaser
              headline={brandTeaser.headline}
              body={brandTeaser.body ?? ''}
              linkLabel={brandTeaser.linkLabel ?? 'Read the story'}
              linkUrl={brandTeaser.linkUrl ?? '/about'}
              image={brandTeaser.image}
            />
          </section>
        ) : null}

        {homepage?.clientLogos?.length ? (
          <section data-testid="client-logos">
            <ClientLogoGrid
              heading="Serving industry leaders"
              logos={homepage.clientLogos}
              columns="4"
            />
          </section>
        ) : null}

        {homepage?.featuredTestimonials?.length ? (
          <section data-testid="featured-testimonials">
            <FeaturedTestimonials
              heading="What clients say"
              testimonials={homepage.featuredTestimonials}
            />
          </section>
        ) : null}

        <section data-testid="workshop-cta">
          <CtaSection
            variant="split"
            headline="The Touchstone Workshop"
            body="A working session that turns AI ambition into an architecture, named epics, and a build sequence."
            primaryCta={{ label: 'Explore the workshop', url: '/workshops/touchstone' }}
          />
        </section>

        {latestPosts.length ? (
          <section data-testid="latest-insights">
            <PostList
              heading="Latest insights"
              source="manual"
              manualItems={latestPosts.slice(0, 3)}
              limit={3}
            />
          </section>
        ) : null}
      </div>
    </>
  )
}
