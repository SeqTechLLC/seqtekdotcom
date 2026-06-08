/**
 * Unit coverage for the photo-ingest tool (ROADMAP C-8). Exercises the pure
 * pieces — alt-text derivation, deterministic filenames, conversion
 * disposition/format, and the hash-dedup + idempotency that the manifest gives
 * us (the T-1 gap the case-study importer has). No Payload/DB needed; uploads
 * go through an in-memory fake uploader.
 */
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { generateAlt } from '../../../tools/ingest-photos/altText'
import { convertFile, targetFilename } from '../../../tools/ingest-photos/convert'
import { Manifest } from '../../../tools/ingest-photos/manifest'
import { runIngest, type MediaUploader } from '../../../tools/ingest-photos/ingest'
import type { SourceFile } from '../../../tools/ingest-photos/types'

let workDir: string

const solidPng = (size = 64): Promise<Buffer> =>
  sharp({ create: { width: size, height: size, channels: 3, background: { r: 12, g: 84, b: 60 } } })
    .png()
    .toBuffer()

const solidJpeg = (size = 64): Promise<Buffer> =>
  sharp({ create: { width: size, height: size, channels: 3, background: { r: 30, g: 30, b: 30 } } })
    .jpeg()
    .toBuffer()

async function writeFixture(rel: string, buffer: Buffer): Promise<SourceFile> {
  const abs = path.join(workDir, rel)
  await mkdir(path.dirname(abs), { recursive: true })
  await writeFile(abs, buffer)
  return {
    absPath: abs,
    relPath: rel,
    ext: path.extname(rel).slice(1).toLowerCase(),
    sizeBytes: buffer.length,
  }
}

beforeAll(async () => {
  workDir = await mkdtemp(path.join(tmpdir(), 'ingest-photos-'))
})
afterAll(async () => {
  await rm(workDir, { recursive: true, force: true })
})

describe('generateAlt', () => {
  it('maps known folders to a template', () => {
    expect(generateAlt('Headshots/jane.png')).toBe('SEQTEK team member headshot')
    expect(generateAlt('Meet Up at the Max/01.jpg')).toBe('SEQTEK team gathering at The Max')
  })

  it('handles year folders, with and without a context subfolder', () => {
    expect(generateAlt('2023/IMG_1.jpg')).toBe('SEQTEK team event (2023)')
    expect(generateAlt('2023/Trade Show/IMG_1.jpg')).toBe('SEQTEK team event — Trade Show (2023)')
  })

  it('falls back to a best-effort title for unknown folders', () => {
    expect(generateAlt('Some_New-Folder/x.png')).toBe('SEQTEK — Some New Folder')
  })
})

describe('targetFilename', () => {
  it('slugifies the relative path and swaps the extension', () => {
    expect(targetFilename('General/IMG_7422.png', 'png')).toBe('general-img-7422.png')
  })

  it('keeps same-named files in different folders distinct', () => {
    expect(targetFilename('a/IMG.png', 'webp')).not.toBe(targetFilename('b/IMG.png', 'webp'))
  })
})

describe('convertFile', () => {
  it('all mode: PNG stays PNG, normalized, EXIF stripped', async () => {
    const file = await writeFixture('General/shot.png', await solidPng())
    const out = await convertFile(file, 'all')
    expect(out.disposition).toBe('normalize')
    expect(out.mimeType).toBe('image/png')
    expect(out.filename).toBe('general-shot.png')
    const meta = await sharp(out.buffer).metadata()
    expect(meta.format).toBe('png')
    expect(meta.exif).toBeUndefined()
  })

  it('all mode: JPEG is re-encoded to WebP', async () => {
    const file = await writeFixture('General/photo.jpg', await solidJpeg())
    const out = await convertFile(file, 'all')
    expect(out.mimeType).toBe('image/webp')
    expect((await sharp(out.buffer).metadata()).format).toBe('webp')
  })

  it('minimal mode: an allowed under-cap file passes through untouched', async () => {
    const png = await solidPng()
    const file = await writeFixture('General/passthru.png', png)
    const out = await convertFile(file, 'minimal')
    expect(out.disposition).toBe('passthrough')
    expect(out.buffer.equals(png)).toBe(true)
  })

  it('minimal mode: a .jfif is converted to WebP', async () => {
    const file = await writeFixture('General/legacy.jfif', await solidJpeg())
    const out = await convertFile(file, 'minimal')
    expect(out.disposition).toBe('convert-webp')
    expect(out.mimeType).toBe('image/webp')
  })
})

describe('runIngest dedup + idempotency', () => {
  it('collapses identical content and skips on re-run', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'ingest-run-'))
    const png = await solidPng(80)
    // Two byte-identical sources (different names) + one distinct image.
    await writeFile(path.join(dir, 'a.png'), png)
    await writeFile(path.join(dir, 'b.png'), png)
    await writeFile(path.join(dir, 'c.png'), await solidPng(96))
    const manifestPath = path.join(dir, '.manifest.test.json')

    const uploads: string[] = []
    let counter = 0
    const uploader: MediaUploader = {
      create: async (args) => {
        uploads.push(args.file.name)
        return { id: ++counter }
      },
    }
    const opts = {
      sourceDir: dir,
      mode: 'all' as const,
      dryRun: false,
      manifestPath,
      log: () => {},
      warn: () => {},
    }

    const first = await runIngest(uploader, opts)
    expect(first.processed).toBe(3)
    expect(first.uploaded).toBe(2) // a.png + c.png; b.png collapses to a.png
    expect(first.skippedExisting).toBe(1)
    expect(new Manifest(manifestPath).size).toBe(2)

    const second = await runIngest(uploader, opts)
    expect(second.uploaded).toBe(0) // manifest already has both hashes
    expect(second.skippedExisting).toBe(3)
    expect(uploads).toHaveLength(2) // no new uploads on the second pass

    await rm(dir, { recursive: true, force: true })
  })

  it('--out mode writes normalized files mirroring the source structure', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'ingest-src-'))
    const outDir = await mkdtemp(path.join(tmpdir(), 'ingest-out-'))
    await mkdir(path.join(dir, '2022'), { recursive: true })
    await mkdir(path.join(dir, 'Headshots'), { recursive: true })
    await writeFile(path.join(dir, '2022', 'IMG_2901.jpg'), await solidJpeg())
    await writeFile(path.join(dir, 'Headshots', 'jane.png'), await solidPng())
    const manifestPath = path.join(outDir, '.manifest.test-disk.json')

    const summary = await runIngest(null, {
      sourceDir: dir,
      mode: 'all',
      dryRun: false,
      manifestPath,
      outDir,
      log: () => {},
      warn: () => {},
    })

    expect(summary.uploaded).toBe(2)
    expect(summary.errors).toHaveLength(0)
    // Folder structure preserved; JPEG → WebP, PNG stays PNG.
    expect(existsSync(path.join(outDir, '2022', 'img-2901.webp'))).toBe(true)
    expect(existsSync(path.join(outDir, 'Headshots', 'jane.png'))).toBe(true)

    await rm(dir, { recursive: true, force: true })
    await rm(outDir, { recursive: true, force: true })
  })
})
