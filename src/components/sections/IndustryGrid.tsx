import Link from 'next/link'

interface IndustryDoc {
  id?: string | number
  title?: string | null
  slug?: string | null
  _status?: ('draft' | 'published') | null
}

interface IndustryGridProps {
  heading?: string | null
  industries?: Array<IndustryDoc | string | number> | null
}

const isDoc = (v: unknown): v is IndustryDoc =>
  typeof v === 'object' && v !== null && 'title' in (v as object)

// A populated relation is not guaranteed to be published, so the card cannot
// link on `isDoc` alone.
//
// On the PUBLIC paths this is already closed at the read: `findPublishedBySlug`
// and `getHomepage` both pass `overrideAccess: false`, so a draft comes back as
// a bare id and `isDoc` rejects it — no card at all. (`getHomepage` only gained
// that in this PR; before it, Payload's local API defaulted `overrideAccess` to
// true and a draft populated in full. Do not remove it.)
//
// The guard below covers the PREVIEW path, which is not closed at the read:
// `getDraftBySlug` uses `overrideAccess: true` by design, so a draft DOES
// populate there. The link would not 404 — draft mode is a cookie that persists
// across navigation, so the target would resolve the draft too. The reason to
// withhold it is consistency: preview should show the editor what the public
// page will look like, and on the public page that card is not a link.
//
// A draft therefore loses its LINK, not its card — the `<div>` branch below
// still renders it. Dropping the card entirely was tried and reverted: it makes
// the block's output depend on a field (`_status`) a caller may not have
// selected, and a grid that renders nothing is indistinguishable from an inert
// control to `blockOutputContract`.
const isLinkable = (d: IndustryDoc): boolean => Boolean(d.slug) && d._status !== 'draft'

export function IndustryGrid({ heading, industries }: IndustryGridProps) {
  const docs = (industries ?? []).filter(isDoc)
  if (docs.length === 0) return null
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-lg">
        {heading ? <h2 className="text-h2 font-bold">{heading}</h2> : null}
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* ROADMAP IND-1 — re-linked. These were unlinked in #126 because
              `/industries/<slug>` did not exist and every card was a 404; the
              route ships with this change. `isLinkable` above is what keeps
              that true: a draft renders as a plain card, never as a link. */}
          {docs.map((d) => (
            <li key={d.id ?? d.slug}>
              {/* `<a>` is transparent content, so the heading belongs in flow
                  content inside the link, matching PartnerGrid. */}
              {isLinkable(d) ? (
                <Link
                  href={`/industries/${d.slug}`}
                  className="flex h-full flex-col rounded-md border border-border-subtle bg-surface p-5 text-center shadow-xs transition-colors hover:border-border"
                >
                  <h3 className="text-h4 font-semibold">{d.title}</h3>
                </Link>
              ) : (
                <div className="flex h-full flex-col rounded-md border border-border-subtle bg-surface p-5 text-center shadow-xs">
                  <h3 className="text-h4 font-semibold">{d.title}</h3>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default IndustryGrid
