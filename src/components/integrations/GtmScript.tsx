import Script from 'next/script'
import { headers } from 'next/headers'
import { NONCE_HEADER } from '@/lib/csp'

/**
 * GTM init snippet — env-gated so unset local dev / CI environments don't
 * hit `googletagmanager.com`. The dynamically inserted gtm.js inherits trust
 * via CSP `'strict-dynamic'` (the inline snippet itself carries the nonce).
 *
 * Per INTEGRATIONS.md §2.1 we load GTM as `afterInteractive`. The consent
 * default in `ConsentDefault.tsx` (beforeInteractive) has already stamped
 * `window.dataLayer` by the time gtm.js arrives.
 */
export async function GtmScript() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID
  if (!gtmId) return null

  const nonce = (await headers()).get(NONCE_HEADER) ?? undefined

  const snippet = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`

  return (
    <>
      <Script
        id="gtm-init"
        strategy="afterInteractive"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: snippet }}
      />
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  )
}
