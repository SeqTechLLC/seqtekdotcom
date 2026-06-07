/**
 * Shared types for the photo-library ingest tool (ROADMAP C-8). Kept free of
 * Payload / fs / process concerns so `convert` and `altText` stay unit-testable.
 */

/**
 * `all` (default): normalize every image — auto-orient, cap the long edge at
 * 2400px, strip EXIF/GPS, HEIC/jfif → WebP, PNG stays PNG. `minimal`: only the
 * roadmap-literal scope — convert HEIC/jfif → WebP, downscale just the files
 * over the 25 MB cap, pass everything else through full-res with EXIF intact.
 */
export type NormalizeMode = 'all' | 'minimal'

/** What `convert` did to a source file — for the run summary. */
export type Disposition = 'passthrough' | 'convert-webp' | 'downscale' | 'normalize'

/** A discovered source image, relative to the ingest root. */
export interface SourceFile {
  /** Absolute path on disk. */
  absPath: string
  /** Path relative to the source root (drives alt text + target filename). */
  relPath: string
  /** Lowercased extension, no leading dot. */
  ext: string
  /** Original size in bytes. */
  sizeBytes: number
}

/** The bytes + metadata to hand to Payload's upload pipeline. */
export interface ConvertedFile {
  buffer: Buffer
  /** Deterministic, slugified from `relPath` so re-runs are stable. */
  filename: string
  mimeType: string
  /** sha256 of the *output* bytes — the dedup / idempotency key. */
  sha256: string
  disposition: Disposition
  originalRelPath: string
}
