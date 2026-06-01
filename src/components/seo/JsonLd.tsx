import { headers } from 'next/headers'

import { NONCE_HEADER } from '@/lib/csp'
import type { JsonLdObject } from '@/lib/structured-data'

// spec 004 Phase 2 (T008). Nonce-safe JSON-LD emitter. Reads the per-request
// CSP nonce the proxy stamps on the request headers (same pattern as
// GtmScript) and attaches it to the `<script type="application/ld+json">` so
// `script-src 'nonce-…' 'strict-dynamic'` admits it. A raw un-nonced inline
// script would be CSP-blocked (Constitution §IV).

interface JsonLdProps {
  data: JsonLdObject | JsonLdObject[]
}

export async function JsonLd({ data }: JsonLdProps) {
  const nonce = (await headers()).get(NONCE_HEADER) ?? undefined
  // JSON.stringify escapes `<` only as needed; replace the closing-tag
  // sequence defensively so the payload can't break out of the <script>.
  const json = JSON.stringify(data).replace(/</g, '\\u003c')

  return (
    <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: json }} />
  )
}
