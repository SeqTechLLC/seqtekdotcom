import type { ComponentType } from 'react'

import AccordionBlock from './AccordionBlock'
import Cards from './Cards'
import Content from './Content'
import Cta from './Cta'
import Embed from './Embed'
import Gallery from './Gallery'
import Hero from './Hero'
import HubspotForm from './HubspotForm'
import Image from './Image'
import Items from './Items'
import MediaText from './MediaText'
import Quote from './Quote'
import Table from './Table'

// blockType (kebab-case slug from src/payload/blocks/layout/*.ts) → React component.
// Every entry MUST appear in src/payload/blocks/layout/index.ts and vice versa
// (enforced by tests/int/render/registryCoverage.int.spec.ts).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const registry: Record<string, ComponentType<any>> = {
  hero: Hero,
  content: Content,
  'media-text': MediaText,
  items: Items,
  image: Image,
  gallery: Gallery,
  table: Table,
  accordion: AccordionBlock,
  embed: Embed,
  quote: Quote,
  cards: Cards,
  cta: Cta,
  'hubspot-form': HubspotForm,
}
