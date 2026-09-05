import { readFileSync, readdirSync } from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

/**
 * The guard that makes the refactor a floor rather than a sweep.
 *
 * Before `ui/Section`, the shell was a fact stated 46 times: every block
 * hand-wrote `px-4 md:px-6 lg:px-8`, 44 hand-wrote `mx-auto max-w-container-*`,
 * and geometry derived from that shell was hand-computed per block against a
 * number that lived nowhere. Moving the rail was a 44-file change that silently
 * invalidated ~46 derivations, and the fallout arrived one defect per review
 * round for six rounds.
 *
 * A block that reintroduces either literal has opted out of the single source
 * of truth, and the next rail change will miss it silently. So it fails here.
 */

const SECTIONS_DIR = path.resolve('src/components/sections')

const BLOCK_FILES = readdirSync(SECTIONS_DIR)
  .filter((f) => f.endsWith('.tsx') && f !== 'RenderBlocks.tsx')
  .sort()

const read = (file: string) => readFileSync(path.join(SECTIONS_DIR, file), 'utf8')

/** Strip comments so prose ABOUT the old pattern doesn't trip the guard. */
const code = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

describe('shell ownership — blocks take their shell from Section', () => {
  it('finds the block components it is meant to be guarding', () => {
    // A rename that empties this list would make every assertion below vacuous.
    expect(BLOCK_FILES.length).toBeGreaterThan(40)
  })

  it.each(BLOCK_FILES)('%s does not restate the rail', (file) => {
    expect(code(read(file))).not.toMatch(/max-w-container-/)
  })

  it.each(BLOCK_FILES)('%s does not restate the section padding', (file) => {
    // The horizontal triple is the shell's, and Section owns it. A bare `px-4`
    // on an inner element (a card, a figcaption) is fine and stays legal.
    expect(code(read(file))).not.toMatch(/px-4[^"'`]*md:px-6[^"'`]*lg:px-8/)
  })

  it.each(BLOCK_FILES)('%s derives any sizes attribute rather than typing one', (file) => {
    // A literal `sizes="..."` is a geometry hand-computed against a rail width
    // that appears nowhere near it. `sizes={...}` from layoutGeometry tracks the
    // shell and is re-checked against the media ladder by its own suite.
    expect(code(read(file))).not.toMatch(/sizes="/)
  })
})
