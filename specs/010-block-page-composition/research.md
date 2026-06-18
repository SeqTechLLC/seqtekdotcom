# Phase 0 Research: Block-composed pages

Resolves the plan-level unknowns for spec 010 / ADR 0009. No `NEEDS CLARIFICATION` markers remained in the spec; the decisions below settle the design forks the spec's Assumptions left "open to revisit during planning," three of which were confirmed with the owner on 2026-06-14.

## R1 — Specialized types stay as collections ("Page + metadata"), not folded into `pages`

**Decision**: Keep `caseStudies`, `workshops`, `services`, `teamMembers` as their own collections. Add a `layout` blocks array to each (the same field shape as `Pages.layout`), keep the typed metadata each listing/SEO/relationship path needs (slug, listing image, order, SEO group, `pillar`/`facilitator`/`testimonial`/`industry` relationships), and **retire only the discrete body fields** (the richText/array prose).

**Rationale**: Folding into `pages` would lose typed listings, per-type relationships, nested URLs (`/services/[pillar]/[slug]`), and the per-type JSON-LD/metadata that the cached readers, sitemap, and `revalidateOnChange` plan are all keyed on. The collection _is_ the "+ metadata"; only the body becomes block-composed. This matches ADR 0009's Option C exactly and preserves the cache-tag-parity (C1) and access-matrix invariants with the smallest blast radius.

**Alternatives considered**: (B) per-type discrete-fields-plus-blocks hybrid — rejected, leaves a half-structured model and doesn't retire the bespoke template; (fold-all-into-`pages`) — rejected, destroys typed listings/relationships/SEO and would force re-deriving the redirect map and nested routing.

## R2 — Expand/contract migration; old body columns hidden one release, dropped later

**Decision** (owner-confirmed): Each type's migration is two coordinated changes — (a) a Payload DB migration that **adds** the `layout` blocks tables, and (b) an idempotent content composer that fills `layout` from the record's previously published discrete fields. The old body fields are set `admin.hidden: true` (and `admin.readOnly: true`) but their **columns are retained for one release** as an in-DB rollback safety net. A follow-up `drop_legacy_body_columns` migration removes them after each migrated type has soaked one release.

**Rationale**: FR-007/SC-003 demand zero content loss. Expand/contract guarantees the source fields survive until the composed `layout` is verified in production, and keeps each migration reversible without a restore. The drop is a clean, separate, low-risk follow-up. Reading the existing migration (`20260612_233107_add_video_embed_eyebrow.ts`) confirms column changes must touch **both** the live `<collection>_blocks_*` tables and the `_<collection>_v_blocks_*` version tables.

**Alternatives considered**: drop-in-same-migration — rejected by owner; cleanest schema but no in-DB rollback once dropped, and it couples schema removal to content-fidelity verification that only completes after deploy.

## R3 — Gap-fill blocks: separate `image` and `gallery`

**Decision** (owner-confirmed): Build two layout blocks — `image` (single figure: one media upload, optional caption, optional width/alignment variant) and `gallery` (**1..N images** with captions and a layout variant: grid / carousel) so an editor can drop a one-to-many picture section into _any_ page's `layout`. Workshop `photos[]` → `gallery`; one-off images → `image`. Both reuse the Media collection (alt-text required, CloudFront-served per ADR 0008). A full coverage audit during Phase A confirms whether the retired templates need any other new block (SC-005); the known gap is images.

**Rationale**: Two constrained blocks are easier to steward and validate than one overloaded block, and map cleanly onto the two real shapes (single figure vs. photo set). The existing library already covers everything else the retired templates do (deliverables, video-embed, hubspot-form, download-card, testimonial-block, faq, metric-display, tech-stack, key-takeaways) — confirmed by the block inventory.

**Alternatives considered**: single `gallery` handling 1..N — rejected by owner; fewer blocks but a 1-image "gallery" is an awkward authoring/SEO shape for a plain figure.

## R4 — Default skeleton via Payload field `defaultValue`

**Decision**: Seed new specialized records from a default block skeleton using the `layout` field's `defaultValue` (a per-type function returning a starter blocks array, sourced from `src/payload/seed/skeletons/`). Fully editable after creation; not schema-enforced.

**Rationale**: FR-008 wants new records "uniform by default" but explicitly _not_ via required per-section fields (spec Assumptions). Field-level `defaultValue` is the canonical Payload content-level template and needs no hook. Uniformity comes from skeleton + curated blocks + the authoring skill, exactly as ADR 0009 states.

**Alternatives considered**: `beforeChange` hook injecting blocks on create — rejected, heavier and harder to override; required section fields — rejected by spec.

## R5 — Migration mechanism: extend the seed/upsert tooling, not raw SQL

**Decision**: The field→block content transform is an extension of the existing seed pipeline: per-type composers under `src/payload/seed/compose/*` that read a record's published discrete fields and write an equivalent `layout` via the Local API `upsertBySlug` pattern (idempotent, `overrideAccess`, `draft:true` so gaps log rather than fail). The Lexical body fields move into `content` blocks largely as-is; arrays/relationships map to their existing blocks. Re-runnable and slug-keyed (FR-007).

**Rationale**: This reuses the proven, tested composition pattern (`seed-about-api.mts`, showcase fixtures, `seedInScopeRoutes`) and goes through Payload hooks/validation rather than raw SQL, so revalidation + access + slug rules all fire. The schema change (new tables) is the only raw-SQL/Payload-migration part.

