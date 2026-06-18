# Phase 1 Data Model: Block-composed pages

Schema deltas for spec 010 / ADR 0009. The universal target shape is the existing `Pages.layout` blocks field; every specialized collection converges on it. Field types and conventions per PAYLOAD_DEVELOPMENT §5–6; blocks per BLOCK_LIBRARY §5.

## Universal shape (already exists on `pages`)

```
layout: blocks   // type:'blocks', the 43-block library + the 2 new blocks (R3)
                 // null/[]/missing → RenderBlocks renders <></> (safe empty state, spec §Edge Cases)
```

Each migrated collection adds this field with a per-type `defaultValue` (the default skeleton, R4) and keeps its metadata. Old body fields are flagged `admin.hidden:true, admin.readOnly:true` and kept one release (expand/contract, R2).

## New blocks (Phase A, FR-005)

### `image` (single figure)

| Field       | Type                                      | Notes                                             |
| ----------- | ----------------------------------------- | ------------------------------------------------- |
| `image`     | upload → media (required)                 | alt-text required by Media collection             |
| `caption`   | text                                      | optional                                          |
| `width`     | select: `narrow`/`standard`/`wide`/`full` | default `standard`; honors reading column (§11.4) |
| `alignment` | select: `center`/`left`/`right`           | default `center`                                  |

### `gallery` (1..N images)

| Field     | Type                                                                 | Notes                 |
| --------- | -------------------------------------------------------------------- | --------------------- |
| `heading` | text                                                                 | optional              |
| `items`   | array (min 1) of `{ image: upload→media (required), caption: text }` |                       |
| `layout`  | select: `grid`/`carousel`                                            | default `grid`        |
| `columns` | select: `2`/`3`/`4`                                                  | conditional on `grid` |

Both get: a Payload config (`src/payload/blocks/layout/{Image,Gallery}.ts`), registration in `blocks/layout/index.ts`, a render component (`src/components/sections/{Image,Gallery}.tsx`) wrapping content per §11.4, a `registry.ts` entry, and a showcase fixture (so `npm run seed:showcase` + visual capture cover them). Registry coverage is pinned by the existing render registry-coverage test.

## Per-collection deltas

### Workshops (Phase B — pilot)

- **Add**: `layout: blocks` (+ default skeleton); `admin.livePreview = livePreviewFor('workshops')`.
- **Keep (metadata)**: `title`, `slug`, `order`, `seo`, `facilitator`→teamMembers, `testimonial`→testimonials.
- **Deprecate (→ blocks, then hide)**: `description`/`format`/`audience` (richText → `content`), `deliverables[]` (→ `deliverables`), `photos[]` (→ `gallery`), `video` group (→ `video-embed`).
- **Composer mapping** (`workshopToLayout.ts`): hero/`content`(description) → `content`(format) → `content`(audience) → `deliverables` → `gallery`(photos) → `video-embed` → `testimonial-block`(if testimonial) → `contact-cta`/`hubspot-form` per current template tail.

### CaseStudies (Phase C)

- **Add**: `layout: blocks` (+ skeleton). (livePreview already enabled.)
- **Keep**: `title`, `slug`, `subtitle`, `industry`→industries, `services[]`, `client` group, `heroImage`, `testimonial`→testimonials, `relatedCaseStudies[]`, `seo`.
- **Deprecate (→ blocks)**: `problem`/`solution`/`impact` (richText → `content`), `metrics[]` (→ `metric-display`/`stats-bar`), `technologies[]` (→ `tech-stack`).
- **Composer** (`caseStudyToLayout.ts`): `case-study-hero`(heroImage+lead metric) → `content`(problem) → `content`(solution) → `content`(impact) → `stats-bar`/`metric-display`(metrics) → `tech-stack`(technologies) → `key-takeaways`(if present) → `testimonial-block`(if testimonial).

### Services (Phase D)

