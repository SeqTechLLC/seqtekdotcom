import type { Access, PayloadRequest } from 'payload'

const isAuthedEditorial = (req: PayloadRequest): boolean =>
  Boolean(req.user?.roles?.some((r) => r === 'admin' || r === 'editor'))

export const publishedOrAuthed: Access = ({ req }) => {
  if (isAuthedEditorial(req)) return true
  return { _status: { equals: 'published' } }
}

/**
 * Global-shaped equivalent of `publishedOrAuthed`. Payload's global read access
 * receives the same `{ req }` arg but its return value must be a boolean or a
 * Where clause that filters the underlying versions table (`_status`). Anon
 * callers see only the published version; admin/editor sessions see drafts.
 * (FR-016 / SC-006 — contract `public-api-draft-filter.md`.)
 */
export const publishedOrAuthedGlobal: Access = ({ req }) => {
  if (isAuthedEditorial(req)) return true
  return { _status: { equals: 'published' } }
}
