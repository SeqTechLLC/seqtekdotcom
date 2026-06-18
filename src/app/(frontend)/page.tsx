import type { Metadata } from 'next'
import { draftMode } from 'next/headers'

import { getHomepage, getPayloadInstance, getSiteSettings, listPosts } from '@/lib/payload'
import { buildMetadata } from '@/lib/metadata'
import { organizationLd } from '@/lib/structured-data'
import { JsonLd } from '@/components/seo/JsonLd'
import { PreviewBanner } from '@/components/layout/PreviewBanner'
import { RenderBlocks } from '@/components/sections/RenderBlocks'
import { PostList } from '@/components/sections/PostList'
import { CtaSection } from '@/components/sections/CtaSection'
import type { Homepage } from '@/payload-types'

// spec 010 US5 (Phase F) — `/` is driven by the `homepage` GLOBAL's `layout`
// blocks rendered through RenderBlocks (ADR 0009): editors reorder/edit the
// homepage sections with no deploy. The Organization JSON-LD and the
// conversion-signal surface are unchanged (data-model.md "Keep"). The Touchstone
// CTA + latest-insights stay template-level: latest-insights resolves posts at
// render time (a static block cannot), so it is not a stored homepage field.

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

  // payload-types Homepage['layout'] is the RenderBlocks-compatible shape.
  const layout = (homepage?.layout ?? []) as never

  return (
    <>
      <JsonLd data={organizationLd(siteSettings)} />
      {isDraft && <PreviewBanner />}

      <div data-testid="homepage" data-homepage="true">
        <RenderBlocks blocks={layout} />

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
