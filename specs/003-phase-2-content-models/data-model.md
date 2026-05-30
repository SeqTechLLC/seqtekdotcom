# Phase 1 — Data Model: Phase 2 Content Models

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Research**: [research.md](./research.md)

This document is **not** an authoritative schema. Field-level shape, validation rules, and relationships are defined by `docs/ARCHITECTURE.md` §2 for collections and globals, and by `docs/BLOCK_LIBRARY.md` §5/§5.2 for blocks. This file:

1. Lists every collection and global Phase 2 ships.
2. Captures Phase-2-specific implementation decisions per collection: which `versions`/`drafts` setting, which access helper, which hooks, whether `livePreview` is wired, and which blocks/relations need extra attention beyond the canonical doc.
3. Documents the access matrix as implemented (cross-referenced against `docs/ARCHITECTURE.md` §6).

Any divergence between this file and the canonical docs is a defect; per Constitution III, divergence is reconciled in the same PR.

---

## 1. Collections

Each row collapses ARCHITECTURE.md §2's field-by-field spec into the Phase-2-specific decisions the implementer needs to make. **Versioning** uses the R-02 decision; **Access** uses the R-12 helpers (`isAdmin`, `isAdminOrEditor`, `publishedOrAuthed`); **Hooks** lists the Phase-2-shared hooks each collection wires; **Preview** is the R-01 wiring for the four supported collections; **Slug** notes any non-default slug behaviour.

### 1.1 `users`

- **Canonical**: ARCHITECTURE.md §2 + already implemented by spec 001 (`src/collections/Users.ts`).
- **Versioning**: None.
- **Access**: `read: isAdminOrEditor`, `create: () => false` (auto-provision only), `update: isAdmin`, `delete: isAdmin`, `admin: isAdminOrEditor`. **Existing** — re-asserted by FR-017 + FR-018, not re-implemented.
- **Hooks**: `enforceDomainAllowlist`, `applyAutoProvisionRole`, `guardRoleUpdates` — **existing** (spec 001).
- **Preview**: N/A.
- **Slug**: N/A.
- **Phase 2 change**: None expected. If we discover a regression in role gating during access-matrix testing (SC-005), patch in-place.

### 1.2 `pages`

- **Canonical**: ARCHITECTURE.md §2 `pages` + BLOCK_LIBRARY.md §6 page composition matrix.
- **Versioning**: `versions: { drafts: true, maxPerDoc: 50 }`.
- **Access**: `read: publishedOrAuthed, create: isAdminOrEditor, update: isAdminOrEditor, delete: isAdmin, admin: isAdminOrEditor`.
- **Hooks**: `slugFromTitle` (beforeChange), `enforceDraftWhenScheduled` (beforeChange, if `publishedAt` adopted on pages — defer to canonical schema), `revalidateOnChange` (afterChange, paths: `/${slug}` + `/sitemap.xml`).
- **Preview**: Wired (`admin.livePreview.url → /preview/pages/${slug}`).
- **Slug**: Auto from title on create; editable thereafter; URL-safe `validate` on every save.
- **Layout field**: `layout: blocks([...all layout blocks from src/payload/blocks/layout/index.ts])` — `pages` is the **only** collection with the full block library per spec Assumption + BLOCK_LIBRARY.md §1.
- **Existing file**: `src/collections/Pages.ts` — currently minimal (title + slug + content richText). Phase 2 expands to: add `layout` blocks field, `status`, `seo` group, hero group per ARCHITECTURE.md §2, wire versions/access/hooks/preview.

### 1.3 `posts`

- **Canonical**: ARCHITECTURE.md §2 `posts`.
- **Versioning**: `versions: { drafts: true, maxPerDoc: 50 }`.
- **Access**: same as `pages`.
- **Hooks**: `slugFromTitle`, `enforceDraftWhenScheduled`, `revalidateOnChange` (paths: `/insights/${slug}` + `/insights` + `/insights/category/${category.slug}` for each category + `/sitemap.xml`).
- **Preview**: Wired (`/preview/posts/${slug}`).
- **Slug**: As `pages`.
- **Content**: `richText` body with the full inline-block set via `BlocksFeature({ inlineBlocks: [...] })` from `editorConfig`.
- **Relationships**: `author → teamMembers` (required), `categories → categories` (hasMany), `relatedPosts → posts` (hasMany, max 3), `relatedServices → services` (hasMany).

