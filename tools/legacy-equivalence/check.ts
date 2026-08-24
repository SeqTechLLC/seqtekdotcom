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
  collection: CollectionSlug
  /** Legacy prose columns whose text must survive in `layout`. */
  proseFields: string[]
  label: string
}

const SOURCES: LegacySource[] = [
  {
    collection: 'caseStudies',
    proseFields: ['problem', 'solution', 'impact'],
    label: 'case study',
  },
  { collection: 'services', proseFields: ['description', 'approach'], label: 'service' },
  {
    collection: 'workshops',
    proseFields: ['description', 'audience', 'format'],
    label: 'workshop',
  },
  { collection: 'teamMembers', proseFields: ['bio', 'quote'], label: 'team member' },
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

/** Normalise for comparison: collapse whitespace, drop punctuation noise, lowercase. */
function normalise(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').trim().toLowerCase()
}

/**
 * Split prose into comparable sentence-ish chunks. Whole-string containment is
 * too brittle (the composer may insert headings mid-body); per-sentence
 * containment catches genuine loss without failing on reflowing.
 */
function chunks(text: string): string[] {
  return normalise(text)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 25)
}

interface Finding {
  collection: string
  slug: string
  field: string
  missingChunks: string[]
  totalChunks: number
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
    const { docs } = await payload.find({
      collection: source.collection,
      limit: 1000,
      depth: 0,
      draft: false,
      overrideAccess: true,
      pagination: false,
    })

    for (const doc of docs as unknown as Array<Record<string, unknown>>) {
      const slug = String(doc.slug ?? doc.id)
      const layoutText = normalise(plainText(doc.layout))
      let hasAnyLegacy = false

      for (const field of source.proseFields) {
        const legacy = doc[field]
        if (legacy == null) continue
        const text = plainText(legacy)
        if (!normalise(text)) continue

        hasAnyLegacy = true
        const parts = chunks(text)
        checked.push(`${source.collection}.${slug}.${field}`)

        // Prose too short to chunk: fall back to whole-string containment.
        const missing =
          parts.length === 0
            ? layoutText.includes(normalise(text))
              ? []
              : [normalise(text).slice(0, 120)]
            : parts.filter((p) => !layoutText.includes(p))

        if (missing.length) {
          findings.push({
            collection: source.collection,
            slug,
            field,
            missingChunks: missing.slice(0, 3),
            totalChunks: parts.length || 1,
          })
        }
      }
      if (hasAnyLegacy) recordsWithLegacy++
    }
  }

  if (asJson) {
    console.log(JSON.stringify({ recordsWithLegacy, checked: checked.length, findings }, null, 2))
  } else {
    console.log(`\nLegacy → layout equivalence gate (spec 011 T009)\n${'='.repeat(52)}`)
    console.log(`Records holding legacy prose : ${recordsWithLegacy}`)
    console.log(`Field values checked         : ${checked.length}`)
    console.log(`Gaps found                   : ${findings.length}\n`)

    if (findings.length === 0) {
      console.log('PASS — every legacy prose value is present in its composed layout.')
      console.log('The drop migration is cleared to run.\n')
    } else {
      console.log('FAIL — the following prose is NOT present in the record layout.')
      console.log('Re-run the matching composer for these records, or fix by hand.\n')
      for (const f of findings) {
        console.log(`  ${f.collection}/${f.slug} — ${f.field}`)
        console.log(`    ${f.missingChunks.length} of ${f.totalChunks} chunk(s) missing, e.g.:`)
        for (const c of f.missingChunks) console.log(`      "${c.slice(0, 100)}…"`)
      }
      console.log('')
    }
  }

  process.exit(findings.length === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error('equivalence check failed to run:', err)
  process.exit(2)
})
