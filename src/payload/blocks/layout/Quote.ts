import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'
import { requiredWhen } from '../conditional'
import { backgroundField, headingField, introField } from '../../fields/blockCopy'

type QuoteSibling = { source?: string }

const fromPanel = (d?: QuoteSibling) => (d?.source ?? 'testimonials') === 'testimonials'
const typedHere = (d?: QuoteSibling) => d?.source === 'custom'

/**
 * Replaces `testimonial-block` and `featured-testimonials`. One quote draws
 * large, several draw as a grid.
 *
 * `source` decides between a testimonial record and a quote typed into the
 * block. Only the side it names is published; the other side's fields are
 * hidden in the admin and ignored by the renderer, so there is no precedence
 * rule for an editor to remember.
 */
export const Quote: Block = {
  slug: 'quote',
  interfaceName: 'QuoteBlock',
  labels: { singular: 'Quote', plural: 'Quotes' },
  admin: blockAdmin('social-proof', 'quote', 'Quote'),
  fields: [
    headingField(),
    introField(),
    {
      name: 'source',
      type: 'select',
      label: 'Where the quote comes from',
      required: true,
      defaultValue: 'testimonials',
      options: [
        { label: 'Testimonials in the panel', value: 'testimonials' },
        { label: 'Typed here', value: 'custom' },
      ],
      admin: {
        description:
          'A testimonial brings the person’s name, title, company and photo from its record. "Typed here" is for a pull quote with no testimonial behind it, such as a line from a talk or a post. Only the one you pick is published.',
      },
    },
    {
      name: 'testimonials',
      type: 'relationship',
      relationTo: 'testimonials',
      label: 'Testimonials',
      hasMany: true,
      ...requiredWhen<QuoteSibling>(fromPanel, {
        description:
          'One testimonial is drawn large. Two or more sit in a grid, in the order you pick them. Add them under Testimonials first.',
      }),
    },
    {
      name: 'quote',
      type: 'textarea',
      label: 'Quote',
      ...requiredWhen<QuoteSibling>(typedHere, {
        description: 'The words themselves, without quotation marks. The page adds them.',
      }),
    },
    {
      name: 'attribution',
      type: 'text',
      label: 'Who said it',
      admin: {
        condition: (_data, siblingData) => typedHere(siblingData as QuoteSibling),
        description: 'Their name. Leave it blank for an unattributed pull quote.',
      },
    },
    {
      name: 'role',
      type: 'text',
      label: 'Their role',
      admin: {
        condition: (_data, siblingData) => typedHere(siblingData as QuoteSibling),
        description:
          'Title and organisation, e.g. "CEO, Acme Manufacturing". Shown after the name.',
      },
    },
    {
      name: 'layout',
      type: 'select',
      label: 'How to draw one quote',
      defaultValue: 'centered',
      options: [
        { label: 'Centered', value: 'centered' },
        { label: 'With photo left', value: 'with-photo-left' },
        { label: 'With photo right', value: 'with-photo-right' },
      ],
      admin: {
        description:
          'Applies when the block shows a single quote; several always sit in a grid. The photo comes from the testimonial, so a typed quote, or a person with no photo on file, has none and the photo layouts leave it out with the quote left-aligned.',
      },
    },
    backgroundField('subtle'),
  ],
}
