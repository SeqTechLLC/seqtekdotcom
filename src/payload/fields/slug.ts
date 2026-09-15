import type {
  CollectionSlug,
  FieldHook,
  PayloadRequest,
  RowField,
  TextField,
  Validate,
  Where,
} from 'payload'
import { slugField, ValidationError } from 'payload'

/**
 * Spec 011 US5 — the URL path every routed collection shares, on Payload's
 * built-in `slugField`.
 *
 * `slugField` adds a hidden `generateSlug` checkbox beside `slug`. Its hook
 * derives the slug from `useAsSlug` on create, and on update only while the
 * checkbox is still on; it switches the checkbox off once a slug exists, so
 * renaming a title never rewrites a URL that links already point at (FR-024).
 * The slug box starts locked, with Unlock and Generate controls. The migration
 * that added `generate_slug` set it false on every row that already had a slug:
 * the column default is true, and a published record left at true would have
 * its slug regenerated from its title on the next save.
 */

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const FORMAT_MESSAGE =
  'Use lowercase letters, numbers and hyphens only, like "case-study-workshop", with no spaces, capitals or accents.'

const EMPTY_MESSAGE = 'Give this a URL path, or press Generate to make one from the title.'

/** How far to look for a free alternative before giving up on suggesting one. */
const MAX_SUGGESTION = 25

/**
 * Payload's default slugify drops accented letters instead of folding them and
 * doubles hyphens around punctuation ("Café & Crème" becomes `caf--crme`), which
 * `SLUG_RE` rejects. This one folds accents and collapses separators.
 */
export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/**
 * FR-023 / contracts/admin-metadata.md C7: empty and malformed. Collisions are
 * `rejectSlugCollision`'s job, because Payload skips validation on a draft save.
 *
 * **This is the required check.** A field's own `validate` replaces Payload's
 * default text validator, which is where `required` is enforced.
 *
 * **Empty passes while `generateSlug` is on.** The browser validates through
 * the `form-state` server function, which runs no field hooks, so a new record
 * is still empty there; the checkbox hook fills it on the real save.
 *
 * On a new record the checkbox hook slugifies a typed value before the save
 * validates it, so a malformed entry is normalised rather than refused. On an
 * existing record the hook leaves the value alone and this refuses it.
 */
export const validateSlug: Validate<string> = (value, { siblingData }) => {
  if (value === undefined || value === null || value === '') {
    return (siblingData as { generateSlug?: unknown } | undefined)?.generateSlug === true
      ? true
      : EMPTY_MESSAGE
  }
  return typeof value === 'string' && SLUG_RE.test(value) ? true : FORMAT_MESSAGE
}

/**
 * FR-024a, as a field hook rather than in `validateSlug`: hooks run on a draft
 * save and validation does not. Without it, a colliding draft save reached only
 * the unique index, whose error names the column and nothing else.
 *
 * Refused by name, never auto-suffixed. The URL map is curated and backed by a
 * 301 table, so `contact-2` would be a URL nobody chose; the message offers a
 * free alternative and taking it is the editor's call.
 */
export const rejectSlugCollision: FieldHook = async ({ collection, originalDoc, req, value }) => {
  if (typeof value !== 'string' || value === '' || !collection) return value
  const doc = originalDoc as { id?: number | string; slug?: unknown } | undefined
  // An unchanged slug cannot newly collide, so ordinary saves skip the query.
  if (doc?.slug === value) return value

  const message = await describeCollision({
    collection: collection.slug as CollectionSlug,
    id: doc?.id,
    req,
    value,
  })
  if (message) {
    const error = new ValidationError({
      collection: collection.slug,
      errors: [{ label: 'URL path', message, path: 'slug' }],
      req,
    })
    // After a Save Draft the admin shows the toast but not field errors, and the
    // toast reads the error's own message ("The following field is invalid: URL
    // path"). Put the sentence that names the conflict there as well.
    error.message = message
    throw error
  }
  return value
}

