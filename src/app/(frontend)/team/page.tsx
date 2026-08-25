import type { Metadata } from 'next'

import { listTeamMembers } from '@/lib/payload'
import { buildMetadata } from '@/lib/metadata'
import { TeamGrid } from '@/components/sections/TeamGrid'
import { byLeadershipThenOrder } from '@/lib/resolveLayout'

// spec 004 US3 (T019). `/team` lists `teamMembers` leadership-first, then by
// `order`. The collection is public-read with NO drafts and NO `seo` group, so
// there is no draft branch and metadata is static / site-constant-sourced
// (invariant R6 N/A — research §D7 caveat).

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(null, {
    title: 'Our team',
    description: 'The people behind SEQTEK across Tulsa, OKC, NW Arkansas, and Kansas City.',
  })
}

export default async function TeamPage() {
  const members = await listTeamMembers()

  // Leadership first, then by `order` (numeric, undefined last), stable. Shared
  // with `resolveLayout` so a `team-grid` block set to "All" matches this page.
  const ordered = [...members].sort(byLeadershipThenOrder)

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
