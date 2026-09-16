import { describe, expect, it } from 'vitest'
import type { Field, FieldHook, TextField } from 'payload'

import { collections } from '../../../src/collections'
import {
  rejectSlugCollision,
  slugify,
  urlPathField,
  validateSlug,
} from '../../../src/payload/fields/slug'

/**
 * Spec 011 US5 — contracts/admin-metadata.md C7, FR-022 to FR-024a.
 *
 * Unit level: the slugifier, the validator, the collision hook (with a stub
 * `find`/`findByID`, so the message is covered without a database), and the
 * wiring `urlPathField` puts on Payload's `slugField`. The admin behaviour is
 * `tests/e2e/admin/slugField.e2e.spec.ts`.
 */

type ValidateOpts = Parameters<typeof validateSlug>[1]
type HookArgs = Parameters<FieldHook>[0]

const validate = (value: unknown, siblingData: Record<string, unknown> = {}) =>
  validateSlug(value as string, { siblingData } as unknown as ValidateOpts)

type Row = { id: number; slug: string; title?: string }

/** A `req` whose `find` answers from `rows` and whose `findByID` can report a newer draft title. */
const reqWith = (rows: Row[], latestTitles: Record<number, string> = {}, calls = { find: 0 }) =>
  ({
    payload: {
      collections: { pages: { config: { admin: { useAsTitle: 'title' } } } },
      find: async ({ where }: { where: Record<string, unknown> }) => {
        calls.find++
        const and = where.and as { slug?: { equals?: string }; id?: { not_equals?: number } }[]
        if (and) {
          const wanted = and[0]?.slug?.equals
          const excluded = and[1]?.id?.not_equals
          return { docs: rows.filter((r) => r.slug === wanted && r.id !== excluded) }
        }
        const clause = where.slug as { equals?: string; like?: string }
        if (clause?.equals !== undefined)
          return { docs: rows.filter((r) => r.slug === clause.equals) }
        return { docs: rows.filter((r) => r.slug.includes(String(clause?.like ?? ''))) }
      },
      findByID: async ({ id }: { id: number }) => {
        const row = rows.find((r) => r.id === id)
        return row ? { ...row, title: latestTitles[id] ?? row.title } : undefined
      },
    },
  }) as unknown as HookArgs['req']

const runHook = (value: unknown, req: HookArgs['req'], originalDoc?: Record<string, unknown>) =>
  rejectSlugCollision({
    collection: { slug: 'pages' },
    originalDoc,
    req,
    value,
  } as unknown as HookArgs)

/** The first field error on a thrown ValidationError. */
async function thrownError(promise: unknown) {
  try {
    await promise
  } catch (error) {
    return (error as { data?: { errors?: { label?: string; message: string; path: string }[] } })
      .data?.errors?.[0]
  }
  return undefined
}

describe('slugify', () => {
  it('folds accents and collapses punctuation into single hyphens', () => {
    expect(slugify('Café & Crème — A Modern Brûlée!')).toBe('cafe-creme-a-modern-brulee')
  })

  it('trims leading and trailing separators', () => {
    expect(slugify('  --Hello World--  ')).toBe('hello-world')
  })
})

describe('validateSlug — empty (the required check)', () => {
  it('passes an empty slug while generateSlug is on, because the save derives it', () => {
    expect(validate('', { generateSlug: true })).toBe(true)
    expect(validate(undefined, { generateSlug: true })).toBe(true)
  })

  it('refuses an empty slug once generateSlug is off', () => {
    for (const empty of ['', undefined, null]) {
      expect(validate(empty, { generateSlug: false }), String(empty)).toMatch(/Generate/)
    }
  })

  it('refuses an empty slug when there is no generateSlug at all', () => {
    expect(typeof validate('')).toBe('string')
  })
})

describe('validateSlug — format (FR-023)', () => {
  it('accepts kebab-case', () => {
    for (const good of ['my-page-1', 'a', '123']) expect(validate(good), good).toBe(true)
  })

  it('rejects capitals, spaces, underscores, slashes and edge hyphens', () => {
    for (const bad of ['My-Page', 'my page', 'my_page', 'my/page', '-leading', 'trailing-']) {
      expect(typeof validate(bad), bad).toBe('string')
    }
  })

  it('shows the shape rather than describing a regex', () => {
    expect(validate('Not A Slug')).toMatch(/case-study-workshop/)
  })
})

