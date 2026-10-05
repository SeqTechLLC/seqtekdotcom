/**
 * Read every content collection and global over REST and write seeder request
 * files, one per collection, plus the media files they reference.
 */

import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { Block, CollectionConfig, GlobalConfig } from 'payload'

import type { PayloadRestClient } from '../payload-rest/client'
import { exportFields, relationTargets, type Directive, type DocId } from './transform'

/** The upsert key per collection. Everything else is keyed by `slug`. */
const IDENTITY: Readonly<Record<string, string>> = { navigation: 'label', testimonials: 'quote' }

export const identityOf = (collection: string): string => IDENTITY[collection] ?? 'slug'

export interface ExportConfig {
  collections: readonly CollectionConfig[]
  globals: readonly GlobalConfig[]
  richTextBlocks: readonly Block[]
}

export interface ExportOptions {
  client: PayloadRestClient
  config: ExportConfig
  outDir: string
  /** Collection or global slugs to write. Default: all. Every collection is still read, to resolve relations. */
  only?: readonly string[]
  /** `$file` paths are written relative to this, the directory the seeder runs from. */
  cwd: string
  log: (msg: string) => void
  warn: (msg: string) => void
}

export interface ExportSummary {
  files: Array<{ file: string; documents: number }>
  media: { downloaded: number; unchanged: number }
  warnings: number
}

interface MediaDoc {
  filename: string
  alt: string
  url: string
  filesize: number | null
}

/** Content collections: not uploads (media travels as `$file`) and not auth (users are per database). */
export const contentCollections = (collections: readonly CollectionConfig[]): CollectionConfig[] =>
  collections.filter((c) => !c.upload && !c.auth)

/** Referenced collections before the ones that point at them. A cycle is broken where it is met. */
export function loadOrder(collections: readonly CollectionConfig[]): CollectionConfig[] {
  const bySlug = new Map(collections.map((c) => [c.slug, c]))
  const done = new Set<string>()
  const visiting = new Set<string>()
  const out: CollectionConfig[] = []
  const visit = (c: CollectionConfig): void => {
    if (done.has(c.slug) || visiting.has(c.slug)) return
    visiting.add(c.slug)
    for (const target of relationTargets(c.fields)) {
      const dep = bySlug.get(target)
      if (dep && dep !== c) visit(dep)
    }
    visiting.delete(c.slug)
    done.add(c.slug)
    out.push(c)
  }
  collections.forEach(visit)
  return out
}

const statusOf = (doc: Record<string, unknown>): 'published' | 'unpublished' =>
  doc._status === 'draft' ? 'unpublished' : 'published'

/** The seeder refuses to overwrite a document that changed after this (ADR 0014). */
const basedOnOf = (doc: Record<string, unknown>): { basedOn?: string } =>
  typeof doc.updatedAt === 'string' ? { basedOn: doc.updatedAt } : {}

async function sizeOnDisk(file: string): Promise<number | null> {
  try {
    return (await stat(file)).size
  } catch {
    return null
  }
}

