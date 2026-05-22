import type { CollectionConfig } from 'payload'
import { withAccountCollection } from 'payload-auth-plugin/collection'

export const Accounts: CollectionConfig = withAccountCollection(
  {
    slug: 'accounts',
    admin: {
      useAsTitle: 'sub',
      defaultColumns: ['user', 'issuerName', 'sub'],
      group: 'Auth',
    },
    access: {
      admin: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')),
      create: () => false,
      read: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')),
      update: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')),
      delete: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')),
    },
  },
  'users',
)
