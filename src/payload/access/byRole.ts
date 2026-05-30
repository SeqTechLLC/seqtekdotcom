import type { AccessArgs, PayloadRequest } from 'payload'

const hasRole = (roles: string[] | null | undefined, role: 'admin' | 'editor'): boolean =>
  Boolean(roles?.includes(role))

/**
 * Returns true when the request user has the `admin` role. Returns a boolean
 * (not a Where clause) so the same helper is reusable on `access.admin`
 * (boolean-only) and CRUD ops.
 */
export const isAdmin = ({ req }: AccessArgs | { req: PayloadRequest }): boolean =>
  hasRole(req.user?.roles ?? null, 'admin')

export const isAdminOrEditor = ({ req }: AccessArgs | { req: PayloadRequest }): boolean =>
  hasRole(req.user?.roles ?? null, 'admin') || hasRole(req.user?.roles ?? null, 'editor')
