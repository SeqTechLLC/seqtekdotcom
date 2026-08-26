/**
 * Spec 011 US2 (FR-010, ADR 0011) — build the committed block-picker previews.
 *
 * Input:  tests/e2e/visual/screenshots/block-previews/<blockType>--<n>.png
 *         (gitignored; produced by `npm run visual:capture`)
 * Output: public/block-previews/<blockType>.webp  (committed)
 *
 * Payload draws a picker thumbnail into an `aspect-ratio: 3/2` box with
 * `object-fit: cover`, so anything that is not already 3:2 gets centre-cropped
 * by the browser. We therefore letterbox to exactly 480×320 here rather than
 * let the admin crop the block's content away. The letterbox colour is sampled
 * from the capture's own top-left pixel, so an inverse or accent block keeps
 * its background instead of sitting on a white slab.
 *
 * Usage: npm run block:thumbnails [-- --check]
 *   --check  verify the committed set against the budget without writing
 */
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { layoutBlocks } from '../../src/payload/blocks/layout'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(dirname, '../..')
const CAPTURE_DIR = path.join(repoRoot, 'tests/e2e/visual/screenshots/block-previews')
const OUT_DIR = path.join(repoRoot, 'public/block-previews')

/** Payload's documented preferred thumbnail ratio (3:2). */
const WIDTH = 480
const HEIGHT = 320
const QUALITY = 78

/**
 * Total committed budget for the raster previews, spec 011 Technical Context.
 * Measured basis: WebP q78 at 480px averages well under 10 KB per block.
 */
const BUDGET_BYTES = 400 * 1024

/**
 * Blocks whose first variant is not the one an editor should be shown. Keyed
 * by block slug → variant index in the showcase fixtures. Every entry here was
 * decided by looking at the captures, not by reading the fixture source.
 */
const PREVIEW_VARIANT: Record<string, number> = {}

/**
 * Blocks that render nothing in isolation (a third-party embed with no
 * credentials, a collection query with no seeded rows). They ship a
 * hand-authored SVG wireframe instead; a screenshot of an empty box would be
 * worse than no preview at all.
 */
const HAND_AUTHORED = new Set<string>([
  // Renders a facade around a REMOTE YouTube poster frame. The capture is
  // non-deterministic (it failed outright on one run) and would commit a third
  // party's video still into a public repository. Drawn instead.
  'video-embed',
])

interface Result {
  slug: string
  bytes: number
  source: 'capture' | 'svg'
}

async function findCapture(slug: string): Promise<string | null> {
  const preferred = PREVIEW_VARIANT[slug] ?? 0
  const candidates = [preferred, 0, 1, 2].filter((v, i, a) => a.indexOf(v) === i)
  for (const variant of candidates) {
    const file = path.join(CAPTURE_DIR, `${slug}--${variant}.png`)
    try {
      await fs.access(file)
      return file
    } catch {
      // try the next variant
    }
  }
  return null
}

/** Top-left pixel of the capture — the block's own background. */
async function letterboxColour(file: string): Promise<{ r: number; g: number; b: number }> {
  const { data } = await sharp(file)
    .extract({ left: 0, top: 0, width: 1, height: 1 })
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { r: data[0], g: data[1], b: data[2] }
}

async function build(slug: string): Promise<Result | null> {
  const source = await findCapture(slug)
  if (!source) return null
  const background = await letterboxColour(source)
  const out = path.join(OUT_DIR, `${slug}.webp`)
  await sharp(source)
    .resize(WIDTH, HEIGHT, { fit: 'contain', background, withoutEnlargement: false })
    .webp({ quality: QUALITY })
    .toFile(out)
  const { size } = await fs.stat(out)
  return { slug, bytes: size, source: 'capture' }
}

async function main(): Promise<void> {
  const checkOnly = process.argv.includes('--check')
  await fs.mkdir(OUT_DIR, { recursive: true })

  const slugs = layoutBlocks.map((b) => b.slug)
  const built: Result[] = []
  const missing: string[] = []

  for (const slug of slugs) {
    if (HAND_AUTHORED.has(slug)) {
      const svg = path.join(OUT_DIR, `${slug}.svg`)
      try {
        const { size } = await fs.stat(svg)
        built.push({ slug, bytes: size, source: 'svg' })
      } catch {
        missing.push(`${slug} (expected hand-authored ${slug}.svg)`)
      }
      continue
    }

    if (checkOnly) {
      const webp = path.join(OUT_DIR, `${slug}.webp`)
      try {
        const { size } = await fs.stat(webp)
        built.push({ slug, bytes: size, source: 'capture' })
      } catch {
        missing.push(slug)
      }
      continue
    }

    const result = await build(slug)
    if (result) built.push(result)
    else
      missing.push(`${slug} (no capture at ${path.relative(repoRoot, CAPTURE_DIR)}/${slug}--*.png)`)
  }

  const total = built.reduce((sum, r) => sum + r.bytes, 0)
  const largest = [...built].sort((a, b) => b.bytes - a.bytes).slice(0, 5)

  console.log(`${checkOnly ? 'checked' : 'built'} ${built.length}/${slugs.length} previews`)
  console.log(`total ${(total / 1024).toFixed(1)} KB of a ${BUDGET_BYTES / 1024} KB budget`)
  console.log('largest:')
  for (const r of largest) {
    console.log(
      `  ${(r.bytes / 1024).toFixed(1).padStart(6)} KB  ${r.slug}${r.source === 'svg' ? ' (svg)' : ''}`,
    )
  }

  if (missing.length > 0) {
    console.log(`\nskipped ${missing.length}:`)
    for (const m of missing) console.log(`  - ${m}`)
  }

  if (total > BUDGET_BYTES) {
    console.error(
      `\nFAIL: committed previews total ${(total / 1024).toFixed(1)} KB, over the ${BUDGET_BYTES / 1024} KB budget.`,
    )
    process.exit(1)
  }
  if (missing.length > 0) {
    console.error(`\nFAIL: ${missing.length} block(s) have no preview.`)
    process.exit(1)
  }
}

await main()
