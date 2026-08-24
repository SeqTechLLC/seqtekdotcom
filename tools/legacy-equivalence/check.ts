/**
 * Spec 011 T009 (FR-031) — the gate that must pass before any legacy body
 * column is dropped.
 *
 * US1 drops the retained legacy prose columns that ADR 0009's expand/contract
 * left behind. That is only safe if every record's prose is genuinely present
 * in its composed `layout`. "The record has blocks" is NOT proof — it says
 * nothing about whether the blocks contain *this* prose. Seven case studies
 * hold legacy prose and also hold three content blocks each, which looks like
 * proof and is not.
 *
 * So this compares CONTENT. For each record holding a non-null legacy column,
 * it extracts the plain text of that column and asserts the same text is
 * present in the stored `layout`. Records that fail are listed for remediation
 * (re-run the composer for that record, or fix by hand) and the migration does
 * not run until the report is clean.
 *
 * Note this is deliberately NOT `tests/int/seed/composeFidelity.int.spec.ts`.
 * That suite runs the composers against synthetic fixtures and proves the
 * composers are correct. This runs against the REAL stored records, whose
 * layouts may have been composed by an earlier composer version, hand-edited
 * in the admin since, or never composed at all.
 *
 * Usage:  NODE_OPTIONS=--no-deprecation npx tsx tools/legacy-equivalence/check.ts [--json]
 * Exit:   0 = every record equivalent, 1 = at least one gap (migration blocked)
 */
import { config as loadEnv } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import type { CollectionSlug } from 'payload'

const filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(filename), '../../')

// Must run before any module evaluates `process.env.PAYLOAD_SECRET` /
// `DATABASE_URL` — i.e. before importing `payload` or the config. Same
// preamble as `src/payload/seed/showcase/index.ts`.
loadEnv({ path: path.join(repoRoot, '.env.local') })
loadEnv({ path: path.join(repoRoot, '.env') })

interface LegacySource {
  /** A collection, or the `homepage` global (read via findGlobal). */
  collection?: CollectionSlug
  global?: 'homepage'
  /** Legacy prose columns whose text must survive in `layout`. */
  proseFields: string[]
  /**
   * Legacy array / group columns that carry text (labels, metrics, Q&A).
   * Dropped by the same migration as the prose, so they need the same check —
   * `plainText` walks them the same way it walks a Lexical body.
   */
  structuredFields?: string[]
  /**
   * Legacy columns holding media relations. Their ids (not text) must appear
   * in the composed layout, or the image is orphaned by the drop.
   */
  mediaFields?: string[]
  label: string
}

const SOURCES: LegacySource[] = [
  {
    collection: 'caseStudies',
    proseFields: ['problem', 'solution', 'impact'],
    structuredFields: ['metrics', 'technologies'],
    label: 'case study',
  },
  {
    collection: 'services',
    proseFields: ['description', 'approach'],
    structuredFields: ['deliverables', 'faq'],
    label: 'service',
  },
  {
    collection: 'workshops',
    proseFields: ['description', 'audience', 'format'],
    structuredFields: ['deliverables', 'video'],
    mediaFields: ['photos'],
    label: 'workshop',
  },
  {
    collection: 'teamMembers',
    proseFields: ['bio', 'quote'],
    structuredFields: ['certifications', 'education', 'personalFacts'],
    label: 'team member',
  },
  {
    // data-model.md §3 names the homepage global as gate input. It was omitted
    // from the first implementation — the site's most important page was the
    // one record whose prose nothing verified before an irreversible drop.
    global: 'homepage',
    proseFields: [],
    structuredFields: ['hero', 'brandTeaser', 'stats'],
    mediaFields: ['clientLogos', 'featuredCaseStudy', 'featuredTestimonials'],
    label: 'homepage',
  },
]

/**
 * Extract human-readable text from a Lexical editor state, a plain string, or
 * an array of blocks.
 *
 * Deliberately structure-aware rather than a blind object walk: a naive
 * `Object.values()` recursion pulls node types, version numbers and format
 * integers into the output ("root 0 1 paragraph 0 1 the actual text"), which
 * then poisons the first comparison chunk of every field. Only `text` nodes
 * contribute characters; everything else contributes only its children.
 */
