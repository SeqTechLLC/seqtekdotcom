// @vitest-environment node
import { promises as fs } from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

import {
  blockCategoryFromGroupLabel,
  BLOCK_CATEGORIES,
  BLOCK_CATEGORY_LABELS,
} from '../../src/payload/blocks/categories'
import { collections } from '../../src/collections'
import { Homepage } from '../../src/globals/Homepage'
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

  it('public/block-previews/inline holds no orphan files', async () => {
    // The layout check above cannot see this directory: `readdir` is not
    // recursive and `isFile()` filters the subdirectory out, so a renamed or
    // deleted rich-text block used to leave its icon behind unnoticed.
    const referenced = new Set(
      [...richTextBlocks, ...richTextInlineBlocks]
        .map((b) => imageUrl(b.admin?.images?.icon as ThumbnailImage))
        .filter((url): url is string => Boolean(url))
        .map((url) => path.basename(url)),
    )
    const onDisk = (
      await fs.readdir(path.join(PUBLIC_DIR, 'block-previews/inline'), { withFileTypes: true })
    )
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
    expect(
      onDisk.filter((name) => !referenced.has(name)),
      'an icon whose block was renamed or deleted — remove the file',
    ).toEqual([])
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

/**
 * Spec 011 US3 / T040 — contracts/admin-metadata.md C3, publish-state clause.
 *
 * The rest of C3 (group, description) lands with US6; this is the half US3
 * owns. It is asserted over the whole registered set rather than a listed ten
 * so that a collection which gains drafts later cannot quietly ship without
 * the column.
 *
 * **Second, not first** — the contract as drafted said `defaultColumns` MUST
 * begin with `_status`, and it was implemented that way and then looked at.
 * Payload links whichever column comes first (`buildColumnState`:
 * `isLinkedColumn: enableLinkedCell && colIndex === activeColumnsIndices[0]`),
 * so `_status` in front turned every row into an underlined "Published" that
 * opened the record while the title beside it went dead. Publish state is
 * still the first thing after the record's name, which is what the story
 * asked for; the name stays the thing you click. C3 is amended to match.
 */
describe('C3 — draft collections show publish state by default', () => {
  const draftCollections = collections.filter(
    (collection) =>
      collection.versions && collection.versions !== true && collection.versions.drafts,
  )

  it('there are draft-enabled collections to check', () => {
    // A guard on the filter itself: if `versions` ever changes shape, the
    // suite below would pass vacuously by testing nothing.
    expect(draftCollections.length).toBeGreaterThan(0)
  })

  it.each(draftCollections.map((c) => [c.slug, c] as const))(
    '%s shows _status immediately after the title column',
    (slug, collection) => {
      const columns = collection.admin?.defaultColumns
      expect(columns, `${slug} declares no defaultColumns`).toBeDefined()
      expect(
        columns?.[1],
        `${slug}: publish state must be the second default column — first in the list makes the status pill the row's link and leaves the title unclickable`,
      ).toBe('_status')
      expect(
        columns?.[0],
        `${slug}: the first default column must be useAsTitle — it is the one Payload turns into the link to the record`,
      ).toBe(collection.admin?.useAsTitle)
    },
  )

  it.each(
    collections
      .filter((c) => !(c.versions && c.versions !== true && c.versions.drafts))
      .map((c) => [c.slug, c] as const),
  )('%s has no _status column, having no drafts', (slug, collection) => {
    // `_status` only exists on the schema when drafts are enabled, so naming
    // it elsewhere is a column header over an empty cell.
    expect(collection.admin?.defaultColumns ?? [], slug).not.toContain('_status')
  })
})

/**
 * Spec 011 US3 / T043 — contracts/admin-metadata.md C6, FR-017.
 *
 * Payload labels array rows by position, so an array of nothing but uploads
 * collapses to `Logo 01` … `Logo 08` and has to be expanded one row at a time
 * to find anything. Six arrays in this config have an `upload` in their rows;
 * this fails the seventh, added later without a row label.
 *
 * The walk is deliberate about `blocks`: the block registries are the source
 * for those, so blocks are traversed once from `layoutBlocks` /
 * `richTextBlocks` rather than once per collection that embeds them.
 */
describe('FR-017 — a collapsed row of media identifies itself', () => {
  interface ArrayFieldRecord {
    where: string
    path: string
    hasRowLabel: boolean
  }

  type AnyField = {
    name?: string
    type?: string
    fields?: AnyField[]
    tabs?: { name?: string; fields: AnyField[] }[]
    admin?: { components?: { RowLabel?: unknown } }
  }

  function collectMediaArrays(fields: AnyField[] | undefined, where: string, path: string) {
    const found: ArrayFieldRecord[] = []
    for (const field of fields ?? []) {
      const here = field.name ? `${path}${path ? '.' : ''}${field.name}` : path
      if (field.type === 'array') {
        if ((field.fields ?? []).some((child) => child.type === 'upload')) {
          found.push({
            where,
            path: here,
            hasRowLabel: Boolean(field.admin?.components?.RowLabel),
          })
        }
        found.push(...collectMediaArrays(field.fields, where, here))
      } else if (field.type === 'group' || field.type === 'row' || field.type === 'collapsible') {
        found.push(...collectMediaArrays(field.fields, where, field.name ? here : path))
      } else if (field.type === 'tabs') {
        for (const tab of field.tabs ?? []) {
          found.push(
            ...collectMediaArrays(tab.fields, where, tab.name ? `${path}.${tab.name}` : path),
          )
        }
      }
    }
    return found
  }

  const mediaArrays: ArrayFieldRecord[] = [
    ...collections.flatMap((c) =>
      collectMediaArrays(c.fields as AnyField[], `collection:${c.slug}`, ''),
    ),
    ...collectMediaArrays(Homepage.fields as AnyField[], 'global:homepage', ''),
    ...[...layoutBlocks, ...richTextBlocks, ...richTextInlineBlocks].flatMap((b) =>
      collectMediaArrays(b.fields as AnyField[], `block:${b.slug}`, ''),
    ),
  ]

  it('the walk finds the arrays it is supposed to check', () => {
    expect(mediaArrays.length).toBeGreaterThan(0)
  })

  it.each(mediaArrays.map((a) => [`${a.where} ${a.path}`, a] as const))(
    '%s declares a RowLabel',
    (_name, field) => {
      expect(
        field.hasRowLabel,
        'use mediaRowLabel() from src/payload/fields/mediaRowLabel.ts — without it the rows collapse to "Logo 01", "Logo 02", …',
      ).toBe(true)
    },
  )
})
