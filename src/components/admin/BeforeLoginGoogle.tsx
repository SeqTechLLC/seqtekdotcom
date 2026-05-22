export default function BeforeLoginGoogle() {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- OAuth authorize is an API route, not a page; needs a real navigation to trigger the 302 redirect chain. */}
      <a
        className="inline-flex w-full items-center justify-center rounded-md bg-brand-green-500 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-brand-green-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green-700 focus-visible:ring-offset-2"
        href="/api/seqtek/oauth/authorize/google"
      >
        Sign in with Google
      </a>
      <p className="text-center text-sm text-neutral-600">
        Restricted to SEQTEK Workspace accounts (@seqtechllc.com).
      </p>
    </div>
  )
}
