import type { Access } from 'payload'

export const publishedOrAuthed: Access = ({ req }) => {
  if (req.user?.roles?.length) return true
  return { _status: { equals: 'published' } }
}
