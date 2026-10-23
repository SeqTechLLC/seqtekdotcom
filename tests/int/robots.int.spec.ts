// @vitest-environment node
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import robots from '../../src/app/robots'

describe('robots.txt', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('points at the lane sitemap, whatever the site origin and a trailing slash', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.seqtek.com/')
    expect(robots().sitemap).toBe('https://www.seqtek.com/sitemap.xml')
  })

  it('lets crawlers in, and keeps them out of the admin and the API', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.seqtek.com')
    expect(robots().rules).toEqual({
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/'],
    })
  })

  // Next registers robots.ts only at the root of `app/`. Moved into a route group it is
  // silently ignored and /robots.txt is answered by the [slug] page with a 404.
  it('sits at the root of app/, the only place Next registers it', () => {
    expect(existsSync(resolve(process.cwd(), 'src/app/robots.ts'))).toBe(true)
    expect(existsSync(resolve(process.cwd(), 'src/app/(frontend)/robots.ts'))).toBe(false)
  })
})
