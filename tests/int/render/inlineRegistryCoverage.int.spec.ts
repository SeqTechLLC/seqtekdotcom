import { describe, expect, it } from 'vitest'

import * as inlineExports from '../../../src/payload/blocks/inline'
import { defaultInlineRegistry } from '../../../src/components/richText/inline/registry'

// Per contract inline-block-converter.md: every inline block exported from
// src/payload/blocks/inline/index.ts MUST have an entry in defaultInlineRegistry
// so RichText never falls back to the unknown-type branch on first-party
// inline content.
describe('inline block registry coverage', () => {
  const inlineBlockExports = Object.entries(inlineExports).filter(
    ([key]) => key !== 'richTextBlocks' && key !== 'richTextInlineBlocks',
  ) as Array<[string, { slug: string }]>

  it.each(inlineBlockExports)('%s has a defaultInlineRegistry entry', (_name, block) => {
    expect(block.slug).toBeDefined()
    expect(
      defaultInlineRegistry[block.slug],
      `missing defaultInlineRegistry entry for slug "${block.slug}"`,
    ).toBeDefined()
  })

  it('no orphan defaultInlineRegistry entries', () => {
    const exportedSlugs = new Set(inlineBlockExports.map(([, b]) => b.slug))
    const orphans = Object.keys(defaultInlineRegistry).filter((slug) => !exportedSlugs.has(slug))
    expect(orphans).toEqual([])
  })
})
