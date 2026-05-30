# Feature Specification: Phase 2 — Content Models, Block Library & Editorial Workflow

**Feature Branch**: `003-phase-2-content-models`

**Created**: 2026-05-28

**Status**: Draft

**Input**: User description: "phase 2 content" — implement ROADMAP §4 Phase 2: all Payload collections + globals per ARCHITECTURE.md §2, the complete block library (`Pages.layout` + inline rich-text blocks) per BLOCK_LIBRARY.md, role-based admin access per ARCHITECTURE.md §6, live preview for posts/case-studies/pages/services, the audit-to-Payload seed script per CONTENT_MIGRATION.md, and an initial admin user creation flow that's compatible with Google SSO (spec 001).

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Content editor authors a page from the block library (Priority: P1)

A SEQTEK content editor signs in at `/admin`, opens the `pages` collection, creates a new page, and composes it by adding blocks from the layout menu (hero, stats bar, content, comparison table, CTA, etc.). They can reorder blocks via drag, edit each block's fields inline, save a draft, and come back later to keep editing without losing data. Inside any rich-text body they can also insert inline blocks — pull quotes, callouts, image-with-caption, embedded testimonials — without leaving the editor.

**Why this priority**: This is the minimum that turns "Payload is installed" into "SEQTEK can produce its website." Every page in Phase 3 (homepage, about, services, case studies, blog posts, industries, locations, workshops, assessment) is composed from this library. Without the block library and a working authoring experience, Phase 3 cannot begin. Per ROADMAP §4 Phase 2 this is the load-bearing item.

**Independent Test**: A non-engineer with admin access can build a complete sample page using only the block menu and rich-text inserts, save it as a draft, log out, log back in, and resume editing — all without an engineer's help and without touching the database directly. Render the saved draft via the public preview path and confirm every block renders to the correct visual component without console errors.

**Acceptance Scenarios**:

1. **Given** an editor is signed in at `/admin`, **When** they create a new `pages` document and add a block from the layout menu, **Then** every block listed in BLOCK_LIBRARY.md §5 is selectable, the block's fields render in the admin form, and required-field validation prevents save until satisfied.
2. **Given** an editor is editing a `pages` document with multiple blocks, **When** they drag a block to a new position and save, **Then** the new order persists across reloads and is reflected in the saved document's `layout` array.
3. **Given** an editor is editing any rich-text body (post content, page `content` block, case study `problem`/`solution`/`impact`, etc.), **When** they invoke the inline-block insertion UI, **Then** every inline block in BLOCK_LIBRARY.md §5.2 (`inline-cta`, `testimonial-embed`, `callout`, `image-with-caption`, `figure`, `quote-pullquote`, `disclosure`) is available and inserts a working node.
4. **Given** a block has conditional required fields (e.g., `hero` requires `media` when `variant` is `with-image`), **When** the editor selects the gating variant and tries to save without the conditional field, **Then** save is blocked with a clear field-level error message.
5. **Given** an editor has saved a draft and signed out, **When** they sign in later and reopen the draft, **Then** every block, every inline-block insertion, and every field value is intact with no data loss.

---

### User Story 2 — Editor previews unpublished content the way users will see it (Priority: P1)

An editor has a draft case study with a new metric callout and an updated testimonial pull-quote. Before publishing, they click the preview action from inside the admin and land on a rendered page that shows the draft exactly as the public will see it after publish — same components, same styling, same images — but unmistakably marked as a preview so they don't confuse it with the live site. They can navigate around adjacent linked pages while keeping the preview context. When they're satisfied, one action transitions the document from `draft` to `published`.

**Why this priority**: The whole point of versioned drafts is editor confidence — without preview, editors will publish-to-check, which produces visible churn on the live site and undermines trust in the CMS. Live preview must work for the four content types where authors do the most work (`posts`, `case-studies`, `pages`, `services`) per ROADMAP §4 Phase 2.

**Independent Test**: Open a draft of each of the four supported content types, click preview, confirm the rendered output matches the draft state and is visibly badged as a preview. Switch the document to `published` and confirm it now resolves on the public route at its slug.

**Acceptance Scenarios**:

