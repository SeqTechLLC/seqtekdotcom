import Link from 'next/link'

import { NotFoundTracker } from '@/components/error/NotFoundTracker'

// spec 004 T035 (ERROR_PAGES §2). Renders within the (frontend) layout, so the
// site header + footer are already present. Consultative voice, not jokey.

const DESTINATIONS = [
  { href: '/', title: 'Home', body: 'Start from the top.' },
  { href: '/services', title: 'Services', body: 'How we help.' },
  { href: '/case-studies', title: 'Case studies', body: 'Work we have shipped.' },
]

export default function NotFound() {
  return (
    <div
      data-testid="not-found"
      className="mx-auto max-w-container-lg px-4 py-24 text-center md:px-6"
    >
      <NotFoundTracker />
      <p className="text-small font-semibold uppercase tracking-wide text-text-muted">Error 404</p>
      <h1 className="mt-2 text-h1 font-bold">We could not find that page</h1>
      <p className="mx-auto mt-4 max-w-prose text-body-lg text-text-secondary">
        The page may have moved or no longer exists. Here are a few good places to pick up.
      </p>

      <ul className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
        {DESTINATIONS.map((d) => (
          <li key={d.href}>
            <Link
              href={d.href}
              className="block rounded-md border border-border-subtle p-6 text-left transition hover:border-accent"
            >
              <span className="block text-body font-semibold">{d.title}</span>
              <span className="mt-1 block text-small text-text-muted">{d.body}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-12">
        <Link
          href="/contact"
          className="inline-block rounded-md bg-accent px-6 py-3 font-semibold text-white transition hover:opacity-90"
        >
          Book a strategy call
        </Link>
      </div>
    </div>
  )
}
