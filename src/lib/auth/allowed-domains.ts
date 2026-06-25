/**
 * Single source of truth for which Google Workspace domains may reach `/admin`.
 *
 * SEQTEK runs two live Workspace domains: the legal entity (`seqtechllc.com`)
 * and the public brand (`seqtek.com`). Staff exist under both — e.g. marketing
 * sits on `@seqtek.com` — so both must be accepted or those editors get
 * domain-rejected at sign-in. This is the ADR 0002 "revisit when the editor set
 * extends beyond `@seqtechllc.com`" revision.
 *
 * Pure module (no Payload/Next imports) so the OAuth route handlers and the
 * collection hook can all share it without dragging in extra graph.
 */
export const ALLOWED_WORKSPACE_DOMAINS = ['seqtechllc.com', 'seqtek.com'] as const

/** True iff `email`'s host is exactly one of the allowed Workspace domains. */
export function isAllowedWorkspaceEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  const at = normalized.lastIndexOf('@')
  if (at === -1) return false
  const domain = normalized.slice(at + 1)
  return (ALLOWED_WORKSPACE_DOMAINS as readonly string[]).includes(domain)
}

/** True iff the Google ID-token `hd` (hosted-domain) claim is an allowed domain. */
export function isAllowedHostedDomain(hd: string | null | undefined): boolean {
  if (!hd) return false
  return (ALLOWED_WORKSPACE_DOMAINS as readonly string[]).includes(hd.trim().toLowerCase())
}