**Alternatives considered**: pure SQL `UPDATE` building JSONB block arrays — rejected, bypasses hooks/validation and is brittle against Payload's block table layout.

## R6 — Type-generic cross-cutting wiring

**Decision**: Before migrating, extend the shared wiring so every migrated detail route behaves like `pages`: add `workshops` and `teamMembers` to `PREVIEW_COLLECTIONS` + `publicPathFor` (`/workshops/[slug]`, `/team/[slug]`); confirm `detailCacheTags`/`listCacheTags` + `buildRevalidatePlan` cover team/workshop tags and CloudFront paths (extend the C1 keystone test); confirm the sitemap enumerates the new `/team/[slug]` route via `publishedSlugsFor`.

**Rationale**: `src/payload/livePreview/url.ts` confirms `workshops`/`teamMembers` are not preview-enabled today, and teamMembers is non-versioned. Team detail (R7) needs draft/preview, so teamMembers gains `versions.drafts` — which moves it from the `public-read-editorial-mutate` access tier to the `editorial-draftable` tier; the access-matrix test (`access.int.spec.ts`) must be updated accordingly. FR-012 requires these invariants hold for all block-composed pages.

## R7 — Team gets full block-composed `/team/[slug]` detail pages

**Decision** (owner-confirmed): Team is migrated to the full pattern — add `layout` + default skeleton + `versions.drafts` + live-preview to `teamMembers`, build a new block-composed `/team/[slug]` detail route, emit `Person` JSON-LD (`personLd`), and compose existing `bio/expertise/certifications/education/personalFacts/quote` into blocks. The `/team` listing (team-grid) is preserved unchanged.

**Team exists as a page AND as a block** (owner clarification 2026-06-14): in addition to its own `/team/[slug]` page, team is droppable into any page's `layout` via the existing `team-grid` block (filter leadership-only/featured/all, or manual member picks). The block already exists (no new code); this just confirms team composition works both ways — a standalone page and an embeddable section.

**Rationale**: Team has no bespoke detail _template_ to retire today (listing-only), so "no regression" is trivially met — but the owner chose full scope because Person detail pages are needed for AICO/E-E-A-T (CONTENT-REQUIREMENTS §8.7: per-member job title, expertise, ≥1 `sameAs` link, canonical URL). Building it now under the same pattern avoids a second migration later. This is the one phase that _adds_ a route rather than retiring a template.

**Alternatives considered**: metadata-only (no detail route) — viable for "no regression" but defers the AICO need; deferred-to-follow-up — rejected by owner in favor of doing it within this feature.

## R8 — Homepage global gains a `layout`; stays a global

**Decision**: The Homepage global (US5, Phase F, highest-risk, last) gains a `layout` blocks array; its discrete section fields (`hero/stats/featuredCaseStudy/brandTeaser/clientLogos/featuredTestimonials`) are composed into the equivalent blocks (`homepage-hero/stats-bar/featured-case-study/brand-teaser/client-logo-grid/featured-testimonials`) and `/` renders via `RenderBlocks`. It remains a **global** (not a `pages` row) to preserve its singular identity, Organization JSON-LD, and the analytics signals wired to it.

**Rationale**: Keeping it a global preserves `getHomepage()`, its global cache tag, and `revalidateGlobalOnChange('homepage')` while still delivering editor-controlled composition. Making homepage a `pages` slug would churn routing, the redirect map, and the homepage-specific metadata path for no gain.

## R9 — Two distinct skills + a curation-loop doc

**Decision**: Ship two separate skills under `.claude/skills/` (project-committed `SKILL.md` with `name`/`description`/`argument-hint`/`user-invocable` frontmatter, matching the existing speckit skill format):

- `compose-page` (FR-010, US3) — **net-new authoring**: given a page brief, emit a valid `layout` using only existing blocks, or name the specific missing block. No bespoke page code.
- `convert-to-blocks` (FR-014, US6) — **re-runnable conversion**: given an existing page (a migrated record, a Wix-audit page, or a hand-built one), emit a `layout` that reproduces the source content, or name the missing block.

Both are distinct from the per-type seed composer (R5), which is the migration mechanism of record. The **block-curation loop** (FR-011, US4) is documented in BLOCK_LIBRARY.md as the single legitimate code path: missing capability → fix/add a block → document it → available everywhere.

**Rationale**: FR-010 and FR-014 are explicitly different jobs (author vs. reproduce), and the spec calls out keeping them distinct from the seed migration. Both skills consume the same BLOCK_LIBRARY catalog (§5/§6) and DESIGN_SYSTEM §11.4 reading-column rule, and both produce the same artifact shape (a `layout` JSON or a single named-gap signal) — captured as a contract in `contracts/authoring-skill.md` and `contracts/conversion-skill.md`.

## R10 — Reading-column enforcement centralized in blocks (FR-009)

**Decision**: The reading-column rule (DESIGN_SYSTEM §11.4 — left-justified body in a centered `max-w-prose` block via `mx-auto`) is owned by the block components themselves; once the bespoke templates are retired, the interim per-template centering (PR #64) is removed and DESIGN_SYSTEM §11.4 is reconciled to state the rule lives in the block library. A fix to a block's wrapper then fixes that layout everywhere (the four-templates-one-bug problem ADR 0009 cites).

**Rationale**: Blocks already wrap content in `mx-auto max-w-container-lg` with `max-w-prose` inner measure; centralizing makes the rule single-source. Per memory ["Reading Column Centering"] and the "measure, don't reason" guidance, verification is by measuring element boxes at both viewports via the visual harness, not by reasoning from classes.
