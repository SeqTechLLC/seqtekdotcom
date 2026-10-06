import Script from 'next/script'
import { headers } from 'next/headers'
import { NONCE_HEADER } from '@/lib/csp'
import { linkedInInsightSnippet } from '@/lib/analytics/linkedInInsight'

/**
 * LinkedIn Insight Tag loader — env-gated on NEXT_PUBLIC_LINKEDIN_PARTNER_ID,
 * consent-gated inside the snippet (`src/lib/analytics/linkedInInsight.ts`).
 */
export async function LinkedInInsightTag() {
  const partnerId = process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID
  if (!partnerId) return null

  const nonce = (await headers()).get(NONCE_HEADER) ?? undefined

  return (
    <Script
      id="linkedin-insight"
      strategy="afterInteractive"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: linkedInInsightSnippet(partnerId) }}
    />
  )
}
