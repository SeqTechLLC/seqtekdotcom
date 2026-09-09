import Link from 'next/link'
import { Section } from '../ui/Section'

interface CaseStudyDoc {
  id?: string | number
  title?: string | null
  slug?: string | null
  subtitle?: string | null
  heroImage?: { url?: string | null; alt?: string | null } | string | number | null
}

interface CaseStudyGridProps {
  heading?: string | null
  /** Authoring-time input consumed by `resolveLayout`, not read here — the
   *  component renders whatever items it is handed (ROADMAP UI-2). */
  source?: 'manual' | 'latest' | 'by-industry' | 'by-service'
  manualItems?: Array<CaseStudyDoc | string | number> | null
  limit?: number | null
  /** Card title level. Defaults to `h3`; listing pages with a page-level `h1`
   *  and no section heading pass `h2` to keep heading order non-skipping. */
  headingLevel?: 'h2' | 'h3'
}

const isDoc = (v: unknown): v is CaseStudyDoc =>
  typeof v === 'object' && v !== null && 'title' in (v as object)

const isMedia = (v: unknown): v is { url: string; alt?: string | null } =>
  typeof v === 'object' && v !== null && 'url' in (v as object) && !!(v as { url: unknown }).url

export function CaseStudyGrid({
  heading,
  manualItems,
  limit = 3,
  headingLevel = 'h3',
}: CaseStudyGridProps) {
  const docs = (manualItems ?? []).filter(isDoc).slice(0, limit ?? 9)

  // No items, no section — the same contract `IndustryGrid` already keeps.
  // Rendering the heading alone put a bare "Selected work" on an industry page
  // with nothing beneath it: a promise of proof with no proof, which is the one
  // thing CONTENT_NEEDS §11 says loses at our size. It is not hypothetical —
  // five of the seven industries have no case study to point at, so every one
  // of them would ship that heading, and a `by-industry` grid fills itself at
  // render, so an editor never sees the empty state while authoring.
  if (docs.length === 0) return null

  const CardHeading = headingLevel
  return (
    <Section padding="spacious">
      {heading ? <h2 className="text-h2 font-bold">{heading}</h2> : null}
      <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {docs.map((d) => {
          const card = (
            <>
              {isMedia(d.heroImage) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={d.heroImage.url}
                  alt={d.heroImage.alt ?? d.title ?? ''}
                  className="aspect-[16/9] w-full object-cover"
                />
              ) : null}
              <div className="p-5">
                <CardHeading className="text-h4 font-semibold">{d.title}</CardHeading>
                {d.subtitle ? (
                  <p className="mt-2 text-body text-text-secondary">{d.subtitle}</p>
                ) : null}
              </div>
            </>
          )
          return (
            <li
              key={d.id ?? d.slug}
              className="group overflow-hidden rounded-md border border-border-subtle bg-surface shadow-xs transition hover:border-border-strong hover:shadow-sm"
            >
              {d.slug ? (
                <Link href={`/case-studies/${d.slug}`} className="block h-full">
                  {card}
                </Link>
              ) : (
                card
              )}
            </li>
          )
        })}
      </ul>
    </Section>
  )
}

export default CaseStudyGrid
