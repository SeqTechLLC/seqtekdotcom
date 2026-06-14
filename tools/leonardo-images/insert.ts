/**
 * Upload the curated Leonardo illustrations into Payload Media and splice a
 * `figure` block into each post's content, then republish.
 *
 *   npx tsx tools/leonardo-images/insert.ts [--dry-run]
 *
 * Idempotent: re-uploads are skipped when a media doc with the target filename
 * already exists, and a post that already carries a `figure` block is left
 * untouched. Reads DATABASE_URL + PAYLOAD_SECRET from .env.local (like seed:showcase).
 *
 * Local DB only. Staging is a separate push (tools/ingest-photos/push-to-payload.ts
 * pattern + a re-run of this against IMPORT_BASE_URL is the follow-up).
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { config as loadEnv } from 'dotenv'

import { CONCEPTS, WINNERS } from './concepts'
import { figureNode, hasFigure, spliceAfterSection, type LexNode } from './figure'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(HERE, '../..')

// Load env BEFORE importing payload.config (it reads PAYLOAD_SECRET / DATABASE_URL).
loadEnv({ path: path.join(REPO_ROOT, '.env.local') })
loadEnv({ path: path.join(REPO_ROOT, '.env') })

async function main(): Promise<number> {
  const dryRun = process.argv.includes('--dry-run')
  if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
    console.error('Missing DATABASE_URL / PAYLOAD_SECRET (set them in .env.local)')
    return 1
  }

  const { getPayload } = await import('payload')
  const { default: config } = await import('../../src/payload.config')
  const payload = await getPayload({ config: await config })

  let inserted = 0
  let skipped = 0
  const errors: string[] = []

  for (const c of CONCEPTS) {
    const winner = WINNERS[c.slug]
    if (!winner) {
      errors.push(`${c.slug}: no curated winner`)
      continue
    }
    const filename = `insight-${c.slug}.jpg`
    try {
      // 1) Media: reuse if the filename already exists, else upload.
      const existing = await payload.find({
        collection: 'media',
        where: { filename: { equals: filename } },
        limit: 1,
        overrideAccess: true,
      })
      let mediaId: number | string
      if (existing.docs[0]) {
        mediaId = existing.docs[0].id
        console.log(`[${c.slug}] media exists (${mediaId}) ${filename}`)
      } else if (dryRun) {
        console.log(`[${c.slug}] would upload ${winner} -> ${filename} (alt: "${c.alt}")`)
        mediaId = 'DRY'
      } else {
        const buf = readFileSync(path.join(HERE, 'out', c.slug, winner))
        const doc = await payload.create({
          collection: 'media',
          data: { alt: c.alt, caption: c.caption },
          file: { data: buf, mimetype: 'image/jpeg', name: filename, size: buf.length },
          overrideAccess: true,
        })
        mediaId = doc.id
        console.log(`[${c.slug}] uploaded -> media ${mediaId}`)
      }

      // 2) Content: splice the figure block, unless one already exists.
      const post = await payload.findByID({
        collection: 'posts',
        id: c.postId,
        depth: 0,
        draft: false,
        overrideAccess: true,
      })
      const content = post.content as { root: { children: LexNode[] } } | null
      if (!content?.root?.children) {
        errors.push(`${c.slug}: post ${c.postId} has no content root`)
        continue
      }
      if (hasFigure(content.root.children)) {
        console.log(`[${c.slug}] figure already present — skipping insert`)
        skipped++
        continue
      }

      const { children, at } = spliceAfterSection(
        content.root.children,
        c.afterHeading,
        figureNode(mediaId, c.caption),
      )
      console.log(`[${c.slug}] insert ${at}`)
      if (dryRun) {
        skipped++
        continue
      }

      const nextContent = { ...content, root: { ...content.root, children } }
      await payload.update({
        collection: 'posts',
        id: c.postId,
        data: { content: nextContent as never, _status: 'published' },
        overrideAccess: true,
      })
      inserted++
      console.log(`[${c.slug}] republished post ${c.postId}`)
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
