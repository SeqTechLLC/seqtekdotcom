import Link from 'next/link'
import { getPayload } from 'payload'
import { RichText } from '@payloadcms/richtext-lexical/react'
import config from '@/payload.config'
import './styles.css'

// Spike: force runtime rendering so `docker build` doesn't need PAYLOAD_SECRET / a DB.
// Phase 1 will switch to ISR with build-time secrets injected via CI (see ARCHITECTURE.md §3).
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const payload = await getPayload({ config: await config })

  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
  })
  const page = docs[0]

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      {page ? (
        <>
          <h1 className="text-4xl font-bold tracking-tight" data-testid="page-title">
            {page.title}
          </h1>
          <div className="prose mt-8" data-testid="page-content">
            {page.content ? <RichText data={page.content} /> : null}
          </div>
        </>
      ) : (
        <section data-testid="empty-state">
          <h1 className="text-4xl font-bold tracking-tight">No page yet</h1>
          <p className="mt-4 text-lg">
            Create a page with slug <code className="rounded bg-gray-100 px-1.5 py-0.5">home</code> in{' '}
            <Link className="text-blue-700 underline" href="/admin">
              /admin
            </Link>{' '}
            to see content rendered here.
          </p>
        </section>
      )}
    </main>
  )
}
