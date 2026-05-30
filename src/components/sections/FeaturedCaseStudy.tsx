import Link from 'next/link'

interface CaseStudyDoc {
  id?: string | number
  title?: string | null
  slug?: string | null
  subtitle?: string | null
  heroImage?: { url?: string | null; alt?: string | null } | string | number | null
}

interface FeaturedCaseStudyProps {
  heading?: string | null
  caseStudy?: CaseStudyDoc | string | number | null
}

const isDoc = (v: unknown): v is CaseStudyDoc =>
  typeof v === 'object' && v !== null && 'title' in (v as object)

const isMedia = (v: unknown): v is { url: string; alt?: string | null } =>
  typeof v === 'object' && v !== null && 'url' in (v as object) && !!(v as { url: unknown }).url

export function FeaturedCaseStudy({ heading, caseStudy }: FeaturedCaseStudyProps) {
  if (!isDoc(caseStudy)) return null
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-lg">
        <p className="text-caption uppercase tracking-wide text-accent">
          {heading ?? 'Featured case study'}
        </p>
        <div className="mt-4 grid gap-10 lg:grid-cols-2 lg:items-center">
          {isMedia(caseStudy.heroImage) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={caseStudy.heroImage.url}
              alt={caseStudy.heroImage.alt ?? caseStudy.title ?? ''}
              className="w-full rounded-md"
            />
          ) : null}
          <div>
            <h2 className="text-h2 font-bold">{caseStudy.title}</h2>
            {caseStudy.subtitle ? (
              <p className="mt-3 text-body-lg text-text-secondary">{caseStudy.subtitle}</p>
            ) : null}
            {caseStudy.slug ? (
              <Link
                href={`/case-studies/${caseStudy.slug}`}
                className="mt-6 inline-block rounded-md bg-accent px-5 py-3 font-medium text-white"
              >
                Read the case study
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeaturedCaseStudy
