# Feature Specification: Block-composed pages (two content primitives)

**Feature Branch**: `feat/010-block-page-composition`

**Created**: 2026-06-14

**Status**: Draft

**Input**: Implements ADR `docs/decisions/0009-block-first-composition.md`. Retire bespoke per-type page templates; every page **except the blog** is a block-composed **Page**, and the blog is a **Post** — the single sanctioned bespoke (rich-text article) template. Specialized types become "a Page body + typed metadata." Layout is editor-controlled; only adding/fixing a block type requires code.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Compose a workshop page from blocks, no deploy (Priority: P1)

A content editor opens a workshop in the admin, reorders its sections (e.g. moves the testimonial above the photo gallery), swaps one block for another, adds an image, and publishes. The change is live after publish with no developer involvement and no deploy. This is the pilot that proves the whole model.

**Why this priority**: It is the core promise and the acceptance gate of the entire feature — if an editor still needs a developer to rearrange a page, the feature has failed. Workshops are the chosen pilot because the template re-implements the most blocks that already exist.

**Independent Test**: On staging, with no code change or deploy, reorder two blocks on a workshop and publish; the public workshop page reflects the new order. The workshop still appears on the workshops listing and still emits valid JSON-LD.

**Acceptance Scenarios**:

1. **Given** a published workshop, **When** an editor reorders two blocks in the admin and publishes, **Then** the public page shows the new order with no deploy.
2. **Given** a workshop, **When** an editor adds an image/gallery block and publishes, **Then** the images render on the public page within the centered reading layout.
3. **Given** the migrated workshops, **When** the workshops listing and a workshop's structured data are rendered, **Then** title, listing image, ordering, and JSON-LD are unchanged from before the migration.
4. **Given** a newly created workshop, **When** the editor opens it, **Then** it starts from a default block skeleton so new workshops are uniform by default.

---

### User Story 2 - Same composition for case studies, services, and team (Priority: P2)

After the pilot, the same "Page + metadata" model is applied to case studies, then services, then team. Each retires its bespoke template body in favor of block composition while keeping the metadata its listings and SEO need.

**Why this priority**: Extends the proven pattern to the rest of the specialized types so the whole site is editor-composable; sequenced after the pilot to limit blast radius.

**Independent Test**: For each type, an editor reorders/enriches a record in the admin and the public detail page updates with no deploy; the type's listing page and JSON-LD are unchanged.

**Acceptance Scenarios**:

1. **Given** a case study, **When** an editor edits its block layout and publishes, **Then** the detail page updates with no deploy and the case-study grid/listing still renders it correctly.
2. **Given** a service, **When** its body is composed from blocks, **Then** the nested `/services/[pillar]/[slug]` URL, breadcrumb, and SEO are preserved.
3. **Given** the team type, **When** migrated, **Then** team listing and member presentation are preserved with no regression.

---

### User Story 3 - Design a page from the existing blocks via a skill (Priority: P3)

An author (or Claude via a skill) assembles a page by selecting and arranging existing blocks, and is told explicitly when the desired layout cannot be expressed with the current library (i.e., a block is missing).

**Why this priority**: Makes the block model usable at speed and turns "I need a new layout" into either composition (no code) or a clear, single block-gap signal — not a hand-built page.

**Independent Test**: Run the skill against a described page; it outputs a valid block composition using only existing blocks, or names the specific missing block. No bespoke page code is produced.

**Acceptance Scenarios**:

1. **Given** a page brief expressible with existing blocks, **When** the skill runs, **Then** it produces a valid block layout and no code changes.
2. **Given** a page brief that needs a capability no block provides, **When** the skill runs, **Then** it flags the specific missing block rather than hand-coding the page.

---

### User Story 4 - Adding a block type is the only code path (Priority: P3)

When a layout genuinely cannot be expressed, a developer adds or fixes a block type following a documented curation loop, after which editors can use it everywhere with no further code.

**Why this priority**: Defines and bounds the single legitimate code path so the "no code for layout" rule has a clear, controlled exception.

