import type { GroupField } from 'payload'

import { requiredWhen } from '../blocks/conditional'
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
  /**
   * Whether the "Menu wording" override is offered. **Only a leaf takes it.**
   *
   * A top-level button and a column heading each declare their own `required`
   * label on the collection, and that is what the resolver reads
   * (`resolveNavigation` uses `doc.label`, `resolveGroup` uses `group.label`).
   * Offering the link's override there too put two wording boxes on one row
   * with only the other one wired — an editor fills in "Menu wording",
   * publishes, and nothing changes. That is the inert control ADR 0010 exists
   * to prevent, so the field is omitted rather than left to mislead.
   *
   * A leaf has no label of its own, so there the override IS the label.
   */
  allowLabelOverride?: boolean
}

export const navLinkField = ({
  name,
  label,
  description,
  allowHeading = false,
  allowLabelOverride = false,
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
    // `requiredWhen`, not a bare `admin.condition`. A condition only HIDES a
    // control; it does not enforce it. Without the validate half an editor
    // could pick "a page on this site", never choose one, publish with no
    // error, and the item would then silently vanish from the menu at render
    // (`resolveLink` returns null and `resolveNavigation` drops it) — with no
    // feedback anywhere. That is precisely the guarantee ADR 0010's amendment
    // rests on: a bad link cannot publish. `safeUrlValidate` does not close it
    // either, since it passes empty through by design (presence is `required`'s
    // job). Contract C4 clause (3) names this helper for exactly this case.
    //
    // The extra `admin` props go in `requiredWhen`'s SECOND ARGUMENT, never as
    // a sibling `admin:` key — a spread followed by `admin: {...}` replaces the
    // `condition` the helper returns, which is how `logo-bar.logos` once shipped
    // validated-but-always-visible.
    {
      name: 'doc',
      type: 'relationship',
      relationTo: [...NAV_LINKABLE_COLLECTIONS],
      label: 'Which page',
      // PUBLISHED ONLY IN THE ADMIN PICKER — and that scope is the honest
      // claim. `filterOptions` constrains what the relationship control offers
      // an editor; it is not a server-side constraint, and the path content
      // actually arrives by (`tools/payload-seed` writing over REST, per
      // CLAUDE.md) never consults it. So this narrows the editorial mistake,
      // it does not make a draft target unrepresentable.
      //
      // What holds regardless: the render path fails safe. `getNavigation`
      // reads with `overrideAccess: false`, so a draft target does not
      // populate, `resolveLink` finds no slug and the item is dropped. Silent,
      // but never a link to something a visitor cannot open.
      //
      // The cost is ordering — publish the page, then point the menu at it —
      // which is the same order the 301 map and the sitemap already assume.
      filterOptions: () => ({ _status: { equals: 'published' } }),
      ...requiredWhen<{ type?: string }>((d) => d?.type === 'internal', {
        description:
          'Start typing to find a published page. Only published pages are listed: the menu is not allowed to point at something a visitor cannot open.',
      }),
    },
    // TWO validators, composed — the `Hero.videoUrl` idiom. A bare spread of
    // `requiredWhen` would REPLACE `safeUrlValidate` (the helper returns its own
    // `validate`), leaving the field required but no longer protocol-checked, so
    // a `javascript:` URI would publish. Presence is checked first, then safety.
    (() => {
      const { admin, validate, custom } = requiredWhen<{ type?: string }>(
        (d) => d?.type === 'external',
        {
          description:
            'A full address including https://. Use this only for somewhere off this site — anything on seqtek.com should be picked as a page above.',
        },
      )
      return {
        name: 'url' as const,
        type: 'text' as const,
        label: 'Web address' as const,
        admin,
        custom,
        validate: (value: unknown, args: { data?: unknown; siblingData?: unknown }) => {
          const requiredCheck = validate(value, args)
          if (requiredCheck !== true) return requiredCheck
          return safeUrlValidate(value)
        },
      }
    })(),
    // LEAVES ONLY. A top-level button and a column heading carry their own
    // `required` label on the collection, and that is the one the resolver
    // reads — rendering this box there too would be a second wording field
    // with nothing wired to it.
    ...(allowLabelOverride
      ? [
          // DESTRUCTURED, not spread, because the condition and the validator
          // must differ. Visible for both link types — on an internal link the
          // wording is an optional override of the target's title. REQUIRED for
          // an external one, which has no target document whose title it could
          // fall back to: a blank label there resolves to `null`, `resolveGroup`
          // drops the row, and the editor gets a clean publish and a menu entry
          // that simply is not there. The old help text ("leave this blank to
          // use the page's own title") walked them straight into it, since that
          // is only true of an internal link.
          (() => {
            const { validate, custom } = requiredWhen<{ type?: string }>(
              (d) => d?.type === 'external',
            )
            return {
              name: 'label' as const,
              type: 'text' as const,
              label: 'Menu wording' as const,
              custom,
              validate,
              admin: {
                description:
                  "For a page on this site: leave blank to use the page's own title, so renaming the page renames the menu. For a web address: required — there is no page title to borrow, and leaving it blank drops the link from the menu.",
              },
            }
          })(),
        ]
      : []),
  ],
})
