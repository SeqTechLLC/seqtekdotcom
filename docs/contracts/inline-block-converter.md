# Contract: Lexical → JSX converter with inline blocks

`src/components/richText/RichText.tsx` is the rich-text analogue of `RenderBlocks`
(`BLOCK_LIBRARY.md` §8).

```ts
interface RichTextProps {
  data: SerializedEditorState | null | undefined
  inlineRegistry?: Record<string, ComponentType<any>> // default: defaultInlineRegistry
  withProse?: boolean // default: true
  className?: string // classes for the <Prose> wrapper
}
function RichText(props: RichTextProps): ReactElement | null
```

## Behaviour

1. Null, undefined or empty `data` returns `null`.
2. Payload's Lexical JSX converter emits semantic markup.
3. `block` nodes (paragraph-level) and `inlineBlock` nodes (mid-paragraph) are both looked up by
   `blockType` in the registry, and each renders its component with the node's fields passed
   through unchanged.
4. An unregistered `blockType` falls through to Payload's fallback, and the rest of the document
   still renders.
5. Internal links resolve to public URLs through `publicPathFor`; an unresolvable one gets
   `href="#"`.
6. With `withProse` true, the output is wrapped in `<Prose>` (`BLOCK_LIBRARY.md` §3).

## Invariant

Every inline block in `src/payload/blocks/inline/index.ts` has an entry in `defaultInlineRegistry`
(`src/components/richText/inline/registry.ts`), and every registry entry has a block. Enforced by
`tests/int/render/inlineRegistryCoverage.int.spec.ts`. The rendering behaviour is covered by
`tests/int/render/richTextInline.int.spec.tsx`.
