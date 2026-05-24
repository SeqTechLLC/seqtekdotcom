import type { CollectionConfig } from 'payload'

import { applyAutoProvisionRole, guardRoleUpdates } from '../lib/auth/apply-bootstrap-role'
import { enforceDomainAllowlist } from '../lib/auth/enforce-domain'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    disableLocalStrategy: true,
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
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
    },
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
