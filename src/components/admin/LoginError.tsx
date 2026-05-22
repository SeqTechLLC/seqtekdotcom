const ERROR_MESSAGES: Record<string, string> = {
  state_mismatch: 'Sign-in expired. Please try again.',
  domain_rejected: 'Only SEQTEK Workspace accounts can sign in here.',
  provider_error: "Google couldn't sign you in. Please try again.",
  network: "We couldn't reach Google. Please try again.",
  internal: 'Something went wrong. Please try again.',
}

interface LoginErrorProps {
  searchParams?: { error?: string | string[] }
}

export default function LoginError({ searchParams }: LoginErrorProps) {
  const raw = searchParams?.error
  const code = Array.isArray(raw) ? raw[0] : raw
  if (!code) return null
  const message = ERROR_MESSAGES[code] ?? ERROR_MESSAGES.internal
  return (
    <div className="admin-login-error" role="alert" data-error-code={code}>
      {message}
    </div>
  )
}
