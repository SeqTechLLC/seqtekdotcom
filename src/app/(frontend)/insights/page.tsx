import type { Metadata } from 'next'

import { getSiteSettings, listPosts } from '@/lib/payload'
import { buildMetadata } from '@/lib/metadata'
import { PostList } from '@/components/sections/PostList'

// spec 004 Phase 8 (T028). Insights (posts) listing.

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await getSiteSettings()
  return buildMetadata(null, {
    title: 'Insights',
    description: 'Practical perspectives on strategy, delivery, and AI from the SEQTEK team.',
    siteSettings,
  })
}

export default async function InsightsPage() {
  const posts = await listPosts()

  return (
    <div data-testid="insights-listing" className="mx-auto max-w-container-xl px-4 py-16 md:px-6">
      <header className="mb-12">
        <h1 className="text-h1 font-bold">Insights</h1>
        <p className="mt-4 text-body-lg text-text-secondary">
          Field notes from the work, not thought-leadership for its own sake.
        </p>
      </header>
      <PostList source="manual" manualItems={posts} limit={posts.length} />
    </div>
  )
}
