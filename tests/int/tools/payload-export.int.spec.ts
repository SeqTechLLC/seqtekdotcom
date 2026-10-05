// @vitest-environment node
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import type { Block, CollectionConfig, GlobalConfig } from 'payload'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { PayloadRestClient, type FetchFn } from '../../../tools/payload-rest/client'
import { exportContent, loadOrder } from '../../../tools/payload-export/run'
import {
  exportFields,
  exportLexical,
  type Directive,
  type TransformContext,
} from '../../../tools/payload-export/transform'
import { resolveData } from '../../../tools/payload-seed/resolve'

/**
 * Unit coverage for the exporter. A small synthetic schema exercises every
 * field shape the transform handles; an injected `fetch` stands in for the
 * server. The seeder's own resolver closes the loop: an exported document
 * resolved back against the same ids must equal what was read.
 */

const Figure: Block = {
  slug: 'figure',
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'caption', type: 'text' },
  ],
}

const Cards: Block = {
  slug: 'cards',
  fields: [
    { name: 'items', type: 'relationship', relationTo: ['posts', 'categories'], hasMany: true },
    {
      name: 'rows',
      type: 'array',
      fields: [{ name: 'image', type: 'upload', relationTo: 'media' }],
    },
  ],
}

const Media: CollectionConfig = {
  slug: 'media',
  upload: true,
  fields: [{ name: 'alt', type: 'text' }],
}
const Users: CollectionConfig = { slug: 'users', auth: true, fields: [] }
const Categories: CollectionConfig = {
  slug: 'categories',
  fields: [{ name: 'slug', type: 'text' }],
}
const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  fields: [{ name: 'quote', type: 'textarea' }],
}
const Posts: CollectionConfig = {
  slug: 'posts',
  versions: { drafts: true },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'slug', type: 'text' },
      ],
    },
    { name: 'tags', type: 'relationship', relationTo: 'categories', hasMany: true },
    { name: 'testimonial', type: 'relationship', relationTo: 'testimonials' },
    { name: 'hero', type: 'upload', relationTo: 'media' },
    {
      name: 'seo',
      type: 'group',
      fields: [{ name: 'image', type: 'upload', relationTo: 'media' }],
    },
    {
      type: 'tabs',
      tabs: [
        { label: 'Main', fields: [{ name: 'flag', type: 'checkbox' }] },
        { name: 'meta', label: 'Meta', fields: [{ name: 'note', type: 'text' }] },
      ],
    },
    { name: 'layout', type: 'blocks', blocks: [Cards] },
    { name: 'body', type: 'richText' },
  ],
}
const Home: GlobalConfig = {
  slug: 'home',
  versions: { drafts: true },
  fields: [{ name: 'hero', type: 'upload', relationTo: 'media' }],
}

const DIRECTIVES: Record<string, Directive> = {
  'media:1': { $file: { path: 'out/media/a.webp', alt: 'A' } },
  'categories:5': { $ref: { collection: 'categories', value: 'ai' } },
  'posts:9': { $ref: { collection: 'posts', value: 'other' } },
  'testimonials:3': { $ref: { collection: 'testimonials', field: 'quote', value: 'Great.' } },
}

function context(): { ctx: TransformContext; warnings: string[] } {
  const warnings: string[] = []
  return {
    warnings,
    ctx: {
      ref: (collection, id) => DIRECTIVES[`${collection}:${id}`] ?? null,
      richTextBlocks: [Figure],
      warn: (msg) => warnings.push(msg),
    },
  }
}

const lexical = (...children: unknown[]): Record<string, unknown> => ({
  root: { type: 'root', version: 1, children },
})

