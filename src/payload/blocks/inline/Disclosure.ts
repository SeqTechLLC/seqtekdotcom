import type { Block } from 'payload'

export const Disclosure: Block = {
  slug: 'disclosure',
  interfaceName: 'DisclosureBlock',
  labels: { singular: 'Disclosure', plural: 'Disclosures' },
  fields: [
    { name: 'summary', type: 'text', required: true },
    { name: 'body', type: 'textarea', required: true },
  ],
}
