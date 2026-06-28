// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { PayloadRestClient, type FetchFn } from '../../../tools/payload-rest/client'
import { importCaseStudy, type ImportOptions } from '../../../tools/import-case-study/importer'
import type { CaseStudyInput } from '../../../tools/import-case-study/types'
import { validateInput } from '../../../tools/import-case-study/types'

/**
 * Unit coverage for the case-study importer. Uses an injected `fetch` so it
 * needs no running server or DB — it asserts the importer builds the right
 * requests (auth header, draft vs publish, upsert routing, Lexical prose) and
 * resolves relations by slug. (Lives under tests/int/** to match the vitest
 * include glob; it does not touch the testcontainer Postgres.)
 */

type DocId = string | number

interface Recorded {
  url: string
  method: string
  headers: Record<string, string>
  body: BodyInit | null
}

interface FakeOptions {
  industries?: Record<string, DocId | null>
  services?: Record<string, DocId | null>
  caseStudies?: Record<string, DocId | null>
  createId?: DocId
  updateId?: DocId
}

function createFakeFetch(opts: FakeOptions): { fetchFn: FetchFn; calls: Recorded[] } {
  const calls: Recorded[] = []
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
    const slugParam = (): string => u.searchParams.get('where[slug][equals]') ?? ''

    // Non-/api/ request → an image fetch by URL.
    if (!u.pathname.startsWith('/api/')) {
      return new Response(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), {
        headers: { 'content-type': 'image/png' },
      })
    }
    if (method === 'GET' && u.pathname === '/api/industries') {
      const id = opts.industries?.[slugParam()] ?? null
      return json({ docs: id === null ? [] : [{ id }] })
    }
    if (method === 'GET' && u.pathname === '/api/services') {
      const id = opts.services?.[slugParam()] ?? null
      return json({ docs: id === null ? [] : [{ id }] })
    }
    if (method === 'GET' && u.pathname === '/api/caseStudies') {
      const id = opts.caseStudies?.[slugParam()] ?? null
      return json({ docs: id === null ? [] : [{ id }] })
    }
    if (method === 'POST' && u.pathname === '/api/media') {
      mediaCount += 1
      return json({ doc: { id: `media-${mediaCount}` } })
    }
    if (method === 'POST' && u.pathname === '/api/caseStudies') {
      return json({ doc: { id: opts.createId ?? 'cs-new' } })
    }
    if (method === 'PATCH' && u.pathname.startsWith('/api/caseStudies/')) {
      return json({ doc: { id: opts.updateId ?? 'cs-existing' } })
    }
    return json({ errors: [{ message: `unhandled ${method} ${u.pathname}` }] }, 500)
  }

  return { fetchFn, calls }
}

function collectOpts(overrides: Partial<ImportOptions> = {}): {
  opts: ImportOptions
  logs: string[]
  warns: string[]
} {
  const logs: string[] = []
  const warns: string[] = []
  return {
    logs,
    warns,
    opts: {
      publish: false,
      dryRun: false,
      log: (m) => logs.push(m),
      warn: (m) => warns.push(m),
      ...overrides,
    },
  }
}

const baseInput: CaseStudyInput = {
  slug: 'acme',
  title: 'Acme',
  industry: 'logistics',
  heroImage: { url: 'https://img.example/hero.png', alt: 'Hero' },
  problem: 'A problem.\n\nA second paragraph.',
}

const TOKEN = 'test-token'

function bodyOf(calls: Recorded[], method: string, pathFragment: string): Record<string, unknown> {
  const call = calls.find((c) => c.method === method && c.url.includes(pathFragment))
  if (!call || typeof call.body !== 'string')
    throw new Error(`no ${method} call to ${pathFragment}`)
  return JSON.parse(call.body) as Record<string, unknown>
}

describe('validateInput', () => {
  it('reports all missing required fields at once', () => {
    const result = validateInput({})
    expect(result.ok).toBe(false)
    if (result.ok) return
    const joined = result.errors.join('\n')
    expect(joined).toMatch(/"slug"/)
    expect(joined).toMatch(/"title"/)
    expect(joined).toMatch(/"industry"/)
    expect(joined).toMatch(/"heroImage"/)
  })

  it('rejects an image ref missing alt or with both file and url', () => {
    const r1 = validateInput({
      slug: 'x',
      title: 'X',
      industry: 'i',
      heroImage: { url: 'https://x/y.png' },
    })
    expect(r1.ok).toBe(false)
    const r2 = validateInput({
      slug: 'x',
      title: 'X',
      industry: 'i',
      heroImage: { file: './a.png', url: 'https://x/y.png', alt: 'a' },
    })
    expect(r2.ok).toBe(false)
  })

  it('accepts a complete valid object', () => {
    const result = validateInput({
      slug: 'acme-logistics-platform',
      title: 'Rebuilding Acme',
      industry: 'logistics',
      heroImage: { file: './hero.jpg', alt: 'Hero' },
      services: ['custom-software'],
      metrics: [{ number: '52%', label: 'Faster' }],
      technologies: ['Next.js'],
    })
    expect(result.ok).toBe(true)
  })

  it('rejects more than 3 related case studies', () => {
    const result = validateInput({
      slug: 'x',
      title: 'X',
      industry: 'i',
      heroImage: { file: './a.png', alt: 'a' },
      relatedCaseStudies: ['a', 'b', 'c', 'd'],
    })
    expect(result.ok).toBe(false)
  })
})

