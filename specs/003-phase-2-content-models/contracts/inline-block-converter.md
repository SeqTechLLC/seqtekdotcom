# Contract: Lexical → JSX converter (with inline blocks)

**File**: `src/components/richText/RichText.tsx` (+ `src/components/richText/inline/<Name>.tsx`)

**Cited from**: `docs/BLOCK_LIBRARY.md` §5.2 + §8 (the inline-block analogue of `RenderBlocks`).

## Signature

```typescript
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

export interface RichTextProps {
  data: SerializedEditorState | null | undefined
  /**
   * Optional override registry — defaults to the full inline-block set
   * registered in src/payload/editor/editorConfig.ts.
   */
  inlineRegistry?: Record<string, React.ComponentType<any>>
  /** Wrap in `<Prose>`. Default: true. */
  withProse?: boolean
}

export function RichText(props: RichTextProps): React.ReactElement
```

## Behaviour

1. `data` null/undefined/empty → returns `null` (no DOM).
2. Walks the Lexical AST and emits semantic JSX (`<p>`, `<h2>`, `<ul>`, `<a>`, etc.).
3. On a `block` node (block-level inline block, e.g., `callout`, `image-with-caption`): look up `inlineRegistry[node.fields.blockType]`. Same not-found behaviour as `RenderBlocks`: dev warning, prod silent, skip the node.
4. On an `inlineBlock` node (truly in-flow, e.g., `inline-cta`): same registry lookup; render inline (e.g., wrapped in a `<span>` if the component is text-level).
5. When `withProse` is true (default): wrap result in `<Prose>` (the `@tailwindcss/typography`-based primitive per BLOCK_LIBRARY.md §3). When false: caller owns wrapping.

## Inline registry (default)

```typescript
import type { ComponentType } from 'react'

export const defaultInlineRegistry: Record<string, ComponentType<any>> = {
  'inline-cta': InlineCta,
  'testimonial-embed': TestimonialEmbed,
  callout: Callout,
  'image-with-caption': ImageWithCaption,
  figure: Figure,
  'quote-pullquote': QuotePullquote,
  disclosure: Disclosure,
}
```

**Invariant**: every inline block registered in `src/payload/blocks/inline/index.ts` MUST appear in `defaultInlineRegistry`. Enforced by the same kind of coverage test as `RenderBlocks`.

## Test contract

- `tests/int/render/richTextInline.test.ts`:
  - Empty input → null.
  - Plain text node → `<p>` inside `<Prose>`.
  - `inline-cta` node → registered component renders with the field values.
  - Unknown block type → dev warning, no DOM for that node.
- `tests/int/render/inlineRegistryCoverage.test.ts`:
  - Iterates inline-block exports and asserts each has a default-registry entry.

## Stability

- `SerializedEditorState` ships from `@payloadcms/richtext-lexical/lexical` — pinned to Payload's minor.
- The converter does **not** do data shaping — inline-block field values are passed straight through to the registered component. This matches FR-008's "inserts a working node" expectation.
