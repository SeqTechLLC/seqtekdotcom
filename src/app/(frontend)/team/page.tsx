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
    <div data-testid="team">
      {/* The grid below is a self-containering block section (px-4 md:px-6
          lg:px-8 around an `mx-auto max-w-container-lg` inner div). Wrapping it
          in a SECOND padded container inset the grid from this header by 32px
          at desktop / 16px at mobile. The header therefore uses the block's own
          container recipe rather than its own, so the two resolve to the same
          x. */}
      <header className="px-4 pt-16 md:px-6 lg:px-8">
        <div className="mx-auto max-w-container-lg">
          <h1 className="text-h1 font-bold">Our team</h1>
          <p className="mt-4 text-body-lg text-text-secondary">
            Senior practitioners who do the work, in the markets we serve.
          </p>
        </div>
      </header>
      <TeamGrid layout="cards" manualItems={ordered} headingLevel="h2" />
    </div>
  )
}