1. **Given** an editor is viewing a draft `post`, `caseStudy`, `page`, or `service` in the admin, **When** they invoke the preview action, **Then** the preview URL renders the public-page layout using the draft data (no published version published yet).
2. **Given** an editor changes a draft field and re-opens preview, **When** the preview loads, **Then** the change is reflected without requiring a publish step.
3. **Given** an editor is on a preview page, **When** they look at the page, **Then** there is an unambiguous visual indicator that this is a preview (banner, frame, or equivalent) and not the live site.
4. **Given** a draft is in preview, **When** an unauthenticated user attempts to access the same preview URL, **Then** access is denied and the user is redirected to the admin sign-in.
5. **Given** an editor flips the document `status` from `draft` to `published`, **When** they save, **Then** the document resolves on its public route at its slug within the published revalidation window, and the on-change revalidation path runs (ISR cache busts and the targeted CloudFront paths invalidate, per ARCHITECTURE.md §3).

---

### User Story 3 — Engineer renders a page from saved content without ad-hoc data shaping (Priority: P1)

A frontend engineer building a Phase 3 page imports the collection's TypeScript type, queries Payload's local API for the document by slug, and hands the result straight to `<RenderBlocks blocks={page.layout} />` (for the `pages` collection) or to the dedicated structured-template renderer (for `caseStudies`, `services`, etc.). The shape they receive matches the canonical type — no surprise nulls on required fields, no untyped `unknown` arrays, no need to defensively coerce values that the schema already constrains. The dispatcher in `RenderBlocks` resolves every block type defined in the block library to its React component without registration drift.

**Why this priority**: Phase 3 has 30+ pages to build. If every page needs custom data-shaping glue, Phase 3 takes 2x as long and the inevitable inconsistencies leak into the public site. The block library is only valuable if the engineer's render path is mechanical.

**Independent Test**: From a clean Phase 3 page file, render any saved-and-published document by querying Payload by slug, passing the result to the appropriate renderer (`<RenderBlocks>` for `pages`, the structured template for collection-driven pages), and observe a complete page in the browser with no console warnings about unknown block types or missing required props.

**Acceptance Scenarios**:

1. **Given** any `pages` document with a populated `layout` array, **When** an engineer passes `layout` to `<RenderBlocks>`, **Then** every block type in the array dispatches to a registered React component and renders without warnings.
2. **Given** generated TypeScript types from Payload, **When** an engineer imports a collection's type, **Then** required fields are non-nullable in the type and optional fields are correctly optional — the type matches the schema's `required: true` markers.
3. **Given** an unknown `blockType` value appears (e.g., from a stale dev database), **When** `<RenderBlocks>` encounters it, **Then** the dispatcher logs a development-only warning and skips that block without crashing the page.
4. **Given** an editor adds a new rich-text or client-component field to a collection, **When** the engineer regenerates Payload's importMap per the documented workflow, **Then** the admin re-mounts cleanly with no missing-component errors (per `project_payload_importmap_gotcha` memory).
5. **Given** an engineer queries `payload.find({ collection, where: { slug: { equals } } })`, **When** the document is in `draft` status and the request is unauthenticated, **Then** the document is excluded from results per ARCHITECTURE.md §6 access control — never leaked to the public render path.

---

### User Story 4 — Content lead seeds the audit data and reviews drafts in one place (Priority: P2)

The content lead runs the seed script once to ingest the Wix audit JSON into Payload. The script populates the 8 case studies, 5-6 generic pages, ~6 post stubs, the `homepage` and `siteSettings` globals — every record landing in `draft` status. The lead opens the admin, sees every imported document grouped by collection, and works through the known-issue list (missing testimonials, missing hero images, content mismatch on the healthcare UX study, stat-number conflicts) by editing each draft. Re-running the script during this period updates existing records by slug rather than creating duplicates, so the lead can iterate on the parser without polluting the database.

**Why this priority**: The seed script is the bridge between the existing Wix content and the new CMS. Without it, the content lead either retypes everything or skips the audit's prose entirely. With it, the lead gets a fast head-start and a structured worklist of every record that needs a human pass per CONTENT_MIGRATION.md §11. P2 (not P1) because Phase 3 page building can proceed against hand-authored fixtures if the seed slips by a week — but the seed has to ship before Phase 5.5 launch readiness or there's no real content to review.

**Independent Test**: Point the script at the audit directory (`AUDIT_DIR=~/projects/seqtek-internal/audit npx tsx src/payload/seed/migrateFromAudit.ts`), confirm it completes without throwing, and verify every record listed in CONTENT_MIGRATION.md §2 exists in the database with the expected slug and `status: draft`. Re-run the script and confirm no duplicates are created.

**Acceptance Scenarios**:

