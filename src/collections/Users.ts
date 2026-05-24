import type { CollectionConfig } from 'payload'
import { JWTAuthentication } from 'payload'

import { applyAutoProvisionRole, guardRoleUpdates } from '../lib/auth/apply-bootstrap-role'
import { enforceDomainAllowlist } from '../lib/auth/enforce-domain'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    // `{ enableFields: true }` rather than the bare `true` so Payload still
    // materializes its base auth fields — most importantly the `sessions`
    // array Payload's JWT strategy checks against the cookie's `sid` claim
    // on every admin request. The email/password strategy itself remains
    // disabled.
    disableLocalStrategy: { enableFields: true },
    // Payload only auto-registers `local-jwt` in `payload.authStrategies`
    // when `disableLocalStrategy` is falsy (see payload/dist/index.js step
    // 3-4 in init). With it set, `executeAuthStrategies` would return
    // user:null and the admin shell would silently redirect /admin →
    // /admin/login even with a perfectly valid session cookie. We register
    // the same JWTAuthentication explicitly so the cookie path keeps
    // working post-OAuth.
    strategies: [{ name: 'local-jwt', authenticate: JWTAuthentication }],
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