**Independent Test**: Follow the documented loop to add a new block; it appears in the library, renders via the shared renderer, is documented, and is immediately usable by editors on any page.

**Acceptance Scenarios**:

1. **Given** a missing capability, **When** a developer follows the block-curation loop, **Then** a new block is added, documented in the block inventory, and available to all page types without per-type code.

---

### User Story 5 - Homepage composed from blocks (Priority: P3)

The homepage (currently a bespoke global composition) is moved onto block composition last, as the highest-risk piece.

**Why this priority**: Highest visibility and the hardest existing composition; sequenced last so the pattern is fully proven first.

**Independent Test**: An editor reorders/edits homepage sections in the admin and the change is live with no deploy; hero, conversion signals, and SEO are preserved.

**Acceptance Scenarios**:

1. **Given** the homepage on blocks, **When** an editor reorders sections and publishes, **Then** the homepage updates with no deploy and analytics/SEO are unchanged.

---

### User Story 6 - Convert an existing page into blocks via a skill (Priority: P3)

An operator points a conversion skill at an existing page (a migrated record, a legacy Wix-audit page, or a hand-built one) and gets back a valid block **layout** that reproduces the page's content, ready to review and publish — with no hand-coding and no bespoke template.

**Why this priority**: Turns "we have N existing pages" into a repeatable, reviewable conversion rather than a per-page manual rebuild, and gives the migration a tool of record beyond the one-shot per-type seed.

**Independent Test**: Run the conversion skill against an existing page; it emits a block layout using only existing blocks that reproduces the source content, or names the specific missing block. No bespoke page code is produced.

**Acceptance Scenarios**:

1. **Given** an existing page expressible with current blocks, **When** the conversion skill runs, **Then** it produces a block layout reproducing the source content with no code changes.
2. **Given** source content needing a capability no block provides, **When** the skill runs, **Then** it flags the specific missing block rather than hand-coding the page.

---

### Edge Cases

- **Empty / partial layout**: a page with no blocks (or a block missing required content) renders a safe empty state, never a crash.
- **Unknown block type** in stored content (e.g. removed block): renders nothing in production (no crash), surfaced in dev — matching existing RenderBlocks resilience.
- **Draft vs published**: live preview reflects unpublished block edits; the public route serves only published layout.
- **Listing without body**: a specialized record can power its listing card from metadata even before its block body is authored.
- **Content migration fidelity**: every migrated record reproduces its prior published content; nothing is silently dropped during field→block migration.
- **Existing deep links / redirects**: detail URLs and the 301 redirect map continue to resolve.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The site MUST render every page **except the blog** through one primitive — the block-composed **Page**. The blog (**Post**) is the single sanctioned bespoke render (rich-text article template); no other per-type bespoke render template may exist.
- **FR-002**: Each specialized type (workshops, case studies, services, team) MUST expose a block **layout** for its body plus only the structured metadata its listing, navigation, relationships, SEO, and AICO (AI / answer-engine optimization) require.
- **FR-003**: A content editor MUST be able to add, remove, reorder, and swap blocks on any page in the admin and publish the result **without any code change or deploy**.
- **FR-004**: Introducing or fixing a **block type** MUST be the ONLY change that requires code and a deploy.
- **FR-005**: The block library MUST cover every capability the retired templates provided; any gap (at minimum an image/gallery block) MUST be filled before the corresponding type is migrated.
- **FR-006**: Migrating a type MUST preserve its listing pages, structured data (JSON-LD), nested URLs, breadcrumbs, and the 301 redirect map with no regression.
- **FR-007**: Migration MUST preserve each record's previously published content with full fidelity (no silent loss); the migration MUST be re-runnable/seedable.
- **FR-008**: New specialized records MUST be created from a default block skeleton so they are uniform by default, while remaining fully editable.
- **FR-009**: Block rendering MUST enforce the reading-column layout rule (DESIGN_SYSTEM.md §11.4) centrally, so layout fixes happen once in the library, not per page.
- **FR-010**: The system MUST provide a content-authoring skill that composes pages from existing blocks and explicitly flags when no existing block satisfies a need.
- **FR-011**: The project MUST document a block-curation loop defining how a missing/able-to-fix block is added (the single legitimate code path) and the block inventory MUST stay current.
- **FR-012**: Caching/ISR with cache-tag parity, draft/live-preview, and the access-matrix invariant MUST continue to hold for all block-composed pages.
- **FR-013**: Implementation MUST be phased — workshops (pilot) → case studies → services → team → homepage — each phase independently shippable and verifiable.
- **FR-014**: The project MUST provide a general, re-runnable **conversion** skill/script that transforms an existing page — including future imports such as the Wix audit content — into a valid block **layout**, distinct from both the per-type seed migration (FR-007) and the net-new authoring skill (FR-010). It MUST flag the specific missing block when a source layout cannot be expressed with existing blocks rather than emitting bespoke page code.