function plainText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return ''
  if (Array.isArray(value)) return value.map(plainText).join(' ')
  if (typeof value !== 'object') return ''

  const node = value as Record<string, unknown>

  // A Lexical text node.
  if (node.type === 'text' && typeof node.text === 'string') return node.text

  // A Lexical root wrapper.
  if (node.root && typeof node.root === 'object') return plainText(node.root)

  // Any node with children contributes its children's text and nothing else.
  if (Array.isArray(node.children)) return node.children.map(plainText).join(' ')

  // A saved block or arbitrary record: take string-valued leaves, but skip the
  // structural keys that carry no prose.
  const SKIP = new Set([
    'blockType',
    'id',
    'type',
    'version',
    'format',
    'direction',
    'mode',
    'style',
    'tag',
    'blockName',
  ])
  return Object.entries(node)
    .filter(([k]) => !SKIP.has(k))
    .map(([, v]) => plainText(v))
    .join(' ')
}

/** Normalise for comparison: collapse whitespace, fold smart quotes, lowercase. */
function normalise(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').trim().toLowerCase()
}

/**
 * Split prose into comparable sentence-ish chunks. Whole-string containment is
 * too brittle (the composer may insert headings mid-body); per-sentence
 * containment catches genuine loss without failing on reflowing.
 */
function chunks(text: string): string[] {
  return (
    normalise(text)
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      // Very short fragments ("Yes.", "SEQTEK.") match almost any body by
      // accident, so they are not chunked. They are NOT skipped: a value that
      // produces no usable chunk falls back to whole-string containment at the
      // call site, so nothing goes unverified.
      .filter((s) => s.length >= 25)
  )
}

interface Finding {
  collection: string
  slug: string
  field: string
  missingChunks: string[]
  totalChunks: number
}

/** Collect every media id referenced by a legacy relation field. */
function mediaIds(value: unknown, out: Set<string> = new Set()): Set<string> {
  if (value == null) return out
  if (typeof value === 'string' || typeof value === 'number') {
    out.add(String(value))
    return out
  }
  if (Array.isArray(value)) {
    for (const v of value) mediaIds(v, out)
    return out
  }
  if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === 'id' && (typeof v === 'string' || typeof v === 'number')) continue
      mediaIds(v, out)
    }
  }
  return out
}