const POST = {
  id: 9,
  title: 'Hello',
  slug: 'hello',
  tags: [5],
  testimonial: 3,
  hero: 1,
  seo: { image: 1 },
  flag: true,
  meta: { note: 'n' },
  layout: [
    {
      id: 'row1',
      blockType: 'cards',
      blockName: null,
      items: [{ relationTo: 'posts', value: 9 }],
      rows: [{ id: 'r1', image: 1 }],
    },
  ],
  body: lexical(
    { type: 'upload', version: 3, relationTo: 'media', value: 1 },
    {
      type: 'paragraph',
      version: 1,
      children: [
        {
          type: 'link',
          version: 3,
          fields: { linkType: 'internal', doc: { relationTo: 'posts', value: 9 } },
          children: [{ type: 'text', text: 'see' }],
        },
      ],
    },
    {
      type: 'block',
      version: 2,
      fields: { id: 'b1', blockType: 'figure', image: 1, caption: 'c' },
    },
  ),
  _status: 'published',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

describe('exportFields', () => {
  it('rewrites every relation as a directive and keeps only declared fields', () => {
    const { ctx, warnings } = context()
    const data = exportFields(Posts.fields, POST, ctx, 'posts:hello')

    expect(data).toEqual({
      title: 'Hello',
      slug: 'hello',
      tags: [DIRECTIVES['categories:5']],
      testimonial: DIRECTIVES['testimonials:3'],
      hero: DIRECTIVES['media:1'],
      seo: { image: DIRECTIVES['media:1'] },
      flag: true,
      meta: { note: 'n' },
      layout: [
        {
          blockType: 'cards',
          items: [{ relationTo: 'posts', value: DIRECTIVES['posts:9'] }],
          rows: [{ image: DIRECTIVES['media:1'] }],
        },
      ],
      body: lexical(
        { type: 'upload', version: 3, relationTo: 'media', value: DIRECTIVES['media:1'] },
        {
          type: 'paragraph',
          version: 1,
          children: [
            {
              type: 'link',
              version: 3,
              fields: {
                linkType: 'internal',
                doc: { relationTo: 'posts', value: DIRECTIVES['posts:9'] },
              },
              children: [{ type: 'text', text: 'see' }],
            },
          ],
        },
        {
          type: 'block',
          version: 2,
          fields: { id: 'b1', blockType: 'figure', image: DIRECTIVES['media:1'], caption: 'c' },
        },
      ),
    })
    expect(warnings).toEqual([])
  })

  it('drops a relation that does not resolve, and says so', () => {
    const { ctx, warnings } = context()
    const data = exportFields(
      Posts.fields,
      { tags: [5, 404], testimonial: 404, hero: null },
      ctx,
      'posts:x',
    )
    expect(data).toEqual({ tags: [DIRECTIVES['categories:5']], testimonial: null, hero: null })
    expect(warnings).toHaveLength(2)
  })

  it('leaves out a field the document does not carry, rather than clearing it', () => {
    const { ctx } = context()
    expect(exportFields(Posts.fields, { title: 'Only' }, ctx, 'posts:x')).toEqual({ title: 'Only' })
  })
})

describe('exportLexical', () => {
  it('removes a dangling upload and unwraps a link to a missing document', () => {
    const { ctx, warnings } = context()
    const out = exportLexical(
      lexical(
        { type: 'upload', relationTo: 'media', value: 404 },
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              fields: { linkType: 'internal', doc: { relationTo: 'posts', value: 404 } },
              children: [{ type: 'text', text: 'kept' }],
            },
          ],
        },
      ),
      ctx,
      'posts:x',
    )
    expect(out).toEqual(lexical({ type: 'paragraph', children: [{ type: 'text', text: 'kept' }] }))
    expect(warnings).toHaveLength(2)
  })
})

describe('round trip through the seeder', () => {
  it('resolves an export back to the ids it was read with', async () => {
    const { ctx } = context()
    const exported = exportFields(Posts.fields, POST, ctx, 'posts:hello')

    // A server holding the same documents: lookups by identity answer the original ids.
    const ids: Record<string, number> = {
      'media:filename:a.webp': 1,
      'categories:slug:ai': 5,
      'posts:slug:other': 9,
      'testimonials:quote:Great.': 3,
    }
    const fetchFn: FetchFn = async (input) => {
      const u = new URL(String(input))
      const collection = u.pathname.replace('/api/', '')
      const where = [...u.searchParams].find(([k]) => k.startsWith('where['))
      const field = where?.[0].match(/^where\[(.+)\]\[equals\]$/)?.[1]
      const id = ids[`${collection}:${field}:${where?.[1]}`]
      return new Response(JSON.stringify({ docs: id === undefined ? [] : [{ id }] }), {
        headers: { 'content-type': 'application/json' },
      })
    }
    const client = new PayloadRestClient({ baseUrl: 'http://cms.test', token: 't', fetchFn })
    const resolved = await resolveData(client, exported, {
      dryRun: false,
      allowMissingRefs: false,
      log: () => {},
      warn: () => {},
    })

    // Everything the export kept comes back as read; row ids and system fields were left behind.
    expect(resolved).toEqual({
      title: 'Hello',
      slug: 'hello',
      tags: [5],
      testimonial: 3,
      hero: 1,
      seo: { image: 1 },
      flag: true,
      meta: { note: 'n' },
      layout: [
        { blockType: 'cards', items: [{ relationTo: 'posts', value: 9 }], rows: [{ image: 1 }] },
      ],
      body: POST.body,
    })
  })
})

describe('loadOrder', () => {
  it('puts a referenced collection before the one that points at it', () => {
    const order = loadOrder([Posts, Testimonials, Categories]).map((c) => c.slug)
    expect(order.indexOf('categories')).toBeLessThan(order.indexOf('posts'))
    expect(order.indexOf('testimonials')).toBeLessThan(order.indexOf('posts'))
  })
})

