// @vitest-environment node
//
// Payload's upload pipeline calls `file-type`'s `fileTypeFromBuffer` which
// throws under jsdom (`globalThis.Blob` shape mismatch). Mirror the override
// used by access.int.spec.ts.
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '../../../src/payload.config.js'

/**
 * T115 / FR-023 / spec 003 US6.
 *
 * Server-side `alt`-required validation runs at the Local API layer, not
 * only in the admin UI. A direct `payload.create({ collection: 'media',
 * data: { alt: '' }, file })` call MUST be rejected. The admin UI's
 * field-level validation is a UX nicety; this is the actual contract.
 */

let payload: Payload

async function fixturePng(): Promise<Buffer> {
  return sharp(
    Buffer.from(
      '<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" fill="#888"/></svg>',
    ),
  )
    .png()
    .toBuffer()
}

beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

afterAll(async () => {
  await payload.delete({
    collection: 'media',
    where: { filename: { like: 'alt-validation-%' } },
    overrideAccess: true,
  })
})

describe('Media alt validation (T115 / FR-023 / spec 003 US6)', () => {
  it('rejects create when alt is empty string', async () => {
    const pngBuffer = await fixturePng()
    await expect(
      payload.create({
        collection: 'media',
        data: { alt: '' },
        file: {
          data: pngBuffer,
          mimetype: 'image/png',
          name: 'alt-validation-empty.png',
          size: pngBuffer.length,
        },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('rejects create when alt is whitespace only', async () => {
    const pngBuffer = await fixturePng()
    await expect(
      payload.create({
        collection: 'media',
        data: { alt: '   ' },
        file: {
          data: pngBuffer,
          mimetype: 'image/png',
          name: 'alt-validation-whitespace.png',
          size: pngBuffer.length,
        },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('accepts create when alt is a non-empty string', async () => {
    const pngBuffer = await fixturePng()
    const doc = await payload.create({
      collection: 'media',
      data: { alt: 'A meaningful description' },
      file: {
        data: pngBuffer,
        mimetype: 'image/png',
        name: 'alt-validation-ok.png',
        size: pngBuffer.length,
      },
      overrideAccess: true,
    })
    expect(doc.id).toBeDefined()
    expect(doc.alt).toBe('A meaningful description')
  })
})
