export default function BeforeLoginGoogle() {
  return (
    <div className="admin-login-google">
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- OAuth authorize is an API route, not a page; needs a real navigation to trigger the 302 redirect chain. */}
      <a className="admin-login-google__cta" href="/api/seqtek/oauth/authorize/google">
        Sign in with Google
      </a>
      <p className="admin-login-google__hint">
        Restricted to SEQTEK Workspace accounts (@seqtechllc.com).
      </p>
    </div>
  )
}
