import { Section } from '../ui/Section'
import Link from 'next/link'

interface IndustryDoc {
  id?: string | number
  title?: string | null
  slug?: string | null
  _status?: ('draft' | 'published') | null
  layout?: unknown[] | null
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
// One asymmetry this accepts: `getDraftBySlug` reads with `draft: true`, which
// propagates into relationship population, so a PUBLISHED industry carrying
// pending draft edits populates as `_status: 'draft'` and shows unlinked in
// preview while the public page links it. That is the inverse of what the
// paragraph above promises, and it errs toward under-linking in preview only.
//
// A draft therefore loses its LINK, not its card — the `<div>` branch below
// still renders it. Dropping the card entirely was tried and reverted: it makes
// the block's output depend on a field (`_status`) a caller may not have
// selected, and a grid that renders nothing is indistinguishable from an inert
// control to `blockOutputContract`.
const CARD =
  'flex h-full flex-col rounded-md border border-border-subtle bg-surface p-5 text-center shadow-xs'

// Published is not the same as ROUTABLE. `/industries/[slug]` calls `notFound()`
// on an industry with an empty `layout`, and the five pre-IND-1 rows are exactly
// that after this migration: published, body NULL, because the seed cannot run
// before the deploy that creates the column. The sitemap reader already draws
// this distinction — `findPublishedIndustrySlugsWithBody` exists so the sitemap
// does not "advertise a URL that 404s" — and a linked card is the same promise
// to the same route, so it takes the same predicate. Without the body check
// this block re-creates the #126 defect it is being re-linked to fix.
//
// Depth-2 population returns the full document, so `layout` is present here.
const isLinkable = (d: IndustryDoc): boolean =>
  Boolean(d.slug) && d._status !== 'draft' && (d.layout ?? []).length > 0

export function IndustryGrid({ heading, industries }: IndustryGridProps) {
  const docs = (industries ?? []).filter(isDoc)
  if (docs.length === 0) return null
  return (
    <Section padding="spacious">
      {heading ? <h2 className="text-h2 font-bold">{heading}</h2> : null}
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* ROADMAP IND-1 — re-linked. These were unlinked in #126 because
            `/industries/<slug>` did not exist and every card was a 404; the
            route ships with this change. `isLinkable` above is what keeps
            that true: anything the route would 404 — a draft, or a published
            industry with no body yet — renders as a plain card, never a link. */}
        {docs.map((d) => (
          <li key={d.id ?? d.slug}>
            {/* `<a>` is transparent content, so the heading belongs in flow
                content inside the link, matching PartnerGrid. */}
            {isLinkable(d) ? (
              <Link
                href={`/industries/${d.slug}`}
                className={`${CARD} transition-colors hover:border-border-strong`}
              >
                <h3 className="text-h4 font-semibold">{d.title}</h3>
              </Link>
            ) : (
              <div className={CARD}>
                <h3 className="text-h4 font-semibold">{d.title}</h3>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Section>
  )
}

export default IndustryGrid
