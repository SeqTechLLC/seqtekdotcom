import type { CollectionConfig } from 'payload'
import { withUsersCollection } from 'payload-auth-plugin/collection'
import { applyAutoProvisionRole } from '../lib/auth/apply-bootstrap-role'
import { enforceDomainAllowlist } from '../lib/auth/enforce-domain'

export const Users: CollectionConfig = withUsersCollection({
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
    beforeChange: [enforceDomainAllowlist, applyAutoProvisionRole],
  },
  fields: [
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
  ],
})