describe('rejectSlugCollision (FR-024a)', () => {
  const rows: Row[] = [
    { id: 1, slug: 'contact', title: 'Contact us' },
    { id: 2, slug: 'contact-2', title: 'Contact, old' },
  ]

  it('lets a free slug through unchanged', async () => {
    expect(await runHook('about', reqWith(rows))).toBe('about')
  })

  it('throws a URL path field error naming the record and offering the first free alternative', async () => {
    const error = await thrownError(runHook('contact', reqWith(rows)))
    expect(error?.path).toBe('slug')
    expect(error?.label).toBe('URL path')
    expect(error?.message).toContain('"Contact us"')
    expect(error?.message).toContain('"contact"')
    expect(error?.message).toContain('"contact-3"')
  })

  it("puts the same sentence on the error's own message, which a draft save toasts", async () => {
    let message: string | undefined
    try {
      await runHook('contact', reqWith(rows))
    } catch (error) {
      message = (error as Error).message
    }
    expect(message).toContain('"Contact us"')
    expect(message).toContain('"contact-3"')
  })

  it('names the record by its latest draft title, not the stale published one', async () => {
    const error = await thrownError(
      runHook('contact', reqWith(rows, { 1: 'Contact, renamed in a draft' })),
    )
    expect(error?.message).toContain('"Contact, renamed in a draft"')
  })

  it('does not collide a record with its own row when its slug changes', async () => {
    const own = [{ id: 1, slug: 'contact', title: 'Contact us' }]
    expect(await runHook('contact', reqWith(own), { id: 1, slug: 'contact-old' })).toBe('contact')
  })

  it('skips the lookup when the slug has not changed', async () => {
    const calls = { find: 0 }
    expect(await runHook('contact', reqWith(rows, {}, calls), { id: 1, slug: 'contact' })).toBe(
      'contact',
    )
    expect(calls.find, 'an unchanged slug must not query').toBe(0)
  })

  it('falls back to the record id when the title field is empty', async () => {
    const error = await thrownError(runHook('x', reqWith([{ id: 9, slug: 'x' }])))
    expect(error?.message).toContain('record 9')
  })
})

/** Top-level and row/collapsible/tab children, which is where a slug field can live. */
function walk(fields: Field[]): Field[] {
  return fields.flatMap((field) => {
    if (field.type === 'row' || field.type === 'collapsible') return [field, ...walk(field.fields)]
    if (field.type === 'tabs') return [field, ...field.tabs.flatMap((tab) => walk(tab.fields))]
    return [field]
  })
}

describe('urlPathField', () => {
  const row = urlPathField({ useAsSlug: 'name', description: 'Help for an editor.' })
  const slug = row.fields.find((f) => 'name' in f && f.name === 'slug') as TextField
  const checkbox = row.fields.find((f) => 'name' in f && f.name === 'generateSlug')

  it('keeps the URL path in the main column, not the sidebar', () => {
    expect(row.admin?.position).toBeUndefined()
  })

  it('labels, describes, validates and collision-checks the slug', () => {
    expect(slug.label).toBe('URL path')
    expect(slug.admin?.description).toBe('Help for an editor.')
    expect(slug.validate).toBe(validateSlug)
    expect(slug.hooks?.beforeChange).toContain(rejectSlugCollision)
    expect(slug.required).toBe(true)
    expect(slug.unique).toBe(true)
  })

  it("carries the generateSlug checkbox slugField's hook depends on", () => {
    expect(checkbox).toMatchObject({ type: 'checkbox', defaultValue: true })
  })

  it("derives with this site's slugify, not Payload's default", () => {
    const derive = (slug.custom as { slugify?: (a: { valueToSlugify?: unknown }) => unknown })
      .slugify
    expect(derive?.({ valueToSlugify: 'Café & Crème' })).toBe('cafe-creme')
  })

  it('renders through the wrapper that shows the description, with the source field', () => {
    const component = slug.admin?.components?.Field as {
      path?: string
      clientProps?: { useAsSlug?: string }
    }
    expect(component?.path).toBe('@/components/admin/UrlPathField#UrlPathField')
    expect(component?.clientProps?.useAsSlug).toBe('name')
  })
})

describe('every collection with a URL path gets it from urlPathField', () => {
  const withSlug = collections.filter((c) =>
    walk(c.fields).some((f) => 'name' in f && f.name === 'slug'),
  )

  it('there are collections to check', () => {
    expect(withSlug.length).toBeGreaterThanOrEqual(10)
  })

  it.each(withSlug.map((c) => [c.slug, c] as const))('%s', (_slug, collection) => {
    const fields = walk(collection.fields)
    const slug = fields.find((f) => 'name' in f && f.name === 'slug') as TextField
    expect(slug.validate, 'slug must be validated by validateSlug').toBe(validateSlug)
    expect(slug.hooks?.beforeChange, 'slug must run the collision hook').toContain(
      rejectSlugCollision,
    )
    expect(
      fields.some((f) => 'name' in f && f.name === 'generateSlug'),
      'a slug without generateSlug is not the built-in field',
    ).toBe(true)
  })
})
