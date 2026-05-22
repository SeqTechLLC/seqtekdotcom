import type { CollectionBeforeChangeHook } from 'payload'

import { logSignIn } from './sign-in-audit'

const ALLOWED_DOMAIN = '@seqtechllc.com'

export function isWorkspaceEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.trim().toLowerCase().endsWith(ALLOWED_DOMAIN)
}

/**
 * On OAuth-provisioning creates (req.user == null), reject any email not in
 * the SEQTEK Google Workspace tenant. Throws before any row is written
 * (FR-003). Audit-logs the rejection so unexpected access patterns are
 * observable in CloudWatch (FR-011).
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
