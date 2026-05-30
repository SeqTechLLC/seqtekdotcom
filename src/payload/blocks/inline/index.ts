// If you add a block here, run `npm run generate:importmap` before
// next dev-start (project_payload_importmap_gotcha).
import { Callout } from './Callout'
import { Disclosure } from './Disclosure'
import { Figure } from './Figure'
import { ImageWithCaption } from './ImageWithCaption'
import { InlineCta } from './InlineCta'
import { QuotePullquote } from './QuotePullquote'
import { TestimonialEmbed } from './TestimonialEmbed'

export {
  Callout,
  Disclosure,
  Figure,
  ImageWithCaption,
  InlineCta,
  QuotePullquote,
  TestimonialEmbed,
}

// Wired into BlocksFeature.blocks. These render block-level markup
// (figure, blockquote, aside, details) so they MUST sit at paragraph level
// — wrapping in <span> via inlineBlocks would produce invalid HTML5 and
// React hydration mismatches.
export const richTextBlocks = [
  Callout,
  ImageWithCaption,
  Figure,
  QuotePullquote,
  TestimonialEmbed,
  Disclosure,
] as const

// Wired into BlocksFeature.inlineBlocks. Only truly inline content
// (an anchor link) belongs here.
export const richTextInlineBlocks = [InlineCta] as const
