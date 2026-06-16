// @vitest-environment node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

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
  'src/app/(frontend)/services/[pillar]/[slug]/page.tsx',
  'src/app/(frontend)/team/[slug]/page.tsx',
]

// The ONE sanctioned bespoke richText body (ADR 0009).
const BLOG_ROUTE = 'src/app/(frontend)/insights/[slug]/page.tsx'

describe('SC-001 — only block-composed bodies remain (RenderBlocks), except the blog Post', () => {
  it.each(RENDER_BLOCKS_ROUTES)('%s renders its body through RenderBlocks', (routePath) => {
    const src = read(routePath)
    expect(src).toContain('RenderBlocks')
    expect(src).toMatch(/<RenderBlocks\b/)
    // A migrated body route must NOT fall back to a bespoke richText article body.
    expect(src).not.toContain('<RichText')
  })

  it('the blog Post route is the sole bespoke richText body (the ADR 0009 exception)', () => {
    const src = read(BLOG_ROUTE)
    expect(src).toContain('<RichText')
    expect(src).not.toContain('<RenderBlocks')
  })
})
