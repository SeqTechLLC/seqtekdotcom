import type { Metadata } from 'next'

import { listPosts } from '@/lib/payload'
import { buildMetadata } from '@/lib/metadata'
import { PostList } from '@/components/sections/PostList'
import { Container } from '@/components/ui/Container'

// spec 004 Phase 8 (T028). Insights (posts) listing.

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(null, {
    title: 'Insights',
    description: 'Practical perspectives on strategy, delivery, and AI from the SEQTEK team.',
  })
}

export default async function InsightsPage() {
  const posts = await listPosts()

  return (
    <div data-testid="insights-listing">
      {/* The grid below is a self-containering block section, so wrapping it in
          a second padded container would inset it from this header. The header
          therefore takes the SAME shell as the block — `ui/Container`, which
          reads `SHELL_RAIL` — rather than restating the recipe. Restating it is
          what left these five headers at container-lg when the blocks moved to
          container-xl, putting every h1 128px right of its own grid (ADR
          0012). */}
      <header className="pt-16">
        <Container>
          <h1 className="text-h1 font-bold">Insights</h1>
          <p className="mt-4 text-body-lg text-text-secondary">
            Field notes from the work, not thought-leadership for its own sake.
          </p>
        </Container>
      </header>
      <PostList manualItems={posts} limit={posts.length} headingLevel="h2" />
    </div>
  )
}