export async function exportContent(opts: ExportOptions): Promise<ExportSummary> {
  const { client, config, outDir } = opts
  let warnings = 0
  const warn = (msg: string): void => {
    warnings += 1
    opts.warn(msg)
  }

  const collections = loadOrder(contentCollections(config.collections))
  const known = new Set([...collections.map((c) => c.slug), ...config.globals.map((g) => g.slug)])
  for (const slug of opts.only ?? []) {
    if (!known.has(slug)) throw new Error(`unknown collection or global "${slug}"`)
  }
  const wanted = (slug: string): boolean => !opts.only?.length || opts.only.includes(slug)

  // Read everything first: a relation can point at any collection.
  const docs = new Map<string, Array<Record<string, unknown>>>()
  const identities = new Map<string, Map<string, string>>()
  for (const c of collections) {
    let list = await client.listDocs(c.slug)
    // A document that is not live is exported as its latest version: its main
    // row holds only its first save. A live one is exported as published.
    if (list.some((doc) => doc._status === 'draft')) {
      const latest = new Map(
        (await client.listDocs(c.slug, { draft: true })).map((d) => [String(d.id), d]),
      )
      list = list.map((doc) =>
        doc._status === 'draft' ? (latest.get(String(doc.id)) ?? doc) : doc,
      )
    }
    docs.set(c.slug, list)
    const field = identityOf(c.slug)
    const ids = new Map<string, string>()
    for (const doc of list) {
      const value = doc[field]
      if (typeof value === 'string' && value.length > 0) ids.set(String(doc.id), value)
    }
    identities.set(c.slug, ids)
  }

  const media = new Map<string, MediaDoc>()
  for (const doc of await client.listDocs('media')) {
    if (typeof doc.filename !== 'string' || typeof doc.url !== 'string') continue
    media.set(String(doc.id), {
      filename: path.basename(doc.filename),
      alt: typeof doc.alt === 'string' && doc.alt.trim() ? doc.alt : doc.filename,
      url: doc.url,
      filesize: typeof doc.filesize === 'number' ? doc.filesize : null,
    })
  }

  const mediaDir = path.join(outDir, 'media')
  const usedMedia = new Map<string, MediaDoc>()
  const ref = (collection: string, id: DocId): Directive | null => {
    if (collection === 'media') {
      const m = media.get(String(id))
      if (!m) return null
      usedMedia.set(String(id), m)
      const file = path.relative(opts.cwd, path.join(mediaDir, m.filename))
      return { $file: { path: file.split(path.sep).join('/'), alt: m.alt } }
    }
    const value = identities.get(collection)?.get(String(id))
    if (value === undefined) return null
    const field = identityOf(collection)
    return { $ref: field === 'slug' ? { collection, value } : { collection, field, value } }
  }
  const ctx = { ref, richTextBlocks: config.richTextBlocks, warn }

  // Numbered by the full load order, so a file keeps its name when `only` narrows the run.
  type Entity = { slug: string } & (
    { collection: CollectionConfig; global?: never } | { collection?: never; global: GlobalConfig }
  )
  const entities: Entity[] = [
    ...collections.map((c) => ({ slug: c.slug, collection: c })),
    ...config.globals.map((g) => ({ slug: g.slug, global: g })),
  ]
  const outputs: Array<{ file: string; specs: unknown[] }> = []
  for (const [i, entity] of entities.entries()) {
    if (!wanted(entity.slug)) continue
    const file = `${String(i + 1).padStart(2, '0')}-${entity.slug}.json`
    if (entity.collection) {
      const identity = identityOf(entity.slug)
      const specs: unknown[] = []
      const keyed: Array<[string, Record<string, unknown>]> = []
      for (const doc of docs.get(entity.slug) ?? []) {
        const key = doc[identity]
        if (typeof key !== 'string' || key.length === 0) {
          warn(`${entity.slug} ${String(doc.id)}: skipped, no ${identity}`)
          continue
        }
        keyed.push([key, doc])
      }
      // By identity, not creation order: a restore re-creates documents, and the file should not change.
      keyed.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      for (const [key, doc] of keyed) {
        specs.push({
          collection: entity.slug,
          ...(identity === 'slug' ? {} : { identity }),
          status: statusOf(doc),
          ...basedOnOf(doc),
          data: exportFields(entity.collection.fields, doc, ctx, `${entity.slug}:${key}`),
        })
      }
      outputs.push({ file, specs })
    } else if (entity.global) {
      const published = await client.getGlobal(entity.slug)
      const doc =
        published._status === 'draft'
          ? await client.getGlobal(entity.slug, { draft: true })
          : published
      outputs.push({
        file,
        specs: [
          {
            global: entity.slug,
            status: statusOf(doc),
            ...basedOnOf(doc),
            data: exportFields(entity.global.fields, doc, ctx, `global:${entity.slug}`),
          },
        ],
      })
    }
  }

  await mkdir(outDir, { recursive: true })
  for (const { file, specs } of outputs) {
    // The seeder refuses an empty file, and a stale one would bring back documents since deleted.
    if (specs.length === 0) {
      await rm(path.join(outDir, file), { force: true })
      opts.log(`${file}: no documents, not written`)
      continue
    }
    await writeFile(path.join(outDir, file), `${JSON.stringify(specs, null, 2)}\n`)
    opts.log(`${file}: ${specs.length} document${specs.length === 1 ? '' : 's'}`)
  }

  let downloaded = 0
  let unchanged = 0
  if (usedMedia.size > 0) await mkdir(mediaDir, { recursive: true })
  for (const m of usedMedia.values()) {
    const target = path.join(mediaDir, m.filename)
    if (m.filesize !== null && (await sizeOnDisk(target)) === m.filesize) {
      unchanged += 1
      continue
    }
    await writeFile(target, await client.downloadFile(m.url))
    downloaded += 1
  }
  opts.log(`media: ${downloaded} downloaded, ${unchanged} unchanged`)

  return {
    files: outputs.map((o) => ({ file: o.file, documents: o.specs.length })),
    media: { downloaded, unchanged },
    warnings,
  }
}
