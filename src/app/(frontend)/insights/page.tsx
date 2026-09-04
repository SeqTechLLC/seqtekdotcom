import type { Metadata } from 'next'

import { listPosts } from '@/lib/payload'
import { buildMetadata } from '@/lib/metadata'
import { PostList } from '@/components/sections/PostList'

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
      {/* The grid below is a self-containering block section (px-4 md:px-6
          lg:px-8 around an `mx-auto max-w-container-xl` inner div). Wrapping it
          in a SECOND padded container inset the grid from this header by 32px
          at desktop / 16px at mobile. The header therefore uses the block's own
          container recipe rather than its own, so the two resolve to the same
          x. */}
      <header className="px-4 pt-16 md:px-6 lg:px-8">
        <div className="mx-auto max-w-container-xl">
          <h1 className="text-h1 font-bold">Insights</h1>
          <p className="mt-4 text-body-lg text-text-secondary">
            Field notes from the work, not thought-leadership for its own sake.
          </p>
        </div>
      </header>
      <PostList manualItems={posts} limit={posts.length} headingLevel="h2" />
    </div>
  )
}
