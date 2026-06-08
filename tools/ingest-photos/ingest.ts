/**
 * Core ingest flow (ROADMAP C-8): walk the photo archive, convert each image,
 * dedup by content hash, and upload to the Media collection. Kept free of
 * process/env/Payload-bootstrap concerns (see `index.ts`) so it is testable
 * with an injected uploader.
 */
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, relative } from 'node:path'

import { convertFile, SOURCE_EXTS, type OutputFormat } from './convert'
import { generateAlt, REVIEW_MARKER } from './altText'
import { Manifest } from './manifest'
import type { NormalizeMode, SourceFile } from './types'

/** Minimal structural slice of the Payload instance this tool needs. */
export interface MediaUploader {
  create(args: {
    collection: 'media'
    data: { alt: string; caption: string }
    file: { data: Buffer; mimetype: string; name: string; size: number }
    overrideAccess: boolean
  }): Promise<{ id: string | number }>
}

export interface IngestOptions {
  sourceDir: string
  mode: NormalizeMode
  dryRun: boolean
  manifestPath: string
  /**
   * When set, write normalized files here (mirroring the source folder
   * structure) instead of uploading to Payload — produces a browseable,
   * curate-able copy of the library. No DB / Payload needed.
   */
  outDir?: string
  /** Force output format (e.g. a JPEG vision set). Default: keep. */
  outFormat?: OutputFormat
  /** Override the longest-edge cap (e.g. 1280 for a vision set). */
  maxEdge?: number
  /** Cap the number of files processed (sampling / local validation). */
  limit?: number
  log: (msg: string) => void
  warn: (msg: string) => void
}

/**
 * On-disk output path that mirrors the source structure: keeps folder names
 * verbatim (spaces and all, for easy browsing), slugifies only the basename,
 * and swaps the extension (`2022/IMG_2901.jpg` → `2022/img-2901.webp`).
 */
export function diskOutPath(relPath: string, outExt: string): string {
  const dir = dirname(relPath)
  const slug =
    basename(relPath)
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'photo'
  const name = `${slug}.${outExt}`
  return dir === '.' ? name : join(dir, name)
}

export interface IngestSummary {
  totalDiscovered: number
  processed: number
  uploaded: number
  planned: number
  skippedExisting: number
  byDisposition: Record<string, number>
  bytesIn: number
  bytesOut: number
  errors: { relPath: string; message: string }[]
}

export async function walkImages(root: string): Promise<SourceFile[]> {
  const out: SourceFile[] = []
  async function recurse(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue // hidden files + AppleDouble `._`
      const abs = join(dir, entry.name)
      if (entry.isDirectory()) {
        await recurse(abs)
        continue
      }
      if (!entry.isFile()) continue
      const ext = extname(entry.name).slice(1).toLowerCase()
      if (!SOURCE_EXTS.has(ext)) continue
      const info = await stat(abs)
      out.push({ absPath: abs, relPath: relative(root, abs), ext, sizeBytes: info.size })
    }
  }
  await recurse(root)
  out.sort((a, b) => a.relPath.localeCompare(b.relPath))
  return out
}

function fmtMB(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

export async function runIngest(
  uploader: MediaUploader | null,
  opts: IngestOptions,
): Promise<IngestSummary> {
  const files = await walkImages(opts.sourceDir)
  const selected = opts.limit ? files.slice(0, opts.limit) : files
  const manifest = new Manifest(opts.manifestPath)
  const seen = new Set<string>() // in-run dedup; also covers dry-run

  const summary: IngestSummary = {
    totalDiscovered: files.length,
    processed: 0,
    uploaded: 0,
    planned: 0,
    skippedExisting: 0,
    byDisposition: {},
    bytesIn: 0,
    bytesOut: 0,
    errors: [],
  }

  opts.log(
    `discovered ${files.length} image(s); processing ${selected.length} ` +
      `(mode=${opts.mode}${opts.dryRun ? ', dry-run' : ''}); manifest has ${manifest.size} prior entr(y/ies)`,
  )

  for (let i = 0; i < selected.length; i++) {
    const file = selected[i]
    let converted
    try {
      converted = await convertFile(file, opts.mode, {
        outFormat: opts.outFormat,
        maxEdge: opts.maxEdge,
      })
    } catch (err) {
      const message = (err as Error).message
      summary.errors.push({ relPath: file.relPath, message })
      opts.warn(`convert failed ${file.relPath}: ${message}`)
      continue
    }

    summary.processed++
    summary.bytesIn += file.sizeBytes
    summary.bytesOut += converted.buffer.length
    summary.byDisposition[converted.disposition] =
      (summary.byDisposition[converted.disposition] ?? 0) + 1

    if (manifest.has(converted.sha256) || seen.has(converted.sha256)) {
      summary.skippedExisting++
      opts.log(`skip (already ingested / duplicate content) ${file.relPath}`)
      continue
    }
    seen.add(converted.sha256)

    if (opts.dryRun) {
      summary.planned++
      opts.log(
        `[plan ${i + 1}] ${converted.disposition} ${file.relPath} → ${converted.filename} ` +
          `(${fmtMB(file.sizeBytes)} → ${fmtMB(converted.buffer.length)}) alt="${generateAlt(file.relPath)}"`,
      )
      continue
    }

    if (opts.outDir) {
      const rel = diskOutPath(file.relPath, extname(converted.filename).slice(1))
      const abs = join(opts.outDir, rel)
      try {
        await mkdir(dirname(abs), { recursive: true })
        await writeFile(abs, converted.buffer)
        manifest.set(converted.sha256, {
          outPath: rel,
          filename: converted.filename,
          relPath: file.relPath,
        })
        summary.uploaded++
        if (summary.uploaded % 50 === 0) manifest.save()
        opts.log(`[${i + 1}/${selected.length}] wrote ${file.relPath} → ${rel}`)
      } catch (err) {
        const message = (err as Error).message
        summary.errors.push({ relPath: file.relPath, message })
        opts.warn(`write failed ${file.relPath}: ${message}`)
      }
      continue
    }

    if (!uploader) throw new Error('uploader is required for a non-dry-run ingest')

    try {
      const { id } = await uploader.create({
        collection: 'media',
        data: { alt: generateAlt(file.relPath), caption: REVIEW_MARKER },
        file: {
          data: converted.buffer,
          mimetype: converted.mimeType,
          name: converted.filename,
          size: converted.buffer.length,
        },
        overrideAccess: true,
      })
      manifest.set(converted.sha256, {
        mediaId: id,
        filename: converted.filename,
        relPath: file.relPath,
      })
      summary.uploaded++
      if (summary.uploaded % 25 === 0) manifest.save()
      opts.log(
        `[${i + 1}/${selected.length}] uploaded ${file.relPath} → media ${id} (${converted.filename})`,
      )
    } catch (err) {
      const message = (err as Error).message
      summary.errors.push({ relPath: file.relPath, message })
      opts.warn(`upload failed ${file.relPath}: ${message}`)
    }
  }

  if (!opts.dryRun) manifest.save()
  return summary
}
