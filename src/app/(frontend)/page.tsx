import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'
import './styles.css'

// Spike: force runtime rendering so `docker build` doesn't need PAYLOAD_SECRET / a DB.
// Phase 3 (Spec 004) will switch to ISR with the homepage global driving render.
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
    <div className="mx-auto max-w-container-md px-4 py-16 md:px-6 lg:px-8">
      {page ? (
        <h1 className="text-h1 font-bold" data-testid="page-title">
          {page.title}
        </h1>
      ) : (
        <section data-testid="empty-state">
          <h1 className="text-h1 font-bold">No page yet</h1>
          <p className="mt-4 text-body-lg text-text-secondary">
            Create a page with slug{' '}
            <code className="rounded-sm bg-surface-subtle px-1.5 py-0.5 font-mono text-small">
              home
            </code>{' '}
            in{' '}
            <Link className="text-link underline hover:text-link-hover" href="/admin">
              /admin
            </Link>{' '}
            to see content rendered here. The Phase 3 templates will render the homepage global with
            the full block library.
          </p>
        </section>
      )}
    </div>
  )
}
