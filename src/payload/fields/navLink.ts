import type { GroupField } from 'payload'

import { NAV_LINKABLE_COLLECTIONS } from '../../lib/routes'
import { safeUrlValidate } from './url'

/**
 * Where one menu entry points, as a discriminated type.
 *
 * ADR 0010's amendment turns on this field and nothing else. The decision it
 * rejected — twice — is a single free-text URL box per entry, WordPress's
 * "Custom Link" shape, which couples the menu to the route table and the 301
 * map with nothing checking either. So:
 *
 * - `internal` stores a POLYMORPHIC RELATIONSHIP, not a path. The URL is
 *   derived from the target's collection and slug at render
 *   (`src/lib/nav/resolve.ts`), so a menu item cannot point at a page that
 *   does not exist, and a slug rename follows it instead of rotting.
 * - `external` is the one type that can rot, so it is the only one that takes
 *   free text, and `safeUrlValidate` refuses `javascript:`/`data:`/`vbscript:`
 *   at save time. `tools/link-sweep --external` is what watches it afterwards.
 * - `heading` is a label with no destination. Groups only — the "How We Work"
 *   panel needs headless column titles, and `NavGroup.url` has always been
 *   optional for exactly that.
 *
 * `label` is an OVERRIDE, not the name. Left blank it falls back to the target
 * document's own title, which is most of the churn this change exists to
 * remove: renaming a page renames its menu entry, and an override is only
 * spent where the menu genuinely wants different words from the page.
 */

export interface NavLinkFieldArgs {
  name: string
  label: string
  /** Editor-facing help for this position in the menu. */
  description: string
  /**
   * Whether `heading` (a label with no destination) is offered. Groups take
   * it; a top-level button and a leaf do not — both must go somewhere, and
   * `layout.e2e.spec.ts` pins every top-level entry as a real link.
   */
  allowHeading?: boolean
}

export const navLinkField = ({
  name,
  label,
  description,
  allowHeading = false,
}: NavLinkFieldArgs): GroupField => ({
  name,
  type: 'group',
  label,
  admin: { description },
  fields: [
    {
      name: 'type',
      type: 'select',
      label: 'What this points at',
      required: true,
      defaultValue: 'internal',
      options: [
        { label: 'A page on this site', value: 'internal' },
        { label: 'A web address somewhere else', value: 'external' },
        ...(allowHeading ? [{ label: 'Nothing — just a heading', value: 'heading' }] : []),
      ],
      admin: {
        description: allowHeading
          ? 'Pick a page on this site wherever you can, so the link follows the page if its address changes. A heading is a column title with nothing to click.'
          : 'Pick a page on this site wherever you can, so the link follows the page if its address changes.',
      },
    },
    {
      name: 'doc',
      type: 'relationship',
      relationTo: [...NAV_LINKABLE_COLLECTIONS],
      label: 'Which page',
      // PUBLISHED ONLY, and that is the guarantee rather than an oversight.
      // ADR 0010's amendment is that a bad link cannot publish; a draft is a
      // page that does not exist yet as far as a visitor is concerned. The
      // cost is ordering — publish the page, then point the menu at it — which
      // is the same order the 301 map and the sitemap already assume.
      filterOptions: () => ({ _status: { equals: 'published' } }),
      admin: {
        condition: (_data, siblingData) => siblingData?.type === 'internal',
        description:
          'Start typing to find a published page. Only published pages are listed: the menu is not allowed to point at something a visitor cannot open.',
      },
    },
    {
      name: 'url',
      type: 'text',
      label: 'Web address',
      validate: safeUrlValidate,
      admin: {
        condition: (_data, siblingData) => siblingData?.type === 'external',
        description:
          'A full address including https://. Use this only for somewhere off this site — anything on seqtek.com should be picked as a page above.',
      },
    },
    {
      name: 'label',
      type: 'text',
      label: 'Menu wording',
      admin: {
        condition: (_data, siblingData) => siblingData?.type !== 'heading',
        description:
          "Leave this blank to use the page's own title, so renaming the page renames the menu. Fill it in only when the menu needs shorter or different wording.",
      },
    },
  ],
})
