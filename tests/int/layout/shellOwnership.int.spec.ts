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
const ROUTES_DIR = path.resolve('src/app/(frontend)')

const BLOCK_FILES = readdirSync(SECTIONS_DIR)
  .filter((f) => f.endsWith('.tsx') && f !== 'RenderBlocks.tsx')
  .sort()

const read = (file: string) => readFileSync(path.join(SECTIONS_DIR, file), 'utf8')

/** Every route file under `src/app/(frontend)`, recursively. */
function routeFiles(dir: string = ROUTES_DIR): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return routeFiles(full)
    return e.name.endsWith('.tsx') ? [full] : []
  })
}

const ROUTE_FILES = routeFiles().sort()

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

/**
 * Route chrome is the same shell, and it drifted once already.
 *
 * The five listing pages each hand-wrote `mx-auto max-w-container-lg` for their
 * `<header>`, with a comment explaining that they restate the block's recipe
 * "so the two resolve to the same x". When `SHELL_RAIL` moved to `xl` the
 * blocks followed and the headers did not, putting every `h1` 128px right of
 * its own card grid — measured, on all five routes. The guard above never saw
 * it because it only scanned `src/components/sections`.
 */
describe('shell ownership — route chrome takes the same shell', () => {
  it('finds the route files it is meant to be guarding', () => {
    expect(ROUTE_FILES.length).toBeGreaterThan(10)
  })

  it.each(ROUTE_FILES.map((f) => [path.relative(ROUTES_DIR, f), f] as const))(
    '%s does not restate the rail',
    (_name, full) => {
      // `Container` and `Section` own the rail. A route that names a
      // `container-*` token directly has opted out and will be left behind by
      // the next `SHELL_RAIL` change, exactly as these five were.
      expect(code(readFileSync(full, 'utf8'))).not.toMatch(/max-w-container-/)
    },
  )
})
