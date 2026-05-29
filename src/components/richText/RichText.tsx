import type { ComponentType, ReactElement } from 'react'
import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react'
import type {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedInlineBlockNode,
} from '@payloadcms/richtext-lexical'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { Prose } from '../ui/Prose'
import { defaultInlineRegistry } from './inline/registry'

interface RichTextProps {
  data: SerializedEditorState | null | undefined
  /** Override the default inline-block registry; falls back to defaultInlineRegistry. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inlineRegistry?: Record<string, ComponentType<any>>
  /** Wrap output in `<Prose>` (default: true). */
  withProse?: boolean
}

type NodeWithBlocks =
  | DefaultNodeTypes
  | SerializedBlockNode<{ blockType: string; [key: string]: unknown }>
  | SerializedInlineBlockNode<{ blockType: string; [key: string]: unknown }>

const warnUnknown = (blockType: string): void => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`Unknown inline blockType: ${blockType}`)
  }
}

/**
 * Lexical → JSX converter with inline-block dispatch (contract:
 * specs/003-phase-2-content-models/contracts/inline-block-converter.md).
 *
 * Empty input → null. Plain text → semantic JSX inside `<Prose>`.
 * Block / inlineBlock nodes look up the registry; unknown types emit a single
 * dev warning and skip the node (matches RenderBlocks behaviour).
 */
export function RichText({
  data,
  inlineRegistry = defaultInlineRegistry,
  withProse = true,
}: RichTextProps): ReactElement | null {
  if (!data) return null

  const root = (data as { root?: { children?: unknown[] } }).root
  if (!root || !Array.isArray(root.children) || root.children.length === 0) return null

  const converters: Record<string, (args: { node: NodeWithBlocks }) => ReactElement | null> = {
    block: ({ node }) => {
      const blockNode = node as SerializedBlockNode<{ blockType: string }>
      const Comp = inlineRegistry[blockNode.fields.blockType]
      if (!Comp) {
        warnUnknown(blockNode.fields.blockType)
        return null
      }
      return <Comp {...(blockNode.fields as unknown as Record<string, unknown>)} />
    },
    inlineBlock: ({ node }) => {
      const blockNode = node as SerializedInlineBlockNode<{ blockType: string }>
      const Comp = inlineRegistry[blockNode.fields.blockType]
      if (!Comp) {
        warnUnknown(blockNode.fields.blockType)
        return null
      }
      return (
        <span>
          <Comp {...(blockNode.fields as unknown as Record<string, unknown>)} />
        </span>
      )
    },
  }

  const body = (
    <PayloadRichText
      data={data}
      converters={({ defaultConverters }) => ({ ...defaultConverters, ...converters })}
    />
  )

  return withProse ? <Prose>{body}</Prose> : body
}
