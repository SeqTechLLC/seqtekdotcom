// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { Media, mediaAdminThumbnail } from '../../src/collections/Media'

/**
 * Spec 011 US3 / T039 — contracts/admin-metadata.md C6.
 *
 * A pure resolver test: no database, no browser. `adminThumbnail` is a
 * server-only config property Payload calls from the `thumbnailURL` afterRead
 * hook with the raw document, so the whole contract is expressible as
 * document-in, URL-or-null-out.
 *
 * The three fixtures are the three states the real library is in or can reach
 * (research R7 inventory: 78 records, all images, all carrying `mobile_webp`;
 * `application/pdf` is an accepted mime type but nothing has been uploaded as
 * one yet). The `null` cases matter as much as the happy path: Payload's
 * `Thumbnail` element probes the URL with an `Image()` and falls back to its
 * file glyph only when there is no src, so a guessed-but-wrong URL renders as
 * a shimmer that never resolves rather than as a file icon (FR-016).
 */

/** The state of all 78 records in the library today. */
const withDerivative = {
  id: 32,
  filename: 'headshot-brent-fields.webp',
  mimeType: 'image/webp',
  url: '/api/media/file/headshot-brent-fields.webp',
  width: 1800,
  sizes: {
    mobile_webp: {
      url: '/api/media/file/headshot-brent-fields-640x427.webp',
      width: 640,
      filename: 'headshot-brent-fields-640x427.webp',
    },
    mobile_jpeg: {
      url: '/api/media/file/headshot-brent-fields-640x427.jpg',
      width: 640,
      filename: 'headshot-brent-fields-640x427.jpg',
    },
    desktop_webp: {
      url: '/api/media/file/headshot-brent-fields-1600x1067.webp',
      width: 1600,
      filename: 'headshot-brent-fields-1600x1067.webp',
    },
  },
}

/**
 * A legacy upload from before `imageSizes` was declared: the size group exists
 * on the schema but every member is null, because nothing has ever re-uploaded
 * the file to generate derivatives. `ResponsiveImage.tsx` carries the same case
 * on the render side.
 *
 * Note this is NOT what a small image looks like — see `smallSource` below.
 */
const withoutUsableDerivative = {
  id: 91,
  filename: 'legacy-upload.png',
  mimeType: 'image/png',
  url: '/api/media/file/legacy-upload.png',
  width: 180,
  sizes: {
    mobile_webp: { url: null, width: null, filename: null },
    mobile_jpeg: { url: null, width: null, filename: null },
  },
}

/**
 * An image narrower than the smallest breakpoint. `withoutEnlargement: true`
 * means Payload writes the derivative anyway, at the source's own dimensions —
 * it does NOT skip it (that is the `undefined` default). Verified against the
 * local mirror: all 78 records carry a `mobile_webp`, and the 220px client
 * logos hold `client-logo-quiktrip-220x220.webp`.
 *
 * This fixture exists because the opposite is an easy thing to assume, and
 * assuming it argues for a `doc.width <= 640 → doc.url` fallback that would be
 * dead code — and unreachable anyway, since the list view does not select the
 * top-level `url`.
 */
const smallSource = {
  id: 93,
  filename: 'client-logo-quiktrip.png',
  mimeType: 'image/png',
  url: '/api/media/file/client-logo-quiktrip.png',
  width: 220,
  sizes: {
    mobile_webp: {
      url: '/api/media/file/client-logo-quiktrip-220x220.webp',
      width: 220,
      filename: 'client-logo-quiktrip-220x220.webp',
    },
  },
}

const nonImage = {
  id: 92,
  filename: 'localshoring-one-pager.pdf',
  mimeType: 'application/pdf',
  url: '/api/media/file/localshoring-one-pager.pdf',
}

describe('C6 — media always previews', () => {
  it('is wired onto the collection, so Payload actually calls it', () => {
    expect(typeof Media.upload === 'object' ? Media.upload.adminThumbnail : undefined).toBe(
      mediaAdminThumbnail,
    )
  })

  it('resolves the smallest existing webp derivative', () => {
    expect(mediaAdminThumbnail({ doc: withDerivative })).toBe(
      '/api/media/file/headshot-brent-fields-640x427.webp',
    )
  })

  it('never returns the full-size original — that is the cost this avoids', () => {
    // 640px is already heavier than a list row warrants (research R7 measured
    // 53 KB); the 1800px original in a 40px box would be an order of magnitude
    // worse, and Payload has no client-side downscale.
    expect(mediaAdminThumbnail({ doc: withDerivative })).not.toBe(withDerivative.url)
  })

  it('returns null, not a broken URL, when no derivative was generated', () => {
    expect(mediaAdminThumbnail({ doc: withoutUsableDerivative })).toBeNull()
  })

  it('previews an image narrower than the smallest breakpoint', () => {
    // withoutEnlargement: true writes the derivative at the source's own size,
    // so small raster logos — the asset class the row labels target — preview
    // like anything else. No width-based fallback is needed.
    expect(mediaAdminThumbnail({ doc: smallSource })).toBe(
      '/api/media/file/client-logo-quiktrip-220x220.webp',
    )
  })

  it('returns null for a record with no sizes group at all', () => {
    const { sizes: _sizes, ...noSizes } = withoutUsableDerivative
    expect(mediaAdminThumbnail({ doc: noSizes })).toBeNull()
  })

  it('returns null for a non-image upload, so Payload draws its file glyph', () => {
    expect(mediaAdminThumbnail({ doc: nonImage })).toBeNull()
  })

  it('returns null when the mime type is missing rather than guessing', () => {
    const { mimeType: _mimeType, ...unknownType } = withDerivative
    expect(mediaAdminThumbnail({ doc: unknownType })).toBeNull()
  })

  it('reads the size that the collection actually generates', () => {
    // Guards the derivation in Media.ts: the resolver picks the smallest
    // breakpoint's webp by computing it from BREAKPOINTS, so a renamed or
    // re-ordered breakpoint must not leave it pointing at a size that no
    // longer exists.
    const generated = new Set(
      (typeof Media.upload === 'object' ? (Media.upload.imageSizes ?? []) : []).map((s) => s.name),
    )
    const resolved = mediaAdminThumbnail({ doc: withDerivative })
    const matching = Object.entries(withDerivative.sizes).find(([, size]) => size.url === resolved)
    expect(matching, 'resolver returned a URL that maps to no declared size').toBeDefined()
    expect(generated.has(matching![0])).toBe(true)
  })
})
