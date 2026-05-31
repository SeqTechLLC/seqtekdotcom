import { expect, test } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import config from '../../../src/payload.config'
import { issueSessionCookie } from '../../../src/lib/auth/session-cookie'
import type { User } from '../../../src/payload-types'
import { parseSetCookieForContext } from '../../sessions/editorSession'

/**
 * T110 / SC-009 / FR-036 / FR-037.
 *
 * Two-part guarantee:
 *
 *   1. On a fresh `users` table the very first OAuth-provisioning
 *      create must promote the signer to `admin`; the second must
 *      stay at `editor`. The wiring lives in
 *      `src/lib/auth/apply-bootstrap-role.ts`; spec 001 covers it at
 *      the int level in `tests/int/auth-provisioning.int.spec.ts`.
 *      This file re-asserts at the E2E layer.
 *
 *   2. A minted Payload session cookie for an admin actually lands on
 *      `/admin` (the JWTAuthentication strategy keeps recognizing
 *      cookies even with `disableLocalStrategy` set — see the inline
 *      rationale in `src/collections/Users.ts`). This part is what
 *      catches a future regression like spec 001's earlier
 *      `local-jwt`-not-registered bug.
 *
 * Wiping the users table is destructive against the local dev DB
 * (shared via .env.local DATABASE_URL with the main worktree's admin
 * row). The bootstrap-promotion tests are gated behind
 * `E2E_ALLOW_DESTRUCTIVE=true` (or `CI`) so a local `npm run test:e2e`
 * stays non-destructive. The cookie-path test always runs because it
 * works with an isolated fixture user.
 */

const BOOTSTRAP_ADMIN = {
  email: 'fixture-first-signin-admin@seqtechllc.com',
  name: 'First-Sign-In Admin',
  sub: 'fixture-first-signin-admin-sub',
}

const SECOND_EDITOR = {
  email: 'fixture-first-signin-editor@seqtechllc.com',
  name: 'First-Sign-In Editor',
  sub: 'fixture-first-signin-editor-sub',
}

const COOKIE_ADMIN = {
  email: 'fixture-first-signin-cookie-admin@seqtechllc.com',
  name: 'First-Sign-In Cookie Admin',
  sub: 'fixture-first-signin-cookie-admin-sub',
}

let payload: Payload

async function deleteFixtureUser(sub: string): Promise<void> {
  await payload.delete({
    collection: 'users',
    where: { googleSub: { equals: sub } },
    overrideAccess: true,
  })
}

async function deleteAllUsers(): Promise<void> {
  await payload.delete({
    collection: 'users',
    where: { id: { exists: true } },
    overrideAccess: true,
  })
}

const ALLOW_DESTRUCTIVE = process.env.E2E_ALLOW_DESTRUCTIVE === 'true' || !!process.env.CI

test.describe('T110 — first-sign-in bootstrap (SC-009 / FR-036 / FR-037)', () => {
  test.beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  test.describe('bootstrap promotion (destructive: wipes users table)', () => {
    test.skip(
      !ALLOW_DESTRUCTIVE,
      'destructive: wipes users table; set E2E_ALLOW_DESTRUCTIVE=true to run locally',
    )

    test.afterAll(async () => {
      await deleteFixtureUser(BOOTSTRAP_ADMIN.sub)
      await deleteFixtureUser(SECOND_EDITOR.sub)
    })

    test('first OAuth-provisioning create on empty table → role=admin', async () => {
      await deleteAllUsers()
      const first = (await payload.create({
        collection: 'users',
        data: {
          email: BOOTSTRAP_ADMIN.email,
          name: BOOTSTRAP_ADMIN.name,
          // The Google OAuth callback always submits role=editor; the
          // bootstrap hook promotes to admin only when the table is
          // empty. Submitting editor here mirrors the production code
          // path, not a permissive shortcut.
          roles: ['editor'],
          googleSub: BOOTSTRAP_ADMIN.sub,
        },
        overrideAccess: true,
        req: { user: null } as Parameters<typeof payload.create>[0]['req'],
      })) as User
      expect(first.roles).toEqual(['admin'])
      expect(first.googleSub).toBe(BOOTSTRAP_ADMIN.sub)
    })

    test('second OAuth-provisioning create defaults to role=editor', async () => {
      const second = (await payload.create({
        collection: 'users',
        data: {
          email: SECOND_EDITOR.email,
          name: SECOND_EDITOR.name,
          roles: ['editor'],
          googleSub: SECOND_EDITOR.sub,
        },
        overrideAccess: true,
        req: { user: null } as Parameters<typeof payload.create>[0]['req'],
      })) as User
      expect(second.roles).toEqual(['editor'])
    })
  })

  test.describe('admin session cookie path', () => {
    test.afterAll(async () => {
      await deleteFixtureUser(COOKIE_ADMIN.sub)
    })

    test('minted admin session lands on /admin (not /admin/login)', async ({
      context,
      page,
      baseURL,
    }) => {
      // Bypass the bootstrap path by creating the admin directly with
      // overrideAccess + explicit roles. This isolates the cookie/JWT
      // path from the table-wipe destructive concern.
      await deleteFixtureUser(COOKIE_ADMIN.sub)
      const adminUser = (await payload.create({
        collection: 'users',
        data: {
          email: COOKIE_ADMIN.email,
          name: COOKIE_ADMIN.name,
          roles: ['admin'],
          googleSub: COOKIE_ADMIN.sub,
        },
        overrideAccess: true,
      })) as User

      const { cookie } = await issueSessionCookie({ payload, user: adminUser })
      expect(baseURL).toBeTruthy()
      await context.addCookies([parseSetCookieForContext(cookie, baseURL!)])

      await page.goto('/admin')
      await expect(page).toHaveURL(/\/admin(?!\/login)/, { timeout: 10_000 })
    })
  })
})
