// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { registry } from '../../../src/components/sections/registry'

/**
 * spec 010 US3 / T059 (contracts/authoring-skill.md) — fixture check for the
 * `compose-page` authoring skill.
 *
 * The skill itself is a SKILL.md procedure executed by Claude, not runnable
 * code, so its load-bearing contract is asserted against the worked-example
 * outputs committed alongside it in `.claude/skills/compose-page/examples/`.
 * Those examples ARE the contract demonstration (and double as authoring
 * references); this test guards them so they can never drift from the real
 * block registry.
 *
 * Per contracts/authoring-skill.md the skill emits EXACTLY ONE of:
 *   1. a `layout` — an ordered blocks array using ONLY registered block slugs
 *      (no bespoke page code, no invented slugs), OR
 *   2. a single named block gap — the one missing capability, routed to the
 *      block-curation loop (FR-011) rather than hand-coded.
 *
 * `registry.ts` is the authoritative slug set (BLOCK_LIBRARY §5 is descriptive
 * and intentionally uses some friendlier names that are NOT slugs), so every
 * emitted `blockType` is validated against it, and every named gap is required
 * to be a genuine gap (a slug the registry does NOT already provide).
 */

const EXAMPLES_DIR = resolve(
  import.meta.dirname,
  '..',
  '..',
  '..',
  '.claude',
  'skills',
  'compose-page',
  'examples',
)

interface LayoutOutput {
  kind: 'layout'
  brief: string
  collection?: string
  layout: Array<{ blockType?: unknown }>
}

interface GapOutput {
  kind: 'gap'
  brief: string
  collection?: string
  missingBlock: { name?: unknown; reason?: unknown; nearestExisting?: unknown }
}

type ComposeOutput = LayoutOutput | GapOutput

const registrySlugs = new Set(Object.keys(registry))

const exampleFiles = readdirSync(EXAMPLES_DIR).filter((f) => f.endsWith('.json'))

const examples: Array<{ file: string; data: ComposeOutput }> = exampleFiles.map((file) => ({
  file,
  data: JSON.parse(readFileSync(resolve(EXAMPLES_DIR, file), 'utf8')) as ComposeOutput,
}))

describe('compose-page authoring skill — emitted output contract', () => {
  it('ships at least one worked example', () => {
    expect(examples.length).toBeGreaterThan(0)
  })

  it.each(examples)('$file declares exactly one output mode (layout | gap)', ({ data }) => {
    expect(data.kind === 'layout' || data.kind === 'gap').toBe(true)
    expect('brief' in data && typeof data.brief === 'string' && data.brief.length > 0).toBe(true)
    // Mutual exclusivity: a layout output carries no gap, a gap carries no layout.
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

  it.each(gapExamples)('$file (gap) names exactly one genuine missing block', ({ data }) => {
    const { name, reason } = data.missingBlock
    expect(typeof name === 'string' && (name as string).length > 0).toBe(true)
    expect(typeof reason === 'string' && (reason as string).length > 0).toBe(true)
    // A genuine gap: the proposed slug must NOT already exist in the registry.
    expect(
      registrySlugs.has(name as string),
      `proposed gap "${String(name)}" already exists in registry.ts — not a real gap`,
    ).toBe(false)
    // If a nearest existing block is suggested, it MUST be a real slug.
    const nearest = data.missingBlock.nearestExisting
    if (typeof nearest === 'string' && nearest.length > 0) {
      expect(
        registrySlugs.has(nearest),
        `nearestExisting "${nearest}" is not a registry slug`,
      ).toBe(true)
    }
  })
})
