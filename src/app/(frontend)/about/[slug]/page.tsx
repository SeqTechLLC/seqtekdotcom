import Link from 'next/link'
import { notFound } from 'next/navigation'

import { navigation } from '@/lib/site-content'

const VALID_SLUGS = new Set(
  navigation.mainNav
    .flatMap((entry) => entry.children ?? [])
    .map((entry) => entry.url)
    .filter((url): url is string => typeof url === 'string')
    .filter((url) => url.startsWith('/about/'))
    .map((url) => url.replace('/about/', '')),
)

export const dynamic = 'force-dynamic'

export function generateStaticParams() {
  return [...VALID_SLUGS].map((slug) => ({ slug }))
}

export default async function AboutPlaceholder({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!VALID_SLUGS.has(slug)) notFound()

  const title = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  return (
    <main className="mx-auto max-w-container-md px-4 py-16 md:px-6 lg:px-8">
      <h1 className="text-h1 font-bold">{title}</h1>
      <p className="mt-4 text-body-lg text-text-secondary">
        This page is coming soon. In the meantime, see our{' '}
        <Link className="text-link underline hover:text-link-hover" href="/">
          home page
        </Link>{' '}
        or get in touch.
      </p>
    </main>
  )
}
