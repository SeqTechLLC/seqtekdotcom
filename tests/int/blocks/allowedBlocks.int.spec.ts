import { describe, expect, it } from 'vitest'

import { layoutBlocks } from '../../../src/payload/blocks/layout'

/**
 * The block list is pinned (docs/planning/block-consolidation.md). Every page,
 * current or new, composes from these. A new look is an option on one of them.
 *
 * Changing this list needs Kenn's sign-off: it is the one place a new block
 * can enter, so a diff here is the signal to push back.
 */
const ALLOWED = [
  'hero',
  'content',
  'media-text',
  'items',
  'cards',
  'image',
  'gallery',
  'quote',
  'cta',
  'table',
  'accordion',
  'embed',
  'hubspot-form',
]

describe('the layout block list', () => {
  it('is exactly the pinned set', () => {
    expect(layoutBlocks.map((b) => b.slug).sort()).toEqual([...ALLOWED].sort())
  })
})