async function main(): Promise<void> {
  const asJson = process.argv.includes('--json')

  const { getPayload } = await import('payload')
  const { default: config } = await import('../../src/payload.config')
  const payload = await getPayload({ config: await config })

  const findings: Finding[] = []
  const checked: string[] = []
  let recordsWithLegacy = 0

  for (const source of SOURCES) {
    const label = source.collection ?? source.global ?? '?'

    // The migration drops the `_v` version mirrors alongside the live columns,
    // so a DRAFT holding prose that never reached the published layout would be
    // destroyed by a gate that only reads published rows. Check both.
    const passes: Array<{ draft: boolean; docs: Array<Record<string, unknown>> }> = []

    for (const draft of [false, true]) {
      if (source.global) {
        const doc = (await payload.findGlobal({
          slug: source.global,
          depth: 0,
          draft,
          overrideAccess: true,
        })) as unknown as Record<string, unknown>
        passes.push({ draft, docs: doc ? [doc] : [] })
      } else {
        const { docs } = await payload.find({
          collection: source.collection as CollectionSlug,
          limit: 1000,
          depth: 0,
          draft,
          overrideAccess: true,
          pagination: false,
        })
        passes.push({ draft, docs: docs as unknown as Array<Record<string, unknown>> })
      }
    }

    const seen = new Set<string>()

    for (const { draft, docs } of passes) {
      for (const doc of docs) {
        const slug = String(doc.slug ?? source.global ?? doc.id)
        const key = `${label}:${slug}:${draft}`
        if (seen.has(key)) continue
        seen.add(key)

        const layoutText = normalise(plainText(doc.layout))
        const layoutMedia = mediaIds(doc.layout)
        const suffix = draft ? ' (draft)' : ''
        let hasAnyLegacy = false

        // --- text-bearing fields: prose and structured alike ---
        for (const field of [...source.proseFields, ...(source.structuredFields ?? [])]) {
          const legacy = doc[field]
          if (legacy == null) continue
          const text = plainText(legacy)
          if (!normalise(text)) continue

          hasAnyLegacy = true
          const parts = chunks(text)
          checked.push(`${label}.${slug}.${field}${suffix}`)

          // Short values (a metric label, a tech name) never survive chunking,
          // so fall back to whole-string containment rather than skipping them.
          const missing =
            parts.length === 0
              ? layoutText.includes(normalise(text))
                ? []
                : [normalise(text).slice(0, 120)]
              : parts.filter((p) => !layoutText.includes(p))

          if (missing.length) {
            findings.push({
              collection: label + suffix,
              slug,
              field,
              missingChunks: missing.slice(0, 3),
              totalChunks: parts.length || 1,
            })
          }
        }

        // --- media relations: the id must be reachable from the layout ---
        for (const field of source.mediaFields ?? []) {
          const legacy = doc[field]
          if (legacy == null) continue
          const ids = [...mediaIds(legacy)]
          if (ids.length === 0) continue

          hasAnyLegacy = true
          checked.push(`${label}.${slug}.${field}${suffix}`)
          const orphaned = ids.filter((id) => !layoutMedia.has(id))
          if (orphaned.length) {
            findings.push({
              collection: label + suffix,
              slug,
              field,
              missingChunks: orphaned
                .slice(0, 3)
                .map((id) => `media id ${id} not referenced by layout`),
              totalChunks: ids.length,
            })
          }
        }

        if (hasAnyLegacy) recordsWithLegacy++
      }
    }
  }

  if (asJson) {
    console.log(JSON.stringify({ recordsWithLegacy, checked: checked.length, findings }, null, 2))
  } else {
    console.log(`\nLegacy → layout equivalence gate (spec 011 T009)\n${'='.repeat(52)}`)
    console.log(`Records holding legacy prose : ${recordsWithLegacy}`)
    console.log(`Field values checked         : ${checked.length}`)
    console.log(`Gaps found                   : ${findings.length}\n`)

    if (checked.length === 0) {
      console.log('INCONCLUSIVE — nothing was verified.')
      console.log('')
      console.log('No record in this database holds any legacy column, so the gate')
      console.log('checked nothing. That means one of:')
      console.log('  - this database has ALREADY been migrated (columns dropped), or')
      console.log('  - it is a fresh environment with no legacy content, or')
      console.log('  - the tool is pointed at the wrong database.')
      console.log('')
      console.log('A pass that verified nothing is not a pass. Confirm which case this')
      console.log('is before running a destructive migration against this lane.')
      console.log('')
    } else if (findings.length === 0) {
      console.log(`PASS — ${checked.length} legacy value(s) across ${recordsWithLegacy} record(s)`)
      console.log('are all present in their composed layout. The drop migration is cleared.')
      console.log('')
    } else {
      console.log('FAIL — the following content is NOT present in the record layout.')
      console.log('Re-run the matching composer for these records, or fix by hand.\n')
      for (const f of findings) {
        console.log(`  ${f.collection}/${f.slug} — ${f.field}`)
        console.log(`    ${f.missingChunks.length} of ${f.totalChunks} item(s) missing, e.g.:`)
        for (const c of f.missingChunks) console.log(`      "${c.slice(0, 100)}…"`)
      }
      console.log('')
    }
  }

  // 0 = verified clean, 1 = gaps found, 3 = nothing to verify (inconclusive).
  // 3 is deliberately not 0: an operator gating an irreversible drop must not
  // read "checked nothing" as "safe to proceed".
  process.exit(findings.length > 0 ? 1 : checked.length === 0 ? 3 : 0)
}

main().catch((err) => {
  console.error('equivalence check failed to run:', err)
  process.exit(2)
})
