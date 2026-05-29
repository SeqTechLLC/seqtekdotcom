// If you add an inline block here, run `npm run generate:importmap` before
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

export const inlineBlocks = [
  InlineCta,
  TestimonialEmbed,
  Callout,
  ImageWithCaption,
  Figure,
  QuotePullquote,
  Disclosure,
] as const
