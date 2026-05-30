import type { CollectionBeforeChangeHook } from 'payload'

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const validateSlug = (value: unknown): true | string => {
  if (typeof value !== 'string' || value.length === 0) return 'Slug is required'
  return SLUG_RE.test(value) || 'Slug must be lowercase letters, numbers, and dashes only'
}

/**
 * Auto-fills `slug` on create from a source field (default: `title`). Never
 * rewrites an existing slug on update — editors can rename freely.
 */
export const slugFromTitle =
  (sourceField: string = 'title'): CollectionBeforeChangeHook =>
  ({ data, operation }) => {
    if (data.slug && typeof data.slug === 'string' && data.slug.length > 0) return data
    if (operation !== 'create') return data
    const source = data[sourceField]
    if (typeof source !== 'string' || source.length === 0) return data
    const candidate = slugify(source)
    if (candidate.length === 0) return data
    return { ...data, slug: candidate }
  }
