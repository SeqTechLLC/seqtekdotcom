import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { getTeamMemberBySlug, getSiteSettings } from '@/lib/payload'
import { getDraftBySlug } from '@/lib/preview'
import { buildMetadata } from '@/lib/metadata'
import { breadcrumbLd, personLd } from '@/lib/structured-data'
import { JsonLd } from '@/components/seo/JsonLd'
import { PreviewBanner } from '@/components/layout/PreviewBanner'
import { RenderBlocks } from '@/components/sections/RenderBlocks'
import { ResponsiveImage } from '@/components/ui/ResponsiveImage'
import type { TeamMember } from '@/payload-types'

// spec 010 US2 (Phase E, R7): the block-composed `/team/[slug]` detail route —
// the one phase that ADDS a route rather than retiring a template. Person +
// breadcrumb JSON-LD (AICO/E-E-A-T); body via RenderBlocks. Same cached-read-
// then-draftMode ordering as the other detail routes (avoids DYNAMIC_SERVER_USAGE).

export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [doc, siteSettings] = await Promise.all([getTeamMemberBySlug(slug), getSiteSettings()])
  if (!doc) return {}
  return buildMetadata(doc.seo, {
    title: doc.title ? `${doc.name}, ${doc.title}` : doc.name,
    siteSettings,
  })
}

export default async function TeamMemberPage({ params }: Props) {
  const { slug } = await params
  // Cached published read FIRST, then the dynamic draft check (order matters —
  // draftMode() before unstable_cache throws DYNAMIC_SERVER_USAGE under ISR).
  const published = await getTeamMemberBySlug(slug)
  const { isEnabled: isDraft } = await draftMode()
  const member = isDraft
    ? ((await getDraftBySlug<TeamMember>('teamMembers', slug)) ?? published)
    : published
  if (!member) notFound()

  const photo = member.photo && typeof member.photo === 'object' ? member.photo : null
  // payload-types TeamMember['layout'] is the RenderBlocks-compatible shape.
  const layout = (member.layout ?? []) as never

  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Team', path: '/team' },
          { name: member.name, path: `/team/${slug}` },
        ])}
      />
      <JsonLd data={personLd(member)} />
      {isDraft && <PreviewBanner />}

      <article data-testid="team-member-detail" className="py-16">
        <header className="mx-auto mb-8 flex max-w-prose flex-col gap-6 px-4 md:flex-row md:items-center md:px-6">
          {photo?.url ? (
            <ResponsiveImage
              media={photo}
              sizes="160px"
              className="h-32 w-32 shrink-0 rounded-full border border-border-subtle object-cover"
              loading="eager"
            />
          ) : null}
          <div>
            <h1 className="text-h1 font-bold" data-testid="team-member-name">
              {member.name}
            </h1>
            {member.title ? (
              <p className="mt-2 text-body-lg text-text-secondary">{member.title}</p>
            ) : null}
            {member.role ? <p className="mt-1 text-body text-text-muted">{member.role}</p> : null}
          </div>
        </header>

        <RenderBlocks blocks={layout} />
      </article>
    </>
  )
}
