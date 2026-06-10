// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

import { invalidateCloudFrontPaths } from '../../src/lib/cloudfront/invalidate'
import {
  makeMediaInvalidationHooks,
  mediaInvalidationPaths,
} from '../../src/payload/hooks/invalidateMediaOnChange'
import { mediaFileURL } from '../../src/payload/storage/s3'

/**
 * Spec 009 US1 / FR-002, FR-004, FR-011 / contracts/media-url.md.
 *
 * Two contracts:
 *   1. `mediaFileURL` — the single source of the public media URL. Must agree
 *      with the S3 key shape (`media/<filename>` via the adapter's static
 *      prefix) because the CloudFront `/media/*` behavior forwards the URL
 *      path verbatim as the object key (no originPath, no rewrite).
 *   2. The CDN-invalidation hooks (FR-011) — with stable keys, a same-filename
 *      replace no longer mints a new key, so the edge must be invalidated on
 *      file replace and delete, and must NOT be touched by metadata-only
 *      updates (the staging re-key PATCH depends on that no-op).
 *
 * The invalidator is INJECTED via `makeMediaInvalidationHooks` rather than
 * `vi.mock`-ing the cloudfront module: this suite runs single-fork with
 * `isolate: false` (shared module cache), where an earlier test file booting
 * payload.config caches the hook module against the real helper and a
 * file-local module mock silently misses.
 */

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('mediaFileURL — contracts/media-url.md', () => {
  it('joins host, prefix, and filename for the canonical case', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://seqtek-preview.com')
    expect(mediaFileURL({ prefix: 'media', filename: 'headshot-hank-haines.webp' })).toBe(
      'https://seqtek-preview.com/media/headshot-hank-haines.webp',
    )
  })

  it('encodes the filename segment but never the path joiner', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://seqtek-preview.com')
    expect(mediaFileURL({ prefix: 'media', filename: 'team photo (1).webp' })).toBe(
      'https://seqtek-preview.com/media/team%20photo%20(1).webp',
    )
  })

  it('legacy empty-prefix doc yields a host-rooted URL (documents the un-migrated shape, no crash)', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://seqtek-preview.com')
    expect(mediaFileURL({ prefix: '', filename: 'x.webp' })).toBe(
      'https://seqtek-preview.com/x.webp',
    )
  })

  it('falls back to the payload.config.ts localhost default when env is unset', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    expect(mediaFileURL({ prefix: 'media', filename: 'x.webp' })).toBe(
      'http://localhost:3100/media/x.webp',
    )
  })

  it('tolerates a trailing slash on the configured host', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://seqtek-preview.com/')
    expect(mediaFileURL({ prefix: 'media', filename: 'x.webp' })).toBe(
      'https://seqtek-preview.com/media/x.webp',
    )
  })
})

const seededDoc = {
  id: 7,
  filename: 'headshot-hank-haines.webp',
  prefix: 'media',
  sizes: {
    mobile_webp: { filename: 'headshot-hank-haines-640x800.webp' },
    mobile_jpeg: { filename: 'headshot-hank-haines-640x800.jpg' },
    tablet_webp: { filename: null }, // withoutEnlargement: source smaller than breakpoint
  },
}

describe('mediaInvalidationPaths — FR-011 path derivation', () => {
  it('derives the original + every variant path under the doc prefix', () => {
    expect(mediaInvalidationPaths(seededDoc)).toEqual([
      '/media/headshot-hank-haines.webp',
      '/media/headshot-hank-haines-640x800.webp',
      '/media/headshot-hank-haines-640x800.jpg',
    ])
  })

  it('encodes path segments to match the request URLs CloudFront caches', () => {
    expect(mediaInvalidationPaths({ filename: 'team photo (1).webp', prefix: 'media' })).toEqual([
      '/media/team%20photo%20(1).webp',
    ])
  })
})

describe('media invalidation hooks — FR-011', () => {
  const setup = () => {
    const invalidator = vi.fn(async () => ({ invalidated: 0, skipped: false }))
    const { afterChange, afterDelete } = makeMediaInvalidationHooks(invalidator)
    return { invalidator, afterChange, afterDelete }
  }

  it('file replace invalidates the PREVIOUS doc paths (stale bytes at the old keys)', async () => {
    const { invalidator, afterChange } = setup()
    await afterChange({
      doc: { ...seededDoc },
      previousDoc: seededDoc,
      operation: 'update',
      req: { file: { name: 'new-upload.webp' } },
      // Cast: the hook only reads doc/previousDoc/operation/req.file.
    } as never)
    expect(invalidator).toHaveBeenCalledTimes(1)
    expect(invalidator).toHaveBeenCalledWith(mediaInvalidationPaths(seededDoc))
  })

  it('metadata-only update (no incoming file) invalidates nothing — the re-key PATCH relies on this', async () => {
    const { invalidator, afterChange } = setup()
    await afterChange({
      doc: { ...seededDoc, prefix: 'media' },
      previousDoc: { ...seededDoc, prefix: '' },
      operation: 'update',
      req: {},
    } as never)
    expect(invalidator).not.toHaveBeenCalled()
  })

  it('create invalidates nothing (fresh key, nothing cached)', async () => {
    const { invalidator, afterChange } = setup()
    await afterChange({
      doc: seededDoc,
      previousDoc: undefined,
      operation: 'create',
      req: { file: { name: 'headshot-hank-haines.webp' } },
    } as never)
    expect(invalidator).not.toHaveBeenCalled()
  })

  it('delete invalidates the doc original + variant paths', async () => {
    const { invalidator, afterDelete } = setup()
    await afterDelete({ doc: seededDoc, req: {} } as never)
    expect(invalidator).toHaveBeenCalledTimes(1)
    expect(invalidator).toHaveBeenCalledWith(mediaInvalidationPaths(seededDoc))
  })

  it('never throws when CloudFront fails — the editor mutation must not roll back', async () => {
    const invalidator = vi.fn(async () => {
      throw new Error('cloudfront down')
    })
    const { afterDelete } = makeMediaInvalidationHooks(invalidator)
    await expect(afterDelete({ doc: seededDoc, req: {} } as never)).resolves.not.toThrow()
    expect(invalidator).toHaveBeenCalledTimes(1)
  })
})

describe('invalidateCloudFrontPaths env-gating (real helper contract)', () => {
  it('skips without CLOUDFRONT_DISTRIBUTION_ID — local dev / CI no-op', async () => {
    vi.stubEnv('CLOUDFRONT_DISTRIBUTION_ID', '')
    const result = await invalidateCloudFrontPaths(['/media/x.webp'])
    expect(result.skipped).toBe(true)
  })
})