1. **Given** the audit directory is present and `AUDIT_DIR` points at it, **When** the lead runs the seed script, **Then** the case studies, pages, post stubs, `homepage` global, and `siteSettings` global are populated per CONTENT_MIGRATION.md §3.
2. **Given** the seed has already run once, **When** the lead re-runs it, **Then** existing records are updated in place by slug — no duplicate rows are created in any collection.
3. **Given** the seed encounters a record with a slug that needs rewriting per the INTEGRATIONS.md §9 redirect map (e.g., `case-study-3` → `mobile-apps-remote-operations`), **When** the record is upserted, **Then** the destination slug is used, not the source slug.
4. **Given** a record cannot be fully populated (missing image, missing testimonial, content mismatch on the healthcare study), **When** the seed processes it, **Then** the record is still created with the available fields, the gap is recorded in `migration-errors.log`, and the document is flagged for editor follow-up in a way that is visible in the admin.
5. **Given** a `--dry-run` flag is passed, **When** the script runs, **Then** the planned upserts are printed to stdout and no writes occur.
6. **Given** the script is invoked with `--collection=caseStudies`, **When** it runs, **Then** only that collection is processed (used for iterative debugging per CONTENT_MIGRATION.md §8).

---

### User Story 5 — Admin manages users and roles without leaking permissions (Priority: P2)

The first SEQTEK admin signs in via Google SSO (spec 001) and is auto-provisioned as `admin` because no admin exists yet. They invite the content lead, who signs in next and is auto-provisioned as `editor`. The admin can promote/demote anyone, can delete content, can manage the user list. The editor can create, update, and publish content but cannot delete documents or manage users. Neither role can see drafts they should not see, and a public unauthenticated visitor sees only published content via the API and the public site.

**Why this priority**: Role-based access is a Phase 2 deliverable per ROADMAP §4 ("Admin panel functional with role-based access"). It must work before non-engineers get accounts, because the wrong default is "everyone is admin" and that's a one-way mistake. P2 because the only user pre-launch is Kenn; the real risk lands when the content lead and leadership get accounts.

**Independent Test**: Create two users via SSO sign-in (the second one in a fresh-table state so the first becomes `admin`, the second becomes `editor`). For each access matrix row in ARCHITECTURE.md §6 (View published, View drafts, Create, Update, Publish, Delete, Manage users, Access `/admin`), exercise the action as each role and confirm the outcome matches the table — including the unauthenticated public case.

**Acceptance Scenarios**:

1. **Given** the `users` table is empty, **When** the first user signs in via SSO, **Then** their role is auto-set to `admin` per spec 001.
2. **Given** an `admin` role exists, **When** a subsequent user signs in via SSO, **Then** their role is auto-set to `editor`.
3. **Given** an editor is signed in, **When** they attempt to delete a `caseStudy` or modify the `users` collection, **Then** the action is rejected by Payload's access control (no UI affordance and the API returns forbidden).
4. **Given** an unauthenticated request to the public API, **When** it queries any content collection, **Then** only documents with `status: 'published'` are returned — drafts are not leaked even via direct API access.
5. **Given** an admin demotes another admin to editor, **When** the demoted user's next request lands, **Then** their effective permissions are editor-only (subject to the JWT TTL bound documented in spec 001).
6. **Given** Payload's local email/password strategy was disabled on the `users` collection by spec 001, **When** anyone visits `/admin` without an existing SSO session, **Then** the only sign-in path offered is Google SSO — no password form is rendered.

---

### User Story 6 — Editor uploads media that is reachable through the CDN (Priority: P2)

An editor uploads a case study hero image through the admin's media browser. The file lands in the per-environment S3 bucket via the storage adapter (using the EC2 instance profile credentials in deployed environments and local filesystem fallback in development). The image is reachable from the public site through the CloudFront `/media/*` path, the editor provides the required `alt` text before the upload can be saved (validation enforced in schema), and the image is selectable from any media-relationship field on any collection. Re-uploading a file with the same content is deduplicated via hash where the seed script handles imports.

**Why this priority**: Phase 3 pages need images to render. Without working media uploads, content gets stuck in "image fields are all null." P2 because hand-uploading to S3 + pasting a URL is a workable workaround for the first week if needed — but it doesn't scale past the seed pass.

**Independent Test**: Upload a JPG via the admin, confirm `alt` is required, confirm the file appears in the per-environment S3 bucket, confirm the file resolves via the CloudFront `/media/*` path with the correct status code, and confirm the file is selectable from a `caseStudy.heroImage` field.

**Acceptance Scenarios**:

