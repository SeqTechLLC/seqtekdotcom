/**
 * Showcase seed — creates one Page per layout block (every variant stacked)
 * plus one Page per block category (first variant of every block in the
 * category). Idempotent: pages and media with the `showcase-` slug/filename
 * prefix are deleted and re-created on each run.
 *
 * Usage: `npm run seed:showcase`
 * Reads DATABASE_URL + PAYLOAD_SECRET from .env.local.
 */
import { config as loadEnv } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import type { getPayload as GetPayload } from 'payload'

import { generatePlaceholders, type PlaceholderBuffer } from './placeholders'
import { type BlockFixture, type MediaIdMap, getBlockFixtures } from './fixtures'
import { clearSupportingDocs, seedSupportingDocs } from './supportingDocs'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const repoRoot = path.resolve(dirname, '../../../../')

// Must run before any module evaluates `process.env.PAYLOAD_SECRET` /
// `DATABASE_URL` — i.e. before importing `payload` or `src/payload.config.ts`.
loadEnv({ path: path.join(repoRoot, '.env.local') })
loadEnv({ path: path.join(repoRoot, '.env') })

const SHOWCASE_PAGE_PREFIX = 'showcase-'
const SHOWCASE_MEDIA_PREFIX = 'showcase-'

async function clearExisting(payload: Awaited<ReturnType<typeof GetPayload>>): Promise<void> {
  // Order matters — supporting docs reference media via FK, so they must
  // go first. Pages reference media via JSON in `layout` (no FK), so the
  // order between pages and supporting docs is flexible.
  const deletedPages = await payload.delete({
    collection: 'pages',
    where: { slug: { like: `${SHOWCASE_PAGE_PREFIX}%` } },
    overrideAccess: true,
  })
  await clearSupportingDocs(payload)
  const deletedMedia = await payload.delete({
    collection: 'media',
    where: { filename: { like: `${SHOWCASE_MEDIA_PREFIX}%` } },
    overrideAccess: true,
  })
  console.log(
    `  cleared ${deletedPages.docs.length} showcase pages + ${deletedMedia.docs.length} showcase media + supporting docs`,
  )
}

async function upsertPlaceholderMedia(
  payload: Awaited<ReturnType<typeof GetPayload>>,
  placeholders: PlaceholderBuffer[],
): Promise<MediaIdMap> {
  const map: Record<string, string | number> = {}
  for (const p of placeholders) {
    const created = await payload.create({
      collection: 'media',
      data: { alt: p.alt },
      file: {
        data: p.buffer,
        mimetype: p.mimeType,
        name: p.filename,
        size: p.buffer.length,
      },
      overrideAccess: true,
    })
    // Filename → role mapping by convention.
    const role = p.filename.replace(/^showcase-/, '').replace(/\.png$/, '')
    map[role] = created.id
  }
  for (const key of ['photo', 'screenshot', 'logo', 'illustration'] as const) {
    if (!(key in map)) throw new Error(`[showcase-seed] missing placeholder for ${key}`)
  }
  return map as unknown as MediaIdMap
}

interface PageInput {
  slug: string
  title: string
  layout: Array<Record<string, unknown>>
}

function buildPerBlockPages(fixtures: BlockFixture[]): PageInput[] {
  return fixtures.map((fx) => ({
    slug: `${SHOWCASE_PAGE_PREFIX}block-${fx.blockType}`,
    title: `[Showcase] block: ${fx.blockType}`,
    layout: fx.variants.map((v) => v.data),
  }))
}

function buildPerCategoryPages(fixtures: BlockFixture[]): PageInput[] {
  const byCategory = new Map<string, BlockFixture[]>()
  for (const fx of fixtures) {
    const list = byCategory.get(fx.category) ?? []
    list.push(fx)
    byCategory.set(fx.category, list)
  }
  return [...byCategory.entries()].map(([category, blocks]) => ({
    slug: `${SHOWCASE_PAGE_PREFIX}category-${category}`,
    title: `[Showcase] category: ${category}`,
    layout: blocks.map((fx) => fx.variants[0]!.data),
  }))
}

async function createPages(
  payload: Awaited<ReturnType<typeof GetPayload>>,
  pages: PageInput[],
): Promise<void> {
  for (const page of pages) {
    await payload.create({
      collection: 'pages',
      data: {
        title: page.title,
        slug: page.slug,
        _status: 'published',
        layout: page.layout as never,
      },
      overrideAccess: true,
    })
    console.log(`  + /showcase/${page.slug.replace(SHOWCASE_PAGE_PREFIX, '')}`)
  }
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
    console.error('[showcase-seed] DATABASE_URL and PAYLOAD_SECRET must be set in .env.local')
    process.exit(1)
  }

  console.log('[showcase-seed] booting Payload…')
  // Dynamic import so payload.config evaluates AFTER dotenv loads.
  const { getPayload } = await import('payload')
  const { default: configPromise } = await import('../../../payload.config')
  const payload = await getPayload({ config: await configPromise })

  console.log('[showcase-seed] clearing existing showcase records…')
  await clearExisting(payload)

  console.log('[showcase-seed] generating placeholder media…')
  const placeholders = await generatePlaceholders()
  const mediaIdMap = await upsertPlaceholderMedia(payload, placeholders)

  console.log('[showcase-seed] seeding supporting docs (testimonials, etc.)…')
  const supporting = await seedSupportingDocs(payload, mediaIdMap.photo)
  console.log(`  + ${supporting.testimonialIds.length} testimonials`)

  console.log('[showcase-seed] building fixtures…')
  const fixtures = getBlockFixtures(mediaIdMap, supporting)
  const perBlock = buildPerBlockPages(fixtures)
  const perCategory = buildPerCategoryPages(fixtures)

  console.log(
    `[showcase-seed] creating ${perBlock.length} per-block + ${perCategory.length} per-category pages…`,
  )
  await createPages(payload, perBlock)
  await createPages(payload, perCategory)

  console.log('[showcase-seed] done.')
  process.exit(0)
}

main().catch((err) => {
  console.error('[showcase-seed] failed:', err)
  process.exit(1)
})
