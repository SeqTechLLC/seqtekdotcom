/**
 * sha256 → uploaded-media manifest for the photo ingest (ROADMAP C-8, T-1).
 *
 * Gives us two things the case-study importer lacks (T-1): idempotent re-runs
 * (skip content already uploaded) and content-dedup (identical photos sitting
 * in multiple folders collapse to one Media row). The manifest is keyed on the
 * sha256 of the *converted* bytes and is environment-scoped (media IDs differ
 * between local / staging / prod), so the filename embeds the env label.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

export interface ManifestEntry {
  /** Set by an upload run (the created Media row id). */
  mediaId?: string | number
  /** Set by a `--out` disk run (path of the written file, relative to outDir). */
  outPath?: string
  filename: string
  relPath: string
}

export type ManifestData = Record<string, ManifestEntry>

export class Manifest {
  private readonly path: string
  private data: ManifestData

  constructor(path: string) {
    this.path = path
    this.data = existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as ManifestData) : {}
  }

  has(sha256: string): boolean {
    return sha256 in this.data
  }

  get(sha256: string): ManifestEntry | undefined {
    return this.data[sha256]
  }

  set(sha256: string, entry: ManifestEntry): void {
    this.data[sha256] = entry
  }

  get size(): number {
    return Object.keys(this.data).length
  }

  save(): void {
    writeFileSync(this.path, `${JSON.stringify(this.data, null, 2)}\n`, 'utf8')
  }
}
