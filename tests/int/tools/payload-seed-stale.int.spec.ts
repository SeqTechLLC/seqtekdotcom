// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { PayloadRestClient, type FetchFn } from '../../../tools/payload-rest/client'
import { validateSpecs } from '../../../tools/payload-seed/spec'
import { StaleSpecError, upsertSpec } from '../../../tools/payload-seed/upsert'

/**
 * The seeder's stale-file check (ADR 0014, ROADMAP CM-2). An exported spec
 * carries `basedOn`, the document's `updatedAt` when it was read; the seeder
 * refuses to overwrite a document whose latest version is newer.
 */

const EXPORTED = '2026-10-05T15:00:00.000Z'
const EDITED = '2026-10-05T16:00:00.000Z'
const WRITTEN = '2026-10-05T17:00:00.000Z'

function server(live: { updatedAt: string } | null): {
  fetchFn: FetchFn
  writes: Array<{ method: string; url: string }>
  reads: string[]
} {
  const writes: Array<{ method: string; url: string }> = []
  const reads: string[] = []
  const json = (body: unknown): Response =>
    new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } })
  const fetchFn: FetchFn = async (input, init) => {
    const url = String(input)
    const method = (init?.method ?? 'GET').toUpperCase()
    if (method === 'GET') {
      reads.push(url)
      if (url.includes('/api/globals/')) return json({ updatedAt: live?.updatedAt })
      return json({ docs: live ? [{ id: 7, updatedAt: live.updatedAt }] : [] })
    }
    writes.push({ method, url })
    if (url.includes('/api/globals/')) return json({ result: { updatedAt: WRITTEN } })
    return json({ doc: { id: 7, updatedAt: WRITTEN } })
  }
  return { fetchFn, writes, reads }
}

const client = (fetchFn: FetchFn): PayloadRestClient =>
  new PayloadRestClient({ baseUrl: 'http://cms.test', token: 't', fetchFn })

function spec(raw: Record<string, unknown>) {
  const v = validateSpecs(raw)
  if (!v.ok) throw new Error(v.errors.join('; '))
  return v.value[0]
}

const PAGE = { collection: 'pages', basedOn: EXPORTED, data: { slug: 'about', title: 'About' } }

describe('stale-file check', () => {
  it('writes when the document has not changed, and reports the new updatedAt', async () => {
    const s = server({ updatedAt: EXPORTED })
    const result = await upsertSpec(client(s.fetchFn), spec(PAGE), PAGE.data, {
      status: 'published',
      dryRun: false,
    })
    expect(result).toMatchObject({ operation: 'update', id: 7, updatedAt: WRITTEN })
    // The check reads the latest version, so a pending draft counts as a change.
    expect(s.reads[0]).toContain('draft=true')
  })

  it('refuses a document edited since the export, and writes nothing', async () => {
    const s = server({ updatedAt: EDITED })
    await expect(
      upsertSpec(client(s.fetchFn), spec(PAGE), PAGE.data, { status: 'published', dryRun: false }),
    ).rejects.toBeInstanceOf(StaleSpecError)
    expect(s.writes).toEqual([])
  })

  it('refuses in a dry-run too, so a rehearsal finds it', async () => {
    const s = server({ updatedAt: EDITED })
    await expect(
      upsertSpec(client(s.fetchFn), spec(PAGE), PAGE.data, { status: 'published', dryRun: true }),
    ).rejects.toBeInstanceOf(StaleSpecError)
  })

  it('writes over the edit with --force', async () => {
    const s = server({ updatedAt: EDITED })
    const result = await upsertSpec(client(s.fetchFn), spec(PAGE), PAGE.data, {
      status: 'published',
      dryRun: false,
      force: true,
    })
    expect(result.operation).toBe('update')
  })

  it('creates a document that does not exist, whatever the file was based on', async () => {
    const s = server(null)
    const result = await upsertSpec(client(s.fetchFn), spec(PAGE), PAGE.data, {
      status: 'published',
      dryRun: false,
    })
    expect(result).toMatchObject({ operation: 'create', updatedAt: WRITTEN })
  })

  it('does not check a hand-written spec with no basedOn', async () => {
    const s = server({ updatedAt: EDITED })
    const raw = { collection: 'pages', data: { slug: 'about' } }
    const result = await upsertSpec(client(s.fetchFn), spec(raw), raw.data, {
      status: 'published',
      dryRun: false,
    })
    expect(result.operation).toBe('update')
  })

  it('checks a global against its latest version', async () => {
    const raw = { global: 'homepage', basedOn: EXPORTED, data: {} }
    const stale = server({ updatedAt: EDITED })
    await expect(
      upsertSpec(client(stale.fetchFn), spec(raw), raw.data, {
        status: 'published',
        dryRun: false,
      }),
    ).rejects.toBeInstanceOf(StaleSpecError)

    const fresh = server({ updatedAt: EXPORTED })
    const result = await upsertSpec(client(fresh.fetchFn), spec(raw), raw.data, {
      status: 'published',
      dryRun: false,
    })
    expect(result).toMatchObject({ operation: 'global', updatedAt: WRITTEN })
    expect(fresh.reads[0]).toContain('/api/globals/homepage?depth=0&draft=true')
  })

  it('rejects a basedOn that is not a timestamp', () => {
    const v = validateSpecs({ ...PAGE, basedOn: 'yesterday' })
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.errors[0]).toContain('basedOn must be an ISO timestamp')
  })
})
