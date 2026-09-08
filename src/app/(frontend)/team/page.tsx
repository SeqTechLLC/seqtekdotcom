import type { Metadata } from 'next'

import { listTeamMembers } from '@/lib/payload'
import { buildMetadata } from '@/lib/metadata'
import { TeamGrid } from '@/components/sections/TeamGrid'
import { byLeadershipThenOrder } from '@/lib/resolveLayout'
import { Container } from '@/components/ui/Container'

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
      {/* The grid below is a self-containering block section, so wrapping it in
          a second padded container would inset it from this header. The header
          therefore takes the SAME shell as the block — `ui/Container`, which
          reads `SHELL_RAIL` — rather than restating the recipe. Restating it is
          what left these five headers at container-lg when the blocks moved to
          container-xl, putting every h1 128px right of its own grid (ADR
          0012). */}
      <header className="pt-16">
        <Container>
          <h1 className="text-h1 font-bold">Our team</h1>
          <p className="mt-4 text-body-lg text-text-secondary">
            Senior practitioners who do the work, in the markets we serve.
          </p>
        </Container>
      </header>
      <TeamGrid layout="cards" manualItems={ordered} headingLevel="h2" />
    </div>
  )
}
