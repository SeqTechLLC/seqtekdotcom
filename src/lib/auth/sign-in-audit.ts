export type SignInOutcome = 'success' | 'domain-rejected' | 'oauth-error'

export interface SignInAuditEvent {
  email: string
  outcome: SignInOutcome
  provider: 'google'
  ip?: string
  userId?: string
  errorCode?: string
}

export function logSignIn(event: SignInAuditEvent): void {
  const payload = {
    event: 'admin_sign_in',
    ts: new Date().toISOString(),
    email: event.email.toLowerCase(),
    outcome: event.outcome,
    provider: event.provider,
    ...(event.ip ? { ip: event.ip } : {}),
    ...(event.userId ? { userId: event.userId } : {}),
    ...(event.errorCode ? { errorCode: event.errorCode } : {}),
  }
  console.log(JSON.stringify(payload))
}
