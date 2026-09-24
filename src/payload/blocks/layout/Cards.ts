import type { Block } from 'payload'

import { CARD_COLLECTIONS, type CardCollection } from '../../../lib/cardCollections'
import { backgroundField, headingField, introField } from '../../fields/blockCopy'
import { blockAdmin } from '../blockAdmin'
import { requiredWhen } from '../conditional'
import { outputContract } from '../outputContract'

type CardsSibling = { collection?: string; source?: string }

const COLLECTION_LABELS: Record<CardCollection, string> = {
  caseStudies: 'Case studies',
  posts: 'Insights (blog posts)',
  services: 'Services',
  industries: 'Industries',
  workshops: 'Workshops',
  teamMembers: 'Team members',
  locations: 'Markets',
  partners: 'Partners',
}

/** A filter shows only while it can narrow this block's list. */
const filtersFor =
  (collection: CardCollection) =>
  (d: CardsSibling | undefined): boolean =>
    d?.collection === collection && d?.source === 'filtered'

/**
 * WordPress's Query Loop: one block for every list of documents, replacing
 * the ten per-collection grids (docs/planning/block-consolidation.md).
 *
 * `src/lib/resolveLayout.ts` reads `collection`, `source`, the filters and
 * `limit`, and hands the component the finished list in `manualItems`. The
 * component still reads `collection`, to choose the card each document is
 * drawn as.
 */
export const Cards: Block = {
  slug: 'cards',
  interfaceName: 'CardsBlock',
  labels: { singular: 'Collection cards', plural: 'Collection cards blocks' },
  admin: blockAdmin('content-collection', 'cards', 'Collection cards'),
  custom: outputContract({
    resolvedUpstream: [
      'collection',
      'source',
      'industry',
      'service',
      'category',
      'leadershipOnly',
      'serviceGroup',
      'limit',
    ],
  }),
  fields: [
    headingField(),
    introField(),
    {
      name: 'collection',
      type: 'select',
      label: 'What to list',
      required: true,
      options: CARD_COLLECTIONS.map((value) => ({ label: COLLECTION_LABELS[value], value })),
      admin: {
        description:
          'The kind of thing this section lists. Each draws as its own card: a case study with its photo, a person with their headshot, a market by name. If nothing matches, the whole section is left off the page, heading included.',
      },
    },
    {
      name: 'source',
      type: 'select',
      label: 'Which ones',
      required: true,
      defaultValue: 'all',
      options: [
        { label: 'All of them', value: 'all' },
        { label: 'Filtered', value: 'filtered' },
        { label: 'Pick them by hand', value: 'manual' },
      ],
      admin: {
        description:
          '"All of them" and "Filtered" fill themselves in and stay current as you publish. "Pick them by hand" shows exactly the items you choose below, in your order. Case studies, insights, services and team members can be filtered; for anything else, "Filtered" lists all of them.',
      },
    },
    {
      name: 'industry',
      type: 'relationship',
      relationTo: 'industries',
      label: 'Only this industry',
      admin: {
        condition: (_data, siblingData) => filtersFor('caseStudies')(siblingData as CardsSibling),
        description:
          'Shows the case studies whose client is in this sector. Leave it blank to skip this filter.',
      },
    },
    {
      name: 'service',
      type: 'relationship',
      relationTo: 'services',
      // SVC-2: only a leaf is a thing a client buys, so the picker must not
      // offer "What We Do" or a group.
      filterOptions: () => ({ tier: { equals: 'leaf' } }),
      label: 'Only this service',
      admin: {
        condition: (_data, siblingData) => filtersFor('caseStudies')(siblingData as CardsSibling),
        description:
          'Shows the case studies where we delivered this service. Leave it blank to skip this filter; set both and a study must match both.',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Topic',
      ...requiredWhen<CardsSibling>(filtersFor('posts'), {
        description: 'Shows the insights filed under this topic, newest first.',
      }),
    },
    {
      name: 'leadershipOnly',
      type: 'checkbox',
      label: 'Leadership only',
      admin: {
        condition: (_data, siblingData) => filtersFor('teamMembers')(siblingData as CardsSibling),
        description:
          'Tick to show only the people marked as leadership. Leave it clear to show the whole team, leadership first.',
      },
    },
    {
      name: 'serviceGroup',
      type: 'relationship',
      // SVC-2: a group is a `services` row with `tier: 'group'`, and it holds
      // an ordered list of its services.
      relationTo: 'services',
      filterOptions: () => ({ tier: { equals: 'group' } }),
      label: 'Group',
      ...requiredWhen<CardsSibling>(filtersFor('services'), {
        description: 'Shows the services this group holds, in the order the group arranges them.',
      }),
    },
    {
      name: 'manualItems',
      type: 'relationship',
      relationTo: [...CARD_COLLECTIONS],
      label: 'Items to show',
      hasMany: true,
      // One relationship across all eight collections; the picker offers only
      // the collection chosen above. Services are either tier a card can link
      // to: a service, or a group of them. Never a top-level menu page.
      filterOptions: ({ relationTo, siblingData }) => {
        if (relationTo !== (siblingData as CardsSibling | undefined)?.collection) return false
        if (relationTo === 'services') return { tier: { in: ['leaf', 'group'] } }
        return true
      },
      ...requiredWhen<CardsSibling>((d) => d?.source === 'manual', {
        description:
          'The exact items, in the order you pick them. Switch "What to list" and anything picked from the old kind is ignored.',
      }),
    },
    {
      name: 'limit',
      type: 'number',
      label: 'How many to show',
      min: 1,
      admin: {
        description:
          'Stops the list after this many, whichever way it is filled. Leave it blank to show all of them.',
      },
    },
    {
      name: 'display',
      type: 'select',
      label: 'Layout',
      required: true,
      defaultValue: 'grid',
      options: [
        { label: 'Grid', value: 'grid' },
        { label: 'First one featured', value: 'featured' },
      ],
      admin: {
        description:
          '"Grid" draws every item as an equal card. "First one featured" draws the first item large, beside its picture, with the rest as a grid underneath.',
      },
    },
    backgroundField(),
  ],
}
