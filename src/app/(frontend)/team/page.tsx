import type { Metadata } from 'next'

import { getSiteSettings, listTeamMembers } from '@/lib/payload'
import { buildMetadata } from '@/lib/metadata'
import { TeamGrid } from '@/components/sections/TeamGrid'

// spec 004 US3 (T019). `/team` lists `teamMembers` leadership-first, then by
// `order`. The collection is public-read with NO drafts and NO `seo` group, so
// there is no draft branch and metadata is static / siteSettings-sourced
// (invariant R6 N/A — research §D7 caveat).

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await getSiteSettings()
  return buildMetadata(null, {
    title: 'Our team',
    description: 'The people behind SEQTEK across Tulsa, OKC, NW Arkansas, and Kansas City.',
    siteSettings,
  })
}

export default async function TeamPage() {
  const members = await listTeamMembers()

  // Leadership first, then by `order` (numeric, undefined last), stable.
  const ordered = [...members].sort((a, b) => {
    const lead = Number(Boolean(b.isLeadership)) - Number(Boolean(a.isLeadership))
    if (lead !== 0) return lead
    return (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER)
  })

  return (
    <div data-testid="team" className="mx-auto max-w-container-lg px-4 py-16 md:px-6">
      <header className="mb-12">
        <h1 className="text-h1 font-bold">Our team</h1>
        <p className="mt-4 text-body-lg text-text-secondary">
          Senior practitioners who do the work, in the markets we serve.
        </p>
      </header>
      <TeamGrid filter="all" layout="cards" manualItems={ordered} headingLevel="h2" />
    </div>
  )
}
