import type { CollectionConfig } from 'payload'

import { applyAutoProvisionRole, guardRoleUpdates } from '../lib/auth/apply-bootstrap-role'
import { enforceDomainAllowlist } from '../lib/auth/enforce-domain'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    // `{ enableFields: true }` rather than the bare `true` so Payload still
    // materializes its base auth fields — most importantly the `sessions`
    // array Payload's JWT strategy checks against the cookie's `sid` claim
    // on every admin request (without it, /admin silently bounces to
    // /admin/login). The email/password strategy itself remains disabled.
    disableLocalStrategy: { enableFields: true },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'roles'],
  },
  access: {
    admin: ({ req: { user } }) => Boolean(user?.roles?.length),
    create: () => false,
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')),
    delete: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')),
  },
  hooks: {
    beforeChange: [enforceDomainAllowlist, applyAutoProvisionRole, guardRoleUpdates],
  },
  fields: [
    // `email` is injected by Payload's base auth fields (via
    // disableLocalStrategy.enableFields above); declaring it here would
    // duplicate the column.
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      defaultValue: ['editor'],
      required: true,
    },
    {
      name: 'googleSub',
      label: 'Google subject ID',
      type: 'text',
      index: true,
      unique: true,
      admin: {
        readOnly: true,
        description: 'Stable identifier from Google. Set on first sign-in; never edited.',
      },
    },
  ],
}
