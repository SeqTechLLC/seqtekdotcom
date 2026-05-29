import { Fragment, type ReactElement } from 'react'

import { registry } from './registry'

interface BlockLike {
  blockType: string
  id?: string | null
  [key: string]: unknown
}

interface RenderBlocksProps {
  blocks: BlockLike[] | null | undefined
}

const warnedTypes = new Set<string>()

const warnUnknown = (blockType: string): void => {
  if (process.env.NODE_ENV === 'production') return
  if (warnedTypes.has(blockType)) return
  warnedTypes.add(blockType)
  console.warn(`Unknown blockType: ${blockType}`)
}

/**
 * Dispatches an array of saved Payload blocks to their registered React
 * renderer. Contract:
 * specs/003-phase-2-content-models/contracts/render-blocks.md (FR-010).
 *
 * - null/undefined/empty → no DOM, no warning.
 * - unknown blockType → silent in prod, single dev warning per render, skip.
 */
export function RenderBlocks({ blocks }: RenderBlocksProps): ReactElement {
  if (!blocks || blocks.length === 0) return <></>
  warnedTypes.clear()
  return (
    <>
      {blocks.map((block, index) => {
        const Component = registry[block.blockType]
        const key = block.id ?? `${block.blockType}-${index}`
        if (!Component) {
          warnUnknown(block.blockType)
          return <Fragment key={key} />
        }
        return <Component key={key} {...(block as Record<string, unknown>)} />
      })}
    </>
  )
}

export default RenderBlocks
