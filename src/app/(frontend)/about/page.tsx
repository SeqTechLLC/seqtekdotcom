import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function AboutLanding() {
  return (
    <main className="mx-auto max-w-container-md px-4 py-16 md:px-6 lg:px-8">
      <h1 className="text-h1 font-bold">About SEQTEK</h1>
      <p className="mt-4 text-body-lg text-text-secondary">
        Detailed content is coming soon. In the meantime, see the{' '}
        <Link className="text-link underline hover:text-link-hover" href="/">
          home page
        </Link>{' '}
        or get in touch.
      </p>
    </main>
  )
}