- **Add**: `layout: blocks` (+ skeleton). (livePreview already enabled.)
- **Keep**: `title`, `slug`, `pillar`→servicePillars (drives nested `/services/[pillar]/[slug]`), `icon`, `order`, `relatedCaseStudies[]`, `seo`.
- **Deprecate (→ blocks)**: `description`/`approach` (richText → `content`), `deliverables[]` (→ `deliverables`), `faq[]` (→ `faq`, preserving FAQPage JSON-LD via the block).
- **Composer** (`serviceToLayout.ts`): `content`(description) → `content`(approach) → `deliverables` → `faq` → `contact-cta`. Nested-URL/breadcrumb/pillar-move revalidation untouched (`revalidateOnChange` services branch).

### TeamMembers (Phase E — also gains a detail route)

- **Add**: `layout: blocks` (+ skeleton); **`versions: { drafts: true, maxPerDoc: 50 }`** (today non-versioned — R6/R7); `admin.livePreview = livePreviewFor('teamMembers')`; `enforceDraftWhenScheduled` beforeChange (matching other draftable types).
- **Keep (metadata)**: `name`, `slug`, `title`, `role`, `photo`, `linkedinUrl`, `email`, `isLeadership`, `order`. **Add** an `seo` group (none today) so the detail route has per-member metadata.
- **Deprecate (→ blocks)**: `bio` (richText → `content`), `expertise[]`/`certifications[]`/`education[]`/`personalFacts[]` (→ `deliverables`/`content`/`key-takeaways` as fits), `quote` (→ `testimonial-block` or `content`).
- **Access-tier change**: moves from `public-read-editorial-mutate` to `editorial-draftable` (read-published public, read-draft hidden, editorial mutate, admin delete). Update `access.int.spec.ts` matrix.
- **New route**: `/team/[slug]/page.tsx` renders `layout` via `RenderBlocks`, emits `personLd(member)` + breadcrumb; `/team` cards link to it.

### Homepage (global, Phase F)

- **Add**: `layout: blocks`. Render `/` via `RenderBlocks`.
- **Deprecate (→ blocks)**: `hero`(→`homepage-hero`), `stats[]`(→`stats-bar`), `featuredCaseStudy`(→`featured-case-study`), `brandTeaser`(→`brand-teaser`), `clientLogos[]`(→`client-logo-grid`/`logo-bar`), `featuredTestimonials`(→`featured-testimonials`).
- **Keep**: global identity, `getHomepage()`, `homepage_list` cache tag, `revalidateGlobalOnChange('homepage')`, Organization JSON-LD, analytics signals.

## Out of migration scope (unchanged)

- **Posts** — the single sanctioned bespoke rich-text article template (ADR 0009); body untouched. Only AICO/SEO chrome touched if anything.
- **Pages** — already block-composed; the reference model.
- **ServicePillars, Industries, Locations, Categories, Testimonials, Media, Users** — taxonomy/reference/auth; no body composition. (ServicePillars keeps its `description` richText; it's a listing target, not a retired detail template.)

## Migration tables (Payload-generated, per `payload migrate`)

Adding `layout` to a collection generates a family of `<collection>_blocks_*` live tables and `_<collection>_v_blocks_*` version tables (one set per block type used). Each `add_layout_<type>` migration is generated by Payload from the schema change; the follow-up `drop_legacy_body_columns` migration removes the deprecated body columns from both live and `_v` tables (R2). No `drizzle-kit push`; Payload owns the schema (Constitution V).

## Invariants preserved (FR-006, FR-012)

- **C1 cache-tag parity** — `detailCacheTags`/`listCacheTags`/`globalCacheTags` ≡ `buildRevalidatePlan` output; keystone test extended for workshops/team.
- **Access matrix** — `access.int.spec.ts`; teamMembers tier updated.
- **Draft isolation** — public routes read `draft:false` cached; preview reads `getDraftBySlug` (bypasses cache); cached-read-then-`draftMode()` ordering kept.
- **Listings + JSON-LD + nested URLs + 301 redirect map + sitemap** — sourced from retained metadata; no regression.
