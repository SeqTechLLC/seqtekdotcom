import { describe, expect, it } from 'vitest'

import { PayloadRestClient, PayloadRestError } from '../../../tools/payload-rest/client'
import { preflight } from '../../../tools/payload-seed/preflight'
import { validateSpecs } from '../../../tools/payload-seed/spec'

/**
 * The seeder's robustness contract, written after an assessment found that the
 * parts which had already burned someone were solid and the parts that had not
 * were sharp. Each block below pins one defect that was real:
 *
 *   - a hang with no timeout, which an unattended caller cannot distinguish
 *     from slow progress (cost a 10-minute stall on a gated lane);
 *   - a typo'd spec key silently doing the OPPOSITE of what the file says;
 *   - directive errors surfacing after N documents were already written;
 *   - `$file.path` pointing at nothing, discovered mid-run.
 *
 * `createIfMissing` publishing rather than drafting, and dry-run reporting
 * create-vs-update, are pinned in `payload-seed.int.spec.ts` beside the
 * behaviour they changed.
 */

const okJson = (body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })

describe('client — per-request timeout', () => {
  it('fails with an actionable message instead of hanging', async () => {
    // A gated lane reached without its cookie does not refuse — it stalls.
    const neverResolves: typeof fetch = (_input, init) =>
      new Promise((_res, rej) => {
        init?.signal?.addEventListener('abort', () =>
          rej(Object.assign(new Error('aborted'), { name: 'TimeoutError' })),
        )
      })

    const client = new PayloadRestClient({
      baseUrl: 'https://gated.example.com',
      token: 't',
      timeoutMs: 40,
      fetchFn: neverResolves,
    })

    await expect(client.findIdByField('services', 'slug', 'x', { draft: false })).rejects.toThrow(
      /exceeded 40ms.*IMPORT_COOKIE/s,
    )
  })

  it('surfaces the timeout as a PayloadRestError, so callers can branch on it', async () => {
    const neverResolves: typeof fetch = (_input, init) =>
      new Promise((_res, rej) => {
        init?.signal?.addEventListener('abort', () =>
          rej(Object.assign(new Error('aborted'), { name: 'TimeoutError' })),
        )
      })
    const client = new PayloadRestClient({
      baseUrl: 'https://gated.example.com',
      token: 't',
      timeoutMs: 30,
      fetchFn: neverResolves,
    })
    await expect(
      client.findIdByField('services', 'slug', 'x', { draft: false }),
    ).rejects.toBeInstanceOf(PayloadRestError)
  })

  it('does not interfere with a request that answers in time', async () => {
    const client = new PayloadRestClient({
      baseUrl: 'https://example.com',
      token: 't',
      timeoutMs: 5_000,
      fetchFn: async () => okJson({ docs: [{ id: 7 }] }),
    })
    await expect(client.findIdByField('services', 'slug', 'x', { draft: false })).resolves.toBe(7)
  })
})

describe('spec validation — key typos', () => {
  it('rejects a near-miss of a real key', () => {
    // The motivating case: `stauts` is ignored, `parseStatus(undefined)`
    // returns 'published', and a spec meant to RETIRE a document publishes it.
    const r = validateSpecs([
      { collection: 'services', identity: 'slug', stauts: 'unpublished', data: { slug: 'a' } },
    ])
    expect(r.ok).toBe(false)
    expect(r.ok === false && r.errors.join('\n')).toMatch(/stauts.*typo for "status"/)
  })

  it('rejects a near-miss of identity, which would silently change the upsert key', () => {
    const r = validateSpecs([{ collection: 'services', identiy: 'title', data: { slug: 'a' } }])
    expect(r.ok).toBe(false)
    expect(r.ok === false && r.errors.join('\n')).toMatch(/identiy.*typo for "identity"/)
  })

  it('leaves deliberate metadata alone — the escape hatch content files rely on', () => {
    // `docs/content-drafts` parks editorial notes beside `collection`, and
    // `_note` documents a spec in place. Neither resembles a real key.
    const r = validateSpecs([
      {
        collection: 'services',
        identity: 'slug',
        _note: 'why this exists',
        bannerHeadline: 'editorial aside',
        data: { slug: 'a' },
      },
    ])
    expect(r.ok).toBe(true)
  })
})

