// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * spec 010 SC-001 / T074 — the keystone guard for ADR 0009: after the
 * block-composition migration, ZERO bespoke per-type body render templates
 * remain except the blog Post (the single sanctioned richText article body).
 *
 * Every non-blog page route must render its body through the shared
 * `RenderBlocks` dispatcher; the blog Post route is the only one allowed to
 * render a bespoke richText body via `<RichText>`. If a future change adds a
 * per-type body template back, this fails.
 */

const read = (relPath: string): string => readFileSync(resolve(process.cwd(), relPath), 'utf8')

// Every route whose page BODY is block-composed must delegate to RenderBlocks.
const RENDER_BLOCKS_ROUTES = [
  'src/app/(frontend)/page.tsx', // homepage global
  'src/app/(frontend)/[slug]/page.tsx', // generic pages
  'src/app/(frontend)/workshops/[slug]/page.tsx',
  'src/app/(frontend)/case-studies/[slug]/page.tsx',
  // ROADMAP SVC-2 (ADR 0009): the bespoke pillar/service templates are gone,
  // so are the block-composed offering Pages that briefly replaced them, and so
  // is the `/services` overview route — it is a 301 onto the What We Do axis.
  // Every tier renders through one collection-backed RenderBlocks template.
  'src/app/(frontend)/services/[slug]/page.tsx', // SVC-2: leaf, group and axis
  'src/app/(frontend)/team/[slug]/page.tsx',
  'src/app/(frontend)/industries/[slug]/page.tsx',
  // ADR 0009 Option C metadata collection — a partner is a Page + typed metadata.
  'src/app/(frontend)/partners/[slug]/page.tsx',
]

// The ONE sanctioned bespoke richText body (ADR 0009).
const BLOG_ROUTE = 'src/app/(frontend)/insights/[slug]/page.tsx'

// Route files that still carry their own copy. A listing or legal page is a
// `pages` doc on `/[slug]`, so none belongs here; delete an entry when its route
// becomes blocks, and do not add one.
const CODE_OWNED_ROUTES = ['src/app/(frontend)/contact/page.tsx']

describe('SC-001 — only block-composed bodies remain (RenderBlocks), except the blog Post', () => {
  it.each(RENDER_BLOCKS_ROUTES)('%s renders its body through RenderBlocks', (routePath) => {
    const src = read(routePath)
    // Assert the exact dispatch (not just a `RenderBlocks` substring) — the body
    // is the `layout` blocks array handed to the shared dispatcher.
    expect(src).toContain('<RenderBlocks blocks={layout}')
    // A migrated body route must NOT fall back to a bespoke richText article body.
    expect(src).not.toContain('<RichText')
  })

  it('the blog Post route is the sole bespoke richText body (the ADR 0009 exception)', () => {
    const src = read(BLOG_ROUTE)
    expect(src).toContain('<RichText')
    expect(src).not.toContain('<RenderBlocks')
  })

  it('every page route is block-composed, the blog Post, or listed as code-owned', () => {
    const root = resolve(process.cwd(), 'src/app/(frontend)')
    const walk = (dir: string, out: string[] = []): string[] => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) walk(full, out)
        else if (entry.name === 'page.tsx') out.push(full)
      }
      return out
    }
    const found = walk(root)
      .map((f) => `src/app/(frontend)/${relative(root, f)}`)
      .sort()
    const accounted = [...RENDER_BLOCKS_ROUTES, BLOG_ROUTE, ...CODE_OWNED_ROUTES].sort()
    expect(found).toEqual(accounted)
  })
})