### 1.4 `caseStudies`

- **Canonical**: ARCHITECTURE.md §2 `caseStudies`.
- **Versioning**: `versions: { drafts: true, maxPerDoc: 50 }`.
- **Access**: same as `pages`.
- **Hooks**: `slugFromTitle`, `enforceDraftWhenScheduled`, `revalidateOnChange` (paths: `/case-studies/${slug}` + `/case-studies` + `/sitemap.xml`; on industry/service link change, also `/industries/${industry.slug}` and per-service pages).
- **Preview**: Wired (`/preview/caseStudies/${slug}`).
- **Slug**: As `pages`.
- **Structured fields**: `subtitle`, `industry` (required relationship), `services` (hasMany), `client` group with `isAnonymized` checkbox + conditional logo, `heroImage` (required), `problem`/`solution`/`impact` (richText with inline blocks), `metrics` array (number/label/context), `technologies` array of text, `testimonial` (relationship, optional), `relatedCaseStudies` (hasMany, max 3), `seo`, `publishedAt`, `status`.
- **Note**: `caseStudies` uses structured fields exclusively (no blocks layout) per BLOCK_LIBRARY.md §1.

### 1.5 `services`

- **Canonical**: ARCHITECTURE.md §2 `services`.
- **Versioning**: `versions: { drafts: true, maxPerDoc: 50 }`.
- **Access**: same as `pages`.
- **Hooks**: `slugFromTitle`, `revalidateOnChange` (paths: `/services/${pillar.slug}/${slug}` + `/services/${pillar.slug}` + `/services` + `/sitemap.xml`).
- **Preview**: Wired (`/preview/services/${slug}`).
- **Slug**: As `pages`.
- **Structured fields**: `pillar` (required relationship → servicePillars), `description` (richText, structured per BLOCK_LIBRARY.md §1 — NOT a blocks field, B-1 closed), `approach` (richText), `deliverables` (array of text), `icon` (text identifier), `relatedCaseStudies` (hasMany), `faq` (array: question/answer pairs), `seo`, `order` (number), `status`.

### 1.6 `servicePillars`

- **Canonical**: ARCHITECTURE.md §2 `servicePillars`.
- **Versioning**: `versions: { drafts: true, maxPerDoc: 50 }`.
- **Access**: same as `pages`.
- **Hooks**: `slugFromTitle`, `revalidateOnChange` (paths: `/services/${slug}` + `/services` + every child `services` listing under this pillar + `/sitemap.xml`).
- **Preview**: Not wired in Phase 2 (only `pages`/`posts`/`caseStudies`/`services` per ROADMAP §4).
- **Slug**: As `pages`.
- **Structured fields**: `title`, `description` (richText), `heroImage`, `seo`, `order`.

### 1.7 `teamMembers`

- **Canonical**: ARCHITECTURE.md §2 `teamMembers`.
- **Versioning**: None (per R-02).
- **Access**: `read: () => true` (public — used in author bylines, no draft lifecycle), `create/update: isAdminOrEditor, delete: isAdmin`.
- **Hooks**: `slugFromTitle` (on `name`), `revalidateOnChange` (limited: any post or workshop authored by this person should invalidate; defer batch logic to "invalidate `/about/team`" listing + the affected document — implementation detail in the hook factory).
- **Preview**: Not wired.
- **Slug**: Auto from `name`.
- **Structured fields per ARCHITECTURE.md §2**: `name` (useAsTitle), `slug`, `title` (job title), `role` (1-sentence), `photo` (required upload), `bio` (richText), `expertise` (array), `certifications`, `education`, `linkedinUrl`, `email`, `personalFacts`, `quote`, `isLeadership` (checkbox), `order`.

### 1.8 `testimonials`

