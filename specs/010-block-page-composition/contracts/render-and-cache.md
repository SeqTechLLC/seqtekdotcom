# Contract: Render, cache, preview & SEO invariants

Covers FR-001, FR-006, FR-009, FR-012. These invariants MUST hold for every block-composed page after each phase.

## Render path

- Every non-blog page renders its body **only** through `RenderBlocks(layout)`. No per-type bespoke body template survives (SC-001). Posts remain the single exception.
- `RenderBlocks` resilience is unchanged: `null`/`[]`/missing `layout` → `<></>` (safe empty state); unknown `blockType` → silent in prod, warn-once in dev (spec §Edge Cases). Every block `slug` has a `registry.ts` entry (pinned by the render registry-coverage test, now incl. `image`, `gallery`).
- Reading-column rule (DESIGN_SYSTEM §11.4) is enforced inside block components, not templates (FR-009). Verified by measuring element boxes at desktop+mobile via the visual harness.

## Cache & revalidation (ADR 0005)

- **C1 parity**: `detailCacheTags(c,slug)` = `[`${c}_${slug}`, `${c}_list`]`, `listCacheTags(c)` = `[`${c}\_list`]`, `globalCacheTags(g)` = `[`${g}\_list`]` MUST exactly equal `buildRevalidatePlan` output. Keystone test `tests/int/lib/payload-cache-tags.int.spec.ts` extended to cover `workshops` and `teamMembers` (incl. `/team/[slug]` and `/workshops/[slug]` CloudFront paths).
- Reader stack unchanged: `withReadTimeout(React.cache(unstable_cache(read,{tags})))`, `draft:false, overrideAccess:false`. Adding `layout` to a detail reader's selected fields must not change its cache key/tags.
- Services pillar-move dual invalidation and nested-path enrichment in `revalidateOnChange` preserved (FR-006).

## Draft / live preview

- `PREVIEW_COLLECTIONS` extended to include `workshops`, `teamMembers`; `publicPathFor` adds `/workshops/${slug}` and `/team/${slug}`.
- Public detail routes: cached published read FIRST, then `draftMode()` (avoids `DYNAMIC_SERVER_USAGE`); draft read via `getDraftBySlug` bypasses `unstable_cache`. Live preview reflects unpublished block edits; public serves only published `layout` (spec §Edge Cases).

## SEO / JSON-LD (FR-006, CONTENT-REQUIREMENTS §8)

- Listing pages and structured data are sourced from retained metadata, unchanged per type: breadcrumb on all detail routes; `articleLd` (posts), Organization (homepage), FAQPage (via `faq` block), and **new** `personLd` for `/team/[slug]`.
- `generateMetadata` per type still reads the `seo` group (teamMembers gains one); JSON-LD stays nonce-safe via `JsonLd.tsx` (Constitution IV).
- Sitemap enumerates `/team/[slug]` via `publishedSlugsFor('teamMembers')`; 301 redirect map unchanged.
