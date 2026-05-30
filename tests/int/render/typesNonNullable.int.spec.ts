import { describe, expectTypeOf, it } from 'vitest'

import type { CaseStudy, HeroBlock, Page, Post, Service } from '../../../src/payload-types'

/**
 * Type-level invariant for SC-008 / FR-038. The render path (Spec 003 US3)
 * leans on the generated types to communicate non-nullability for fields that
 * Payload's schema marks as required. If these break, engineers composing
 * Phase 3 page templates would have to start sprinkling defensive null-checks
 * or `as any` casts — the exact failure mode this story exists to prevent.
 *
 * The cases below assert the structural shape that `payload generate:types`
 * produces today; if a future schema change makes one of these nullable on
 * purpose, update the corresponding assertion in the same PR and reconcile
 * the data-model doc per Constitution III.
 */
describe('payload-types generated shape (SC-008, FR-038)', () => {
  describe('Page required fields', () => {
    it('title is a non-nullable string', () => {
      expectTypeOf<Page['title']>().toEqualTypeOf<string>()
    })

    it('slug is a non-nullable string', () => {
      expectTypeOf<Page['slug']>().toEqualTypeOf<string>()
    })

    it('updatedAt and createdAt are non-nullable strings', () => {
      expectTypeOf<Page['updatedAt']>().toEqualTypeOf<string>()
      expectTypeOf<Page['createdAt']>().toEqualTypeOf<string>()
    })

    it('layout is an optional union of block discriminants', () => {
      // `layout` is intentionally optional — pages can render without blocks
      // (hero-only). The dispatcher contract handles the empty/undefined case
      // explicitly (see render-blocks.md), so engineers don't need to
      // defend against `null` themselves. This assertion documents that the
      // optionality is the only nullable surface on the render path.
      type Layout = NonNullable<Page['layout']>
      expectTypeOf<Layout>().toBeArray()
    })
  })

  describe('CaseStudy required fields', () => {
    it('title is a non-nullable string', () => {
      expectTypeOf<CaseStudy['title']>().toEqualTypeOf<string>()
    })

    it('slug is a non-nullable string', () => {
      expectTypeOf<CaseStudy['slug']>().toEqualTypeOf<string>()
    })

    it('industry is a non-nullable relationship (id or populated doc)', () => {
      // Schema marks `industry` required (data-model §1.4). The depth-aware
      // type `number | Industry` is what engineers consume; neither side is
      // nullable, so a depth-0 caseStudy still surfaces a numeric FK.
      type Industry = NonNullable<Exclude<CaseStudy['industry'], number>>
      expectTypeOf<CaseStudy['industry']>().toMatchTypeOf<number | Industry>()
      expectTypeOf<CaseStudy['industry']>().not.toBeNullable()
    })

    it('heroImage is a non-nullable relationship', () => {
      type Media = NonNullable<Exclude<CaseStudy['heroImage'], number>>
      expectTypeOf<CaseStudy['heroImage']>().toMatchTypeOf<number | Media>()
      expectTypeOf<CaseStudy['heroImage']>().not.toBeNullable()
    })
  })

  describe('Post required fields', () => {
    it('title and slug are non-nullable strings', () => {
      expectTypeOf<Post['title']>().toEqualTypeOf<string>()
      expectTypeOf<Post['slug']>().toEqualTypeOf<string>()
    })
  })

  describe('Service required fields', () => {
    it('title and slug are non-nullable strings', () => {
      expectTypeOf<Service['title']>().toEqualTypeOf<string>()
      expectTypeOf<Service['slug']>().toEqualTypeOf<string>()
    })
  })

  describe('Block-level required fields', () => {
    it('HeroBlock.variant is a non-nullable union literal', () => {
      expectTypeOf<HeroBlock['variant']>().toEqualTypeOf<
        'text-only' | 'with-image' | 'with-video' | 'split'
      >()
    })

    it('HeroBlock.headline is a non-nullable string', () => {
      // Required by data-model. Phase 3 page templates assume they can render
      // <h1>{block.headline}</h1> without null-checks.
      expectTypeOf<HeroBlock['headline']>().toEqualTypeOf<string>()
    })

    it('HeroBlock.blockType is the literal discriminant', () => {
      // The discriminant on every block must be a string literal — that's
      // what the dispatcher narrows on. If this widens to `string`, the
      // `<RenderBlocks>` switch loses exhaustiveness.
      expectTypeOf<HeroBlock['blockType']>().toEqualTypeOf<'hero'>()
    })
  })
})
