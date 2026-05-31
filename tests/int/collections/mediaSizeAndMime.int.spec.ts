// @vitest-environment node
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '../../../src/payload.config.js'

/**
 * T116 / data-model §1.12 / spec 003 US6.
 *
 * Two upload-pipeline gates worth pinning in CI:
 *   - 25 MB cap on file size (enforced via `enforceMaxFileSize` beforeOperation
 *     hook in `src/collections/Media.ts`, because Payload v3's UploadConfig
 *     has no native `maxFileSize`).
 *   - MIME allowlist excluding SVG (XSS surface) and everything outside the
 *     declared list. Enforced by `upload.mimeTypes` in the collection config.
 *
 * Both must fail at the Local API, not just the admin UI.
 */

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024

let payload: Payload

async function fixturePng(sizeBytes?: number): Promise<Buffer> {
  // For the oversize case we want a buffer larger than 25 MB. A 5000x5000
  // PNG at maximum quality + no compression gets us into that range
  // reliably without producing a 100 MB file. If `sizeBytes` is set we
  // pad to that exact size with raw bytes appended — the upload hook only
  // checks `file.size`, not validity.
  const baseline = await sharp({
    create: {
      width: 64,
      height: 64,
      channels: 3,
      background: { r: 128, g: 128, b: 128 },
    },
  })
    .png()
    .toBuffer()
  if (!sizeBytes || sizeBytes <= baseline.length) return baseline
  return Buffer.concat([baseline, Buffer.alloc(sizeBytes - baseline.length)])
}

beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

afterAll(async () => {
  await payload.delete({
    collection: 'media',
    where: { filename: { like: 'size-mime-%' } },
    overrideAccess: true,
  })
})

describe('Media size + MIME gates (T116 / data-model §1.12 / spec 003 US6)', () => {
  it('rejects upload exceeding 25 MB cap', async () => {
    // 26 MB — one over the cap. The `enforceMaxFileSize` beforeOperation
    // hook throws an APIError with `isPublic: true` so the admin surfaces
    // the readable message.
    const oversizeBuffer = await fixturePng(MAX_UPLOAD_BYTES + 1024 * 1024)
    await expect(
      payload.create({
        collection: 'media',
        data: { alt: 'oversize test' },
        file: {
          data: oversizeBuffer,
          mimetype: 'image/png',
          name: 'size-mime-oversize.png',
          size: oversizeBuffer.length,
        },
        overrideAccess: true,
      }),
    ).rejects.toThrow(/25 MB/i)
  })

  it('rejects non-allowed MIME type (SVG)', async () => {
    // SVG is excluded from `ALLOWED_MIME` — XSS surface (inline <script>).
    // Payload's upload pipeline matches `upload.mimeTypes` against the
    // sniffed type, not the provided one, so we pass a real SVG buffer.
    const svgBuffer = Buffer.from(
      '<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" fill="#888"/></svg>',
    )
    await expect(
      payload.create({
        collection: 'media',
        data: { alt: 'svg test' },
        file: {
          data: svgBuffer,
          mimetype: 'image/svg+xml',
          name: 'size-mime-test.svg',
          size: svgBuffer.length,
        },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('accepts an allowed MIME type under the size cap', async () => {
    const pngBuffer = await fixturePng()
    const doc = await payload.create({
      collection: 'media',
      data: { alt: 'happy path' },
      file: {
        data: pngBuffer,
        mimetype: 'image/png',
        name: 'size-mime-ok.png',
        size: pngBuffer.length,
      },
      overrideAccess: true,
    })
    expect(doc.id).toBeDefined()
  })
})
