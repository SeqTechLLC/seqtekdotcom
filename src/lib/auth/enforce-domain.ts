import type { CollectionBeforeChangeHook } from 'payload'

import { isAllowedWorkspaceEmail } from './allowed-domains'
import { logSignIn } from './sign-in-audit'

/**
 * True iff `email` belongs to a SEQTEK Workspace domain (`seqtechllc.com` or
 * `seqtek.com`). Thin alias over the shared allowlist — kept under this name
 * because it is the documented public check (FR-002). See `allowed-domains.ts`.
 */
export function isWorkspaceEmail(email: string | null | undefined): boolean {
  return isAllowedWorkspaceEmail(email)
}

/**
 * On OAuth-provisioning creates (req.user == null), reject any email not in a
 * SEQTEK Google Workspace tenant. Throws before any row is written (FR-003).
 * Audit-logs the rejection so unexpected access patterns are observable in
 * CloudWatch (FR-011).
 */
export const enforceDomainAllowlist: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
}) => {
  if (operation !== 'create') return data
  if (req.user) return data

  const email = String(data.email ?? '')
  if (!isWorkspaceEmail(email)) {
    logSignIn({
      email,
      outcome: 'domain-rejected',
      provider: 'google',
      errorCode: 'domain_rejected',
    })
    throw new Error('Only SEQTEK Workspace accounts may sign in.')
  }
  return data
}
