/**
 * Services restructure seeder (feat/services-restructure) — creates the four
 * peer-offering Pages as block-composed `layout` records, idempotent + slug-keyed
 * via `upsertBySlug`. No collection schema change: these are ordinary Pages whose
 * known slugs the `/services` + `/services/[offering]` routes look up.
 *
 *   npm run seed:services            # writes against DATABASE_URL in .env.local
 *   npm run seed:services -- --dry-run
 *
 * Idempotent: re-running upserts by slug (zero new rows for an already-seeded
 * page). Published so the public RenderBlocks routes show them immediately.
 *
 * Gated copy lands as CLEARLY-MARKED placeholders:
 *   - Localshoring concise definition  → Hank-gated
 *   - The two non-Touchstone workshops → Brent-gated (referenced from /workshops,
 *     so no placeholder lives in these Pages; noted here for traceability)
 *
 * Portable across DBs: the `featured-case-study` block references a caseStudy by
 * looking its slug up at seed time (IDs differ local vs staging).
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { config as loadEnv } from 'dotenv'
import type { Payload } from 'payload'

import { upsertBySlug } from '../upsert'
import {
  aiIntegrationLayout,
  digitalTransformationLayout,
  localshoringLayout,
  overviewLayout,
} from './layouts'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(HERE, '../../../../')

// Load env BEFORE importing payload.config (it reads PAYLOAD_SECRET / DATABASE_URL).
loadEnv({ path: path.join(REPO_ROOT, '.env.local') })
loadEnv({ path: path.join(REPO_ROOT, '.env') })

// Preferred featured case studies per page, by slug, with fallbacks if a DB
// doesn't carry them. The block requires a caseStudy id, so a page that wants a
// featured block but finds no candidate simply omits it (composed conditionally).
const FEATURED_CANDIDATES = {
  overview: ['endurance-lift', 'novamud', 'taurex', 'wellchecked', 'hogan'],
  digitalTransformation: ['novamud', 'hogan', 'endurance-lift', 'taurex', 'wellchecked'],
} as const

async function findCaseStudyId(
  payload: Payload,
  slugs: readonly string[],
): Promise<string | number | null> {
  for (const slug of slugs) {
    const found = await payload.find({
      collection: 'caseStudies',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const id = found.docs[0]?.id
    if (id != null) return id
  }
  return null
}

interface PageSpec {
  slug: string
  title: string
  seo: { metaTitle: string; metaDescription: string }
  layout: Array<Record<string, unknown>>
}

async function main(): Promise<number> {
  const dryRun = process.argv.includes('--dry-run')
  if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
    console.error('[services-seed] DATABASE_URL and PAYLOAD_SECRET must be set in .env.local')
    return 1
  }

  console.log('[services-seed] booting Payload…')
  const { getPayload } = await import('payload')
  const { default: configPromise } = await import('../../../payload.config')
  const payload = await getPayload({ config: await configPromise })

  const overviewFeatured = await findCaseStudyId(payload, FEATURED_CANDIDATES.overview)
  const dtFeatured = await findCaseStudyId(payload, FEATURED_CANDIDATES.digitalTransformation)
  if (!overviewFeatured)
    console.warn('[services-seed] no featured case study for /services overview')
  if (!dtFeatured) console.warn('[services-seed] no featured case study for digital-transformation')

  const pages: PageSpec[] = [
    {
      slug: 'service-overview',
      title: 'Services',
      seo: {
        metaTitle: 'Services',
        metaDescription:
          'Four ways SEQTEK helps: workshops, localshoring, AI integration, and digital transformation. One delivery model, senior US engineers.',
      },
      layout: overviewLayout({ featuredCaseStudyId: overviewFeatured }),
    },
    {
      slug: 'service-localshoring',
      title: 'Localshoring',
      seo: {
        metaTitle: 'Localshoring',
        metaDescription:
          'A senior US engineering team that plugs into your roadmap. Localshoring compared with nearshore and offshore, and when it is the right call.',
      },
      layout: localshoringLayout(),
    },
    {
      slug: 'service-ai-integration',
      title: 'AI Integration',
      seo: {
        metaTitle: 'AI Integration',
        metaDescription:
          'Where AI makes sense for your business and where it does not. A practical engagement that finds the real opportunities, not the hype.',
      },
      layout: aiIntegrationLayout(),
    },
    {
      slug: 'service-digital-transformation',
      title: 'Digital Transformation',
      seo: {
        metaTitle: 'Digital Transformation',
        metaDescription:
          'Custom software plus the change management to make it stick, including fractional product ownership. Delivery that survives go-live.',
      },
      layout: digitalTransformationLayout({ featuredCaseStudyId: dtFeatured }),
    },
  ]

  let created = 0
  let updated = 0
  for (const page of pages) {
    const result = await upsertBySlug({
      payload,
      collection: 'pages',
      slug: page.slug,
      data: {
        slug: page.slug,
        title: page.title,
        seo: page.seo,
        layout: page.layout as never,
        // Pages has drafts enabled, so `draft: false` alone does not publish a
        // NEW record — Payload defaults `_status` to 'draft'. Set it explicitly
        // (matches the showcase seed) so the public RenderBlocks routes, which
        // read the published version, see these immediately.
        _status: 'published',
      },
      dryRun,
      draft: false,
    })
    if (dryRun) {
      console.log(
        JSON.stringify({
          slug: page.slug,
          operation: result.operation,
          blockTypes: page.layout.map((b) => b.blockType),
        }),
      )
    } else {
      if (result.operation === 'create') created++
      if (result.operation === 'update') updated++
      console.log(
        `  ${result.operation === 'create' ? '+' : '~'} /${page.slug} (${result.operation})`,
      )
    }
  }

  console.log(
    dryRun
      ? `[services-seed] ${pages.length} pages planned (--dry-run, no writes)`
      : `[services-seed] done. created=${created} updated=${updated}`,
  )
  return 0
}

main()
  .then((c) => process.exit(c))
  .catch((err) => {
    console.error('[services-seed] failed:', err)
    process.exit(1)
  })
