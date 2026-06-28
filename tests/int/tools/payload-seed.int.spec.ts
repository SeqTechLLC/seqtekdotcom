// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { PayloadRestClient, type FetchFn } from '../../../tools/payload-rest/client'
import { resolveData, type ResolveOptions } from '../../../tools/payload-seed/resolve'
import { validateSpecs } from '../../../tools/payload-seed/spec'
import { upsertSpec } from '../../../tools/payload-seed/upsert'

/**
 * Unit coverage for the generic Payload seeder. Uses an injected `fetch` so it
 * needs no running server or DB — it asserts the exact REST calls the resolver
 * and write engine make (auth header, upsert routing, directive resolution).
 * (Lives under tests/int/** to match the vitest include glob; it does not touch
 * the testcontainer Postgres.)
 */

type DocId = string | number

interface Recorded {
  url: string
  method: string
  headers: Record<string, string>
  body: BodyInit | null
}

interface SeedDoc {
  id: DocId
  fields: Record<string, unknown>
}

interface FakeOptions {
  /** Pre-existing docs per collection (incl. `media` with `{ filename }`). */
  seed?: Record<string, SeedDoc[]>
}

/**
 * A fake Payload REST surface. GETs resolve `findIdByField` against a store;
 * POST/PATCH writes append to the store so a doc created by an earlier call is
 * findable by a later one (this is what exercises sequential ordering).
 */
function createFakeFetch(opts: FakeOptions = {}): { fetchFn: FetchFn; calls: Recorded[] } {
  const calls: Recorded[] = []
  const store: Record<string, SeedDoc[]> = {}
  for (const [coll, docs] of Object.entries(opts.seed ?? {})) {
    store[coll] = docs.map((d) => ({ id: d.id, fields: { ...d.fields } }))
  }
  let createCount = 0
  let mediaCount = 0

  const fetchFn: FetchFn = async (input, init) => {
    const url = typeof input === 'string' ? input : input.toString()
    const method = (init?.method ?? 'GET').toUpperCase()
    calls.push({
      url,
      method,
      headers: (init?.headers as Record<string, string>) ?? {},
      body: init?.body ?? null,
    })
    const u = new URL(url)
    const json = (obj: unknown, status = 200): Response =>
      new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } })

    // Non-/api/ request → an image fetch by URL.
    if (!u.pathname.startsWith('/api/')) {
      return new Response(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), {
        headers: { 'content-type': 'image/png' },
      })
    }

    if (method === 'GET') {
      const collection = u.pathname.slice('/api/'.length)
      let field = ''
      let value = ''
      for (const [k, v] of u.searchParams) {
        const m = /^where\[(.+)\]\[equals\]$/.exec(k)
        if (m) {
          field = m[1]
          value = v
        }
      }
      const match = (store[collection] ?? []).find((d) => String(d.fields[field]) === value)
      return json({ docs: match ? [{ id: match.id }] : [] })
    }

    if (method === 'POST' && u.pathname === '/api/media') {
      mediaCount += 1
      const id = `media-${mediaCount}`
      ;(store.media ??= []).push({ id, fields: {} })
      return json({ doc: { id } })
    }
    if (method === 'POST' && u.pathname.startsWith('/api/globals/')) {
      return json({})
    }
    if (method === 'POST' && u.pathname.startsWith('/api/')) {
      const collection = u.pathname.slice('/api/'.length)
      createCount += 1
      const id = `${collection}-${createCount}`
      const fields =
        typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : {}
      ;(store[collection] ??= []).push({ id, fields })
      return json({ doc: { id } })
    }
    if (method === 'PATCH' && u.pathname.startsWith('/api/')) {
      const id = u.pathname.split('/').pop() ?? ''
      return json({ doc: { id } })
    }
    return json({ errors: [{ message: `unhandled ${method} ${u.pathname}` }] }, 500)
  }

  return { fetchFn, calls }
}

const TOKEN = 'test-token'

function makeClient(fetchFn: FetchFn): PayloadRestClient {
  return new PayloadRestClient({ baseUrl: 'http://localhost:3100', token: TOKEN, fetchFn })
}

function resolveOpts(overrides: Partial<ResolveOptions> = {}): {
  opts: ResolveOptions
  logs: string[]
  warns: string[]
} {
  const logs: string[] = []
  const warns: string[] = []
  return {
    logs,
    warns,
    opts: {
      dryRun: false,
      allowMissingRefs: false,
      log: (m) => logs.push(m),
      warn: (m) => warns.push(m),
      ...overrides,
    },
  }
}

