import { relId, runGlobalComposer, textContentBlock, type LayoutBlock } from './shared'

// spec 010 US5 (Phase F) — homepage GLOBAL field→layout composer. Maps the
// deprecated structured fields onto the universal `layout` blocks per
// data-model.md:
//   hero → homepage-hero, stats → stats-bar, featuredCaseStudy →
//   featured-case-study, brandTeaser → brand-teaser, clientLogos →
//   client-logo-grid (or logo-bar below 4), featuredTestimonials →
//   featured-testimonials (or testimonial-block below 2).
// Pure + deterministic so re-runs are idempotent (contract migration-fidelity).
// The two hardcoded route sections (workshop CTA + latest-insights) stay
// template-level: latest-insights resolves posts at render time, which a static
// block cannot do — they are not stored homepage fields, so out of composer scope.

interface HomepageHeroField {
  headline?: string | null
  subheadline?: string | null
  backgroundImage?: unknown
  cta?: { label?: string | null; url?: string | null } | null
}

interface HomepageStat {
  number?: string | null
  label?: string | null
  suffix?: string | null
}

interface BrandTeaserField {
  headline?: string | null
  body?: string | null
  linkLabel?: string | null
  linkUrl?: string | null
  image?: unknown
}

interface HomepageRecord {
  hero?: HomepageHeroField | null
  stats?: Array<HomepageStat | null> | null
  featuredCaseStudy?: unknown
  brandTeaser?: BrandTeaserField | null
  clientLogos?: Array<{ logo?: unknown } | null> | null
  featuredTestimonials?: Array<unknown> | null
  [key: string]: unknown
}

// homepage-hero requires BOTH a primary and a secondary CTA (its
// acceptance-test-of-record dual-CTA design). The global stores at most one, so
// the composer supplies documented defaults for whatever the source lacks — no
// stored unit is dropped, and the homepage gains the dual CTA its block intends.
const DEFAULT_PRIMARY_CTA = { label: 'Explore our services', url: '/services' }
const DEFAULT_SECONDARY_CTA = { label: 'Book a call', url: '/contact' }

export function composeHomepageLayout(record: HomepageRecord): LayoutBlock[] {
  const blocks: LayoutBlock[] = []

  // 1. hero → homepage-hero
  const hero = record.hero
  if (hero?.headline) {
    const primaryCta =
      hero.cta?.label && hero.cta?.url
        ? { label: hero.cta.label, url: hero.cta.url }
        : DEFAULT_PRIMARY_CTA
    const backgroundImage = relId(hero.backgroundImage)
    blocks.push({
      blockType: 'homepage-hero',
      headline: hero.headline,
      ...(hero.subheadline ? { subheadline: hero.subheadline } : {}),
      ...(backgroundImage != null ? { backgroundImage } : {}),
      primaryCta,
      secondaryCta: DEFAULT_SECONDARY_CTA,
    })
  }

  // 2. stats → stats-bar (inline). minRows 3; 1–2 preserved as a content line.
  const stats = (record.stats ?? []).filter(
    (s): s is HomepageStat => !!s && !!s.number && !!s.label,
  )
  if (stats.length >= 3) {
    blocks.push({
      blockType: 'stats-bar',
      source: 'inline',
      items: stats.map((s) => ({
        number: s.number,
        label: s.label,
        ...(s.suffix ? { suffix: s.suffix } : {}),
      })),
    })
  } else if (stats.length > 0) {
    const block = textContentBlock(
      stats.map((s) => `${s.number}${s.suffix ?? ''} ${s.label}`).join(' · '),
    )
    if (block) blocks.push(block)
  }

  // 3. featuredCaseStudy → featured-case-study
  const caseStudyId = relId(record.featuredCaseStudy)
  if (caseStudyId != null) {
    blocks.push({
      blockType: 'featured-case-study',
      heading: 'Featured work',
      caseStudy: caseStudyId,
    })
  }

  // 4. brandTeaser → brand-teaser (block requires headline+body+linkLabel+linkUrl)
  const bt = record.brandTeaser
  if (bt?.headline && bt?.body) {
    const image = relId(bt.image)
    blocks.push({
      blockType: 'brand-teaser',
      headline: bt.headline,
      body: bt.body,
      linkLabel: bt.linkLabel ?? 'Read the story',
      linkUrl: bt.linkUrl ?? '/about/our-story',
      ...(image != null ? { image } : {}),
    })
  } else if (bt?.headline) {
    const block = textContentBlock(bt.headline)
    if (block) blocks.push(block)
  }

  // 5. clientLogos → client-logo-grid (≥4) / logo-bar (1–3)
  const logos = (record.clientLogos ?? [])
    .map((l) => {
      const logo = relId(l?.logo)
      return logo != null ? { logo } : null
    })
    .filter((l): l is { logo: string | number } => l !== null)
  if (logos.length >= 4) {
    blocks.push({
      blockType: 'client-logo-grid',
      heading: 'Serving industry leaders',
      logos,
      columns: '4',
    })
  } else if (logos.length > 0) {
    blocks.push({
      blockType: 'logo-bar',
      source: 'inline',
      logos,
      treatment: 'grayscale-on-color-hover',
    })
  }

  // 6. featuredTestimonials → featured-testimonials (≥2) / testimonial-block (1)
  const testimonialIds = (record.featuredTestimonials ?? [])
    .map((t) => relId(t))
    .filter((id): id is string | number => id != null)
  if (testimonialIds.length >= 2) {
    blocks.push({
      blockType: 'featured-testimonials',
      heading: 'What clients say',
      testimonials: testimonialIds,
      autoplay: false,
    })
  } else if (testimonialIds.length === 1) {
    blocks.push({
      blockType: 'testimonial-block',
      testimonial: testimonialIds[0],
      layout: 'centered',
    })
  }

  return blocks
}

// CLI bootstrap — skipped when imported as a module by tests.
const invokedDirectly = (() => {
  const entry = process.argv[1]
  if (!entry) return false
  return entry.endsWith('homepageToLayout.ts') || entry.endsWith('homepageToLayout.js')
})()

if (invokedDirectly) {
  runGlobalComposer({ global: 'homepage', compose: (record) => composeHomepageLayout(record) })
    .then((summary) => process.exit(summary.exitCode))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
