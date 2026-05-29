import {
  BlocksFeature,
  BlockquoteFeature,
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnderlineFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { inlineBlocks } from '../blocks/inline'

/**
 * The shared Lexical editor config used by every `richText` field that needs
 * the canonical block + inline-block set. Wiring the editor at this level
 * keeps the admin and the seed (`src/payload/seed/htmlToLexical.ts`) producing
 * structurally identical JSON.
 *
 * Layout blocks are not registered here — they live on `pages.layout` as a
 * `blocks` field, not inside the rich-text body. Only inline blocks belong
 * in the editor config (per BLOCK_LIBRARY.md §1).
 */
export const editorConfig = lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    BlockquoteFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    LinkFeature({ enabledCollections: ['pages', 'posts', 'caseStudies', 'services'] }),
    InlineToolbarFeature(),
    FixedToolbarFeature(),
    BlocksFeature({ inlineBlocks: [...inlineBlocks] }),
  ],
})
