// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

import robots from '../../src/app/(frontend)/robots'

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
})
