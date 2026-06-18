import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { render } from '@testing-library/react'
import type { Block, CollectionConfig, Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { CaseStudies } from '../../../src/collections/CaseStudies'
import { Pages } from '../../../src/collections/Pages'
import { Workshops } from '../../../src/collections/Workshops'
import { RenderBlocks } from '../../../src/components/sections/RenderBlocks'
import { registry } from '../../../src/components/sections/registry'
import { Gallery as GalleryBlock } from '../../../src/payload/blocks/layout/Gallery'
import { layoutBlocks } from '../../../src/payload/blocks/layout'

/**
 * spec 010 US4 / T061 — the single code path (ADR 0009 / FR-011).
 *
 * Adding a block type is the ONE legitimate code path; once a block lands it is
 * usable on every page type with no per-type code. `gallery` (a Phase-2 gap-fill
 * block, the worked example for the curation loop) is the proof case: this test
 * pins that one block definition + one shared renderer serves page, case study,
 * and workshop identically — break the reuse anywhere and a leg of this fails.
 *
 * Three legs:
 *   1. Schema reuse — `gallery` is in each collection's `layout` blocks because
 *      they all spread the SAME `layoutBlocks` array (one definition, no copies).
 *   2. Render reuse — the SAME `RenderBlocks` dispatcher renders the gallery
 *      identically regardless of which page type the layout came from.
 *   3. No per-type code — one registry entry resolves `gallery`, and every
 *      migrated detail route hands its whole `layout` to RenderBlocks rather
 *      than branching per block type.
 */

const TYPES: Array<[label: string, collection: CollectionConfig]> = [
  ['page', Pages],
  ['case study', CaseStudies],
  ['workshop', Workshops],
]

/** The block slugs a collection's `layout` field accepts. */
function layoutBlockSlugs(collection: CollectionConfig): string[] {
  const field = collection.fields.find(
    (f: Field): f is Extract<Field, { type: 'blocks' }> =>
      'name' in f && f.name === 'layout' && f.type === 'blocks',
  )
  if (!field) throw new Error(`${String(collection.slug)} has no \`layout\` blocks field`)
  return (field.blocks ?? []).map((b: Block) => b.slug)
}

const media = (url: string, alt = 'A photo') => ({ url, alt })

// An identical gallery block — the same authored content for every page type.
const galleryBlock = {
  blockType: 'gallery',
  heading: 'Proof',
  layout: 'grid',
  columns: '2',
  items: [
    { image: media('/g/1.jpg'), caption: 'One' },
    { image: media('/g/2.jpg'), caption: 'Two' },
  ],
}

describe('block reuse across page types (ADR 0009 — one code path)', () => {
  it('there is exactly ONE `gallery` block definition (shared, not per-type)', () => {
    const galleryDefs = layoutBlocks.filter((b) => b.slug === 'gallery')
    expect(galleryDefs).toHaveLength(1)
    // The single definition is the one exported block object.
    expect(galleryDefs[0]).toBe(GalleryBlock)
  })

  it('one registry entry resolves the `gallery` slug for every consumer', () => {
    const galleryEntries = Object.entries(registry).filter(([slug]) => slug === 'gallery')
    expect(galleryEntries).toHaveLength(1)
    expect(registry.gallery).toBeDefined()
  })

  it.each(TYPES)(
    '%s `layout` accepts `gallery` via the shared layoutBlocks',
    (_label, collection) => {
      // Schema reuse: same block object reachable from this collection's layout.
      expect(layoutBlockSlugs(collection)).toContain('gallery')
      const field = collection.fields.find(
        (f: Field): f is Extract<Field, { type: 'blocks' }> =>
          'name' in f && f.name === 'layout' && f.type === 'blocks',
      )
      expect(field?.blocks).toContain(GalleryBlock)
    },
  )

  // Render reuse: the gallery renders the same DOM through the one dispatcher,
  // no matter which page type's layout it sits in.
  const renderedHtml: string[] = []

  it.each(TYPES)('%s renders `gallery` through the shared RenderBlocks', (_label, collection) => {
    // Guard: only assert render-reuse for types that actually allow the block.
    expect(layoutBlockSlugs(collection)).toContain('gallery')
    const { container } = render(<RenderBlocks blocks={[galleryBlock]} />)
    expect(container.querySelectorAll('img')).toHaveLength(2)
    expect(container.textContent).toContain('Proof')
    renderedHtml.push(container.innerHTML)
  })

  it('produces byte-identical output for every page type (renderer is type-agnostic)', () => {
    expect(renderedHtml).toHaveLength(TYPES.length)
    const [first, ...rest] = renderedHtml
    for (const html of rest) expect(html).toBe(first)
  })

  it.each([
    ['workshops', 'src/app/(frontend)/workshops/[slug]/page.tsx'],
    ['case-studies', 'src/app/(frontend)/case-studies/[slug]/page.tsx'],
    ['team', 'src/app/(frontend)/team/[slug]/page.tsx'],
    ['pages', 'src/app/(frontend)/[slug]/page.tsx'],
  ])(
    'the %s detail route delegates its whole layout to RenderBlocks (no per-type block code)',
    (_label, routePath) => {
      const src = readFileSync(resolve(process.cwd(), routePath), 'utf8')
      expect(src).toContain('<RenderBlocks blocks={layout}')
    },
  )
})
