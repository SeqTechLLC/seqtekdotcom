/**
 * Generate mid-post editorial illustration candidates via the Leonardo.ai API.
 *
 *   npx tsx tools/leonardo-images/generate.ts            # all concepts
 *   npx tsx tools/leonardo-images/generate.ts --slug brick-for-stone
 *   npx tsx tools/leonardo-images/generate.ts --count 6  # candidates per concept
 *
 * Reads LEONARDO_API_KEY from .env.local. Flow mirrors the proven path in
 * ~/projects/micro-blog-writer (POST /generations -> poll -> download). Phoenix
 * v1 model, 16:9 (1472x832) to match the hero-banner rhythm; figures render at
 * <=720px so this is plenty of resolution. Output lands in out/<slug>/ (gitignored)
 * plus a manifest.json the curate/insert step reads.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { CONCEPTS, NEGATIVE, STYLE, type Concept } from './concepts'

const API = 'https://cloud.leonardo.ai/api/rest/v1'
const PHOENIX = 'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3' // Leonardo Phoenix 1.0
const WIDTH = 1472
const HEIGHT = 832
const POLL_MS = 4000
const MAX_POLLS = 75 // ~5 min

const HERE = path.resolve(import.meta.dirname)
const OUT = path.join(HERE, 'out')

interface GenImage {
  id: string
  url: string
}

function loadApiKey(): string {
  const fromEnv = process.env.LEONARDO_API_KEY
  if (fromEnv) return fromEnv
  const envPath = path.resolve(HERE, '../../.env.local')
  const line = readFileSync(envPath, 'utf8')
    .split('\n')
    .find((l) => l.startsWith('LEONARDO_API_KEY='))
  if (!line) throw new Error('LEONARDO_API_KEY not found in env or .env.local')
  return line
    .slice('LEONARDO_API_KEY='.length)
    .trim()
    .replace(/^["']|["']$/g, '')
}

function parseArgs(argv: readonly string[]): { slug?: string; count: number } {
  const out = { slug: undefined as string | undefined, count: 4 }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--slug' && argv[i + 1]) out.slug = argv[++i]
    else if (a === '--count' && argv[i + 1]) {
      const n = Number(argv[++i])
      if (!Number.isInteger(n) || n < 1) throw new Error(`--count must be a positive integer`)
      out.count = n
    } else throw new Error(`Unknown argument: ${a}`)
  }
  return out
}

async function headers(key: string): Promise<Record<string, string>> {
  return {
    accept: 'application/json',
    'content-type': 'application/json',
    authorization: `Bearer ${key}`,
  }
}

async function createGeneration(key: string, prompt: string, count: number): Promise<string> {
  const res = await fetch(`${API}/generations`, {
    method: 'POST',
    headers: await headers(key),
    body: JSON.stringify({
      prompt,
      negative_prompt: NEGATIVE,
      modelId: PHOENIX,
      width: WIDTH,
      height: HEIGHT,
      num_images: count,
    }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`create ${res.status}: ${text}`)
  const id = JSON.parse(text)?.sdGenerationJob?.generationId
  if (!id) throw new Error(`no generationId in response: ${text.slice(0, 300)}`)
  return id
}

async function waitForImages(key: string, genId: string): Promise<GenImage[]> {
  for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
    await new Promise((r) => setTimeout(r, POLL_MS))
    const res = await fetch(`${API}/generations/${genId}`, { headers: await headers(key) })
    if (!res.ok) {
      // 4xx (bad/expired key, unknown id) won't fix itself — fail fast with the
      // status instead of masquerading as a 5-minute timeout. 429 + 5xx are
      // transient, so keep polling those.
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        throw new Error(`poll ${res.status} for ${genId}: ${(await res.text()).slice(0, 200)}`)
      }
      continue
    }
    const gen = (await res.json())?.generations_by_pk
    const status = gen?.status
    if (status === 'COMPLETE') {
      return (gen.generated_images ?? []).map((im: { id: string; url: string }) => ({
        id: im.id,
        url: im.url,
      }))
    }
    if (status === 'FAILED') throw new Error(`generation ${genId} FAILED`)
  }
  throw new Error(`generation ${genId} timed out`)
}

async function download(url: string, dest: string): Promise<void> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`download ${res.status} for ${url}`)
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
}

async function runConcept(key: string, c: Concept, count: number): Promise<void> {
  const dir = path.join(OUT, c.slug)
  mkdirSync(dir, { recursive: true })
  const prompt = `${c.prompt} ${STYLE}`
  console.log(`\n[${c.slug}] generating ${count} candidates...`)
  const genId = await createGeneration(key, prompt, count)
  console.log(`  generation ${genId} — polling`)
  const images = await waitForImages(key, genId)
  console.log(`  complete: ${images.length} images`)
  const manifest: Array<{ file: string; leonardoId: string; url: string }> = []
  for (let i = 0; i < images.length; i++) {
    const file = `cand-${i + 1}.jpg`
    await download(images[i].url, path.join(dir, file))
    manifest.push({ file, leonardoId: images[i].id, url: images[i].url })
    console.log(`  saved ${file}`)
  }
  writeFileSync(
    path.join(dir, 'manifest.json'),
    `${JSON.stringify({ slug: c.slug, prompt, generationId: genId, candidates: manifest }, null, 2)}\n`,
  )
}

async function main(): Promise<number> {
  const { slug, count } = parseArgs(process.argv.slice(2))
  const key = loadApiKey()
  const concepts = slug ? CONCEPTS.filter((c) => c.slug === slug) : CONCEPTS
  if (concepts.length === 0) throw new Error(`no concept matches slug "${slug}"`)
  if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })
  for (const c of concepts) {
    try {
      await runConcept(key, c, count)
    } catch (err) {
      console.error(`  FAILED ${c.slug}: ${(err as Error).message}`)
    }
  }
  console.log('\nDone. Review candidates under tools/leonardo-images/out/<slug>/')
  return 0
}

main()
  .then((c) => process.exit(c))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
