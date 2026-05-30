import { describe, expect, it } from 'vitest'

import { slugFromTitle, validateSlug } from '../../../src/payload/hooks/slugFromTitle'

type HookArgs = Parameters<ReturnType<typeof slugFromTitle>>[0]

const minimalArgs = (data: Record<string, unknown>, operation: 'create' | 'update'): HookArgs =>
  ({
    data,
    operation,
    originalDoc: undefined,
    req: { payload: {} },
    collection: { slug: 'pages' },
  }) as unknown as HookArgs

describe('slugFromTitle (FR-003)', () => {
  const hook = slugFromTitle('title')

  it('auto-generates slug from title on create', async () => {
    const result = await hook(minimalArgs({ title: 'My First Page' }, 'create'))
    expect((result as { slug: string }).slug).toBe('my-first-page')
  })

  it('does not overwrite an existing slug on create', async () => {
    const result = await hook(
      minimalArgs({ title: 'My First Page', slug: 'custom-slug' }, 'create'),
    )
    expect((result as { slug: string }).slug).toBe('custom-slug')
  })

  it('does not auto-generate slug on update', async () => {
    const result = await hook(minimalArgs({ title: 'Renamed Page' }, 'update'))
    expect((result as { slug?: string }).slug).toBeUndefined()
  })

  it('strips punctuation, normalizes unicode, lowercases', async () => {
    const result = await hook(minimalArgs({ title: 'Café & Crème — A Modern Brûlée!' }, 'create'))
    // NFKD-normalize then strip combining marks; accented letters become
    // their base Latin counterparts.
    expect((result as { slug: string }).slug).toBe('cafe-creme-a-modern-brulee')
  })

  it('produces no slug when title is missing or empty', async () => {
    const a = await hook(minimalArgs({}, 'create'))
    const b = await hook(minimalArgs({ title: '' }, 'create'))
    expect((a as { slug?: string }).slug).toBeUndefined()
    expect((b as { slug?: string }).slug).toBeUndefined()
  })
})

describe('validateSlug (FR-003)', () => {
  it('accepts kebab-case', () => {
    expect(validateSlug('my-page-1')).toBe(true)
    expect(validateSlug('a')).toBe(true)
    expect(validateSlug('123')).toBe(true)
  })

  it('rejects empty', () => {
    expect(validateSlug('')).toBe('Slug is required')
    expect(validateSlug(undefined)).toBe('Slug is required')
  })

  it('rejects uppercase, spaces, and disallowed characters', () => {
    expect(typeof validateSlug('My-Page')).toBe('string')
    expect(typeof validateSlug('my page')).toBe('string')
    expect(typeof validateSlug('my_page')).toBe('string')
    expect(typeof validateSlug('my/page')).toBe('string')
  })

  it('rejects leading or trailing dashes', () => {
    expect(typeof validateSlug('-leading')).toBe('string')
    expect(typeof validateSlug('trailing-')).toBe('string')
  })
})
