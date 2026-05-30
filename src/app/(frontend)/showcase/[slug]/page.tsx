import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'

import { RenderBlocks } from '@/components/sections/RenderBlocks'

// Dev showcase route. URL /showcase/<slug> resolves to the `pages` document
// with slug `showcase-<slug>`. Seeded by `npm run seed:showcase`.
//
// Force-dynamic so the latest seed run is visible without rebuild.
export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ShowcasePage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayload({ config: await config })

  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: `showcase-${slug}` } },
    limit: 1,
    depth: 2,
  })

  const page = docs[0]
  if (!page) notFound()

  // payload-types Page['layout'] is the source of truth; RenderBlocks accepts
  // the same shape (BlockLike[] is structurally compatible).
  const layout = (page.layout ?? []) as never

  return (
    <article data-testid="showcase-page">
      <div className="mx-auto max-w-container-xl border-b border-border-subtle px-4 py-4 text-small text-text-muted">
        <span data-testid="showcase-slug">showcase/{slug}</span>
        <span className="px-2">·</span>
        <span>{page.title}</span>
      </div>
      <RenderBlocks blocks={layout} />
    </article>
  )
}
