import type { Metadata } from 'next'
import { draftMode } from 'next/headers'

import { getHomepage, getPayloadInstance } from '@/lib/payload'
import { buildMetadata } from '@/lib/metadata'
import { siteSettings } from '@/lib/site-content'
import { organizationLd } from '@/lib/structured-data'
import { JsonLd } from '@/components/seo/JsonLd'
import { PreviewBanner } from '@/components/layout/PreviewBanner'
import { RenderBlocks } from '@/components/sections/RenderBlocks'
import { resolveLayout } from '@/lib/resolveLayout'
import type { Homepage } from '@/payload-types'

// spec 010 US5 (Phase F) — `/` is driven by the `homepage` GLOBAL's `layout`
// blocks rendered through RenderBlocks (ADR 0009): editors reorder/edit every
// section of the homepage with no deploy. Nothing on the page is template
// code: the Touchstone band is a `cta` block and latest insights is a `cards`
// block over `posts`, which `resolveLayout` fills at render. The Organization
// JSON-LD and the conversion-signal surface are unchanged (data-model.md "Keep").

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
  // from the code-owned site constant (spec 011 T013).
  const { companyName, tagline } = siteSettings
  return buildMetadata(null, {
    title: tagline ? `${companyName}: ${tagline}` : companyName,
    description: tagline,
    absoluteTitle: true,
  })
}

export default async function HomePage() {
  // Cached published read FIRST, then the dynamic draft check — keeps the
  // unstable_cache read out of a dynamic scope (DYNAMIC_SERVER_USAGE guard).
  const publishedHomepage = await getHomepage()
  const { isEnabled: isDraft } = await draftMode()
  const homepage = isDraft ? await readDraftHomepage() : publishedHomepage

  // payload-types Homepage['layout'] is the RenderBlocks-compatible shape.
  // ROADMAP UI-2: `cards` blocks get their items filled in here, before the
  // layout reaches the synchronous RenderBlocks dispatcher.
  const layout = (await resolveLayout(homepage?.layout as never)) as never

  return (
    <>
      <JsonLd data={organizationLd()} />
      {isDraft && <PreviewBanner />}

      <div data-testid="homepage" data-homepage="true">
        <RenderBlocks blocks={layout} />
      </div>
    </>
  )
}
