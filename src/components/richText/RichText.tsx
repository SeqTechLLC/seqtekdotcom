import type { ComponentType, ReactElement } from 'react'
import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react'
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

type BlockNodeLike = { fields: { blockType: string; [key: string]: unknown } }

// Payload's Lexical JSX converter dispatches block / inlineBlock nodes via
// nested per-blockType maps (`converters.blocks[slug]`, `converters.inlineBlocks[slug]`).
// The top-level `block` / `inlineBlock` keys are explicitly excluded from
// the JSXConverters type, so we MUST build a per-slug map for each side
// or the registry is silently ignored.
const buildBlockMap = (
  registry: Record<string, ComponentType<Record<string, unknown>>>,
): Record<string, (args: { node: BlockNodeLike }) => ReactElement> => {
  const map: Record<string, (args: { node: BlockNodeLike }) => ReactElement> = {}
  for (const [slug, Comp] of Object.entries(registry)) {
    map[slug] = ({ node }) => <Comp {...node.fields} />
  }
  return map
}

/**
 * Lexical → JSX converter with block / inline-block dispatch (contract:
 * specs/003-phase-2-content-models/contracts/inline-block-converter.md).
 *
 * Empty input → null. Plain text → semantic JSX inside `<Prose>`.
 * The same registry serves both `blocks` (paragraph-level) and `inlineBlocks`
 * (mid-paragraph); editorConfig decides which side a given block lands on.
 * Unknown blockTypes fall through to Payload's built-in fallback (dev
 * `console.error` + no DOM), matching the RenderBlocks resilience contract.
 */
export function RichText({
  data,
  inlineRegistry = defaultInlineRegistry,
  withProse = true,
}: RichTextProps): ReactElement | null {
  if (!data) return null

  const root = (data as { root?: { children?: unknown[] } }).root
  if (!root || !Array.isArray(root.children) || root.children.length === 0) return null

  const blockMap = buildBlockMap(
    inlineRegistry as Record<string, ComponentType<Record<string, unknown>>>,
  )

  const body = (
    <PayloadRichText
      data={data}
      converters={({ defaultConverters }) => ({
        ...defaultConverters,
        blocks: { ...defaultConverters.blocks, ...blockMap },
        inlineBlocks: { ...defaultConverters.inlineBlocks, ...blockMap },
      })}
    />
  )

  return withProse ? <Prose>{body}</Prose> : body
}