### Key Entities

- **Page**: a block-composed content document (a `layout` of ordered blocks) — the universal body shape.
- **Post**: the long-form blog/insights type — the one primitive that keeps a bespoke (rich-text) article template rather than block composition; the single sanctioned exception to the block model.
- **Specialized type (Workshop / Case Study / Service / Team member)**: a collection of typed metadata (title, slug, listing image, order, SEO, relationships such as facilitator/testimonial) attached to a Page body.
- **Block**: a reusable, typed layout/content unit in the shared library, rendered by the shared renderer; the only unit that requires code to create.
- **Default skeleton**: a content-level starting layout seeded onto new specialized records for baseline uniformity.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Every public page type except the blog renders through the block-composed **Page** primitive; zero bespoke per-type render templates remain at completion other than the blog (the single sanctioned exception).
- **SC-002**: A content editor can reorder or swap two elements on any page and have it live after publish with **zero** code changes and **zero** deploys — verified per type.
- **SC-003**: Every migrated record reproduces its prior published content (0 instances of dropped content across the migration).
- **SC-004**: No regression in existing automated coverage (E2E, visual capture, integration) and no change to listing pages or structured data, verified per phase.
- **SC-005**: After the block-library gap-fill, there is at least one block for every capability the retired templates provided (0 capabilities lost).
- **SC-006**: The only change category that requires a deploy for content/layout work is "new/fixed block type" — demonstrated by completing a representative editor layout change with no deploy.
- **SC-007**: Each phase ships independently; the pilot (workshops) is fully usable before later phases begin.

## Assumptions

- Specialized types remain as collections ("a Page + metadata"), not folded wholesale into the generic `pages` collection, to preserve typed listings/relationships/SEO. (Open to revisit per type during planning.)
- The existing ~34-block library covers most needs; the primary known gap is an image/gallery block (workshop photos); a full audit during the pilot will confirm any others.
- Existing seed/migration tooling can be extended to transform discrete-field content into block layouts and is the mechanism of record for content fidelity.
- Reading-column/centering behavior (PR #64) is interim; once blocks own layout it lives only in the blocks.
- Marquee **copy and photography** are produced by the separate content track and are out of scope here.
- The auth model and deploy/infrastructure model are unchanged and out of scope.
- "Uniformity" is achieved via the seeded default skeleton + curated blocks + the authoring skill, not via schema-enforced required sections.
- The blog (Post) is the single sanctioned bespoke template and is explicitly out of the block-composition migration; only its surrounding chrome/SEO/AICO metadata is touched, if anything.

## Out of Scope

- Writing marquee content (copy, testimonials, photography) — content track.
- Auth, deployment, and infrastructure changes.
- Redesigning the visual/brand system beyond what blocks already express.
- The eventual margin/edge treatment for wide viewports (separate design decision).

## Dependencies

- ADR 0009 (this spec implements it); ADR 0005 (ISR/cache-tag parity) must be preserved.
- The existing block library + `RenderBlocks` renderer and the `pages` composition path (the proven Shape A).
- Existing listing pages, JSON-LD/SEO, redirect map, draft/preview, and the access matrix.
- `BLOCK_LIBRARY.md` (kept current) and `DESIGN_SYSTEM.md` §11.4 (reading column).
