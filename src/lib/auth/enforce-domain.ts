import type { CollectionBeforeChangeHook } from 'payload'

export function isWorkspaceEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.trim().toLowerCase().endsWith('@seqtechllc.com')
}

export const enforceDomainAllowlist: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (operation !== 'create') return data
  return data
}