function bodyOf(calls: Recorded[], method: string, pathFragment: string): Record<string, unknown> {
  const call = calls.find((c) => c.method === method && c.url.includes(pathFragment))
  if (!call || typeof call.body !== 'string')
    throw new Error(`no ${method} call to ${pathFragment}`)
  return JSON.parse(call.body) as Record<string, unknown>
}

describe('validateSpecs', () => {
  it('rejects a spec with neither collection nor global', () => {
    const r = validateSpecs({})
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.join('\n')).toMatch(/collection must be a non-empty string/)
  })

  it('requires the identity value to be present in data', () => {
    const r = validateSpecs({ collection: 'caseStudies', data: { title: 'No slug' } })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.join('\n')).toMatch(/data\.slug is required/)
  })

  it('rejects a spec carrying both collection and global', () => {
    const r = validateSpecs({ global: 'g', collection: 'c', data: { slug: 'a' } })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.join('\n')).toMatch(/both "global" and "collection"/)
  })

  it('rejects an invalid status and an empty array, and accepts a valid spec', () => {
    expect(validateSpecs({ collection: 'c', data: { slug: 'a' }, status: 'live' }).ok).toBe(false)
    expect(validateSpecs([]).ok).toBe(false)
    const ok = validateSpecs({ collection: 'c', data: { slug: 'a' } })
    expect(ok.ok).toBe(true)
    if (!ok.ok) return
    expect(ok.value[0]).toMatchObject({ collection: 'c', identity: 'slug', status: 'published' })
  })

  it('honours a custom identity field', () => {
    const r = validateSpecs({ collection: 'redirects', identity: 'from', data: { from: '/old' } })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.value[0]).toMatchObject({ identity: 'from' })
  })
})

describe('upsertSpec — collection', () => {
  it('creates (POST, _status published, no draft param) when none exists', async () => {
    const { fetchFn, calls } = createFakeFetch()
    const client = makeClient(fetchFn)
    const spec = validateSpecs({ collection: 'caseStudies', data: { slug: 'acme', title: 'Acme' } })
    expect(spec.ok).toBe(true)
    if (!spec.ok) return

    const result = await upsertSpec(
      client,
      spec.value[0],
      { slug: 'acme', title: 'Acme' },
      {
        draft: false,
        dryRun: false,
      },
    )

    expect(result.operation).toBe('create')
    const createCall = calls.find((c) => c.method === 'POST' && c.url.includes('/api/caseStudies'))
    expect(createCall).toBeDefined()
    expect(createCall?.url).not.toContain('draft=true')
    expect(createCall?.headers.Authorization).toBe(`JWT ${TOKEN}`)
    const body = bodyOf(calls, 'POST', '/api/caseStudies')
    expect(body._status).toBe('published')
    expect(body.slug).toBe('acme')
  })

  it('updates in place (PATCH, ?draft=true) when the identity already exists', async () => {
    const { fetchFn, calls } = createFakeFetch({
      seed: { caseStudies: [{ id: 'cs-1', fields: { slug: 'acme' } }] },
    })
    const client = makeClient(fetchFn)
    const spec = validateSpecs({
      collection: 'caseStudies',
      data: { slug: 'acme' },
      status: 'draft',
    })
    expect(spec.ok).toBe(true)
    if (!spec.ok) return

    const result = await upsertSpec(
      client,
      spec.value[0],
      { slug: 'acme' },
      {
        draft: true,
        dryRun: false,
      },
    )

    expect(result.operation).toBe('update')
    expect(result.id).toBe('cs-1')
    const patch = calls.find((c) => c.method === 'PATCH' && c.url.includes('/api/caseStudies/cs-1'))
    expect(patch?.url).toContain('draft=true')
    expect(calls.some((c) => c.method === 'POST' && c.url.includes('/api/caseStudies'))).toBe(false)
    // Draft writes don't force _status.
    expect((JSON.parse(patch?.body as string) as Record<string, unknown>)._status).toBeUndefined()
  })

  it('dry-run performs no writes', async () => {
    const { fetchFn, calls } = createFakeFetch()
    const client = makeClient(fetchFn)
    const spec = validateSpecs({ collection: 'caseStudies', data: { slug: 'acme' } })
    if (!spec.ok) return
    const result = await upsertSpec(
      client,
      spec.value[0],
      { slug: 'acme' },
      {
        draft: false,
        dryRun: true,
      },
    )
    expect(result.operation).toBe('dry-run')
    expect(calls.length).toBe(0)
  })
})

