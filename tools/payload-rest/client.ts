/**
 * Thin, generic Payload REST client shared by the repo's content tools
 * (photo ingest, Leonardo image push, the seeder and the exporter).
 *
 * Authenticates with `Authorization: JWT <token>` — the token is the caller's
 * own `payload-token` session JWT from a logged-in /admin session. Payload's
 * built-in JWT strategy (registered in src/collections/Users.ts) reads that
 * header, so callers need no new auth surface (no API key, no schema change).
 * `fetch` is injectable so the unit tests can run without a server.
 *
 * An environment can also sit behind an authenticating proxy in FRONT of the
 * app (the pre-launch prod site is gated by an ALB + Cognito rule, so every
 * path — `/api/*` included — 302s to the IdP before Payload ever sees it).
 * `cookie` carries that proxy's session cookie, which is a separate concern
 * from `token`: the proxy decides whether the request reaches the origin, the
 * JWT decides who you are once it does. Both are needed to write to a gated
 * environment.
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
  /**
   * Raw `Cookie` header value for an environment behind an auth proxy, e.g.
   * `AWSELBAuthSessionCookie-0=...; AWSELBAuthSessionCookie-1=...`. Omit for
   * ungated environments (local, staging).
   */
  cookie?: string
  /**
   * Per-request timeout in ms. Default 60s — generous enough for a 25MB media
   * upload over a slow link, short enough that a wedged request fails instead
   * of hanging. There was no timeout at all before: a gated lane reached
   * without its session cookie left the run stalled indefinitely rather than
   * erroring, which is the worst outcome for an unattended caller, because a
   * hang is indistinguishable from slow progress.
   */
  timeoutMs?: number
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
    /**
     * Structural failure kind. `'timeout'` is what the consecutive-timeout
     * abort branches on — it used to match `/exceeded \d+ms/` against the
     * message, so rewording the prose would have silently disabled the abort
     * with no test to catch it.
     */
    readonly code?: 'timeout',
  ) {
    super(message)
    this.name = 'PayloadRestError'
  }
}

type DocId = string | number

interface FindResponse {
  docs?: Array<{ id: DocId; updatedAt?: unknown }>
}

interface WriteResponse {
  doc?: { id: DocId; updatedAt?: unknown }
  /** A global's write answers with `result` rather than `doc`. */
  result?: { updatedAt?: unknown }
}

/** A document's id and the `updatedAt` the read or write reported. */
export interface DocVersion {
  id: DocId
  updatedAt: string | null
}

const updatedAtOf = (value: unknown): string | null => (typeof value === 'string' ? value : null)

/**
 * Wrap a fetch so every request carries a deadline, and an expired one reports
 * as a timeout rather than a generic `AbortError`. Applied once in the
 * constructor so every call site inherits it — patching them individually is how
 * one gets missed, and the count changes as methods are added.
 */
export function timeoutMessage(url: string, timeoutMs: number): string {
  return (
    `Request to ${url} exceeded ${timeoutMs}ms. If the target is behind an auth ` +
    `proxy, a missing or expired session cookie stalls rather than refusing — ` +
    `check IMPORT_COOKIE first.`
  )
}

export function isAbortLike(err: unknown): boolean {
  const name = (err as { name?: string } | undefined)?.name
  return name === 'TimeoutError' || name === 'AbortError'
}

function withTimeout(fetchFn: FetchFn, timeoutMs: number): FetchFn {
  return async (input, init) => {
    const timeout = AbortSignal.timeout(timeoutMs)
    // Preserve a caller's own signal rather than replacing it. Nothing passes
    // one today, but silently disabling caller cancellation the moment
    // something does is the kind of latent surprise this file is trying to
    // stop shipping.
    const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout
    try {
      return await fetchFn(input, { ...(init ?? {}), signal })
    } catch (err) {
      if (isAbortLike(err)) {
        // A caller's own signal aborting is a cancellation, not a timeout —
        // distinguish them rather than blaming the deadline for both.
        const cancelled = init?.signal?.aborted === true
        throw new PayloadRestError(
          cancelled
            ? `Request to ${String(input)} was cancelled by the caller.`
            : timeoutMessage(String(input), timeoutMs),
          undefined,
          undefined,
          cancelled ? undefined : 'timeout',
        )
      }
      throw err
    }
  }
}

