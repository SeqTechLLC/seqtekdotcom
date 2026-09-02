import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'
import { publishedOrAuthed } from '../payload/access/publishedOrAuthed'
import { enforceDraftWhenScheduled } from '../payload/hooks/enforceDraftWhenScheduled'
import { revalidateOnChange } from '../payload/hooks/revalidateOnChange'
import { slugFromTitle, validateSlug } from '../payload/hooks/slugFromTitle'
import { seoField } from '../payload/fields/seo'
import { orderField, publishedAtField } from '../payload/fields/publishing'
import { layoutBlocks } from '../payload/blocks/layout'
import { livePreviewFor } from '../payload/livePreview/url'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', '_status', 'tier', 'slug', 'order'],
    // SVC-2 made this a routed, block-composed collection again, so it gets the
    // same live preview as every other one — without it `/services/[slug]`'s
    // draft branch has no way to be entered.
    livePreview: livePreviewFor('services'),
  },
  access: {
    read: publishedOrAuthed,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdmin,
    admin: isAdminOrEditor,
  },
  versions: { drafts: true, maxPerDoc: 50 },
  hooks: {
    beforeChange: [slugFromTitle('title'), enforceDraftWhenScheduled],
    afterChange: [revalidateOnChange('services')],
  },
  fields: [
    // ROADMAP SVC-2. THREE TIERS, ONE COLLECTION. Brent's structure has an axis
    // page ("What We Do"), three group pages under it, and the services
    // themselves — and the three differ in ROLE, not in shape: each is a title,
    // a slug, a block body and an SEO group. Separate collections would have
    // meant a third collection for the axis, or the special-cased `Page` that
    // SVC-2 exists to delete.
    //
    // It also turns a hazard into an invariant. With services and groups in two
    // collections nothing enforced slug uniqueness BETWEEN them, so a collision
    // silently made one of them unreachable and a precedence rule in the route
    // decided which. One collection means one unique index and no rule.
    {
      name: 'tier',
      type: 'select',
      label: 'What kind of page this is',
      required: true,
      defaultValue: 'leaf',
      options: [
        { label: 'Service', value: 'leaf' },
        { label: 'Group of services', value: 'group' },
        { label: 'Top-level menu page', value: 'axis' },
      ],
      admin: {
        description:
          'A service is the thing a client buys. A group gathers several services and can have its own page. A top-level menu page is what a nav button points at, like "What We Do".',
      },
    },
    {
      name: 'title',
      type: 'text',
      label: 'Service name',
      required: true,
      admin: { description: 'What this service is called on service cards and case studies.' },
    },
    {
      name: 'slug',
      type: 'text',
      label: 'URL path',
      required: true,
      unique: true,
      index: true,
      validate: validateSlug,
      admin: {
        description:
          'The last part of the web address for this service, for example "software-delivery". Lowercase words joined by hyphens, no spaces. Changing it on something already published breaks every existing link to it.',
      },
    },
    {
      name: 'icon',
      type: 'text',
      label: 'Icon name',
      admin: {
        description:
          'Leave this blank. There is no icon set behind it yet, so whatever you type is printed on the card as text (ROADMAP INERT-2).',
      },
    },
    {
      name: 'relatedCaseStudies',
      type: 'relationship',
      relationTo: 'caseStudies',
      label: 'Proof of this work',
      hasMany: true,
      admin: { description: 'Case studies that show this service delivered.' },
    },
    // The group→services relation lives on the GROUP and is many-to-many: a
    // leaf can be cross-listed under more than one group — the strategy and
    // alignment work is genuinely something a client buys AND the way we open
    // an engagement. A `parent` field on the child assumes one owner and cannot
    // express that. Holding the ordered list here also makes a group page an
    // editorial object that chooses what it shows, in the order it wants,
    // rather than a query result.
    //
    // Cross-listing means ONE page and TWO links to it, never two pages: the
    // flat `/services/<slug>` namespace IS that rule expressed in routing.
    {
      name: 'items',
      type: 'relationship',
      relationTo: 'services',
      label: 'What sits under this',
      hasMany: true,
      filterOptions: () => ({
        // A group holds services. Nothing sits under a service, and nothing may
        // contain itself.
        tier: { equals: 'leaf' },
      }),
      admin: {
        // GROUPS ONLY, and that is an INERT-2 call rather than a modelling one.
        // An axis holding its groups reads like the obvious other half of this
        // relation, but nothing renders it: `resolveLayout` reaches `.items`
        // only through a `service-cards` block whose `pillar` is a
        // `tier: 'group'` row, and `service-pillar-cards` has no `source` field
        // and no resolver, so it is manual-pick only. Shown on an axis, this
        // would be a control an editor arranges and no page reflects — the
        // defect class this collection was rebuilt to remove. It comes back the
        // moment something reads it (a `source` on `service-pillar-cards`, or a
        // nav built from data rather than `site-content.ts`).
        condition: (data) => data?.tier === 'group',
        description:
          'The services shown under this group, in the order you arrange them. The same service may appear under more than one group.',
      },
    },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Service page',
      labels: { singular: 'Block', plural: 'Blocks' },
      blocks: [...layoutBlocks],
      admin: {
        description:
          'The service page, built from blocks. Start with a hero so the page has a headline.',
      },
    },
    // Un-hidden with the route that reads it (ROADMAP INERT-1): `/services/[slug]`
    // now calls `buildMetadata` with this group.
    seoField({ noun: 'service' }),
    orderField({ what: 'a service list' }),
    publishedAtField(),
  ],
}
