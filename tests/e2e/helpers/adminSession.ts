import type { BrowserContext } from '@playwright/test'

import {
  attachEditorSessionToContext,
  cleanupEditorSession,
  parseSetCookieForContext,
  type EditorSession,
} from '../../sessions/editorSession'

/**
 * Spec 011 T002 — reusable admin-session fixture.
 *
 * Every admin-panel E2E spec in this feature needs the same three lines:
 * mint an editorial user, attach its session cookie to the browser context,
 * and delete the user afterwards. `editorDeleteForbidden.e2e.spec.ts` open-codes
 * that today; the specs added here (block picker, variant fields, slug
 * creation) would each open-code it again.
 *
 * This wrapper derives a unique fixture identity from a caller-supplied
 * label so parallel specs never collide on the `users.email` unique index,
 * and returns a `dispose` that is safe to call unconditionally in
 * `afterAll` — including when setup failed partway.
 */

export interface AdminSession extends EditorSession {
  email: string
  /**
   * Attach this ALREADY-MINTED session to another browser context.
   *
   * Prefer this in `beforeEach` over calling `useAdminSession` again: that
   * re-seeds, and re-seeding deletes and recreates the fixture user, so every
   * test in the file runs as a different user id and the previous test's
   * cookie is dead the moment the next one starts.
   */
  attachTo: (context: BrowserContext) => Promise<void>
  /** Idempotent teardown. Safe to call more than once. */
  dispose: () => Promise<void>
}

/**
 * Mint an editor session and attach it to `context`.
 *
 * @param label short kebab-case identifier unique to the calling spec —
 *   it becomes part of the fixture user's email, so two specs running in
 *   parallel must not share one.
 */
export async function useAdminSession(
  context: BrowserContext,
  baseURL: string,
  label: string,
  role: 'admin' | 'editor' = 'editor',
): Promise<AdminSession> {
  const email = `fixture-${label}@seqtechllc.com`

  const session = await attachEditorSessionToContext(context, baseURL, {
    email,
    name: `Fixture ${label}`,
    sub: `fixture-${label}-sub`,
    role,
  })

  let disposed = false

  return {
    ...session,
    email,
    attachTo: async (target: BrowserContext) => {
      await target.addCookies([parseSetCookieForContext(session.cookieHeader, baseURL)])
    },
    dispose: async () => {
      if (disposed) return
      disposed = true
      await cleanupEditorSession(email)
    },
  }
}
