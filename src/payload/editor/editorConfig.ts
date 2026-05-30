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

import { richTextBlocks, richTextInlineBlocks } from '../blocks/inline'

/**
 * Shared Lexical editor config used by every `richText` field. Block-level
 * rich-text components (Callout, Figure, Blockquote, Disclosure, …) are
 * registered as `blocks` so they render at paragraph level; only truly
 * inline content (e.g. InlineCta) goes under `inlineBlocks` — wrapping
 * block-level markup in the inline `<span>` slot produces invalid HTML5
 * and React hydration mismatches.
 *
 * Layout blocks live on `pages.layout` as a top-level `blocks` field, not
 * here (per BLOCK_LIBRARY.md §1).
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
    BlocksFeature({
      blocks: [...richTextBlocks],
      inlineBlocks: [...richTextInlineBlocks],
    }),
  ],
})
