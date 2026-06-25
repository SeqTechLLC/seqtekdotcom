/**
 * Remote loader for the four peer-offering Pages (feat/services-restructure).
 *
 * The companion `index.ts` seeds these Pages through the Payload **Local API**
 * against `DATABASE_URL` — which only works where the DB is reachable, i.e.
 * locally. Staging/prod have no direct DB access and CD does not seed content,
 * so this script does the SAME upserts over **REST** against a running instance
 * (the app writes via its own instance profile), mirroring
 * `tools/leonardo-images/push-staging.ts`.
 *
 *   IMPORT_BASE_URL=https://seqtek-preview.com IMPORT_TOKEN=<payload-token> \
 *     npm run seed:services:remote
 *   npm run seed:services:remote -- --dry-run   # lists intended actions; no token needed
 *
 * Single source of truth: the block JSON comes from `./layouts` — the same
 * definitions the Local-API seeder consumes. This file only changes the
 * *transport* (REST vs Local API) and the reference-resolution (slug → id over
 * REST, since IDs differ per env).
 *
 * Idempotent: each Page is upserted by slug (find-by-slug → create or update),
 * published via `_status: 'published'`. Re-running writes zero new rows.
 */
import { PayloadRestClient } from '../../../../tools/import-case-study/client'
import {
  aiIntegrationLayout,
  digitalTransformationLayout,
  localshoringLayout,
  overviewLayout,
} from './layouts'

// Preferred featured case studies per page, by slug, with fallbacks. Mirrors
// index.ts: the `featured-case-study` block requires a caseStudy id, so a page
// that wants one but finds no candidate simply omits the block.
const FEATURED_CANDIDATES = {
  overview: ['endurance-lift', 'novamud', 'taurex', 'wellchecked', 'hogan'],
  digitalTransformation: ['novamud', 'hogan', 'endurance-lift', 'taurex', 'wellchecked'],
} as const

type Block = Record<string, unknown> & { blockType: string }

interface PageSpec {
  slug: string
  title: string
  seo: { metaTitle: string; metaDescription: string }
  layout: Block[]
}

/** Resolve the first caseStudy slug that exists on the target, by slug → id. */
async function findCaseStudyId(
  client: PayloadRestClient,
  slugs: readonly string[],
): Promise<string | number | null> {
  for (const slug of slugs) {
    const id = await client.findIdByField('caseStudies', 'slug', slug, { draft: false })
    if (id !== null) return id
  }
  return null
}

function buildPages(opts: {
  overviewFeatured: string | number | null
  dtFeatured: string | number | null
}): PageSpec[] {
  return [
    {
      slug: 'service-overview',
      title: 'Services',
      seo: {
        metaTitle: 'Services',
        metaDescription:
          'Four ways SEQTEK helps: workshops, localshoring, AI integration, and digital transformation. One delivery model, senior US engineers.',
      },
      layout: overviewLayout({ featuredCaseStudyId: opts.overviewFeatured }),
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
      layout: digitalTransformationLayout({ featuredCaseStudyId: opts.dtFeatured }),
    },
  ]
}

async function main(): Promise<number> {
  const dryRun = process.argv.includes('--dry-run')
  const baseUrl = (process.env.IMPORT_BASE_URL ?? 'https://seqtek-preview.com').replace(/\/+$/, '')
  const token = process.env.IMPORT_TOKEN

  if (!token && !dryRun) {
    console.error(
      '[services-remote] IMPORT_TOKEN (your /admin payload-token JWT) is required to write.\n' +
        '  Re-run with --dry-run to preview intended actions without a token.',
    )
    return 1
  }

  console.log(`[services-remote] target: ${baseUrl} | ${dryRun ? 'DRY-RUN' : 'LIVE'}`)
  const client = new PayloadRestClient({ baseUrl, token })

  // Resolve featured case studies over REST. In a tokenless dry-run we cannot
  // hit the API, so fall back to the first candidate slug as a label-only stand-in
  // and note that the real id is resolved at write time.
  let overviewFeatured: string | number | null
  let dtFeatured: string | number | null
  if (dryRun && !token) {
    overviewFeatured = FEATURED_CANDIDATES.overview[0]
    dtFeatured = FEATURED_CANDIDATES.digitalTransformation[0]
    console.log(
      '[services-remote] (dry-run, no token) featured case-study ids resolved at write time;\n' +
        `  using candidate slugs as placeholders: overview="${overviewFeatured}", digital-transformation="${dtFeatured}"`,
    )
  } else {
    overviewFeatured = await findCaseStudyId(client, FEATURED_CANDIDATES.overview)
    dtFeatured = await findCaseStudyId(client, FEATURED_CANDIDATES.digitalTransformation)
    if (!overviewFeatured)
      console.warn('[services-remote] no featured case study for /services overview')
    if (!dtFeatured)
      console.warn('[services-remote] no featured case study for digital-transformation')
  }

  const pages = buildPages({ overviewFeatured, dtFeatured })

  let created = 0
  let updated = 0
  const errors: string[] = []

  for (const page of pages) {
    try {
      // In a tokenless dry-run we cannot query the target, so we cannot know
      // whether the page exists. Report the intent without an operation verb.
      let existingId: string | number | null = null
      let operation: 'create' | 'update' | 'unknown'
      if (dryRun && !token) {
        operation = 'unknown'
      } else {
        existingId = await client.findIdByField('pages', 'slug', page.slug, { draft: false })
        operation = existingId === null ? 'create' : 'update'
      }

      if (dryRun) {
        console.log(
          JSON.stringify({
            slug: page.slug,
            operation,
            blockTypes: page.layout.map((b) => b.blockType),
          }),
        )
        continue
      }

      const data = {
        slug: page.slug,
        title: page.title,
        seo: page.seo,
        layout: page.layout,
        // Pages has drafts enabled, so a NEW record defaults `_status` to
        // 'draft'. Set it explicitly (matches index.ts + the showcase seed)
        // so the public RenderBlocks routes, which read the published version,
        // see these immediately.
        _status: 'published',
      }

      if (existingId === null) {
        const id = await client.createDoc('pages', data, { draft: false })
        created++
        console.log(`  + /${page.slug} (create -> ${id})`)
      } else {
        const id = await client.updateDoc('pages', existingId, data, { draft: false })
        updated++
        console.log(`  ~ /${page.slug} (update -> ${id})`)
      }
    } catch (err) {
      const msg = (err as Error).message
      errors.push(`${page.slug}: ${msg}`)
      console.error(`  ✗ /${page.slug} FAILED: ${msg}`)
    }
  }

  if (dryRun) {
    console.log(`[services-remote] ${pages.length} pages planned (--dry-run, no writes)`)
    return 0
  }

  console.log(
    `[services-remote] done. created=${created} updated=${updated} errors=${errors.length}`,
  )
  for (const e of errors) console.error(`  ✗ ${e}`)
  return errors.length > 0 ? 5 : 0
}

main()
  .then((c) => process.exit(c))
  .catch((err) => {
    console.error('[services-remote] failed:', err)
    process.exit(1)
  })