describe('exportContent', () => {
  let out: string
  beforeEach(async () => {
    out = await mkdtemp(path.join(tmpdir(), 'payload-export-'))
  })
  afterEach(async () => {
    await rm(out, { recursive: true, force: true })
  })

  const DOCS: Record<string, Array<Record<string, unknown>>> = {
    categories: [{ id: 5, slug: 'ai' }],
    testimonials: [],
    posts: [
      { id: 9, slug: 'zeta', title: 'Z', hero: 1, _status: 'draft' },
      {
        id: 8,
        slug: 'alpha',
        title: 'A',
        tags: [5],
        _status: 'published',
        updatedAt: '2026-10-05T15:00:00.000Z',
      },
    ],
    media: [
      {
        id: 1,
        filename: 'a.webp',
        alt: 'A',
        url: 'http://cms.test/api/media/file/a.webp',
        filesize: 3,
      },
    ],
  }

  // A draft save writes only the versions table, so the never-published `zeta`
  // has moved on from its main row; `draft=true` reads that latest version.
  const LATEST: Record<string, Array<Record<string, unknown>>> = {
    posts: [
      {
        id: 9,
        slug: 'zeta',
        title: 'Z, second draft',
        hero: 1,
        _status: 'draft',
        updatedAt: '2026-10-05T16:00:00.000Z',
      },
    ],
  }

  function server(): {
    fetchFn: FetchFn
    requests: Array<{ url: string; headers: Record<string, string> }>
  } {
    const requests: Array<{ url: string; headers: Record<string, string> }> = []
    const fetchFn: FetchFn = async (input, init) => {
      const u = new URL(String(input))
      requests.push({ url: u.toString(), headers: (init?.headers as Record<string, string>) ?? {} })
      if (u.pathname.startsWith('/api/media/file/')) return new Response(new Uint8Array([1, 2, 3]))
      const json = (body: unknown): Response =>
        new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } })
      if (u.pathname === '/api/globals/home') return json({ id: 1, hero: 1, _status: 'published' })
      const key = u.pathname.replace('/api/', '')
      const docs = u.searchParams.get('draft') === 'true' ? LATEST[key] : DOCS[key]
      return json({ docs: docs ?? [], hasNextPage: false })
    }
    return { fetchFn, requests }
  }

  const run = (fetchFn: FetchFn, only?: string[]): ReturnType<typeof exportContent> =>
    exportContent({
      client: new PayloadRestClient({
        baseUrl: 'http://cms.test',
        token: 't',
        cookie: 'gate=1',
        fetchFn,
      }),
      config: {
        collections: [Media, Users, Posts, Testimonials, Categories],
        globals: [Home],
        richTextBlocks: [],
      },
      outDir: out,
      only,
      cwd: out,
      log: () => {},
      warn: () => {},
    })

  it('writes one file per collection in load order, sorted, with media beside it', async () => {
    const { fetchFn, requests } = server()
    const summary = await run(fetchFn)

    expect((await readdir(out)).sort()).toEqual([
      '01-categories.json',
      '03-posts.json',
      '04-home.json',
      'media',
    ])
    const posts = JSON.parse(await readFile(path.join(out, '03-posts.json'), 'utf8')) as unknown[]
    expect(posts).toEqual([
      {
        collection: 'posts',
        status: 'published',
        basedOn: '2026-10-05T15:00:00.000Z',
        data: {
          title: 'A',
          slug: 'alpha',
          tags: [{ $ref: { collection: 'categories', value: 'ai' } }],
        },
      },
      {
        collection: 'posts',
        status: 'unpublished',
        basedOn: '2026-10-05T16:00:00.000Z',
        data: {
          title: 'Z, second draft',
          slug: 'zeta',
          hero: { $file: { path: 'media/a.webp', alt: 'A' } },
        },
      },
    ])
    expect(await readFile(path.join(out, 'media/a.webp'))).toEqual(Buffer.from([1, 2, 3]))
    expect(summary.media).toEqual({ downloaded: 1, unchanged: 0 })

    // The file download carries the gate cookie but never the session JWT.
    const download = requests.find((r) => r.url.includes('/api/media/file/'))
    expect(download?.headers).toEqual({ Cookie: 'gate=1' })
  })

  it('skips a media file already on disk at the same size', async () => {
    await run(server().fetchFn)
    const summary = await run(server().fetchFn)
    expect(summary.media).toEqual({ downloaded: 0, unchanged: 1 })
  })

  it('keeps file numbers when narrowed, and removes the file of a collection now empty', async () => {
    await writeFile(path.join(out, '02-testimonials.json'), '[]')
    await run(server().fetchFn, ['posts', 'testimonials'])
    expect((await readdir(out)).filter((f) => f.endsWith('.json'))).toEqual(['03-posts.json'])
  })

  it('refuses an unknown name', async () => {
    await expect(run(server().fetchFn, ['nope'])).rejects.toThrow(
      'unknown collection or global "nope"',
    )
  })
})
