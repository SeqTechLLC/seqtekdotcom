export default function BeforeLoginGoogle() {
  return (
    <div className="admin-login-google">
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- OAuth authorization is an API route, not a page; needs a real navigation to trigger the 302 redirect chain. */}
      <a className="admin-login-google__cta" href="/api/auth/oauth/authorization/google">
        Sign in with Google
      </a>
      <p className="admin-login-google__hint">
        Restricted to SEQTEK Workspace accounts (@seqtechllc.com or @seqtek.com).
      </p>
    </div>
  )
}
