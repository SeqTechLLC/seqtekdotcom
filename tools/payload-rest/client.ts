/**
 * Thin, generic Payload REST client shared by the repo's content tools
 * (case-study importer, photo ingest, Leonardo image push, generic seeder).
 *
 * Authenticates with `Authorization: JWT <token>` — the token is the caller's
 * own `payload-token` session JWT from a logged-in /admin session. Payload's
 * built-in JWT strategy (registered in src/collections/Users.ts) reads that
 * header, so callers need no new auth surface (no API key, no schema change).
 * `fetch` is injectable so the unit tests can run without a server.
 */

import { readFile } from 'node:fs/promises'
import { basename, extname } from 'node:path'

export type FetchFn = typeof fetch

/** A source image: a local file path OR a remote URL, plus required alt text. */
export interface ImageRef {
  /** Local filesystem path to the image (mutually exclusive with `url`). */
  file?: string
  /** Remote URL to fetch the image from (mutually exclusive with `file`). */
  url?: string
  /** Alt text — the media collection requires it (FR-023). */
  alt: string
}

export interface ClientConfig {
  baseUrl: string
  /** Session JWT. Optional for read-only dry-runs; required to write. */
  token?: string
  fetchFn?: FetchFn
}

// Mirror the media collection's guards (src/collections/Media.ts) so a bad
// asset fails locally with a clear message instead of a 413/415 from the API.
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024
const MIME_BY_EXT: Readonly<Record<string, string>> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
}
const ALLOWED_MIME = Object.values(MIME_BY_EXT)

export interface ResolvedImage {
  data: Uint8Array
  mimeType: string
  filename: string
  alt: string
}

export interface FindOptions {
  draft: boolean
}

export interface WriteOptions {
  draft: boolean
}

export class PayloadRestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly body?: string,
  ) {
    super(message)
    this.name = 'PayloadRestError'
  }
}

type DocId = string | number

interface FindResponse {
  docs?: Array<{ id: DocId }>
}

interface WriteResponse {
  doc?: { id: DocId }
}

export class PayloadRestClient {
  private readonly baseUrl: string
  private readonly token?: string
  private readonly fetchFn: FetchFn

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '')
    this.token = config.token
    this.fetchFn = config.fetchFn ?? globalThis.fetch
  }

  get hasToken(): boolean {
    return typeof this.token === 'string' && this.token.length > 0
  }

  private authHeaders(): Record<string, string> {
    return this.hasToken ? { Authorization: `JWT ${this.token ?? ''}` } : {}
  }

  private async toError(res: Response, action: string): Promise<PayloadRestError> {
    let body = ''
    try {
      body = await res.text()
    } catch {
      body = ''
    }
    const suffix = body ? ` — ${body.slice(0, 500)}` : ''
    return new PayloadRestError(
      `Failed to ${action}: ${res.status} ${res.statusText}${suffix}`,
      res.status,
      body,
    )
  }

  /** Look up a document ID by an exact field match (e.g. slug). null when none. */
  async findIdByField(
    collection: string,
    field: string,
    value: string,
    opts: FindOptions,
  ): Promise<DocId | null> {
    const params = new URLSearchParams({
      [`where[${field}][equals]`]: value,
      limit: '1',
      depth: '0',
      draft: opts.draft ? 'true' : 'false',
    })
    const res = await this.fetchFn(`${this.baseUrl}/api/${collection}?${params.toString()}`, {
      headers: this.authHeaders(),
    })
    if (!res.ok) throw await this.toError(res, `find ${collection} by ${field}`)
    const json = (await res.json()) as FindResponse
    return json.docs && json.docs.length > 0 ? json.docs[0].id : null
  }

  /** Read an image from disk or URL into bytes, validating type + size. */
  async resolveImage(ref: ImageRef): Promise<ResolvedImage> {
    let data: Uint8Array
    let filename: string
    let headerMime: string | undefined

    if (ref.file) {
      const buf = await readFile(ref.file)
      data = new Uint8Array(buf)
      filename = basename(ref.file)
    } else if (ref.url) {
      const res = await this.fetchFn(ref.url)
      if (!res.ok) throw await this.toError(res, `fetch image ${ref.url}`)
      data = new Uint8Array(await res.arrayBuffer())
      headerMime = res.headers.get('content-type')?.split(';')[0].trim()
      filename = basename(new URL(ref.url).pathname) || 'image'
    } else {
      throw new PayloadRestError('image ref has neither "file" nor "url"')
    }

    const ext = extname(filename).toLowerCase()
    const mimeType = MIME_BY_EXT[ext] ?? headerMime ?? ''
    if (!ALLOWED_MIME.includes(mimeType)) {
      throw new PayloadRestError(
        `Unsupported image type "${mimeType || ext || 'unknown'}" for ${filename}. Allowed: ${ALLOWED_MIME.join(', ')}`,
      )
    }
    if (data.byteLength > MAX_UPLOAD_BYTES) {
      const mb = (data.byteLength / 1024 / 1024).toFixed(1)
      throw new PayloadRestError(`Image ${filename} is ${mb} MB, exceeds the 25 MB cap`)
    }
    return { data, mimeType, filename, alt: ref.alt }
  }

  /** Upload a resolved image to the media collection; returns the new media ID. */
  async uploadMedia(img: ResolvedImage): Promise<DocId> {
    const form = new FormData()
    form.append('file', new Blob([img.data], { type: img.mimeType }), img.filename)
    form.append('_payload', JSON.stringify({ alt: img.alt }))
    // Do NOT set Content-Type: fetch adds the multipart boundary itself.
    const res = await this.fetchFn(`${this.baseUrl}/api/media`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: form,
    })
    if (!res.ok) throw await this.toError(res, 'upload media')
    const json = (await res.json()) as WriteResponse
    if (json.doc?.id === undefined)
      throw new PayloadRestError('media upload returned no document id')
    return json.doc.id
  }

  async createDoc(
    collection: string,
    data: Record<string, unknown>,
    opts: WriteOptions,
  ): Promise<DocId> {
    const url = `${this.baseUrl}/api/${collection}${opts.draft ? '?draft=true' : ''}`
    const res = await this.fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw await this.toError(res, `create ${collection}`)
    const json = (await res.json()) as WriteResponse
    if (json.doc?.id === undefined)
      throw new PayloadRestError(`create ${collection} returned no document id`)
    return json.doc.id
  }

  async updateDoc(
    collection: string,
    id: DocId,
    data: Record<string, unknown>,
    opts: WriteOptions,
  ): Promise<DocId> {
    const url = `${this.baseUrl}/api/${collection}/${id}${opts.draft ? '?draft=true' : ''}`
    const res = await this.fetchFn(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw await this.toError(res, `update ${collection}`)
    const json = (await res.json()) as WriteResponse
    return json.doc?.id ?? id
  }

  /** Update a Payload global by slug (POST /api/globals/:slug). */
  async updateGlobal(
    slug: string,
    data: Record<string, unknown>,
    opts: WriteOptions,
  ): Promise<void> {
    const url = `${this.baseUrl}/api/globals/${slug}${opts.draft ? '?draft=true' : ''}`
    const res = await this.fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw await this.toError(res, `update global ${slug}`)
  }
}