describe('upsertSpec — global', () => {
  it('POSTs the global with no _status injection', async () => {
    const { fetchFn, calls } = createFakeFetch()
    const client = makeClient(fetchFn)
    const spec = validateSpecs({ global: 'siteSettings', data: { tagline: 'Hi' } })
    expect(spec.ok).toBe(true)
    if (!spec.ok) return

    const result = await upsertSpec(
      client,
      spec.value[0],
      { tagline: 'Hi' },
      {
        draft: false,
        dryRun: false,
      },
    )

    expect(result.operation).toBe('global')
    const call = calls.find(
      (c) => c.method === 'POST' && c.url.includes('/api/globals/siteSettings'),
    )
    expect(call).toBeDefined()
    expect(call?.url).not.toContain('draft=true')
    const body = JSON.parse(call?.body as string) as Record<string, unknown>
    expect(body).toEqual({ tagline: 'Hi' })
    expect(body._status).toBeUndefined()
  })
})

describe('resolveData — $ref', () => {
  it('resolves an array value by first match (fallback order)', async () => {
    const { fetchFn, calls } = createFakeFetch({
      seed: { caseStudies: [{ id: 'cs-9', fields: { slug: 'present' } }] },
    })
    const client = makeClient(fetchFn)
    const { opts } = resolveOpts()

    const data = await resolveData(
      client,
      { featured: { $ref: { collection: 'caseStudies', value: ['missing', 'present'] } } },
      opts,
    )

    expect(data.featured).toBe('cs-9')
    // Two lookups: missing (miss) then present (hit).
    const lookups = calls.filter((c) => c.method === 'GET' && c.url.includes('/api/caseStudies'))
    expect(lookups.length).toBe(2)
  })

  it('creates the doc when createIfMissing is set and nothing resolves', async () => {
    const { fetchFn, calls } = createFakeFetch()
    const client = makeClient(fetchFn)
    const { opts } = resolveOpts()

    const data = await resolveData(
      client,
      {
        industry: {
          $ref: {
            collection: 'industries',
            field: 'title',
            value: 'Healthcare',
            createIfMissing: { title: 'Healthcare', slug: 'healthcare' },
          },
        },
      },
      opts,
    )

    expect(data.industry).toBe('industries-1')
    const created = bodyOf(calls, 'POST', '/api/industries')
    expect(created).toEqual({ title: 'Healthcare', slug: 'healthcare' })
  })

  it('drops the enclosing array element when an omitIfMissing $ref is unresolved', async () => {
    const { fetchFn } = createFakeFetch()
    const client = makeClient(fetchFn)
    const { opts } = resolveOpts()

    const data = await resolveData(
      client,
      {
        layout: [
          {
            blockType: 'featuredCaseStudy',
            caseStudy: { $ref: { collection: 'caseStudies', value: 'gone', omitIfMissing: true } },
          },
          { blockType: 'richText', body: 'kept' },
        ],
      },
      opts,
    )

    expect(data.layout).toEqual([{ blockType: 'richText', body: 'kept' }])
  })

  it('omits just the field when an omitIfMissing $ref is a plain field', async () => {
    const { fetchFn } = createFakeFetch()
    const client = makeClient(fetchFn)
    const { opts } = resolveOpts()

    const data = await resolveData(
      client,
      {
        title: 'Kept',
        hero: { $ref: { collection: 'media', value: 'nope', omitIfMissing: true } },
      },
      opts,
    )

    expect(data).toEqual({ title: 'Kept' })
  })

  it('errors on an unresolved non-omittable $ref, unless --allow-missing-refs', async () => {
    const { fetchFn } = createFakeFetch()
    const client = makeClient(fetchFn)

    const strict = resolveOpts()
    await expect(
      resolveData(
        client,
        { x: { $ref: { collection: 'industries', value: 'nope' } } },
        strict.opts,
      ),
    ).rejects.toThrow(/unresolved \$ref/)

    const lax = resolveOpts({ allowMissingRefs: true })
    const data = await resolveData(
      client,
      { x: { $ref: { collection: 'industries', value: 'nope' } } },
      lax.opts,
    )
    expect(data).toEqual({})
    expect(lax.warns.join('\n')).toMatch(/unresolved \$ref/)
  })
})