describe('preflight — structure before the first write', () => {
  const spec = (data: Record<string, unknown>) => {
    const v = validateSpecs([{ collection: 'services', identity: 'slug', data }])
    if (!v.ok) throw new Error(`fixture invalid: ${v.errors.join(', ')}`)
    return v.value
  }

  it('reports every problem in one pass, not the first', async () => {
    const { errors } = await preflight(
      spec({
        slug: 'a',
        one: { $ref: { collection: '', field: 'slug', value: 'x' } },
        two: { $lexical: 123 },
        three: { $file: { url: 'https://e.com/a.png' } },
      }),
      process.cwd(),
    )
    expect(errors).toHaveLength(3)
    expect(errors.join('\n')).toMatch(/\$ref\.collection/)
    expect(errors.join('\n')).toMatch(/\$lexical value must be a string/)
    expect(errors.join('\n')).toMatch(/\$file\.alt is required/)
  })

  it('names the document, not just the collection', async () => {
    const { errors } = await preflight(
      spec({ slug: 'the-one-that-broke', bad: { $lexical: 5 } }),
      process.cwd(),
    )
    expect(errors[0]).toContain('services:the-one-that-broke')
  })

  it('catches a $file.path that is not on disk', async () => {
    const { errors } = await preflight(
      spec({ slug: 'a', img: { $file: { path: 'no/such/asset.png', alt: 'x' } } }),
      process.cwd(),
    )
    expect(errors.join('\n')).toMatch(/does not exist on disk/)
  })

  it('rejects a directive object carrying extra keys', async () => {
    const { errors } = await preflight(
      spec({ slug: 'a', x: { $ref: { collection: 'c', field: 'f', value: 'v' }, note: 'oops' } }),
      process.cwd(),
    )
    expect(errors.join('\n')).toMatch(/malformed directive/)
  })

  it('passes a well-formed file', async () => {
    const { errors } = await preflight(
      spec({
        slug: 'a',
        rel: { $ref: { collection: 'industries', field: 'slug', value: 'energy' } },
        body: { $lexical: 'Some prose.' },
      }),
      process.cwd(),
    )
    expect(errors).toEqual([])
  })
})

describe('dry-run — intra-file refs resolve without the network', () => {
  it('resolves a $ref to a doc an earlier spec would create, even when the target is unreachable', async () => {
    const { resolveData } = await import('../../../tools/payload-seed/resolve')
    const logs: string[] = []
    // Any network call here is a failure of the test's premise, not a timeout.
    const exploding: typeof fetch = () => {
      throw new Error('the resolver reached the network for a planned identity')
    }
    const client = new PayloadRestClient({
      baseUrl: 'http://127.0.0.1:9',
      token: 't',
      fetchFn: exploding,
    })

    const out = await resolveData(
      client,
      { industry: { $ref: { collection: 'industries', field: 'slug', value: 'brand-new' } } },
      {
        dryRun: true,
        allowMissingRefs: false,
        plannedIdentities: new Map([['industries:slug:brand-new', 0]]),
        specIndex: 1,
        log: (m) => logs.push(m),
        warn: () => {},
      },
    )

    expect(out.industry).toBe('<ref-planned:industries:brand-new>')
    expect(logs.join('\n')).toMatch(/would resolve .* an earlier spec creates/)
  })

  it('still reports a ref that no spec creates as unresolved', async () => {
    const { resolveData } = await import('../../../tools/payload-seed/resolve')
    const client = new PayloadRestClient({
      baseUrl: 'https://example.com',
      token: 't',
      fetchFn: async () => okJson({ docs: [] }),
    })
    await expect(
      resolveData(
        client,
        { industry: { $ref: { collection: 'industries', field: 'slug', value: 'nope' } } },
        {
          dryRun: true,
          allowMissingRefs: false,
          plannedIdentities: new Map([['industries:slug:something-else', 0]]),
          specIndex: 1,
          log: () => {},
          warn: () => {},
        },
      ),
    ).rejects.toThrow(/unresolved \$ref/)
  })
})

describe('dry-run — order matters', () => {
  it('does NOT resolve a $ref pointing at a doc a LATER spec creates', async () => {
    const { resolveData } = await import('../../../tools/payload-seed/resolve')
    const client = new PayloadRestClient({
      baseUrl: 'https://example.com',
      token: 't',
      fetchFn: async () => okJson({ docs: [] }),
    })

    // Spec 0 refers to something spec 5 creates. Specs run sequentially, so the
    // real run fails here — a dry-run that called this resolvable would
    // under-report the exact failure class it exists to catch, and load order
    // is a documented constraint of these files.
    await expect(
      resolveData(
        client,
        { industry: { $ref: { collection: 'industries', field: 'slug', value: 'made-later' } } },
        {
          dryRun: true,
          allowMissingRefs: false,
          plannedIdentities: new Map([['industries:slug:made-later', 5]]),
          specIndex: 0,
          log: () => {},
          warn: () => {},
        },
      ),
    ).rejects.toThrow(/unresolved \$ref/)
  })
})

describe('preflight — parity with the resolver', () => {
  const spec = (data: Record<string, unknown>) => {
    const v = validateSpecs([{ collection: 'services', identity: 'slug', data }])
    if (!v.ok) throw new Error(`fixture invalid: ${v.errors.join(', ')}`)
    return v.value
  }

  it('accepts a $ref with no `field` — the documented shorthand defaulting to slug', async () => {
    // `resolve.ts` defaults `field` to 'slug' and the README says so. Pre-flight
    // requiring it made the gate reject the shorthand its own docs teach, and
    // because pre-flight runs before the first write that is a hard exit 2.
    const { errors } = await preflight(
      spec({ slug: 'a', industry: { $ref: { collection: 'industries', value: 'energy' } } }),
      process.cwd(),
    )
    expect(errors).toEqual([])
  })

  it('still rejects a `field` that is present but unusable', async () => {
    const { errors } = await preflight(
      spec({ slug: 'a', x: { $ref: { collection: 'c', field: '', value: 'v' } } }),
      process.cwd(),
    )
    expect(errors.join('\n')).toMatch(/\$ref\.field must be a non-empty string when set/)
  })

  it('rejects a numeric $ref.value, which the resolver would reject mid-run', async () => {
    // Pre-flight accepting what the resolver refuses recreates the exact
    // partial-write shape the gate exists to prevent.
    const { errors } = await preflight(
      spec({ slug: 'a', x: { $ref: { collection: 'c', field: 'f', value: 42 } } }),
      process.cwd(),
    )
    expect(errors.join('\n')).toMatch(/must be a string or an array of strings/)
  })
})