1. **Given** an editor opens the media upload UI, **When** they select a file without providing `alt` text, **Then** save is blocked with a clear validation message per ARCHITECTURE.md §2 `media` collection.
2. **Given** the application is running in a deployed environment, **When** an editor uploads a file, **Then** the file lands in the environment's S3 bucket at the key pattern `<media-id>/<filename>` per ARCHITECTURE.md §5, with no static AWS credentials anywhere in the request path.
3. **Given** an uploaded media object's URL, **When** a public user requests it via the CloudFront `/media/*` path, **Then** the object is served via the OAC-signed origin to the S3 bucket. The bucket itself remains non-public per ARCHITECTURE.md §5.
4. **Given** an editor is editing any document with a media-relationship field (e.g., `caseStudies.heroImage`), **When** they open the media picker, **Then** they can browse and select any uploaded asset and the document's reference is stored as the media doc's ID, not as a URL string.
5. **Given** the application is running in local development without S3 environment variables, **When** an editor uploads a file, **Then** the file is stored on the local filesystem and remains usable across `next dev` restarts per LOCAL_DEVELOPMENT.md.

---

### User Story 7 — Editor schedules content to publish at a future moment (Priority: P3)

An editor finishes a blog post on Friday but wants it to publish at 9:00 AM on Monday. They set `publishedAt` to the future date and save. The document stays `draft` until the cutover moment, then transitions to `published` and runs the same revalidation path as a manual publish. The invariant holds even if the cutover trigger misfires — a subsequent save of the draft never accidentally publishes before the target time.

**Why this priority**: Scheduled publishing is documented in ARCHITECTURE.md §6 as part of the editor workflow. Phase 2 owns the Payload-side enforcement (the `beforeChange` hook that forces `status: 'draft'` when `publishedAt` is in the future) — the scheduling trigger that flips drafts to published at the cutover moment is infrastructure that lands in a later phase (see Assumptions). P3 because no current launch-readiness item depends on it, but the invariant has to be in place before any editor sets a future `publishedAt`, otherwise the manual-save path silently publishes early.

**Independent Test**: Save a `posts` draft with `publishedAt` set 24 hours in the future and `status: 'published'`. Confirm the saved record has `status: 'draft'` (the hook forced it). Re-save the draft without changing `publishedAt`; confirm the status is still `draft`. Update `publishedAt` to a past moment and save; confirm it is now allowed to be `published`.

**Acceptance Scenarios**:

1. **Given** an editor saves any draftable document with `publishedAt` set in the future, **When** the save runs, **Then** Payload's `beforeChange` hook forces `status: 'draft'` regardless of what the editor submitted, per ARCHITECTURE.md §6.
2. **Given** a draft with a future `publishedAt`, **When** an editor saves the draft again without changing `publishedAt`, **Then** the document remains `draft` — no accidental publish from a re-save.
3. **Given** a draft with a past `publishedAt`, **When** an editor saves it with `status: 'published'`, **Then** the save is allowed and the standard on-change revalidation runs.

---

### Edge Cases

