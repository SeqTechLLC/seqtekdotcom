// @vitest-environment node
import { promises as fs } from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

import {
  blockCategoryFromGroupLabel,
  BLOCK_CATEGORIES,
  BLOCK_CATEGORY_LABELS,
} from '../../src/payload/blocks/categories'
import { richTextBlocks, richTextInlineBlocks } from '../../src/payload/blocks/inline'
import { layoutBlocks } from '../../src/payload/blocks/layout'

/**
 * Spec 011 US2 — contracts/admin-metadata.md C1 and C2.
 *
 * These are pure config assertions plus a stat() of the committed preview
 * files: no browser, no database, no capture run (FR-013). What they defend is
 * that a block added in six months still arrives with a category, a preview,
 * and a name an editor can tell apart from its neighbours — the three things
 * Payload's picker actually renders.
 *
 * The contract's original `admin.description` clause is retired: Payload has
 * no such property and no place to draw it. See the amendment in
 * contracts/admin-metadata.md C1 for the evidence, and FR-011 in spec.md.
 */
const PUBLIC_DIR = path.resolve(import.meta.dirname, '../../public')

/** spec 011 Technical Context — the committed raster budget. */
const PREVIEW_BUDGET_BYTES = 400 * 1024

type ThumbnailImage = { url: string; alt?: string } | string | undefined

function imageUrl(image: ThumbnailImage): string | undefined {
  if (!image) return undefined
  return typeof image === 'string' ? image : image.url
}

function imageAlt(image: ThumbnailImage): string | undefined {
  if (!image || typeof image === 'string') return undefined
  return image.alt
}

