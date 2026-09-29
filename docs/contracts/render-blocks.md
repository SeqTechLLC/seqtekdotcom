# Contract: `RenderBlocks` dispatcher

`src/components/sections/RenderBlocks.tsx` renders every `layout` (ADR 0009, `BLOCK_LIBRARY.md` §8).

```ts
interface RenderBlocksProps {
  blocks: { blockType: string; id?: string | null; [key: string]: unknown }[] | null | undefined
}
function RenderBlocks(props: RenderBlocksProps): ReactElement
```

## Behaviour

1. Null, undefined or empty `blocks` render nothing, with no warning.
2. Each block looks up `registry[block.blockType]` (`src/components/sections/registry.ts`) and
   renders the component with the whole block as props, keyed by `id ?? \`${blockType}-${index}\``.
   There is no per-block data shaping.
3. An unknown `blockType` renders nothing in its slot. Outside production it warns once per type
   per render; in production it is silent.

## Invariant

Every block in `src/payload/blocks/layout/index.ts` has a registry entry, and the reverse. Enforced
by `tests/int/render/registryCoverage.int.spec.ts`. The behaviour is covered by
`tests/int/render/renderBlocksUnknownType.int.spec.tsx`.

A new layout block also needs the owner's sign-off and an entry in
`tests/int/blocks/allowedBlocks.int.spec.ts` (ADR 0013). The full checklist is in
`PAYLOAD_DEVELOPMENT.md` §6.
