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
    // GHSA-jg8r-5jh2-v2xj. Payload's `unlock` access defaults to "any
    // authenticated user", so an editor could clear another account's lockout.
    // The audit lists no fixed version (the advisory is against the default,
    // not a bug), and the remediation is to declare the access control — so
    // declare it, at the same level as `update` and `delete`.
    //
    // The exposure here is shape, not effect: `disableLocalStrategy` means
    // there is no password login, `incrementLoginAttempts` only runs in the
    // local strategy, and so no account ever locks in the first place. Setting
    // `maxLoginAttempts: 0` would drop the lock fields outright and close it at
    // the schema — but that is a column drop and therefore a migration, which
    // is not worth it for a path nothing reaches. This is the config-only half.
    unlock: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')),
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
      label: 'Full name',
      required: true,
      admin: { description: 'Shown wherever this account appears in the panel.' },
    },
    {
      name: 'roles',
      type: 'select',
      label: 'Access level',
      hasMany: true,
      admin: {
        description:
          'Editors can create, edit and publish content. Admins can do that, and can also delete records and change access here. Accounts themselves are created by signing in with Google, never in this panel.',
      },
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