describe('spec validation — the typo net is narrow on purpose', () => {
  const base = { collection: 'services', identity: 'slug', data: { slug: 'x' } }

  it.each(['stauts', 'identiy', 'statuss', 'identtiy'])('flags %s', (key) => {
    expect(validateSpecs([{ ...base, [key]: 'v' }]).ok).toBe(false)
  })

  // These are ordinary editorial keys. An earlier cut used distance 2 against
  // all five known keys and rejected every one of them, turning a file that
  // seeded fine into a hard exit 1.
  it.each(['date', 'meta', 'state', 'entity', 'notes', 'title', 'tags', 'bannerHeadline'])(
    'leaves %s alone',
    (key) => {
      expect(validateSpecs([{ ...base, [key]: 'v' }]).ok).toBe(true)
    },
  )

  it.each([
    ['collectoin', 'collection'],
    ['dat', 'data'],
  ])('%s is caught by the required-field check, not the heuristic', (typo, real) => {
    const spec: Record<string, unknown> = { identity: 'slug', data: { slug: 'x' }, [typo]: 'v' }
    if (real === 'data') delete spec.data
    else delete spec.collection
    if (real === 'data') spec.collection = 'services'
    const r = validateSpecs([spec])
    expect(r.ok).toBe(false)
  })
})

describe('listPublishedFieldValues — orphan detection reads', () => {
  const page = (docs: unknown[], hasNextPage = false) => okJson({ docs, hasNextPage })

  it('excludes retired documents, which an admin token would otherwise return', async () => {
    // `draft: false` picks the main table, not published-only; the `_status`
    // filter normally comes from access control, and `publishedOrAuthed`
    // returns `true` for the admin session this always runs with. Without a
    // client-side filter, documents retired via `status: "unpublished"` came
    // back and were reported as live orphans.
    const client = new PayloadRestClient({
      baseUrl: 'https://example.com',
      token: 't',
      fetchFn: async () =>
        page([
          { slug: 'live', _status: 'published' },
          { slug: 'retired', _status: 'draft' },
        ]),
    })
    await expect(client.listPublishedFieldValues('services', 'slug')).resolves.toEqual(['live'])
  })

  it('treats a missing _status as published, for collections without drafts', async () => {
    // `categories` has no `versions` key at all, so no `_status` column. A
    // server-side `where[_status][equals]=published` would return nothing here.
    const client = new PayloadRestClient({
      baseUrl: 'https://example.com',
      token: 't',
      fetchFn: async () => page([{ slug: 'strategy' }, { slug: 'delivery' }]),
    })
    await expect(client.listPublishedFieldValues('categories', 'slug')).resolves.toEqual([
      'strategy',
      'delivery',
    ])
  })

  it('follows pagination instead of truncating', async () => {
    // A single limit=500 with hasNextPage discarded silently truncated, which
    // is a FALSE NEGATIVE in the one diagnostic built to surface documents you
    // cannot otherwise see.
    let call = 0
    const client = new PayloadRestClient({
      baseUrl: 'https://example.com',
      token: 't',
      fetchFn: async () => {
        call += 1
        return call === 1
          ? page([{ slug: 'a', _status: 'published' }], true)
          : page([{ slug: 'b', _status: 'published' }], false)
      },
    })
    await expect(client.listPublishedFieldValues('services', 'slug')).resolves.toEqual(['a', 'b'])
    expect(call).toBe(2)
  })
})

describe('PayloadRestError — timeout is structural, not textual', () => {
  it('carries code "timeout" so the abort does not depend on message prose', async () => {
    const neverResolves: typeof fetch = (_i, init) =>
      new Promise((_r, rej) =>
        init?.signal?.addEventListener('abort', () =>
          rej(Object.assign(new Error('aborted'), { name: 'TimeoutError' })),
        ),
      )
    const client = new PayloadRestClient({
      baseUrl: 'https://x.example',
      token: 't',
      timeoutMs: 25,
      fetchFn: neverResolves,
    })
    await client.findIdByField('s', 'slug', 'x', { draft: false }).then(
      () => expect.unreachable('should have timed out'),
      (err: unknown) => {
        expect(err).toBeInstanceOf(PayloadRestError)
        expect((err as PayloadRestError).code).toBe('timeout')
      },
    )
  })
})
