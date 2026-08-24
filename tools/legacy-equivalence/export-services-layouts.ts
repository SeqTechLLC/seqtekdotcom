/**
 * Spec 011 T010a (FR-031) — preserve `services.layout` before migration 4
 * drops it.
 *
 * data-model.md §1.4 drops the whole `services.layout` because no route renders
 * it (Services has been unrouted since PR #79). That reasoning is sound for
 * *visitors*: nothing on the live site changes.
 *
 * It is not sound for *us*. The T003 inventory found the tables hold composed
 * block content for the nine capability services — 24 content blocks, 9
 * deliverables blocks (36 items), 9 FAQ blocks (23 items), 12 contact CTAs.
 * ROADMAP SVC-3 plans to publish exactly those nine pages and notes the prose
 * "is already written" in `docs/content-drafts/_archive/content-batch.json`.
 * What that archive does NOT contain is the composition — the block
 * arrangement built on top of the prose. Dropping the tables discards it and
 * SVC-3 redoes the work.
 *
 * FR-031 allows two outs for content that lives only in a field being removed:
 * confirm it is represented elsewhere, or preserve it. This is the preserve
 * branch, and it costs one command.
 *
 * Output is a gitignored content-drafts file, matching the project's
 * "tool is committed, data is not" rule (CLAUDE.md).
 *
 * Usage: NODE_OPTIONS=--no-deprecation npx tsx tools/legacy-equivalence/export-services-layouts.ts
 */
import { config as loadEnv } from 'dotenv'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(filename), '../../')

loadEnv({ path: path.join(repoRoot, '.env.local') })
loadEnv({ path: path.join(repoRoot, '.env') })

const OUT = path.join(repoRoot, 'docs/content-drafts/services-layouts-backup.json')

async function main(): Promise<void> {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../../src/payload.config')
  const payload = await getPayload({ config: await config })

  const { docs } = await payload.find({
    collection: 'services',
    limit: 1000,
    depth: 0,
    draft: false,
    overrideAccess: true,
    pagination: false,
  })

  const records = (docs as unknown as Array<Record<string, unknown>>)
    .filter((d) => Array.isArray(d.layout) && (d.layout as unknown[]).length > 0)
    // The three `showcase-*` rows are generated test fixtures, not content.
    .filter((d) => !String(d.slug ?? '').startsWith('showcase-'))
    .map((d) => ({
      slug: d.slug,
      title: d.title,
      layout: d.layout,
    }))

  const blockCount = records.reduce(
    (n, r) => n + ((r.layout as unknown[] | undefined)?.length ?? 0),
    0,
  )

  mkdirSync(path.dirname(OUT), { recursive: true })
  writeFileSync(
    OUT,
    JSON.stringify(
      {
        _note:
          'Composed services.layout captured before spec 011 migration 4 dropped it. ' +
          'Source for ROADMAP SVC-3 if the nine capability pages are published. ' +
          'Gitignored: this is content, not code.',
        _capturedAt: new Date().toISOString(),
        _spec: '011-payload-admin-ux T010a (FR-031)',
        records,
      },
      null,
      2,
    ),
  )

  console.log(`Exported ${records.length} service layout(s), ${blockCount} blocks total`)
  console.log(`  → ${path.relative(repoRoot, OUT)}`)
  console.log(`  slugs: ${records.map((r) => r.slug).join(', ')}`)
  process.exit(0)
}

main().catch((err) => {
  console.error('export failed:', err)
  process.exit(1)
})
