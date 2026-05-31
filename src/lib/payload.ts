import 'server-only'

import { cache } from 'react'
import { getPayload, type Payload } from 'payload'

import config from '@/payload.config'
import type { SiteSetting, Navigation, Homepage } from '@/payload-types'

// T134 / spec 003 Polish. Module-level singleton + per-request `React.cache()`
// readers so multiple server components in the same request share a single
// Payload instance + dedupe their global reads. Spec 004 page templates
// compose against these — without them every block/header/footer that needs
// `siteSettings` or `navigation` would re-init Payload and re-query.

let payloadPromise: Promise<Payload> | null = null

/**
 * Module-level singleton — initialise Payload exactly once per Node process.
 * Repeated callers share the same promise so concurrent first-touches don't
 * race. Use this anywhere a server component or server action needs the
 * Local API.
 */
export const getPayloadInstance = (): Promise<Payload> => {
  if (!payloadPromise) {
    payloadPromise = getPayload({ config })
  }
  return payloadPromise
}

/**
 * `React.cache` dedupes calls within a single React render pass — every
 * server component in the request tree that calls `getSiteSettings()` shares
 * the result of one underlying `findGlobal` round-trip. Across requests the
 * cache is reset, so this is safe for per-request data.
 */
export const getSiteSettings = cache(async (): Promise<SiteSetting> => {
  const payload = await getPayloadInstance()
  return payload.findGlobal({ slug: 'siteSettings', depth: 2 }) as Promise<SiteSetting>
})

export const getNavigation = cache(async (): Promise<Navigation> => {
  const payload = await getPayloadInstance()
  return payload.findGlobal({ slug: 'navigation', depth: 2 }) as Promise<Navigation>
})

export const getHomepage = cache(async (): Promise<Homepage> => {
  const payload = await getPayloadInstance()
  return payload.findGlobal({ slug: 'homepage', depth: 2 }) as Promise<Homepage>
})