function publicPathFor(url: string): string {
  return path.join(PUBLIC_DIR, url.replace(/^\//, ''))
}

/**
 * The two pickers, each checked against its own population. A label only has
 * to be distinguishable from the labels an editor sees beside it.
 */
const PICKERS = [
  { name: 'layout block drawer', blocks: [...layoutBlocks] },
  { name: 'rich-text insertion menu', blocks: [...richTextBlocks, ...richTextInlineBlocks] },
] as const

describe('C1 — every layout block declares its identity', () => {
  it.each(layoutBlocks.map((b) => [b.slug, b] as const))(
    '%s declares a known category on admin.group',
    (slug, block) => {
      expect(block.admin?.group, `${slug} has no admin.group`).toBeDefined()
      expect(
        blockCategoryFromGroupLabel(block.admin?.group),
        `${slug}: admin.group "${String(block.admin?.group)}" is not a BLOCK_CATEGORY_LABELS heading`,
      ).not.toBeNull()
    },
  )

  it.each(layoutBlocks.map((b) => [b.slug, b] as const))(
    '%s hides the unused blockName field',
    (slug, block) => {
      expect(block.admin?.disableBlockName, `${slug} must set admin.disableBlockName`).toBe(true)
    },
  )

  it.each(layoutBlocks.map((b) => [b.slug, b] as const))(
    '%s declares a thumbnail with alt text',
    (slug, block) => {
      const thumbnail = block.admin?.images?.thumbnail as ThumbnailImage
      expect(imageUrl(thumbnail), `${slug} has no admin.images.thumbnail.url`).toBeTruthy()
      expect(imageAlt(thumbnail), `${slug}'s thumbnail needs alt text`).toBeTruthy()
    },
  )

  it('every thumbnail resolves to a committed file under public/', async () => {
    const missing: string[] = []
    for (const block of layoutBlocks) {
      const url = imageUrl(block.admin?.images?.thumbnail as ThumbnailImage)
      if (!url) continue
      try {
        await fs.access(publicPathFor(url))
      } catch {
        missing.push(`${block.slug} -> ${url}`)
      }
    }
    expect(missing, 'run `npm run block:thumbnails` (see quickstart.md)').toEqual([])
  })

  it('no two blocks share a thumbnail', () => {
    const seen = new Map<string, string>()
    const collisions: string[] = []
    for (const block of layoutBlocks) {
      const url = imageUrl(block.admin?.images?.thumbnail as ThumbnailImage)
      if (!url) continue
      const previous = seen.get(url)
      if (previous) collisions.push(`${previous} and ${block.slug} both use ${url}`)
      else seen.set(url, block.slug)
    }
    expect(collisions).toEqual([])
  })

  it('the committed preview set stays within budget', async () => {
    let total = 0
    for (const block of layoutBlocks) {
      const url = imageUrl(block.admin?.images?.thumbnail as ThumbnailImage)
      if (!url) continue
      total += (await fs.stat(publicPathFor(url))).size
    }
    expect(
      total,
      `previews total ${(total / 1024).toFixed(1)} KB, budget is ${PREVIEW_BUDGET_BYTES / 1024} KB`,
    ).toBeLessThanOrEqual(PREVIEW_BUDGET_BYTES)
  })

  it('public/block-previews holds no orphan files', async () => {
    const referenced = new Set(
      layoutBlocks
        .map((b) => imageUrl(b.admin?.images?.thumbnail as ThumbnailImage))
        .filter((url): url is string => Boolean(url))
        .map((url) => path.basename(url)),
    )
    const onDisk = (
      await fs.readdir(path.join(PUBLIC_DIR, 'block-previews'), {
        withFileTypes: true,
      })
    )
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
    expect(
      onDisk.filter((name) => !referenced.has(name)),
      'a preview whose block was renamed or deleted — remove the file',
    ).toEqual([])
  })
})

describe('C2 — every rich-text block declares an icon', () => {
  const inlineBlocks = [...richTextBlocks, ...richTextInlineBlocks]

  it.each(inlineBlocks.map((b) => [b.slug, b] as const))(
    '%s declares a 20x20 icon with alt text',
    (slug, block) => {
      const icon = block.admin?.images?.icon as ThumbnailImage
      expect(imageUrl(icon), `${slug} has no admin.images.icon.url`).toBeTruthy()
      expect(imageAlt(icon), `${slug}'s icon needs alt text`).toBeTruthy()
    },
  )

  it('every icon resolves to a committed file under public/', async () => {
    const missing: string[] = []
    for (const block of inlineBlocks) {
      const url = imageUrl(block.admin?.images?.icon as ThumbnailImage)
      if (!url) continue
      try {
        await fs.access(publicPathFor(url))
      } catch {
        missing.push(`${block.slug} -> ${url}`)
      }
    }
    expect(missing).toEqual([])
  })
})

describe('C1 — labels disambiguate within their own picker', () => {
  // This is what carries FR-011 now that admin.description is off the table:
  // labels.singular is the only text the picker draws and the only text its
  // search matches, so "similar names must be disambiguated" has to be a rule
  // about labels. Bare `Hero` beside `Case study hero` is the motivating case.
  it.each(PICKERS.map((p) => [p.name, p.blocks] as const))(
    'no duplicate labels in the %s',
    (_name, blocks) => {
      const seen = new Map<string, string>()
      const duplicates: string[] = []
      for (const block of blocks) {
        const label = String(block.labels?.singular ?? '')
        const previous = seen.get(label)
        if (previous) duplicates.push(`${previous} and ${block.slug} are both labelled "${label}"`)
        else seen.set(label, block.slug)
      }
      expect(duplicates).toEqual([])
    },
  )

  it.each(PICKERS.map((p) => [p.name, p.blocks] as const))(
    'no label is a substring of another in the %s',
    (_name, blocks) => {
      const labels = blocks.map((b) => ({
        slug: b.slug,
        label: String(b.labels?.singular ?? ''),
      }))
      const ambiguous: string[] = []
      for (const a of labels) {
        for (const b of labels) {
          if (a.slug === b.slug) continue
          if (b.label.toLowerCase().includes(a.label.toLowerCase())) {
            ambiguous.push(
              `"${a.label}" (${a.slug}) is contained in "${b.label}" (${b.slug}) — qualify it`,
            )
          }
        }
      }
      expect(ambiguous).toEqual([])
    },
  )
})

describe('the picker draws categories in the declared order', () => {
  // Payload's BlockSelector groups by first encounter while iterating the
  // blocks array, so the picker's heading order IS the registration order.
  // BLOCK_CATEGORIES documents that order as load-bearing ("what starts a page"
  // through "what you reach for occasionally"); this is what makes that true
  // rather than aspirational, and what catches a block appended to the wrong
  // run of the array.
  it('layoutBlocks is sorted by BLOCK_CATEGORIES', () => {
    const encountered: string[] = []
    for (const block of layoutBlocks) {
      const category = blockCategoryFromGroupLabel(block.admin?.group)
      if (category && encountered.at(-1) !== category) encountered.push(category)
    }
    const expected = BLOCK_CATEGORIES.filter((category) => encountered.includes(category))
    expect(encountered, 'a block sits outside its category run in layout/index.ts').toEqual(
      expected,
    )
  })
})

describe('the category taxonomy', () => {
  it('has unique headings, so admin.group can be inverted back to a category', () => {
    const labels = Object.values(BLOCK_CATEGORY_LABELS)
    expect(new Set(labels).size).toBe(labels.length)
  })
})
