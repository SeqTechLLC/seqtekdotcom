import type { GroupField } from 'payload'

/**
 * Spec 011 US4 / T046 — the `seo` group, authored once.
 *
 * Ten collections carried a byte-identical copy of this group with no labels
 * and no help text, so an editor met a section called "Seo" holding "Meta
 * Title", "Meta Description" and "Og Image" and had to already know what a
 * meta description was to fill it in. The wording here is the whole point of
 * the extraction: it is written in terms of what a visitor sees in a search
 * result or a pasted link, per FR-019 and acceptance scenario 5.
 *
 * **Schema-identical by construction.** Field names, types and `relationTo`
 * are unchanged from the inline definitions, so Drizzle generates the same
 * `seo_meta_title` / `seo_meta_description` / `seo_og_image_id` columns on
 * every table. Labels and descriptions are admin presentation and never reach
 * the database. `npm run generate:types` produced no diff across the
 * extraction, which is the byte-level evidence of that.
 */

interface SeoFieldOptions {
  /**
   * What this record is called in help text: "Leave blank to use the case
   * study title". Defaults to "page".
   */
  noun?: string
  /**
   * The field this collection's route passes to `buildMetadata` as the
   * description fallback, in the editor's words ("the summary line").
   *
   * Only `posts` (`excerpt`) and `caseStudies` (`subtitle`) pass one; the
   * other four routes call `buildMetadata(doc.seo, { title })` and fall
   * straight through to the company tagline. Saying "falls back to this
   * page's own summary" on those four was false — check the route before
   * passing this.
   */
  summaryFallback?: string
  /**
   * Hide the whole group from the admin (ROADMAP INERT-1). `locations` has no
   * detail route, so nothing ever calls `buildMetadata` with its `seo` group.
   * The columns stay (that route is on the roadmap); the control goes, because
   * an editor filling it in today changes nothing. `services` left this set
   * under SVC-2 and `industries` under IND-1 — `/services/[slug]` and
   * `/industries/[slug]` read their `seo`, so the group is un-hidden there.
   *
   * `admin.hidden` only hides — the REST API still reads and writes the group,
   * so `tools/payload-seed` and `docs/content-drafts/*.json` are unaffected.
   */
  hidden?: boolean
}

export const seoField = ({
  noun = 'page',
  hidden = false,
  summaryFallback,
}: SeoFieldOptions = {}): GroupField => ({
  name: 'seo',
  type: 'group',
  label: 'Search result and link preview',
  admin: {
    description: `How this ${noun} looks in a Google result and when someone pastes its link into LinkedIn or Slack. Everything here is optional.`,
    ...(hidden ? { hidden: true } : {}),
  },
  fields: [
    {
      name: 'metaTitle',
      type: 'text',
      label: 'Search result headline',
      admin: {
        description: `The blue headline in a Google result. Leave blank to use the ${noun} title above. "| SEQTEK" is appended automatically, so do not type it.`,
      },
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      label: 'Search result summary',
      admin: {
        description: `The gray summary under that headline, and the text on a shared link. Google truncates around 155 characters. ${
          summaryFallback
            ? `Leave blank and the ${summaryFallback} is used instead.`
            : 'Leave blank and every search result for this collection shows the same generic company tagline, so it is worth writing.'
        }`,
      },
    },
    {
      name: 'ogImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Link preview image',
      admin: {
        description:
          'The picture that appears when someone shares this link on LinkedIn, Facebook or Slack. Landscape, at least 1200x630. Without one the shared link renders as text only.',
      },
    },
  ],
})