describe('resolveData — $file', () => {
  it('reuses an existing media doc by filename (no upload)', async () => {
    const { fetchFn, calls } = createFakeFetch({
      seed: { media: [{ id: 'media-existing', fields: { filename: 'hank.jpg' } }] },
    })
    const client = makeClient(fetchFn)
    const { opts } = resolveOpts()

    const data = await resolveData(
      client,
      { headshot: { $file: { path: '../photos/team/hank.jpg', alt: 'Hank' } } },
      opts,
    )

    expect(data.headshot).toBe('media-existing')
    expect(calls.some((c) => c.method === 'POST' && c.url.endsWith('/api/media'))).toBe(false)
  })

  it('uploads when no media match exists', async () => {
    const { fetchFn, calls } = createFakeFetch()
    const client = makeClient(fetchFn)
    const { opts } = resolveOpts()

    const data = await resolveData(
      client,
      { hero: { $file: { url: 'https://img.example/hero.png', alt: 'Hero' } } },
      opts,
    )

    expect(data.hero).toBe('media-1')
    expect(calls.some((c) => c.method === 'POST' && c.url.endsWith('/api/media'))).toBe(true)
  })

  it('dry-run replaces a $file with a placeholder and uploads nothing', async () => {
    const { fetchFn, calls } = createFakeFetch()
    const client = makeClient(fetchFn)
    const { opts } = resolveOpts({ dryRun: true })

    const data = await resolveData(
      client,
      { hero: { $file: { path: './assets/hero.png', alt: 'Hero' } } },
      opts,
    )

    expect(data.hero).toBe('<file:hero.png>')
    expect(calls.some((c) => c.method === 'POST')).toBe(false)
  })
})

describe('resolveData — $lexical', () => {
  it('expands prose into a Lexical editor state', async () => {
    const { fetchFn } = createFakeFetch()
    const client = makeClient(fetchFn)
    const { opts } = resolveOpts()

    const data = await resolveData(client, { body: { $lexical: 'One.\n\nTwo.' } }, opts)

    const state = data.body as { root?: { children?: unknown[] } }
    expect(state.root?.children?.length).toBeGreaterThan(0)
  })

  it('rejects a malformed directive (more than one directive key)', async () => {
    const { fetchFn } = createFakeFetch()
    const client = makeClient(fetchFn)
    const { opts } = resolveOpts()
    await expect(
      resolveData(client, { x: { $lexical: 'a', $ref: { collection: 'c', value: 'v' } } }, opts),
    ).rejects.toThrow(/malformed directive/)
  })
})

describe('sequential array ordering', () => {
  it('a later $ref resolves a doc an earlier spec created', async () => {
    const { fetchFn, calls } = createFakeFetch()
    const client = makeClient(fetchFn)

    const validated = validateSpecs([
      { collection: 'industries', data: { slug: 'health', title: 'Health' } },
      {
        collection: 'caseStudies',
        data: {
          slug: 'acme',
          title: 'Acme',
          industry: { $ref: { collection: 'industries', field: 'slug', value: 'health' } },
        },
      },
    ])
    expect(validated.ok).toBe(true)
    if (!validated.ok) return

    // Drive the same loop the CLI runs: resolve then upsert, in order.
    for (const spec of validated.value) {
      const { opts } = resolveOpts()
      const data = await resolveData(client, spec.data, opts)
      await upsertSpec(client, spec, data, { draft: false, dryRun: false })
    }

    // The industry was POSTed before the case study referenced it.
    const industryPostIdx = calls.findIndex(
      (c) => c.method === 'POST' && c.url.includes('/api/industries'),
    )
    const caseStudyRefLookupIdx = calls.findIndex(
      (c) => c.method === 'GET' && c.url.includes('/api/industries'),
    )
    expect(industryPostIdx).toBeGreaterThanOrEqual(0)
    // The case study's POST carries the created industry id.
    const csBody = bodyOf(calls, 'POST', '/api/caseStudies')
    expect(csBody.industry).toBe('industries-1')
    // And the resolving lookup happened after the create.
    const refLookup = calls
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => c.method === 'GET' && c.url.includes('/api/industries'))
      .at(-1)
    expect(refLookup && refLookup.i).toBeGreaterThan(industryPostIdx)
    expect(caseStudyRefLookupIdx).toBeGreaterThanOrEqual(0)
  })
})
