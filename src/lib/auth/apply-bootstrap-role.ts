import type { CollectionBeforeChangeHook } from 'payload'

import { logSignIn } from './sign-in-audit'

type Role = 'admin' | 'editor'

function rolesIncludeAdmin(roles: unknown): boolean {
  return Array.isArray(roles) && roles.includes('admin')
}

/**
 * On OAuth-provisioning creates (req.user == null), force the role to:
 *   - 'admin'  when the users table currently has zero admins (bootstrap)
 *   - 'editor' otherwise
 *
 * Authenticated creates (admin clicking "Create" in the admin UI) keep the
 * caller-supplied role. The Users access matrix already forbids
 * unauthenticated creates from non-plugin code paths.
 */
export const applyAutoProvisionRole: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
}) => {
  if (operation !== 'create') return data
  if (req.user) return data

  const existingAdmins = await req.payload.find({
    collection: 'users',
    where: {
      roles: {
        in: ['admin'],
      },
    },
    limit: 1,
    pagination: false,
    overrideAccess: true,
  })

  const nextRole: Role = existingAdmins.docs.length === 0 ? 'admin' : 'editor'
  const next = { ...data, roles: [nextRole] }

  logSignIn({
    email: String(data.email ?? ''),
    outcome: 'success',
    provider: 'google',
  })

  return next
}

/**
 * On updates with no authenticated requester, forbid changes to `roles`.
 * Defends FR-007 (preserve role across sign-ins) against forged or replayed
 * unauthenticated PATCH requests.
 */
export const guardRoleUpdates: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
  operation,
}) => {
  if (operation !== 'update') return data
  if (req.user) return data

  const previousRoles = originalDoc?.roles
  if (rolesIncludeAdmin(data.roles) !== rolesIncludeAdmin(previousRoles)) {
    throw new Error('Role changes require an authenticated admin.')
  }
  return data
}
