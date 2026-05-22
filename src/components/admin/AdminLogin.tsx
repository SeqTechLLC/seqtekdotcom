import BeforeLoginGoogle from './BeforeLoginGoogle'
import LoginError from './LoginError'

interface AdminLoginProps {
  searchParams?: { error?: string | string[] }
}

export default function AdminLogin({ searchParams }: AdminLoginProps) {
  return (
    <main className="admin-login">
      <header className="admin-login__header">
        <h1>SEQTEK Admin</h1>
        <p>Sign in to manage content.</p>
      </header>
      <LoginError searchParams={searchParams} />
      <BeforeLoginGoogle />
    </main>
  )
}