describe('importCaseStudy', () => {
  it('creates a draft: resolves industry, uploads hero, POSTs with ?draft=true and JWT auth', async () => {
    const { fetchFn, calls } = createFakeFetch({
      industries: { logistics: 'ind-1' },
      caseStudies: {},
    })
    const client = new PayloadRestClient({
      baseUrl: 'http://localhost:3100',
      token: TOKEN,
      fetchFn,
    })
    const { opts } = collectOpts()

    const result = await importCaseStudy(client, baseInput, opts)

    expect(result.operation).toBe('create')
    expect(result.status).toBe('draft')

    // Hero was uploaded before the case study was created.
    expect(calls.some((c) => c.method === 'POST' && c.url.endsWith('/api/media'))).toBe(true)

    const createCall = calls.find((c) => c.method === 'POST' && c.url.includes('/api/caseStudies'))
    expect(createCall).toBeDefined()
    expect(createCall?.url).toContain('draft=true')
    expect(createCall?.headers.Authorization).toBe(`JWT ${TOKEN}`)

    const body = bodyOf(calls, 'POST', '/api/caseStudies')
    expect(body.industry).toBe('ind-1')
    expect(body.heroImage).toBe('media-1')
    expect(body._status).toBeUndefined()
    // Prose converted to a Lexical editor state.
    expect(
      (body.problem as { root?: { children?: unknown[] } }).root?.children?.length,
    ).toBeGreaterThan(0)
  })

  it('updates in place (PATCH) when a case study with the slug already exists', async () => {
    const { fetchFn, calls } = createFakeFetch({
      industries: { logistics: 'ind-1' },
      caseStudies: { acme: 'cs-existing' },
    })
    const client = new PayloadRestClient({
      baseUrl: 'http://localhost:3100',
      token: TOKEN,
      fetchFn,
    })
    const { opts } = collectOpts()

    const result = await importCaseStudy(client, baseInput, opts)

    expect(result.operation).toBe('update')
    expect(
      calls.some((c) => c.method === 'PATCH' && c.url.includes('/api/caseStudies/cs-existing')),
    ).toBe(true)
    expect(calls.some((c) => c.method === 'POST' && c.url.includes('/api/caseStudies'))).toBe(false)
  })

  it('publishes: sets _status published + publishedAt and omits the draft param', async () => {
    const { fetchFn, calls } = createFakeFetch({
      industries: { logistics: 'ind-1' },
      caseStudies: {},
    })
    const client = new PayloadRestClient({
      baseUrl: 'http://localhost:3100',
      token: TOKEN,
      fetchFn,
    })
    const { opts } = collectOpts({ publish: true, now: () => new Date('2026-01-02T03:04:05.000Z') })

    const result = await importCaseStudy(client, baseInput, opts)

    expect(result.status).toBe('published')
    const createCall = calls.find((c) => c.method === 'POST' && c.url.includes('/api/caseStudies'))
    expect(createCall?.url).not.toContain('draft=true')
    const body = bodyOf(calls, 'POST', '/api/caseStudies')
    expect(body._status).toBe('published')
    expect(body.publishedAt).toBe('2026-01-02T03:04:05.000Z')
  })

  it('throws a clear error when the required industry slug does not resolve', async () => {
    const { fetchFn } = createFakeFetch({ industries: {}, caseStudies: {} })
    const client = new PayloadRestClient({
      baseUrl: 'http://localhost:3100',
      token: TOKEN,
      fetchFn,
    })
    const { opts } = collectOpts()

    await expect(importCaseStudy(client, baseInput, opts)).rejects.toThrow(
      /industry "logistics" not found/,
    )
  })

  it('warns and skips an unknown service slug but still imports', async () => {
    const { fetchFn, calls } = createFakeFetch({
      industries: { logistics: 'ind-1' },
      caseStudies: {},
    })
    const client = new PayloadRestClient({
      baseUrl: 'http://localhost:3100',
      token: TOKEN,
      fetchFn,
    })
    const { opts, warns } = collectOpts()

    const result = await importCaseStudy(client, { ...baseInput, services: ['nope'] }, opts)

    expect(result.operation).toBe('create')
    expect(warns.join('\n')).toMatch(/service "nope" not found/)
    const body = bodyOf(calls, 'POST', '/api/caseStudies')
    expect(body.services).toBeUndefined()
  })

  it('dry-run resolves but performs no writes', async () => {
    const { fetchFn, calls } = createFakeFetch({
      industries: { logistics: 'ind-1' },
      caseStudies: {},
    })
    const client = new PayloadRestClient({
      baseUrl: 'http://localhost:3100',
      token: TOKEN,
      fetchFn,
    })
    const { opts } = collectOpts({ dryRun: true })

    const result = await importCaseStudy(client, baseInput, opts)

    expect(result.operation).toBe('dry-run')
    expect(calls.some((c) => c.method === 'POST' || c.method === 'PATCH')).toBe(false)
  })
})
