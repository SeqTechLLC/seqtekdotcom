import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'
import { editorConfig } from '../../editor/editorConfig'
import { backgroundField, headingField, introField } from '../../fields/blockCopy'

/**
 * Replaces `faq`, `accordion` and `tabs`: titled panels of rich text, either
 * opened in place or switched between as tabs. Emits no FAQPage JSON-LD.
 */
export const Accordion: Block = {
  slug: 'accordion',
  interfaceName: 'AccordionBlock',
  labels: { singular: 'Accordion', plural: 'Accordions' },
  admin: blockAdmin('content', 'accordion', 'Accordion'),
  fields: [
    headingField(),
    introField(),
    {
      name: 'display',
      type: 'select',
      label: 'How the panels open',
      required: true,
      defaultValue: 'accordion',
      options: [
        { label: 'Accordion (each opens in place)', value: 'accordion' },
        { label: 'Tabs (one shown at a time)', value: 'tabs' },
      ],
      admin: {
        description:
          'Accordion stacks closed panels a reader opens one by one: questions and answers, detail most readers skip. Tabs put the titles in a row and show one panel at a time: alternatives a reader compares.',
      },
    },
    {
      name: 'items',
      type: 'array',
      label: 'Panels',
      labels: { singular: 'Panel', plural: 'Panels' },
      required: true,
      minRows: 1,
      admin: {
        description:
          'For questions, write each the way a prospect would ask it and answer it in the first sentence.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Title',
          required: true,
          admin: {
            description: 'The line the reader clicks: a question, or a tab name of a word or two.',
          },
        },
        {
          name: 'body',
          type: 'richText',
          label: 'Content',
          required: true,
          editor: editorConfig,
          admin: { description: 'What the reader sees once the panel is open.' },
        },
      ],
    },
    backgroundField(),
  ],
}
