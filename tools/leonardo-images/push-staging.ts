/**
 * Mirror the curated mid-post illustrations to a live Payload instance over REST.
 * Uploads insight-<slug>.jpg, then splices the `figure` block into each post and
 * republishes — the same edit insert.ts makes locally, but against staging where
 * we have no DB/S3 access (the running app does the writes via its instance profile).
 *
 *   IMPORT_TOKEN=<payload-token> IMPORT_BASE_URL=https://seqtek-preview.com \
 *     npx tsx tools/leonardo-images/push-staging.ts [--dry-run]
 *
 * Idempotent: media is reused when insight-<slug>.jpg already exists, and a post
 * that already carries a `figure` block is left untouched. Run generate.ts first
 * so out/<slug>/ holds the candidates.
 *
 * Note: PayloadRestClient.uploadMedia only forwards `alt`, so staging media docs
 * carry no `caption` (insert.ts sets one locally). This is cosmetic — the rendered
 * caption comes from the `figure` block, not the media doc — so the divergence is
 * left as-is rather than widening the shared REST client.
 */
import { copyFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { PayloadRestClient } from '../import-case-study/client'
import { CONCEPTS, WINNERS } from './concepts'
import { figureNode, hasFigure, spliceAfterSection, type LexNode } from './figure'

const HERE = path.dirname(fileURLToPath(import.meta.url))

interface PostDoc {
  id: number | string
  content: { root: { children: LexNode[] } } | null
}

async function fetchPostBySlug(
  baseUrl: string,
  token: string,
  slug: string,
): Promise<PostDoc | null> {
  const params = new URLSearchParams({
    'where[slug][equals]': slug,
    depth: '0',
    draft: 'false',
    limit: '1',
  })
  const res = await fetch(`${baseUrl}/api/posts?${params.toString()}`, {
    headers: { Authorization: `JWT ${token}` },
  })
  if (!res.ok) throw new Error(`fetch post ${slug}: ${res.status} ${await res.text()}`)
  const json = (await res.json()) as { docs?: PostDoc[] }
  return json.docs?.[0] ?? null
}

async function main(): Promise<number> {
  const dryRun = process.argv.includes('--dry-run')
  const baseUrl = (process.env.IMPORT_BASE_URL ?? 'https://seqtek-preview.com').replace(/\/+$/, '')
  const token = process.env.IMPORT_TOKEN
  if (!token) {
    console.error('IMPORT_TOKEN (your /admin payload-token JWT) is required.')
    return 1
  }
  console.log(`target: ${baseUrl} | ${dryRun ? 'DRY-RUN' : 'LIVE'}`)
  const client = new PayloadRestClient({ baseUrl, token })

  let inserted = 0
  let skipped = 0
  const errors: string[] = []

  for (const c of CONCEPTS) {
    const winner = WINNERS[c.slug]
    const src = path.join(HERE, 'out', c.slug, winner ?? '')
    if (!winner || !existsSync(src)) {
      errors.push(`${c.slug}: candidate ${winner ?? '?'} missing (run generate.ts)`)
      continue
    }
    const filename = `insight-${c.slug}.jpg`
    try {
      // 1) Media — reuse by filename, else upload under the clean per-slug name.
      let mediaId: number | string | null = await client.findIdByField(
        'media',
        'filename',
        filename,
        { draft: false },
      )
      if (mediaId !== null) {
        console.log(`[${c.slug}] media exists (${mediaId}) ${filename}`)
      } else if (dryRun) {
        console.log(`[${c.slug}] would upload ${filename} (alt: "${c.alt}")`)
        mediaId = 'DRY'
      } else {
        const named = path.join(HERE, 'out', c.slug, filename)
        copyFileSync(src, named) // resolveImage derives filename from basename
        const resolved = await client.resolveImage({ file: named, alt: c.alt })
        mediaId = await client.uploadMedia(resolved)
        console.log(`[${c.slug}] uploaded -> media ${mediaId}`)
      }

      // 2) Content — splice the figure block, unless one is already there.
      const post = await fetchPostBySlug(baseUrl, token, c.slug)
      if (!post) {
        errors.push(`${c.slug}: no post with that slug on ${baseUrl}`)
        continue
      }
      if (!post.content?.root?.children) {
        errors.push(`${c.slug}: post ${post.id} has no content root`)
        continue
      }
      if (hasFigure(post.content.root.children)) {
        console.log(`[${c.slug}] figure already present — skipping insert`)
        skipped++
        continue
      }

      const { children, at } = spliceAfterSection(
        post.content.root.children,
        c.afterHeading,
        figureNode(mediaId, c.caption),
      )
      console.log(`[${c.slug}] post ${post.id}: insert ${at}`)
      if (dryRun) {
        skipped++
        continue
      }

      const nextContent = { ...post.content, root: { ...post.content.root, children } }
      await client.updateDoc(
        'posts',
        post.id,
        { content: nextContent, _status: 'published' },
        { draft: false },
      )
      inserted++
      console.log(`[${c.slug}] republished post ${post.id}`)
    } catch (err) {
      const msg = (err as Error).message
      errors.push(`${c.slug}: ${msg}`)
      console.error(`[${c.slug}] FAILED: ${msg}`)
    }
  }

  console.log(`\nDone. inserted=${inserted} skipped=${skipped} errors=${errors.length}`)
  for (const e of errors) console.error(`  ✗ ${e}`)
  return errors.length > 0 ? 5 : 0
}

main()
  .then((c) => process.exit(c))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
