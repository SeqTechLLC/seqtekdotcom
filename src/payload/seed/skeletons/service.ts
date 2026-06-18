import { buildLexical } from '../showcase/lexical'

// spec 010 US2 (FR-008) — default block skeleton for NEW service records.
// Sourced by `Services.layout`'s `defaultValue`. Fully editable after create.
export const serviceSkeleton = (): Array<Record<string, unknown>> => [
  {
    blockType: 'content',
    width: 'standard',
    background: 'none',
    body: buildLexical([
      { kind: 'h', tag: 'h2', text: 'Overview' },
      { kind: 'p', text: 'What this service does and the outcome it drives.' },
    ]),
  },
  {
    blockType: 'content',
    width: 'standard',
    background: 'none',
    body: buildLexical([
      { kind: 'h', tag: 'h2', text: 'Our approach' },
      { kind: 'p', text: 'How we deliver it.' },
    ]),
  },
  {
    blockType: 'contact-cta',
    heading: 'Talk to a pillar lead',
    body: 'Tell us what you are trying to ship.',
    primaryCta: { label: 'Book a call', url: '/contact/book-a-call' },
  },
]

export default serviceSkeleton
