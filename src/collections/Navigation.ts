import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'
import { publishedOrAuthed } from '../payload/access/publishedOrAuthed'
import { navLinkField } from '../payload/fields/navLink'
import { revalidateOnChange } from '../payload/hooks/revalidateOnChange'
import { orderField } from '../payload/fields/publishing'
import { ADMIN_GROUPS } from './groups'

/**
 * ADR 0010, amended 2026-09-16: the header nav leaves code and becomes
 * content. Nothing else in that ADR moves — company name, tagline, phone,
 * email, address, social links, footer text, the footer nav, the legal nav and
 * the header CTA all stay in `src/lib/site-content.ts` and change by deploy.
 *
 * ONE DOCUMENT PER TOP-LEVEL BUTTON, which is why this is a collection of
 * items rather than one global holding the whole tree. The menu is edited a
 * button at a time ("reword Industries", "add Retail under it"), a button is
 * what gets reordered, and drafts are per-document — so staging a change to
 * one axis does not hold the rest of the menu hostage. A single global would
 * make every edit a rewrite of the entire menu and every draft a lock on it.
 *
 * The panel lives in `groups` → `items`, which is the exact shape
 * `PrimaryNav`/`MobileNav` already consume (`NavPanel` → `NavGroup` → NavItem`
 * in `site-content.ts`). No group rows at all means a plain link with no
 * caret, which is what Case Studies, Insights and Contact are today.
 *
 * NOT derived from the `services` tree, deliberately. `services` already
 * encodes What We Do → three groups → nine leaves via its `items`
 * self-relation, and deriving the menu from it was the framing the ROADMAP
 * carried before this ADR amendment. It is rejected because the menu and the
 * catalogue are different editorial objects: the menu cross-lists, omits,
 * reorders and renames independently of what the catalogue says, and Industries
 * and Insights are in the menu without being services at all.
 */
export const Navigation: CollectionConfig = {
  slug: 'navigation',
  labels: { singular: 'Menu item', plural: 'Header menu' },
  admin: {
    group: ADMIN_GROUPS.site,
    description:
      'The buttons across the top of every page, in order, and the dropdown under each one. Changes here go live on publish, without a deploy.',
    useAsTitle: 'label',
    // contracts/admin-metadata.md C3: `useAsTitle` first (it is the column
    // Payload turns into the link to the record), `_status` second.
    defaultColumns: ['label', '_status', 'order'],
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
    // The one hook, and it is the expensive one: this collection renders in the
    // root layout, so a publish busts every page rather than a path. See
    // `buildRevalidatePlan`'s `navigation` branch.
    afterChange: [revalidateOnChange('navigation')],
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      label: 'Button wording',
      required: true,
      admin: {
        description:
          'The words on the button itself, for example "What We Do". This one is not optional: a top-level button is named by the menu rather than by whatever it points at.',
      },
    },
    navLinkField({
      name: 'link',
      label: 'Where the button goes',
      description:
        'Every top-level button is a link as well as a menu, so the page behind it is never stranded behind a dropdown.',
    }),
    {
      name: 'groups',
      type: 'array',
      label: 'Dropdown columns',
      labels: { singular: 'Column', plural: 'Columns' },
      admin: {
        description:
          'Leave this empty for a plain button with no dropdown. One row per column: one column gives a simple list, several draw side by side.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Column heading',
          required: true,
          admin: {
            description:
              'The heading over this column. With only one column it is not drawn at all — the button above is already the heading.',
          },
        },
        navLinkField({
          name: 'link',
          label: 'Where the heading goes',
          description:
            'A column heading may be a link to a page of its own, or just a heading. Choose "just a heading" when there is no page to send people to.',
          allowHeading: true,
        }),
        {
          name: 'items',
          type: 'array',
          label: 'Links in this column',
          labels: { singular: 'Link', plural: 'Links' },
          fields: [
            navLinkField({
              name: 'link',
              label: 'Link',
              description: 'One entry in the column, in the order you arrange them.',
            }),
          ],
        },
      ],
    },
    orderField({
      what: 'the row of buttons, left to right',
      unnumbered: 'Buttons without a number come after the numbered ones, in alphabetical order.',
    }),
  ],
}