- **Canonical**: ARCHITECTURE.md §2 `testimonials`.
- **Versioning**: None (per R-02 — `isActive` gates visibility).
- **Access**: `read: ({ req }) => isAdminOrEditor({ req }) || { isActive: { equals: true } }`, `create/update: isAdminOrEditor, delete: isAdmin`.
- **Hooks**: `revalidateOnChange` (paths: every page referencing this testimonial; conservative: invalidate `/` plus any `caseStudies` with `testimonial` pointing to this id).
- **Preview**: Not wired.
- **Slug**: None (uses `personName` as `useAsTitle`).
- **Structured fields**: `quote`, `personName` (required, full name per CONTENT-REQUIREMENTS §6), `personTitle`, `company`, `photo`, `caseStudy` (optional relationship), `isActive` (checkbox).

### 1.9 `workshops`

- **Canonical**: ARCHITECTURE.md §2 `workshops`.
- **Versioning**: `versions: { drafts: true, maxPerDoc: 50 }`.
- **Access**: same as `pages`.
- **Hooks**: `slugFromTitle`, `revalidateOnChange` (paths: `/touchstone-workshops/${slug}` + `/touchstone-workshops` + `/sitemap.xml`).
- **Preview**: Not wired.
- **Slug**: As `pages`.
- **Structured fields**: `description`, `format`, `audience` (all richText), `deliverables` array, `facilitator` (relationship → teamMembers), `testimonial` (relationship → testimonials), `order`, `seo`.

### 1.10 `industries`

- **Canonical**: ARCHITECTURE.md §2 `industries`.
- **Versioning**: `versions: { drafts: true, maxPerDoc: 50 }`.
- **Access**: same as `pages`.
- **Hooks**: `slugFromTitle`, `revalidateOnChange` (paths: `/industries/${slug}` + `/sitemap.xml`; also invalidate any case-study listing filtered by this industry).
- **Preview**: Not wired.
- **Slug**: As `pages`.
- **Structured fields**: `description` (richText), `relevantServices` (hasMany → services), `clientLogos` (array of uploads), `seo`.

### 1.11 `locations`

- **Canonical**: ARCHITECTURE.md §2 `locations`.
- **Versioning**: `versions: { drafts: true, maxPerDoc: 50 }`.
- **Access**: same as `pages`.
- **Hooks**: `slugFromTitle` (on `city`), `revalidateOnChange` (paths: `/consulting/${slug}` + `/sitemap.xml`).
- **Preview**: Not wired.
- **Slug**: Auto from `city`.
- **Structured fields**: `city`, `description` (richText), `address` group, `hasOffice` (checkbox), `seo`.

### 1.12 `media`

