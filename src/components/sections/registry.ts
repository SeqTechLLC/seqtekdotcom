import type { ComponentType } from 'react'

import Content from './Content'
import CtaSection from './CtaSection'
import Hero from './Hero'

// blockType (kebab-case slug from src/payload/blocks/layout/*.ts) → React component.
// Every entry MUST appear in src/payload/blocks/layout/index.ts and vice versa
// (enforced by tests/int/render/registryCoverage.test.ts).
// Types intentionally use `any` per contract render-blocks.md — each renderer
// declares its own concrete props and Payload's saved block JSON shape doesn't
// statically match React's prop-position invariants.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const registry: Record<string, ComponentType<any>> = {
  hero: Hero,
  content: Content,
  'cta-section': CtaSection,
}