export class PayloadRestClient {
  private readonly baseUrl: string
  private readonly token?: string
  private readonly cookie?: string
  private readonly timeoutMs: number
  private readonly fetchFn: FetchFn

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '')
    this.token = config.token
    this.cookie = config.cookie
    this.timeoutMs = config.timeoutMs ?? 60_000
    this.fetchFn = withTimeout(config.fetchFn ?? globalThis.fetch, this.timeoutMs)
  }

  get hasToken(): boolean {
    return typeof this.token === 'string' && this.token.length > 0
  }

  private authHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}
    if (this.hasToken) headers.Authorization = `JWT ${this.token ?? ''}`
    if (this.cookie) headers.Cookie = this.cookie
    return headers
  }

  /**
   * Parse a JSON body, failing loudly when the response is HTML instead.
   * A gated environment answers an unauthenticated request with a 302 to the
   * IdP, which `fetch` follows to a 200 sign-in PAGE — so without this the
   * first symptom of a missing/expired gate cookie is an opaque JSON syntax
   * error rather than "you are not through the gate".
   */
  private async parseJson<T>(res: Response, action: string): Promise<T> {
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('json')) {
      // Carry the body through. A gate is the usual cause, but a CloudFront
      // error page, a maintenance page, or a proxy that sends no content-type
      // at all lands here too — without the snippet an operator chases a
      // cookie that was never the problem.
      const body = await this.readBody(res)
      const suffix = body ? ` — ${body.slice(0, 500)}` : ''
      throw new PayloadRestError(
        `Expected JSON from ${action} but got "${contentType || 'unknown'}" from ${this.hostLabel(res)}. ` +
          `The environment is likely behind an auth proxy — supply its session cookie — ` +
          `but confirm against the body.${suffix}`,
        res.status,
        body,
      )
    }
    try {
      return (await res.json()) as T
    } catch (err) {
      // `fetch` settles when the HEADERS arrive, so a timeout that fires while
      // the BODY is still draining throws here, outside the wrapper — and used
      // to surface as a bare TimeoutError with none of the guidance.
      if (isAbortLike(err)) {
        throw new PayloadRestError(
          timeoutMessage(res.url || this.hostLabel(res), this.timeoutMs),
          undefined,
          undefined,
          'timeout',
        )
      }
      throw err
    }
  }

  /** Response body as text, never throwing — both callers are error paths. */
  private async readBody(res: Response): Promise<string> {
    try {
      return await res.text()
    } catch {
      return ''
    }
  }

  /**
   * Host for diagnostics. `new URL` would throw on a scheme-less baseUrl and
   * mask the real failure, so never let the error path raise its own error.
   */
  private hostLabel(res: Response): string {
    try {
      return new URL(res.url || this.baseUrl).host
    } catch {
      return this.baseUrl
    }
  }

  private async toError(res: Response, action: string): Promise<PayloadRestError> {
    const body = await this.readBody(res)
    // The sibling case to parseJson: a proxy that answers 401/403 with its own
    // HTML rather than redirecting. Without this the operator gets 500
    // characters of markup instead of the reason.
    const contentType = res.headers.get('content-type') ?? ''
    if (contentType.includes('html')) {
      const suffix = body ? ` — ${body.slice(0, 500)}` : ''
      return new PayloadRestError(
        `Failed to ${action}: ${res.status} ${res.statusText} — got HTML from ${this.hostLabel(res)}. ` +
          `The environment is likely behind an auth proxy — supply its session cookie — ` +
          `but confirm against the body.${suffix}`,
        res.status,
        body,
      )
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
    return (await this.findDocByField(collection, field, value, opts))?.id ?? null
  }

  /**
   * Like `findIdByField`, with the document's `updatedAt`. With `draft: true`
   * that is the latest version's, so a pending draft shows as a change.
   */
  async findDocByField(
    collection: string,
    field: string,
    value: string,
    opts: FindOptions,
  ): Promise<DocVersion | null> {
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
    const json = await this.parseJson<FindResponse>(res, `find ${collection} by ${field}`)
    const doc = json.docs?.[0]
    return doc ? { id: doc.id, updatedAt: updatedAtOf(doc.updatedAt) } : null
  }

  /**
   * Every PUBLISHED value of `field` in a collection, for orphan detection.
   * Read-only, one request, `depth=0`.
   *
   * The seeder is upsert-only: a request file describes what to write, never
   * what to retire, so deleting a document from a file leaves it live and
   * unreferenced. That has bitten twice — the `taurex` umbrella stayed
   * published for weeks, and the nine legacy capability-set services survived
   * the SVC-2 reseed and stayed in the sitemap. Neither was detectable from
   * the seeder's own output, because from its point of view nothing was wrong.
   */
  async listPublishedFieldValues(collection: string, field: string): Promise<string[]> {
    const out: string[] = []
    let page = 1

    // Paginate. A single `limit=500` silently truncated past that many rows,
    // producing FALSE NEGATIVES in the one diagnostic that exists to surface
    // documents you cannot otherwise see.
    for (;;) {
      const params = new URLSearchParams({
        limit: '200',
        page: String(page),
        depth: '0',
        draft: 'false',
        [`where[${field}][exists]`]: 'true',
      })
      const res = await this.fetchFn(`${this.baseUrl}/api/${collection}?${params.toString()}`, {
        headers: this.authHeaders(),
      })
      if (!res.ok) throw await this.toError(res, `list ${collection}`)
      const json = await this.parseJson<{
        docs?: Array<Record<string, unknown>>
        hasNextPage?: boolean
      }>(res, `list ${collection}`)

      for (const doc of json.docs ?? []) {
        // Filter published CLIENT-side, not with `where[_status]`.
        //
        // `draft: false` picks the main table over the versions table; it does
        // NOT exclude rows whose `_status` is 'draft'. Exclusion normally comes
        // from access control — `publishedOrAuthed` returns a `_status` filter
        // for anonymous callers — but this runs with IMPORT_TOKEN, an admin
        // session, for which that access returns `true` and no filter is
        // applied at all. So retired documents came back and were reported as
        // live orphans, advising you to unpublish what is already unpublished.
        //
        // A server-side `where[_status][equals]=published` would fix that for
        // drafts-enabled collections and break the rest: `categories` has no
        // `versions` key, so no `_status` column to filter on, while
        // `industries`, `locations` and `services` do. Treating a MISSING
        // `_status` as published is correct for both shapes.
        const status = doc._status
        if (status !== undefined && status !== 'published') continue
        const value = doc[field]
        if (typeof value === 'string' || typeof value === 'number') out.push(String(value))
      }

      if (!json.hasNextPage) break
      page += 1
    }
    return out
  }

  /**
   * Every document in a collection at `depth=0`, oldest first. With a token
   * this includes never-published documents, since an admin session bypasses
   * `publishedOrAuthed`. `draft: false` reads the main table: a published
   * document as published, but a never-published one as its FIRST save, because
   * a draft save writes only the versions table. `draft: true` reads each
   * document's latest version.
   */
  async listDocs(
    collection: string,
    opts: FindOptions = { draft: false },
  ): Promise<Array<Record<string, unknown>>> {
    const out: Array<Record<string, unknown>> = []
    for (let page = 1; ; page += 1) {
      const params = new URLSearchParams({
        limit: '100',
        page: String(page),
        depth: '0',
        draft: opts.draft ? 'true' : 'false',
        sort: 'createdAt',
      })
      const res = await this.fetchFn(`${this.baseUrl}/api/${collection}?${params.toString()}`, {
        headers: this.authHeaders(),
      })
      if (!res.ok) throw await this.toError(res, `list ${collection}`)
      const json = await this.parseJson<{
        docs?: Array<Record<string, unknown>>
        hasNextPage?: boolean
      }>(res, `list ${collection}`)
      out.push(...(json.docs ?? []))
      if (!json.hasNextPage) return out
    }
  }

  /** A global at `depth=0`: as published, or its latest version with `draft: true`. */
  async getGlobal(
    slug: string,
    opts: FindOptions = { draft: false },
  ): Promise<Record<string, unknown>> {
    const params = new URLSearchParams({ depth: '0', draft: opts.draft ? 'true' : 'false' })
    const res = await this.fetchFn(`${this.baseUrl}/api/globals/${slug}?${params.toString()}`, {
      headers: this.authHeaders(),
    })
    if (!res.ok) throw await this.toError(res, `read global ${slug}`)
    return this.parseJson<Record<string, unknown>>(res, `read global ${slug}`)
  }

  /**
   * A media file's bytes. Media reads are public, so no JWT is sent; the gate
   * cookie is, but only to the target's own origin.
   */
  async downloadFile(url: string): Promise<Uint8Array> {
    const target = new URL(url, this.baseUrl)
    const headers: Record<string, string> = {}
    if (this.cookie && target.origin === new URL(this.baseUrl).origin) {
      headers.Cookie = this.cookie
    }
    const res = await this.fetchFn(target.toString(), { headers })
    if (!res.ok) throw await this.toError(res, `download ${target.pathname}`)
    return new Uint8Array(await res.arrayBuffer())
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
    const json = await this.parseJson<WriteResponse>(res, 'upload media')
    if (json.doc?.id === undefined)
      throw new PayloadRestError('media upload returned no document id')
    return json.doc.id
  }

  async createDoc(
    collection: string,
    data: Record<string, unknown>,
    opts: WriteOptions,
  ): Promise<DocVersion> {
    const url = `${this.baseUrl}/api/${collection}${opts.draft ? '?draft=true' : ''}`
    const res = await this.fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw await this.toError(res, `create ${collection}`)
    const json = await this.parseJson<WriteResponse>(res, `create ${collection}`)
    if (json.doc?.id === undefined)
      throw new PayloadRestError(`create ${collection} returned no document id`)
    return { id: json.doc.id, updatedAt: updatedAtOf(json.doc.updatedAt) }
  }

  async updateDoc(
    collection: string,
    id: DocId,
    data: Record<string, unknown>,
    opts: WriteOptions,
  ): Promise<DocVersion> {
    const url = `${this.baseUrl}/api/${collection}/${id}${opts.draft ? '?draft=true' : ''}`
    const res = await this.fetchFn(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw await this.toError(res, `update ${collection}`)
    const json = await this.parseJson<WriteResponse>(res, `update ${collection}`)
    return { id: json.doc?.id ?? id, updatedAt: updatedAtOf(json.doc?.updatedAt) }
  }

  /** Update a Payload global by slug (POST /api/globals/:slug). */
  async updateGlobal(
    slug: string,
    data: Record<string, unknown>,
    opts: WriteOptions,
  ): Promise<{ updatedAt: string | null }> {
    const url = `${this.baseUrl}/api/globals/${slug}${opts.draft ? '?draft=true' : ''}`
    const res = await this.fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw await this.toError(res, `update global ${slug}`)
    // Parsed even when the caller ignores the result. A gated environment
    // answers the unauthenticated POST with a 302 that `fetch` follows to a 200
    // HTML sign-in page, which passes `res.ok` and would otherwise report a
    // silent success for a write that never happened.
    const json = await this.parseJson<WriteResponse>(res, `update global ${slug}`)
    return { updatedAt: updatedAtOf(json.result?.updatedAt ?? json.doc?.updatedAt) }
  }
}