- **Canonical**: ARCHITECTURE.md §2 `media` + §5 storage config.
- **Versioning**: None.
- **Access**: `read: () => true` (public — served via CloudFront `/media/*`), `create/update: isAdminOrEditor, delete: isAdmin`.
- **Hooks**: None (R-03 hook intentionally not wired here — media changes invalidate via the consuming document's hook).
- **Preview**: N/A.
- **Slug**: N/A (filename + media-id key per ARCHITECTURE.md §5).
- **Upload config**: `upload: true` plus the `@payloadcms/storage-s3` plugin wiring at the config level (per R-07). Size cap: 25 MB (covers the largest expected hero image with WebP/AVIF derivatives). MIME types: images (`image/*`), PDFs (`application/pdf`).
- **Validation**: `alt` field `required: true` + a `validate` returning a clear error on empty string (FR-023).
- **Existing file**: `src/collections/Media.ts` — currently minimal. Phase 2 adds the validate, size cap, MIME filter, focal-point field if not already present.

### 1.13 `categories`

- **Canonical**: ARCHITECTURE.md §2 `categories`.
- **Versioning**: None (per ARCHITECTURE.md §2 "public read, no draft status on categories").
- **Access**: `read: () => true`, `create/update/delete: isAdmin`.
- **Hooks**: `slugFromTitle`, `revalidateOnChange` (paths: `/insights/category/${slug}` + `/insights` + `/sitemap.xml`).
- **Preview**: Not wired.
- **Slug**: As `pages`.
- **Structured fields**: `title`, `slug`.

---

## 2. Globals

Globals get `versions: { drafts: true, maxPerDoc: 50 }` per R-02 — editorial workflow for high-touch globals needs preview-before-publish.

### 2.1 `siteSettings`

- **Canonical**: ARCHITECTURE.md §2 `siteSettings`.
- **Access**: `read: () => true, update: isAdminOrEditor` (delete N/A for globals).
- **Hooks**: `revalidateOnChange` (paths: every public page — conservative invalidation of `/` + the sitemap; ARCHITECTURE.md §3 lists this as a global-wide invalidation).
- **Fields**: `companyName`, `tagline`, `phone`, `email`, `address` group, `socialLinks` group, `footerText`, `stats` array.

### 2.2 `navigation`

- **Canonical**: ARCHITECTURE.md §2 `navigation`.
- **Access**: same as `siteSettings`.
- **Hooks**: `revalidateOnChange` (every page consumes the nav → conservative: invalidate `/` + sitemap; rely on ISR for downstream pages).
- **Fields**: `mainNav` array (label/url/children), `footerNav` array, `ctaButton` group.

### 2.3 `homepage`

- **Canonical**: ARCHITECTURE.md §2 `homepage` + BLOCK_LIBRARY.md §6 homepage composition.
- **Access**: same as `siteSettings`.
- **Hooks**: `revalidateOnChange` (paths: `/` + `/sitemap.xml`).
- **Fields**: `hero` group, `stats` group, `featuredCaseStudy` relationship, `brandTeaser` group, `clientLogos` array of uploads, `featuredTestimonials` hasMany (max 3).
- **Note**: structured fields (no blocks layout) per BLOCK_LIBRARY.md §1.

---

## 3. Block Library

The full catalog of layout blocks (35+) and inline blocks (7) is documented in BLOCK_LIBRARY.md §5 and §5.2. Phase 2 implements every block in that catalog:

- **Layout blocks** → `src/payload/blocks/layout/*.ts` (one file per block per BLOCK_LIBRARY.md §9 rule 6). Re-exported from `src/payload/blocks/layout/index.ts`.
- **Inline blocks** → `src/payload/blocks/inline/*.ts`. Re-exported and registered via `BlocksFeature({ inlineBlocks: [...] })` in `src/payload/editor/editorConfig.ts`.
- **Renderers** → `src/components/sections/<BlockName>.tsx` (layout) and `src/components/richText/inline/<BlockName>.tsx` (inline).
- **Dispatcher** → `src/components/sections/RenderBlocks.tsx` + `registry.ts` per BLOCK_LIBRARY.md §8.

Conditional required fields (per R-06) are implemented via the `requiredWhen(predicate)` helper. Blocks with such fields per BLOCK_LIBRARY.md §5: `hero`, `case-study-hero`, `stats-bar`, `logo-bar`, `case-study-grid`, `service-cards`, `cta-section`, `service-pillar-hero`, `video-embed` (custom thumbnail conditional).

---

## 4. Access Matrix (as implemented)

Reproduces ARCHITECTURE.md §6 and serves as the table the SC-005 test iterates. Per R-17, this is enforced by a data-driven Vitest integration test against the Payload Local API.

| Operation                               | Public | Editor | Admin |
| --------------------------------------- | :----: | :----: | :---: |
| View published content                  |   ✓    |   ✓    |   ✓   |
| View drafts                             |        |   ✓    |   ✓   |
| Create content (any collection)         |        |   ✓    |   ✓   |
| Update content (any collection)         |        |   ✓    |   ✓   |
| Publish (`status: 'published'`)         |        |   ✓    |   ✓   |
| Schedule publish (future `publishedAt`) |        |   ✓    |   ✓   |
| Delete content                          |        |        |   ✓   |
| Manage users                            |        |        |   ✓   |
| Access `/admin`                         |        |   ✓    |   ✓   |
| Read `media`                            |   ✓    |   ✓    |   ✓   |
| Read `categories`                       |   ✓    |   ✓    |   ✓   |
| Read `testimonials` where `isActive`    |   ✓    |   ✓    |   ✓   |
| Read `testimonials` where `!isActive`   |        |   ✓    |   ✓   |
| Read `teamMembers`                      |   ✓    |   ✓    |   ✓   |

**First-sign-in auto-provisioning** (FR-036): if `users` table is empty → first signer becomes `admin`; otherwise → `editor`. **Existing behaviour** from spec 001 (`src/lib/auth/apply-bootstrap-role.ts`); Phase 2's SC-009 test asserts the property has not regressed.

---

## 5. State Transitions

### 5.1 Document lifecycle (any draftable collection)

```text
[create] → status=draft ── editor save ──> status=draft (no revalidation)
                       ── publish (status=published, publishedAt<=now) ──> status=published
                                                                          + afterChange fires
                                                                          + revalidateTag()
                                                                          + CloudFront invalidate

[draft] ── editor sets publishedAt=future + status=published ──> beforeChange forces status=draft
                                                                  (stays draft until cron flip)

[published] ── editor edits content + save ──> status=published, afterChange fires (cache bust)
[published] ── editor unpublishes (status=draft) ──> status=draft, afterChange fires (cache bust)
[published] ── admin deletes ──> document gone, afterChange fires for "deletion" (out of scope for FR-026)
```

**Note**: Phase 2 does **not** ship the cron trigger that flips a scheduled draft to published at the cutover moment (per spec Assumption). The Phase 2 invariant (R-11) only ensures a future `publishedAt` cannot accidentally land as `published`.

### 5.2 Seed lifecycle (per record)

```text
[script start]
  ├─ parse audit JSON for collection
  ├─ for each record:
  │    ├─ map fields per CONTENT_MIGRATION.md §3
  │    ├─ rewrite slug via INTEGRATIONS.md §9 map (FR-031)
  │    ├─ upsertBySlug(collection, doc)  (FR-030)
  │    └─ on any field gap → migration-errors.log line (FR-032)
  ├─ if --recrawl-images set → download/upload media (R-10)
  └─ done

[re-run] → same flow; existing records updated in place; no duplicates
[dry-run] → planned upserts printed to stdout; no writes
[--collection=<name>] → only that collection processed
```

---

## 6. Migration Errors (the seed's worklist output)

`migration-errors.log` format per R-16:

```text
2026-05-29T14:00:00Z WARN MISSING_IMAGE caseStudies/healthcare-ux-redesign hero
2026-05-29T14:00:00Z WARN MISSING_TESTIMONIAL caseStudies/oil-gas-modernization
2026-05-29T14:00:00Z WARN STATS_CONFLICT homepage vs pages/about: 20+/411+/8221+ vs 25+/500+/10,000+
2026-05-29T14:00:00Z WARN CONTENT_MISMATCH caseStudies/healthcare-ux-redesign body describes UX redesign; title was drill bit
2026-05-29T14:00:00Z WARN MISSING_BIO teamMembers/hank-haines
2026-05-29T14:00:00Z WARN ADDRESS_DISCREPANCY pages/privacy-policy body says Sapulpa; footer says Tulsa
2026-05-29T14:00:00Z WARN MISSING_ALT media/${id} (only when --recrawl-images set)
```

Categories enumerated by CONTENT_MIGRATION.md §11. SC-011 asserts 100% coverage on a fresh run.

---

## 7. Generated Types

`src/payload-types.ts` is regenerated by `npm run generate:types` (already in `package.json:15`). Phase 2 expands the file from its current ~8KB (3 collections) to roughly 60–80KB (13 collections × every field plus the global types and the block union types). FR-038 documents this as the required follow-up to any schema change.

---

## 8. Open follow-ups (intentionally out of scope)

The following are explicitly Phase 3+ or later-spec scope and called out so this data model doesn't appear to under-deliver:

- `/api/cron/publish-scheduled` cron endpoint — flips drafts at the scheduled cutover moment (spec Assumption + R-11).
- Image re-crawl Playwright pass — produces the URL list `--recrawl-images` consumes (R-10).
- `migration-errors.log` admin UI surface — spec Assumption says explicitly out of scope.
- Phase 3 page templates (homepage page, about, services, case studies, etc.) — Phase 2 ships `RenderBlocks` and the inline-block converter, not the page-by-page composition.
