import type { ComponentType } from 'react'

import { Callout } from './Callout'
import { Disclosure } from './Disclosure'
import { Figure } from './Figure'
import { ImageWithCaption } from './ImageWithCaption'
import { InlineCta } from './InlineCta'
import { QuotePullquote } from './QuotePullquote'
import { TestimonialEmbed } from './TestimonialEmbed'

// blockType (kebab-case slug from src/payload/blocks/inline/*.ts) → React component.
// Every entry MUST appear in src/payload/blocks/inline/index.ts and vice versa
// (enforced by tests/int/render/inlineRegistryCoverage.test.ts).
// Types intentionally use `any` per contract inline-block-converter.md.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const defaultInlineRegistry: Record<string, ComponentType<any>> = {
  'inline-cta': InlineCta,
  'testimonial-embed': TestimonialEmbed,
  callout: Callout,
  'image-with-caption': ImageWithCaption,
  figure: Figure,
  'quote-pullquote': QuotePullquote,
  disclosure: Disclosure,
}
