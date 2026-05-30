import { describe, expect, it } from 'vitest'

import * as layoutExports from '../../../src/payload/blocks/layout'
import { registry } from '../../../src/components/sections/registry'

// Per contract render-blocks.md: every layout block exported from
// src/payload/blocks/layout/index.ts MUST have an entry in
// src/components/sections/registry.ts so the dispatcher never falls back
// to the unknown-type branch for first-party content.
describe('layout block registry coverage', () => {
  // Drop the named-array export; we only iterate the per-block configs.
  const blockExports = Object.entries(layoutExports).filter(
    ([key]) => key !== 'layoutBlocks',
  ) as Array<[string, { slug: string }]>

  it.each(blockExports)('%s has a registry entry for its slug', (_name, block) => {
    expect(block.slug).toBeDefined()
    expect(registry[block.slug], `missing registry entry for slug "${block.slug}"`).toBeDefined()
  })

  it('no orphan registry entries (every registry key maps to a layout export)', () => {
    const exportedSlugs = new Set(blockExports.map(([, b]) => b.slug))
    const orphans = Object.keys(registry).filter((slug) => !exportedSlugs.has(slug))
    expect(orphans).toEqual([])
  })
})