/**
 * The message for a slug another record already holds, or null. `overrideAccess`,
 * because a draft the current user cannot read still owns the slug in the unique
 * index.
 */
export async function describeCollision({
  collection,
  id,
  req,
  value,
}: {
  collection: CollectionSlug
  id?: number | string
  req: PayloadRequest
  value: string
}): Promise<string | null> {
  const { payload } = req
  const conflict = await payload.find({
    collection,
    where: (id
      ? { and: [{ slug: { equals: value } }, { id: { not_equals: id } }] }
      : { slug: { equals: value } }) as Where,
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })
  const existing = conflict.docs[0] as unknown as Record<string, unknown> | undefined
  if (!existing) return null

  // Name the record by its latest draft title, which is what the list view
  // shows; the main row keeps the last published title until the next publish.
  const titleField = payload.collections[collection]?.config?.admin?.useAsTitle ?? 'id'
  const latest = (await payload
    .findByID({
      collection,
      id: existing.id as number | string,
      draft: true,
      depth: 0,
      overrideAccess: true,
      req,
    })
    .catch(() => undefined)) as unknown as Record<string, unknown> | undefined
  const rawTitle = latest?.[titleField] ?? existing[titleField]
  const conflictName =
    typeof rawTitle === 'string' && rawTitle.length > 0 ? `"${rawTitle}"` : `record ${existing.id}`

  const suggestion = await suggestAlternative(value, collection, req)
  return suggestion
    ? `${conflictName} already uses the URL path "${value}". Try "${suggestion}", or pick another.`
    : `${conflictName} already uses the URL path "${value}". Pick a different one.`
}

/** The first `<slug>-N` nobody holds, found from one `like` query. */
async function suggestAlternative(
  base: string,
  collection: CollectionSlug,
  req: PayloadRequest,
): Promise<string | null> {
  const neighbours = await req.payload.find({
    collection,
    where: { slug: { like: base } } as Where,
    limit: MAX_SUGGESTION * 2,
    depth: 0,
    pagination: false,
    overrideAccess: true,
    req,
  })
  const taken = new Set(
    neighbours.docs
      .map((doc) => (doc as unknown as Record<string, unknown>).slug)
      .filter((s): s is string => typeof s === 'string'),
  )
  for (let n = 2; n <= MAX_SUGGESTION; n++) {
    const candidate = `${base}-${n}`
    if (!taken.has(candidate)) return candidate
  }
  return null
}

export interface UrlPathFieldArgs {
  /** The field the slug is derived from: `title`, `name` or `city`. */
  useAsSlug: string
  /** Editor-facing help, specific to the collection. */
  description: string
}

/** `slugField` with this site's slugify, label, help text, validation and collision check. */
export const urlPathField = ({ useAsSlug, description }: UrlPathFieldArgs): RowField =>
  slugField({
    useAsSlug,
    slugify: ({ valueToSlugify }) =>
      typeof valueToSlugify === 'string' ? slugify(valueToSlugify) : undefined,
    overrides: (row) => {
      // Keep the URL path in the main column, under the field it is derived
      // from, where these forms have always had it. `slugField` defaults to the
      // sidebar.
      if (row.admin) delete row.admin.position
      const slug = row.fields.find((field) => 'name' in field && field.name === 'slug') as TextField
      slug.label = 'URL path'
      slug.validate = validateSlug as TextField['validate']
      slug.hooks = {
        ...slug.hooks,
        beforeChange: [...(slug.hooks?.beforeChange ?? []), rejectSlugCollision],
      }
      // Payload's SlugField renders no description, so it is wrapped in one that does.
      slug.admin = {
        ...slug.admin,
        description,
        components: {
          ...slug.admin?.components,
          Field: {
            path: '@/components/admin/UrlPathField#UrlPathField',
            clientProps: { useAsSlug },
          },
        },
      }
      return row
    },
  })
