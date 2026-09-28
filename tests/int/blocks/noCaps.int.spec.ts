import { describe, expect, it } from 'vitest'

import { layoutBlocks } from '../../../src/payload/blocks/layout'
import { flattenBlock } from '../helpers/flattenFields'

/**
 * No block may cap its content (docs/planning/block-consolidation.md). A cap
 * turns a content change into a code change: seven CADENCE principles against
 * a six-step maximum is the case that set the rule. A layout that degrades
 * past N items handles N instead.
 *
 * `minRows` of 1 is allowed: it is how a required array says "not empty".
 */
describe('layout blocks carry no numeric caps', () => {
  for (const block of layoutBlocks) {
    it(block.slug, () => {
      const caps = flattenBlock(block).flatMap(({ path, field }) => {
        const f = field as Record<string, unknown>
        const found: string[] = []
        for (const key of ['maxRows', 'maxLength', 'max'] as const) {
          if (f[key] !== undefined) found.push(`${path}.${key}=${String(f[key])}`)
        }
        if (typeof f.minRows === 'number' && f.minRows > 1)
          found.push(`${path}.minRows=${f.minRows}`)
        return found
      })
      expect(caps).toEqual([])
    })
  }
})