- The seed script's parser hits a case-study record whose section labels are missing or in a non-standard order — the script logs the parse failure to `migration-errors.log`, creates the record with whatever was parsed, and moves on; the lead handles the gap in the admin (per CONTENT_MIGRATION.md §11).
- An editor tries to publish a document whose required relationship target (e.g., `posts.author` → `teamMembers`) does not yet exist — Payload validation blocks the publish with a clear error pointing at the missing relationship.
- An admin attempts to delete a `caseStudy` that is referenced by another document's `relatedCaseStudies` or `featuredCaseStudy` — the system either prevents the delete or nulls the references per a documented policy; either way, the deletion does not leave dangling foreign-key references that break the public render.
- A block schema gains a new required field after some pages have already been authored — existing pages render correctly (the new field is null/empty on existing blocks) and editing forces the editor to fill the new field before re-save. No silent data corruption.
- Two editors edit the same document concurrently — the second-saver-wins behavior (Payload's default) is the documented policy; if a more sophisticated lock is needed it is explicitly deferred.
- An editor uploads a media file that exceeds the configured size cap — the upload is rejected before bytes hit S3, with a clear message naming the cap.
- An editor adds a `richText` or client-component field to a collection but the engineer forgets to regenerate `src/app/(payload)/admin/importMap.js` — the admin's behavior on next start is observable and the symptom is documented (per `project_payload_importmap_gotcha` memory). Phase 2 publishes a one-line "regenerate importMap" command in the developer docs.
- A document is rendered into the ISR cache, then its referenced media doc is replaced (same media ID, different file bytes) — the on-change hook also invalidates the page that references the media; if not, the runbook covers it.
- The seed script is interrupted mid-run (Ctrl-C, process killed) — re-running it picks up where it left off because every operation is an upsert by slug; no partial-state cleanup is required.

## Requirements _(mandatory)_

### Functional Requirements

**Collections and globals**

- **FR-001**: The system MUST define all document collections enumerated in ARCHITECTURE.md §2 — `users`, `pages`, `posts`, `caseStudies`, `services`, `servicePillars`, `teamMembers`, `testimonials`, `workshops`, `industries`, `locations`, `media`, `categories` — with fields, relationships, validation, and access control matching that document. Any divergence is intentional and recorded as a change to ARCHITECTURE.md in the same PR.
- **FR-002**: The system MUST define all globals enumerated in ARCHITECTURE.md §2 — `siteSettings`, `navigation`, `homepage` — with the same authoritative-doc rule above.
- **FR-003**: Every collection that supports authored content MUST have a `slug` field that is auto-generated from `title` on create, editable thereafter, and validated to be URL-safe.
- **FR-004**: Every public-facing collection MUST have a `status` select field with values `draft` and `published`. Drafts MUST never be returned by the public API or rendered on the public site to unauthenticated users.
- **FR-005**: `posts` and `caseStudies` MUST have versioning enabled with drafts. The other published collections (`pages`, `services`, `servicePillars`, `workshops`, `industries`, `locations`) get drafts enabled per ARCHITECTURE.md §2 where the architecture calls for it; the implementation MUST match the doc on which collections do and do not version.
- **FR-006**: Required-field validation MUST be enforced server-side, not only in the admin form — the API rejects save of a document missing required fields with a clear error.

**Block library**

- **FR-007**: The system MUST register every layout block enumerated in BLOCK_LIBRARY.md §5 (35+ blocks across hero, content, social-proof, CTA, content-collection, and specialty categories), with fields and required-marker semantics matching that document.
- **FR-008**: The system MUST register every inline rich-text block enumerated in BLOCK_LIBRARY.md §5.2 (`inline-cta`, `testimonial-embed`, `callout`, `image-with-caption`, `figure`, `quote-pullquote`, `disclosure`) as a `BlocksFeature` on the relevant rich-text fields.
- **FR-009**: The `pages.layout` field MUST accept every layout block in the library; other collections embed only the specific blocks the schema declares (per BLOCK_LIBRARY.md §1 — structured everywhere else, blocks only on `pages`).
- **FR-010**: A single dispatcher component (`RenderBlocks`) MUST resolve each `blockType` to its React component via a registry; unknown block types MUST be skipped with a development-mode warning, not a crash, per BLOCK_LIBRARY.md §8.
- **FR-011**: Block schemas with conditional required fields (e.g., `hero` requires `media` when `variant: with-image`) MUST enforce the conditional requirement server-side via admin-form `condition` or `validate` functions, not only via UI hints.
- **FR-012**: A block MUST be added to the library only when a documented page composition (BLOCK_LIBRARY.md §6) requires it. One-off page components do not enter the block library, per BLOCK_LIBRARY.md §9 rule 1.

**Rich text editor**

- **FR-013**: The Lexical editor MUST be configured per ARCHITECTURE.md §1 with link, list, heading, blockquote, and the inline blocks listed in FR-008. The exact feature set MUST be defined in a single shared `editorConfig` exported from a documented module so the seed script can use the same config (per CONTENT_MIGRATION.md §4).
- **FR-014**: Rich-text body styling on the public site MUST flow through a single `Prose` wrapper that uses `@tailwindcss/typography` with brand-aligned tokens (extends or overrides as needed to match DESIGN_SYSTEM.md), per BLOCK_LIBRARY.md §3 (`Prose` primitive).

**Access control**

- **FR-015**: Every collection MUST declare explicit access control functions for `create`, `read`, `update`, `delete`, and `admin` operations per the access matrix in ARCHITECTURE.md §6. Defaults are not relied upon.
- **FR-016**: Public read access MUST be filtered to `status: 'published'`. Editor/Admin reads include drafts. Unauthenticated requests for drafts return empty results, not 401s, so listing endpoints behave predictably.
- **FR-017**: The `users` collection MUST have Payload's local email/password strategy disabled per ARCHITECTURE.md §6 (already enforced by spec 001 and re-asserted here so the property does not regress).
- **FR-018**: The admin panel at `/admin` MUST be reachable only by users with the `admin` or `editor` role. Non-authenticated requests redirect to SSO sign-in (spec 001).

**Live preview**

- **FR-019**: Live preview MUST be wired for `posts`, `caseStudies`, `pages`, and `services` per ROADMAP §4 Phase 2 — invoking preview from inside the admin opens a render of the document at its slug using draft data.
- **FR-020**: The preview render MUST be visually distinguishable from the live site (banner, frame, or equivalent) so editors cannot mistake one for the other.
- **FR-021**: Preview URLs MUST require an authenticated admin/editor session — unauthenticated access redirects to SSO sign-in. Preview MUST not be a back-door to drafts.

**Media**

- **FR-022**: The `media` collection MUST use the S3 storage adapter in deployed environments, sourcing credentials from the EC2 instance profile (no static AWS credentials anywhere) per ARCHITECTURE.md §5. In local development, the adapter MUST fall back to filesystem storage when S3 env vars are absent.
- **FR-023**: The `media` collection MUST require an `alt` value on every upload, enforced in the field schema (`required: true` plus a `validate` for non-empty), per ARCHITECTURE.md §2.
- **FR-024**: Uploaded objects MUST land at the key pattern `<media-id>/<filename>` per ARCHITECTURE.md §5 so the on-change cache busting via new URLs continues to work.
- **FR-025**: Per-environment buckets MUST be used (`seqtek-media-prod`, `seqtek-media-staging`) per ARCHITECTURE.md §5; environment variables drive which bucket the running container uses.

**On-change revalidation**

- **FR-026**: A Payload `afterChange` hook MUST run for every published-state transition on `pages`, `posts`, `caseStudies`, `services`, `servicePillars`, `workshops`, `industries`, `locations`, `homepage`, `siteSettings`, and `navigation` and call Next.js `revalidateTag()` for the affected route(s), per ARCHITECTURE.md §3.
- **FR-027**: The same hook MUST issue a targeted CloudFront path invalidation (specific paths, not `/*`) for the affected document's route(s) plus any listing/index route(s) that show it. The invalidation count per save MUST stay well within the AWS free-tier monthly path budget for normal editorial throughput, per ARCHITECTURE.md §3.

**Scheduled publishing (Payload-side invariant only)**

- **FR-028**: A Payload `beforeChange` hook MUST enforce the invariant: if `publishedAt` is in the future on save, `status` is forced to `draft` regardless of what the editor submitted, per ARCHITECTURE.md §6. The cron trigger that flips drafts to published at the cutover moment is out of scope for Phase 2 (see Assumptions).

**Seed script**

- **FR-029**: The system MUST ship a seed script at `src/payload/seed/migrateFromAudit.ts` that ingests the audit JSON files into Payload per CONTENT_MIGRATION.md §1-§9. The script MUST be runnable via `npx tsx <path>` from the repo root.
- **FR-030**: The seed script MUST be idempotent — re-running it updates existing records by slug rather than creating duplicates (across `caseStudies`, `pages`, `posts`, and the `homepage`/`siteSettings` globals), per CONTENT_MIGRATION.md §8.
- **FR-031**: The seed script MUST honor the slug rewrite map from INTEGRATIONS.md §9 — Wix garbage slugs (e.g., `case-study-3`, `organizational-strategy-1-1-1-3`) are translated to their destination slugs, not preserved verbatim, per CONTENT_MIGRATION.md §6.
- **FR-032**: The seed script MUST create every imported record with `status: 'draft'` and log known content issues (missing testimonials, missing hero images, stat-number conflicts, the healthcare-UX content mismatch) to `migration-errors.log` per CONTENT_MIGRATION.md §11.
- **FR-033**: The seed script MUST support `--dry-run` (prints planned upserts without writing) and `--collection=<name>` (narrows to one collection) flags per CONTENT_MIGRATION.md §8.
- **FR-034**: The seed script MUST source the audit directory from `process.env.AUDIT_DIR` (default `~/projects/seqtek-internal/audit/`), keeping the audit files out of the public repo per CLAUDE.md ("Private SEQTEK assets … are kept outside this repo").
- **FR-035**: Media handling in the seed script MUST follow CONTENT_MIGRATION.md §5: image fields land null with a `MISSING_IMAGE` log entry by default; the per-record re-crawl path is an opt-in flag (its design lives in CONTENT_MIGRATION.md §5 but its execution is post-Phase-2 unless the lead requests it).

**Admin user creation flow**

- **FR-036**: First-sign-in via SSO MUST auto-provision a `users` row at role `editor`. If the `users` table is empty (no existing admins), the first signer MUST be auto-provisioned at role `admin` instead — per ARCHITECTURE.md §6 and consistent with spec 001's behavior.
- **FR-037**: There MUST be no separate "create the first admin" CLI or seed step beyond what FR-036 covers — the SSO path is the only on-ramp, removing one class of bootstrapping mistake.

**Developer ergonomics**

- **FR-038**: The TypeScript types generated by Payload (`payload-types.ts`) MUST be regenerated as part of the documented developer workflow whenever a collection or block schema changes. The README or LOCAL_DEVELOPMENT.md MUST state the regeneration command.
- **FR-039**: The Payload importMap regeneration step MUST be documented as a required follow-up to adding `richText`/client-component fields, per `project_payload_importmap_gotcha` memory — Phase 2 publishes the exact command in developer docs so future contributors do not hit the same gotcha.

### Key Entities

- **Collection**: One Payload document type (`pages`, `posts`, etc.). Each carries field definitions, validation, access control, hooks, versioning configuration, and (for some) live-preview configuration. The collection list is fixed by ARCHITECTURE.md §2.
- **Global**: A singleton document (`siteSettings`, `navigation`, `homepage`). Same shape as a collection's single record. Editor-edited in one place, read anywhere.
- **Block**: One unit of editor-composable content. Each block has a Payload `Block` config (in `src/payload/blocks/`), a React renderer (in `src/components/sections/`), and a registry entry in the dispatcher. The block list is fixed by BLOCK_LIBRARY.md §5.
- **Inline Block**: A subset of blocks usable inside `richText` fields via the Lexical `BlocksFeature`. Distinct render path inside the rich-text JSX converter, distinct register list, per BLOCK_LIBRARY.md §5.2.
- **Document**: One row in a collection — e.g., one specific `caseStudy`. Carries a slug, a status, and the collection's fields. The unit on which access control, versioning, and revalidation operate.
- **Role**: `admin` or `editor`. Stored on the `users` row, projected into the JWT, consulted by every collection's access functions per ARCHITECTURE.md §6.
- **Audit Record**: One entry in one of the `audit/*.json` files (e.g., one case-study key in `case-studies-content.json`). The seed script's input unit. Maps to one Payload document per CONTENT_MIGRATION.md §3.
- **Migration Error**: One line in `migration-errors.log` — a known content gap (missing image, missing testimonial, content mismatch) that the seed script captured for the editor's follow-up worklist.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A non-engineer with editor access can author and save a complete `pages` document using only the admin block menu and rich-text inserts — no engineer hand-holding, no direct database access — within 30 minutes of getting their account, on first attempt.
- **SC-002**: Every block enumerated in BLOCK_LIBRARY.md §5 (both layout and inline) is present in the admin, selectable from the appropriate UI, and renders to a corresponding React component on the public site. Coverage is 100% — no block in the library is "registered but not rendered" or "rendered but not registered."
- **SC-003**: For each of the four supported preview content types (`posts`, `caseStudies`, `pages`, `services`), an editor can open a preview from inside the admin and see the draft rendered with full styling within 10 seconds of clicking the preview action, with an unambiguous visual preview indicator.
- **SC-004**: The seed script runs end-to-end against the production audit dataset in under 5 minutes and produces zero duplicate records on re-run (verified by row counts being equal across two consecutive runs against a previously-seeded database).
- **SC-005**: For every role × operation cell in the ARCHITECTURE.md §6 access matrix, the implemented behavior matches the documented behavior — confirmed by an automated access-control test per role per collection. Drift in either direction (allowed when shouldn't be, blocked when shouldn't be) counts as a defect.
- **SC-006**: An unauthenticated request to the public REST or GraphQL API for any drafted document returns zero draft data — confirmed by an automated test per draftable collection that creates a draft and asserts it does not leak to the public list/detail endpoints.
- **SC-007**: Publishing a content change (`status` flip to `published`, or content update to an already-published document) is visible on the public site within 60 seconds end-to-end (Payload `afterChange` → `revalidateTag()` → CloudFront path invalidation completes → public request returns the new content), measured against a staging-environment editor flow.
- **SC-008**: After Phase 2, an engineer building a Phase 3 page can render any saved document by importing the generated type, querying by slug, and passing to the documented renderer — no per-page data-shaping glue, no `as any` casts, no defensive null-checks for schema-required fields.
- **SC-009**: The first SSO sign-in against an empty `users` table provisions an `admin`; the second sign-in provisions an `editor`. Verified by an automated test that boots a fresh database and runs both sign-ins end-to-end.
- **SC-010**: A media upload through the admin lands in the per-environment S3 bucket within 5 seconds and resolves through the CloudFront `/media/*` path within 30 seconds. The S3 bucket remains non-public throughout (Block Public Access on, OAC the only read path). Verified against the staging environment.
- **SC-011**: The seed script's `migration-errors.log` enumerates 100% of the known content gaps listed in CONTENT_MIGRATION.md §11 after a fresh seed run, with one log line per affected record. Editors can work the log as a punch list.
- **SC-012**: A documented developer who clones the repo and follows LOCAL_DEVELOPMENT.md can run the admin, sign in via SSO (or the dev shortcut documented for local), create a page composed of three blocks, save, preview, and publish — within 30 minutes of cloning, on a clean machine.

## Assumptions

- The Phase 1 scaffold (spec D-13) shipped a working Next 16.2.3 + React 19.2.4 + Payload 3.84 + Postgres setup with admin login, Lexical authoring, and public render verified. Phase 2 builds on that scaffold — it does not re-validate the stack choice.
- Spec 001 (Google SSO for `/admin`) is in production and is the only sign-in path. Phase 2 does not re-implement authentication; it relies on spec 001 for SSO and on the first-sign-in auto-provisioning behavior already in place. The user-creation flow specified in FR-036 is what spec 001 already does; Phase 2 re-asserts the property so it does not regress.
- Spec 002 (AWS CDK infrastructure) shipped staging on `seqtek-preview.com` with per-environment S3 buckets, parameter-store secrets, OAC-fronted CloudFront, and the on-change revalidation hook surface ready. Phase 2 wires the application code that uses those resources but does not re-architect the infrastructure.
- ARCHITECTURE.md §2 (collection and global schemas), BLOCK_LIBRARY.md §5 (block catalog) and §6 (page composition matrix), CONTENT_MIGRATION.md (seed script spec), and ARCHITECTURE.md §6 (access matrix) are the authoritative source of truth for what to build. Any divergence in Phase 2 implementation gets documented as a change to those docs in the same PR. This spec defers to those docs rather than re-listing every field.
- The scheduled-publishing infrastructure (EventBridge rule → API route trigger at `/api/cron/publish-scheduled`, per ARCHITECTURE.md §6) is out of scope for Phase 2. Phase 2 ships the Payload-side `beforeChange` invariant that prevents accidental early publishing (FR-028); the cron trigger that performs the cutover at the scheduled moment lands in a later phase (sized as a small spec when an editor first needs it).
- The on-change revalidation infrastructure surface (the `/api/revalidate` route handler and the CloudFront invalidation call from inside the EC2 process) is the responsibility of Phase 2 because it is application code that lives next to the Payload hooks. The IAM permission that allows the EC2 instance to issue CloudFront invalidations is part of spec 002's deliverables; if any permission gap is discovered during Phase 2 implementation, it's a spec 002 follow-up, not a Phase 2 spec change.
- The image re-crawl path documented in CONTENT_MIGRATION.md §5 (download images from Wix CDN, upload to media, set the field) is an opt-in seed-script flag in Phase 2 — not the default. Default behavior is "image fields land null with a `MISSING_IMAGE` log entry." The lead opts in if they want to pre-populate; otherwise images get uploaded by hand during the editorial review pass.
- Phase 2 does **not** ship content editorial work — no real testimonials, no team bios, no service descriptions, no leadership headshots. Those are CONTENT_MIGRATION.md §12 ("What is NOT migrated automatically") items tracked in ROADMAP §1 as C-1 through C-7 and depend on humans (the content lead, leadership). Phase 2 ships the structure that holds them.
- Phase 2 does **not** ship Phase 3 page templates (homepage, about, services, case studies, etc.) — those are explicitly Phase 3 per ROADMAP §4. Phase 2's render-side deliverable is the `RenderBlocks` dispatcher and the inline-block JSX converters, not the Phase 3 page-by-page composition.
- "Concurrent edit policy is last-write-wins (Payload default)" is the documented policy. A more sophisticated lock or merge is out of scope; an editor surprised by an overwrite uses Payload's version history to recover.
- The `Pages.layout` field is the only blocks field in Phase 2 (per BLOCK_LIBRARY.md §1 and open question B-1). All other collections use structured fields. If a future need arises to make `services.description` (or any other field) a blocks field, that's a follow-up spec — Phase 2 does not pre-empt it.
- The Payload importMap regeneration gotcha (`project_payload_importmap_gotcha` memory) is real and recurs whenever a `richText` or client-component field is added to a collection or block. Phase 2's mitigation is documentation in LOCAL_DEVELOPMENT.md and a one-line command (`npx payload generate:importmap` or equivalent — exact command finalized in planning). Phase 2 does not attempt to automate this away.
- Per the project constitution: spec-before-code holds — this spec is the gate for Phase 2 PRs. Phase 2 work that drifts from this spec lands a spec amendment in the same PR.
- The seed script's `migration-errors.log` is a local file at the repo root (gitignored) — it is not committed and not surfaced through the admin UI. It is the lead's worklist while reviewing imported drafts; it does not need a CMS-side surface until/unless that becomes a workflow friction point.
