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
  /**
   * True when this doc was uploaded with a generated placeholder `alt` that
   * still needs an editor (C-7). This used to be stamped into `media.caption`
   * as `REVIEW_MARKER`, but ROADMAP INERT-2 dropped that column — it rendered
   * nowhere, so the admin offered editors a caption field that reached no
   * page. The flag lives here instead, beside the `mediaId` it describes, so
   * the alt-text pass can select exactly the auto-ingested rows. Note that
   * pass does not exist yet — nothing in the tree reads this field except the
   * test that pins it — so this is where C-7 should look, not a live contract.
   */
  altPending?: boolean
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
