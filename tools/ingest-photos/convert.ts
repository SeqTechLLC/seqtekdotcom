/**
 * Image normalization for the bulk photo ingest (ROADMAP C-8).
 *
 * Uses the `sharp` bundled with Payload for resize/encode. HEIC is decoded
 * out-of-band via `heic-convert` (sharp's libheif lacks the HEVC plugin). The
 * `../photos` archive is never touched; this only produces in-memory buffers.
 */
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

import sharp from 'sharp'

import type { ConvertedFile, Disposition, NormalizeMode, SourceFile } from './types'

/** Media collection hard cap (`enforceMaxFileSize`, data-model §1.12). */
export const MAX_BYTES = 25 * 1024 * 1024
/** Longest edge the site ever serves (the `wide` breakpoint in Media.ts). */
export const MAX_EDGE = 2400
const WEBP_QUALITY = 82
const JPEG_QUALITY = 82

/** Not in the collection's allowed MIME list — must be re-encoded. */
const CONVERT_EXT = new Set(['heic', 'heif', 'jfif'])
/**
 * HEVC-compressed HEIC: sharp's bundled libheif has the container but not the
 * HEVC decoder plugin, so we decode these out-of-band with `heic-convert`
 * (in-process wasm libheif+libde265) before handing the bytes to sharp.
 * Dynamically imported so the wasm only loads when a HEIC is actually seen.
 */
const HEIC_EXT = new Set(['heic', 'heif'])

async function decodeHeic(input: Buffer): Promise<Buffer> {
  const { default: heicConvert } = await import('heic-convert')
  const decoded = await heicConvert({ buffer: input, format: 'JPEG', quality: 1 })
  return Buffer.from(decoded)
}
/** Source extensions we ingest. Anything else is skipped during the walk. */
export const SOURCE_EXTS = new Set(['png', 'jpg', 'jpeg', 'jfif', 'webp', 'heic', 'heif'])

type OutFormat = 'webp' | 'png' | 'jpeg'

/** Force a single output format, or `keep` for the default per-ext behavior. */
export type OutputFormat = 'jpeg' | 'webp' | 'keep'

/** Extra knobs for non-ingest passes (e.g. a small JPEG set for vision). */
export interface ConvertOptions {
  /** Override the output format for every file. Default: `keep`. */
  outFormat?: OutputFormat
  /** Override the longest-edge cap. Default: MAX_EDGE (2400). */
  maxEdge?: number
}

/**
 * Default (`keep`): PNGs stay lossless PNG (screenshots/graphics), everything
 * else → WebP. An explicit `jpeg`/`webp` forces that format for every file.
 */
function targetFormat(
  ext: string,
  override: OutputFormat = 'keep',
): { format: OutFormat; outExt: string } {
  if (override === 'jpeg') return { format: 'jpeg', outExt: 'jpg' }
  if (override === 'webp') return { format: 'webp', outExt: 'webp' }
  if (ext === 'png') return { format: 'png', outExt: 'png' }
  return { format: 'webp', outExt: 'webp' }
}

function mimeForExt(ext: string): string {
  switch (ext) {
    case 'png':
      return 'image/png'
    case 'webp':
      return 'image/webp'
    case 'jpg':
    case 'jpeg':
    case 'jfif':
      return 'image/jpeg'
    default:
      return 'application/octet-stream'
  }
}

async function encode(input: Buffer, format: OutFormat, edge: number | null): Promise<Buffer> {
  // `.rotate()` with no args bakes in EXIF orientation then drops the tag;
  // not calling `.withMetadata()` means sharp strips EXIF/GPS on output.
  let pipeline = sharp(input, { failOn: 'none' }).rotate()
  if (edge !== null) {
    pipeline = pipeline.resize({
      width: edge,
      height: edge,
      fit: 'inside',
      withoutEnlargement: true,
    })
  }
  if (format === 'webp') return pipeline.webp({ quality: WEBP_QUALITY }).toBuffer()
  if (format === 'jpeg') return pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer()
  return pipeline.png({ compressionLevel: 9 }).toBuffer()
}

/** Encode, then shrink the long edge until the result clears the 25 MB cap. */
async function encodeUnderCap(
  input: Buffer,
  format: OutFormat,
  startEdge: number | null,
): Promise<Buffer> {
  let out = await encode(input, format, startEdge)
  let edge = startEdge ?? MAX_EDGE
  while (out.length > MAX_BYTES && edge > 500) {
    edge = Math.round(edge * 0.8)
    out = await encode(input, format, edge)
  }
  return out
}

/**
 * Deterministic target filename from the relative path so re-runs are stable
 * and same-named files in different folders don't collide
 * (`General/IMG_7422.png` → `general-img-7422.png`).
 */
export function targetFilename(relPath: string, outExt: string): string {
  const slug = relPath
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug || 'photo'}.${outExt}`
}

export async function convertFile(
  file: SourceFile,
  mode: NormalizeMode,
  opts: ConvertOptions = {},
): Promise<ConvertedFile> {
  const input = await readFile(file.absPath)
  const mustConvert = CONVERT_EXT.has(file.ext)
  const overCap = file.sizeBytes > MAX_BYTES
  const maxEdge = opts.maxEdge ?? MAX_EDGE
  const forced = opts.outFormat && opts.outFormat !== 'keep'
  const { format, outExt } = targetFormat(file.ext, opts.outFormat)

  let buffer: Buffer
  let disposition: Disposition
  let finalExt: string
  let mimeType: string

  // A forced output format (e.g. the JPEG vision set) always re-encodes.
  if (mode === 'minimal' && !mustConvert && !overCap && !forced) {
    // True passthrough — original bytes, EXIF intact.
    buffer = input
    disposition = 'passthrough'
    finalExt = file.ext === 'jpeg' || file.ext === 'jfif' ? 'jpg' : file.ext
    mimeType = mimeForExt(file.ext)
  } else {
    // Resize when normalizing everything (`all`), when forced under the cap
    // (`minimal` + oversized), or whenever a maxEdge is in play.
    const startEdge = mode === 'all' || overCap || forced ? maxEdge : null
    const source = HEIC_EXT.has(file.ext) ? await decodeHeic(input) : input
    buffer = await encodeUnderCap(source, format, startEdge)
    disposition = mustConvert ? 'convert-webp' : overCap ? 'downscale' : 'normalize'
    finalExt = outExt
    mimeType = format === 'png' ? 'image/png' : format === 'jpeg' ? 'image/jpeg' : 'image/webp'
  }

  const sha256 = createHash('sha256').update(buffer).digest('hex')
  return {
    buffer,
    filename: targetFilename(file.relPath, finalExt),
    mimeType,
    sha256,
    disposition,
    originalRelPath: file.relPath,
  }
}
