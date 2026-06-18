// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { registry } from '../../../src/components/sections/registry'
import { composeWorkshopLayout } from '../../../src/payload/seed/compose/workshopToLayout'

/**
 * spec 010 US6 / T070 (contracts/conversion-skill.md) — fixture check for the
 * `convert-to-blocks` conversion skill.
 *
 * Like `compose-page`, the skill is a SKILL.md procedure executed by Claude,
 * so its load-bearing contract is asserted against the worked-example outputs
 * committed in `.claude/skills/convert-to-blocks/examples/`. This test guards
 * them so they can never drift from the registry — and, for a migrated record,
 * from the deterministic per-type composer.
 *
 * The conversion skill is distinct from `compose-page`: it REPRODUCES an
 * existing page's content (migrated record / Wix-audit page / hand-built) and
 * is RE-RUNNABLE, rather than authoring net-new copy. So beyond the
 * only-registry-slugs / one-gap contract it shares, this test adds:
 *   - source pointer: each example names a real source (ref + type + the
 *     content units it must reproduce);
 *   - reproduction over invention: every declared source unit appears in the
 *     emitted layout;
 *   - re-runnable / consistent with the composer: a migrated workshop converts
 *     to the SAME block-type sequence `composeWorkshopLayout` produces, so the
 *     skill and the migration mechanism of record (contracts/migration-fidelity)
 *     cannot diverge.
 */

const EXAMPLES_DIR = resolve(
  import.meta.dirname,
  '..',
  '..',
  '..',
  '.claude',
  'skills',
  'convert-to-blocks',
  'examples',
)

interface SourceRef {
  ref: string
  type: 'migrated-record' | 'wix-audit' | 'hand-built'
  record?: Record<string, unknown>
  content: { mustReproduce: string[] }
}

interface LayoutOutput {
  kind: 'layout'
  source: SourceRef
  brief?: string
  layout: Array<{ blockType?: unknown }>
}

interface GapOutput {
  kind: 'gap'
  source: SourceRef
  brief?: string
  missingBlock: { name?: unknown; reason?: unknown; nearestExisting?: unknown }
}

type ConvertOutput = LayoutOutput | GapOutput

const registrySlugs = new Set(Object.keys(registry))
const blockTypesOf = (layout: Array<{ blockType?: unknown }>): string[] =>
  layout.map((b) => String(b.blockType))

const exampleFiles = readdirSync(EXAMPLES_DIR).filter((f) => f.endsWith('.json'))
const examples: Array<{ file: string; data: ConvertOutput }> = exampleFiles.map((file) => ({
  file,
  data: JSON.parse(readFileSync(resolve(EXAMPLES_DIR, file), 'utf8')) as ConvertOutput,
}))

describe('convert-to-blocks conversion skill — emitted output contract', () => {
  it('ships at least one worked example', () => {
    expect(examples.length).toBeGreaterThan(0)
  })

  it.each(examples)('$file points at a real source and declares one output mode', ({ data }) => {
    expect(data.kind === 'layout' || data.kind === 'gap').toBe(true)
    // Source-driven (not assumed): every conversion names its source.
    expect(typeof data.source?.ref === 'string' && data.source.ref.length > 0).toBe(true)
    expect(['migrated-record', 'wix-audit', 'hand-built']).toContain(data.source?.type)
    expect(Array.isArray(data.source?.content?.mustReproduce)).toBe(true)
    expect(data.source.content.mustReproduce.length).toBeGreaterThan(0)
    if (data.kind === 'layout') {
      expect('missingBlock' in data).toBe(false)
    } else {
      expect('layout' in data).toBe(false)
    }
  })

  const layoutExamples = examples.filter((e) => e.data.kind === 'layout') as Array<{
    file: string
    data: LayoutOutput
  }>
  const gapExamples = examples.filter((e) => e.data.kind === 'gap') as Array<{
    file: string
    data: GapOutput
  }>

  it('demonstrates both contract branches (≥1 layout AND ≥1 gap)', () => {
    expect(layoutExamples.length).toBeGreaterThan(0)
    expect(gapExamples.length).toBeGreaterThan(0)
  })

  it.each(layoutExamples)('$file (layout) uses ONLY registered block slugs', ({ data }) => {
    expect(Array.isArray(data.layout)).toBe(true)
    expect(data.layout.length).toBeGreaterThan(0)
    const unknown = data.layout
      .map((block) => block.blockType)
      .filter((slug) => typeof slug !== 'string' || !registrySlugs.has(slug))
    expect(
      unknown,
      `layout references slugs absent from registry.ts: ${JSON.stringify(unknown)}`,
    ).toEqual([])
  })

  it.each(layoutExamples)(
    '$file (layout) reproduces every declared source content unit',
    ({ data }) => {
      const serialized = JSON.stringify(data.layout)
      const missing = data.source.content.mustReproduce.filter((unit) => !serialized.includes(unit))
      expect(
        missing,
        `source content not reproduced in the layout: ${JSON.stringify(missing)}`,
      ).toEqual([])
    },
  )

  // Re-runnable + consistent with the deterministic composer: a migrated
  // workshop record converts to the SAME block sequence the composer of record
  // produces. composeWorkshopLayout is pure (no DB), so this also pins idempotency.
  const migratedWorkshop = layoutExamples.filter(
    (e) => e.data.source.type === 'migrated-record' && e.data.source.ref.startsWith('workshops/'),
  )

  it('ships a migrated-workshop example to exercise composer consistency', () => {
    expect(migratedWorkshop.length).toBeGreaterThan(0)
  })

  it.each(migratedWorkshop)(
    '$file matches the deterministic composeWorkshopLayout block sequence',
    ({ data }) => {
      expect(data.source.record, 'migrated-record example must carry source.record').toBeDefined()
      const expected = blockTypesOf(
        composeWorkshopLayout(data.source.record as Parameters<typeof composeWorkshopLayout>[0]),
      )
      expect(blockTypesOf(data.layout)).toEqual(expected)
    },
  )

  it.each(gapExamples)('$file (gap) names exactly one genuine missing block', ({ data }) => {
    const { name, reason } = data.missingBlock
    expect(typeof name === 'string' && (name as string).length > 0).toBe(true)
    expect(typeof reason === 'string' && (reason as string).length > 0).toBe(true)
    expect(
      registrySlugs.has(name as string),
      `proposed gap "${String(name)}" already exists in registry.ts — not a real gap`,
    ).toBe(false)
    const nearest = data.missingBlock.nearestExisting
    if (typeof nearest === 'string' && nearest.length > 0) {
      expect(
        registrySlugs.has(nearest),
        `nearestExisting "${nearest}" is not a registry slug`,
      ).toBe(true)
    }
  })
})
