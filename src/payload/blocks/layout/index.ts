// The thirteen layout blocks (ADR 0013, docs/planning/block-consolidation.md).
// The list is pinned by tests/int/blocks/allowedBlocks.int.spec.ts: a new look
// is an option on one of these, not a new block. Run `npm run generate:types`
// and `npm run generate:importmap` after any change (FR-038, FR-039).
import { Accordion } from './AccordionBlock'
import { Cards } from './Cards'
import { Content } from './Content'
import { Cta } from './Cta'
import { Embed } from './Embed'
import { Gallery } from './Gallery'
import { Hero } from './Hero'
import { HubspotForm } from './HubspotForm'
import { Image } from './Image'
import { Items } from './Items'
import { MediaText } from './MediaText'
import { Quote } from './Quote'
import { Table } from './Table'

export {
  Accordion,
  Cards,
  Content,
  Cta,
  Embed,
  Gallery,
  Hero,
  HubspotForm,
  Image,
  Items,
  MediaText,
  Quote,
  Table,
}

// Picker order follows BLOCK_CATEGORIES (adminMetadata pins it): the opener,
// body, proof, the close, collection lists, then specialty.
export const layoutBlocks = [
  Hero,
  Content,
  MediaText,
  Items,
  Image,
  Gallery,
  Table,
  Accordion,
  Quote,
  Cta,
  Cards,
  Embed,
  HubspotForm,
] as const
