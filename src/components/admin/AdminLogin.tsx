import BeforeLoginGoogle from './BeforeLoginGoogle'
import LoginError from './LoginError'

interface AdminLoginProps {
  searchParams?: { error?: string | string[] }
}

export default function AdminLogin({ searchParams }: AdminLoginProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-12">
      <header className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">SEQTEK Admin</h1>
        <p className="text-sm text-neutral-600">Sign in to manage content.</p>
      </header>
      <LoginError searchParams={searchParams} />
      <BeforeLoginGoogle />
    </main>
  )
}
