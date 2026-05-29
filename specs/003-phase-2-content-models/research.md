# Phase 0 — Research: Phase 2 Content Models

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

Resolves every NEEDS CLARIFICATION surfaced by the spec, the template's Technical Context, and the open questions called out in `docs/BLOCK_LIBRARY.md` §10 and `docs/CONTENT_MIGRATION.md` §11. All decisions cite the canonical doc by section number; alternatives are recorded so a future spec doesn't re-litigate.

---

## R-01 — Live preview wiring for `posts` / `caseStudies` / `pages` / `services`

**Decision**: Use Payload v3 first-party `admin.livePreview = { url, breakpoints }` per collection. The `url` builder lives in `src/payload/livePreview/url.ts` and returns `${PUBLIC_URL}/preview/{collection}/{slug}?secret=${PREVIEW_SECRET}` (single shared `PREVIEW_SECRET` env var, validated server-side in a Next route handler at `src/app/(frontend)/preview/[collection]/[slug]/route.ts` that sets the Next.js `draftMode` cookie, then redirects to the public route, which then reads `draft: true` against Payload for authenticated requests). Per-collection breakpoints default to `[{ name: 'mobile', width: 375 }, { name: 'tablet', width: 768 }, { name: 'desktop', width: 1280 }]`.

**Rationale**: `node_modules/payload/dist/config/types.d.ts` `LivePreviewConfig` + per-collection `admin.livePreview` is the documented path; Payload pushes draft data into the iframe via `postMessage` — no custom plumbing needed. The shared route handler that sets `draftMode` is required by Next.js 15+'s draft-mode contract. FR-021 ("preview MUST require authenticated session") is enforced by the same admin/editor cookie check that gates `/admin`, plus the shared secret as defence in depth.

**Alternatives considered**:

- Per-collection bespoke preview pages — rejected: 4× duplicated code, no upside over the shared route.
- Skip the `draftMode` cookie and have the public route always query `draft: true` when authenticated — rejected: would couple every public page render to the user session check; the cookie keeps the public render path stateless.

---

## R-02 — Which collections enable versioning + drafts

**Decision**: Enable `versions: { drafts: true, maxPerDoc: 50 }` on **every public-facing content collection that ARCHITECTURE.md §2 lists with a `status` field** — i.e., `pages`, `posts`, `caseStudies`, `services`, `servicePillars`, `workshops`, `industries`, `locations`, and the globals `homepage`/`siteSettings`/`navigation` (Payload supports drafts on globals via `versions: { drafts: true }`). `users`, `teamMembers`, `testimonials`, `media`, and `categories` do **not** get drafts — they are reference/relational data without a public-render lifecycle that needs preview-before-publish (`categories` is explicitly "public read, no draft status" per ARCHITECTURE.md §2; `testimonials` uses `isActive` as its visibility gate; `teamMembers` are referenced by other documents whose drafts cover the lifecycle).

**Rationale**: FR-005 says "the implementation MUST match the doc on which collections do and do not version" — ARCHITECTURE.md §2 is the source of truth. `maxPerDoc: 50` caps storage growth at ≈ 50 × ~30KB ≈ 1.5MB per heavily-edited document; acceptable. `validate: false` (the default) is intentional so editors can save half-finished drafts.

**Alternatives considered**:

- Drafts on `testimonials` too — rejected: the `isActive` checkbox already provides "hide from public" and editors don't preview a testimonial in isolation.
- `maxPerDoc: 100` per Payload sample defaults — rejected: 50 is plenty for editorial throughput at our scale and halves the storage tail.

---

## R-03 — On-change revalidation surface

**Decision**: Implement one shared `afterChange` hook factory at `src/payload/hooks/revalidateOnChange.ts` that:

1. Guards on `doc._status === 'published'` so draft saves don't burn invalidations.
2. Computes the affected tag(s) from a collection→tag mapping (per-collection tag + the listing tag, e.g. `caseStudies_${id}` and `caseStudies_list`).
3. Calls `revalidateTag()` for each tag (in-process — `import { revalidateTag } from 'next/cache'`).
4. Computes the affected CloudFront path(s) from a collection→paths mapping (mirrors the route table in ARCHITECTURE.md §3) — typically 2–3 paths per save (detail + listing + sitemap).
5. Issues a single `CreateInvalidation` via `src/lib/cloudfront/invalidate.ts` (a thin wrapper around `@aws-sdk/client-cloudfront` using the default credential chain → EC2 instance profile in prod).
6. Wraps every call in try/catch + structured log; the hook never throws (per Payload contract, hook errors don't roll the mutation back, so a thrown error would leave the editor confused with the save already persisted).

Hook is registered on `pages`, `posts`, `caseStudies`, `services`, `servicePillars`, `workshops`, `industries`, `locations`, and via `globals[*].hooks.afterChange` on `homepage`, `siteSettings`, `navigation` (globals affect every page that consumes them — invalidation is broader, e.g., `/` plus the sitemap; documented in the mapping).

**Rationale**: ARCHITECTURE.md §3 explicitly mandates in-process `revalidateTag()` + targeted (not `/*`) CloudFront invalidation. The free-tier budget (1,000 paths/month) tolerates ~30 saves/day × 3 paths = 90/day = 2,700/month — over budget at sustained max throughput, but actual editorial throughput is 5–10 saves/day = well inside the budget. The hook factory keeps every collection's wiring uniform.

**Alternatives considered**:

- Per-collection bespoke hooks — rejected: 11 copies of the same code; tag/path mapping centralises better as data.
- Skip the published-only guard and invalidate on every save — rejected: draft saves are frequent during authoring; would blow the budget.
- Use `/*` CloudFront invalidations — rejected: ARCHITECTURE.md §3 explicitly forbids it for routine saves.

---

## R-04 — Public render path's draft handling

**Decision**: Public route handlers (Phase 3 will compose these, but Phase 2 ships the access primitives) call Payload's local API with `draft: false` (the default) for unauthenticated requests. The collection's `access.read` returns `{ _status: { equals: 'published' } }` for the public case, so a draft never escapes via the API even if someone forgets the `draft` flag. The `/preview/[collection]/[slug]` route handler enables Next's `draftMode` cookie, after which Phase 3 public pages can opt into `draft: true` for those authenticated requests.

**Rationale**: Defense in depth — both the access function and the call site agree on "no drafts to the public." This satisfies SC-006 (automated test per draftable collection that a created draft does not leak via REST/GraphQL). Using `Where` clauses returned from access functions is the documented Payload pattern (`AccessResult = boolean | Where` in `node_modules/payload/dist/config/types.d.ts`).

**Alternatives considered**:

- Rely only on call-site `draft: false` — rejected: one forgotten flag leaks every draft. Access-function filter is the load-bearing protection.

---

## R-05 — Slug generation strategy

**Decision**: Implement a `beforeChange` hook `slugFromTitle.ts` that runs only on `operation === 'create'` and only when `data.slug` is not provided. It uses a small inline helper (≈ 15 LOC: lowercase, ASCII-fold via `String.prototype.normalize('NFKD')`, strip non-`[a-z0-9-]`, collapse `-`). No new dependency. URL-safety validation is enforced by a field-level `validate` on every collection's `slug` field that runs on both create and update (so manual edits also stay URL-safe).

**Rationale**: A 15-line helper avoids adding `slugify` (~2KB, MIT, healthy maintenance but still a transitive surface). `String.prototype.normalize` handles the SEQTEK-realistic cases (English plus the occasional curly-quote / accented char in audit prose). Auto-generate-on-create-only matches FR-003 ("auto-generated from title on create, editable thereafter").

**Alternatives considered**:

- `slugify@^1` — rejected: trivial inline replacement; one fewer dep on the prod tree.
- Auto-regenerate on every save — rejected: would surprise editors who rename a published doc (would break public URLs and inbound links).

---

## R-06 — Conditional required fields (e.g., `hero.media` when `variant === 'with-image'`)

**Decision**: For every block whose required fields depend on a variant select (the `hero` family, `case-study-hero`, `stats-bar`, `logo-bar`, `case-study-grid`, `service-cards`, `cta-section`, `service-pillar-hero`), use Payload's per-field `admin.condition` (drives UI visibility) **plus** a per-field `validate` function (server-side enforcement, satisfies FR-011's "not only UI"). The pattern is encapsulated in a small helper `requiredWhen(predicate)` that returns `{ admin: { condition }, validate }` — keeps each block file readable.

**Rationale**: FR-011 explicitly requires server-side enforcement (not "UI only"). Payload's `condition` on its own only hides the field; the `validate` function on its own loses the admin UX cue. Both together match the editor experience documented in BLOCK_LIBRARY.md §5.1 onwards and pass the automated server-side validation test.

**Alternatives considered**:

- Use the `condition` only — rejected: a malicious or buggy API client could POST a `with-image` hero with no `media` and Payload would accept it.
- Custom collection-level `beforeValidate` hook checking every block — rejected: scales poorly to 35+ blocks; field-local `validate` keeps validation next to the schema.

---

## R-07 — S3 storage adapter wiring

**Decision**: Install `@payloadcms/storage-s3@^3.85` and register it as a plugin in `payload.config.ts` via `s3Storage({ collections: { media: true }, bucket: process.env.S3_BUCKET, config: { region: process.env.S3_REGION } })`. AWS credentials come from the default credential chain (`@aws-sdk/credential-providers` discovers the EC2 instance profile via IMDSv2 automatically). In local dev, `S3_BUCKET` is absent → the plugin is conditionally registered: `plugins: process.env.S3_BUCKET ? [s3Storage({...})] : []`, so absent S3 env vars cleanly fall back to Payload's local-filesystem upload (FR-022 second sentence). Object key pattern `<media-id>/<filename>` is the Payload default behaviour of the adapter (no override needed) — matches ARCHITECTURE.md §5 + FR-024.

**Rationale**: First-party Payload package (trust review: ✅, same org as `payload`); the conditional-plugin pattern is the documented way to keep local dev frictionless. Instance-profile credentials require zero code per Constitution IV ("Static AWS credential variables … are not used anywhere in this codebase").

**Alternatives considered**:

- Roll a custom S3 adapter via `@aws-sdk/client-s3` — rejected: violates "prefer first-party over custom" judgement; Payload's S3 adapter handles MIME, ACL, key collision, public/private URLs out of the box.
- Always register the plugin and pass `disableLocalStorage: false` for local fallback — rejected: would write to S3 in local dev if env vars are set in `.env.local` by accident; the conditional registration is louder/safer.

---

## R-08 — `importMap` regeneration workflow

**Decision**: Treat `npm run generate:importmap` as a **required** follow-up after any of: adding a `richText` field to a new collection, adding a new block to `BlocksFeature`, adding a new client-side admin component, or adding a new collection that introduces either. Document in `docs/LOCAL_DEVELOPMENT.md` under a new "Payload importMap" subsection, link from `docs/PAYLOAD_DEVELOPMENT.md`, and add a brief inline comment at the top of `src/payload/blocks/inline/index.ts` reminding contributors. No automation (e.g., file watcher) — automation is fragile and history per `project_payload_importmap_gotcha` shows the issue is human-noticeable on next dev-start.

**Rationale**: FR-039 mandates documentation, not automation. The script already exists at `package.json:14` (`generate:importmap`). One-line command + clear doc + inline reminder addresses the recurring gotcha without inventing new tooling.

**Alternatives considered**:

- Husky pre-commit hook that runs `generate:importmap` automatically — rejected: regenerates files that need to be reviewed (the user owns the diff); also adds 3–5s to every commit.
- A `postinstall` script — rejected: runs at the wrong time (deps installing, not blocks changing).

---

## R-09 — Seed script idempotency + upsert strategy

**Decision**: Every collection upsert in `src/payload/seed/migrateFromAudit.ts` goes through a single `upsertBySlug(collection, doc)` helper that:

1. Calls `payload.find({ collection, where: { slug: { equals: doc.slug } }, limit: 1, depth: 0 })`.
2. If found → `payload.update({ collection, id: found.id, data: doc })`.
3. If not → `payload.create({ collection, data: doc })`.
4. All operations use the Payload Local API (not raw SQL) so access control, hooks, and validation fire as they would in the admin — matching CONTENT_MIGRATION.md §8.

Media dedup is by SHA-256 of file bytes — an in-memory `Map<hash, mediaId>` populated lazily over the run; first occurrence creates the media doc, subsequent occurrences return the cached ID. The hash table is not persisted across runs (acceptable — re-running pays the rehash cost, but no S3 duplicates because every upload still goes through the same find-by-hash before create).

**Rationale**: Matches CONTENT_MIGRATION.md §8 ("re-running the script updates existing records by slug rather than creating duplicates") and FR-030 ("idempotent — re-running … updates existing records by slug rather than creating duplicates"). Local API path is the only safe one — bypassing it would skip the `beforeChange` slug auto-gen and the access function entirely.

**Alternatives considered**:

- Raw SQL `INSERT … ON CONFLICT (slug) DO UPDATE` — rejected: bypasses Payload hooks (the slug normaliser, the published-state revalidation, etc.) and the type-safety we get for free from the Local API.
- Persistent hash table for media dedup — rejected: complexity not worth the marginal time savings on re-runs; the bottleneck is HTTP, not hashing.

---

## R-10 — Image re-crawl: opt-in flag design

**Decision**: Default behaviour: image fields land null with a `MISSING_IMAGE: <record> <field>` line in `migration-errors.log` (FR-035). Opt-in: `--recrawl-images` flag on `migrateFromAudit.ts`. When set, for each known image source in the audit (case-study hero URLs harvested via a separate Playwright pass — _not_ implemented in Phase 2 unless the lead requests it), the script downloads → hashes for dedup → `payload.create({ collection: 'media', file: { data, name, mimetype, size, alt: '' } })`. `alt` is empty by default and the record is flagged in `migration-errors.log` as `MISSING_ALT: <media-id>` so the editor backfills before the document can be published (the `media` collection's `alt` validator blocks publish on use).

**Rationale**: CONTENT_MIGRATION.md §5 explicitly says the re-crawl path is opt-in and ships its design even if execution defers to post-Phase-2. Phase 2 ships the flag and the wiring; the lead can enable when ready. Filename-derived `alt` was considered and rejected — it produces low-quality alt text that gets shipped accidentally; explicit "MISSING_ALT" surfacing is better.

**Alternatives considered**:

- Default-on re-crawl — rejected: requires network access and the audit directory's image URL list, neither of which Phase 2 owns. Easier to ship as opt-in and let the lead trigger it.
- Auto-`alt` from filename — rejected per above.

---

## R-11 — Scheduled-publish invariant (`beforeChange`)

**Decision**: A small `beforeChange` hook `enforceDraftWhenScheduled.ts` on every collection that has a `publishedAt` field (`posts`, `caseStudies`, optionally `pages`/`services`/`workshops` — schema decides). Body:

```typescript
if (data.publishedAt && new Date(data.publishedAt) > new Date()) {
  data._status = 'draft'
}
```

Runs before validation (Payload's order), so forcing `_status: 'draft'` doesn't trip a required-field check. Phase 2 explicitly does **not** ship the cron trigger that flips drafts at the cutover moment (out of scope per spec Assumption — lands later).

**Rationale**: FR-028 + ARCHITECTURE.md §6. The hook is 3 lines; the test asserts the invariant directly. The cron trigger is a separate concern (EventBridge → `/api/cron/publish-scheduled`) and would need its own spec when an editor first sets a future `publishedAt`.

**Alternatives considered**: None — invariant is unambiguous and the implementation is mechanical.

---

## R-12 — Role-based access: shared helpers vs per-collection

**Decision**: Define three reusable access helpers in `src/payload/access/byRole.ts`:

- `isAdmin = ({ req }) => Boolean(req.user?.roles?.includes('admin'))`
- `isAdminOrEditor = ({ req }) => Boolean(req.user?.roles?.length)`
- `publishedOrAuthed = ({ req }) => isAdminOrEditor({ req }) || { _status: { equals: 'published' } }`

Each collection's `access` object composes these (e.g., `read: publishedOrAuthed, create: isAdminOrEditor, update: isAdminOrEditor, delete: isAdmin, admin: isAdminOrEditor`). Per-collection overrides (e.g., `categories` allows public reads with no draft filter because it has no drafts) are explicit.

**Rationale**: FR-015 mandates explicit per-collection access; reusable helpers satisfy that without 11 hand-copied identical blocks. Matches the access matrix in ARCHITECTURE.md §6. The `Where`-clause return from `publishedOrAuthed` is the documented pattern for "show different rows to different users without two queries."

**Alternatives considered**:

- Default access via a config wrapper that applies the same access object to every collection — rejected: violates FR-015 "Defaults are not relied upon" — explicit per-collection access is auditable.
- Inline access functions per collection — rejected: 11 copies of `Boolean(req.user?.roles?.includes('admin'))` is harder to keep in sync.

---

## R-13 — `BLOCK_LIBRARY.md` open questions B-1 through B-5

| ID  | Question                                                                        | Phase 2 decision                                                                                                                                                                                                                                                                                                               |
| --- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| B-1 | `pages.layout` only, or also `services.description`?                            | **`pages.layout` only.** Confirmed in spec Assumption ("Pages.layout field is the only blocks field in Phase 2"). All other collections use structured fields per BLOCK_LIBRARY.md §1.                                                                                                                                         |
| B-2 | `featured-case-study` / `featured-testimonials`: globals-only or also on Pages? | **Available on both.** They're registered in the layout block library so Pages can use them; the homepage global wires them via the structured-fields path (its own relationship fields, not a blocks layout). Cost is one block config either way — letting Pages compose them costs nothing and unblocks the editorial team. |
| B-3 | `mission-vision-values` source: `siteSettings` or inline per page?              | **Inline per page** in Phase 2 — keeps the schema simple and avoids cross-cutting siteSettings churn. If the team wants single-source later, that's a small follow-up spec (add a `source: 'inline' \| 'from-site-settings'` select with conditional fields, mirroring `stats-bar`).                                           |
| B-4 | `comparison-table`: generic or hardcoded to localshoring?                       | **Generic** — `min 2 / max 4` columns + arbitrary rows per BLOCK_LIBRARY.md §5.2. Hardcoding to localshoring would make a one-off and violate BLOCK_LIBRARY.md §9 rule 1.                                                                                                                                                      |
| B-5 | Inline-blocks editor UX: slash command vs button bar?                           | **Both.** `BlocksFeature` exposes them via Lexical's standard insertion menus (button bar at selection + slash command in the editor) automatically — no extra wiring. Editor lead can give feedback after the first author sessions and we adjust if needed (Lexical config is one file).                                     |

---

## R-14 — `CONTENT_MIGRATION.md` §11 stat-numbers conflict

**Decision**: The seed script imports both stat sets verbatim (homepage's 20+/411+/8221+ and About's 25+/500+/10,000+) and writes a single `STATS_CONFLICT` line to `migration-errors.log`. No pre-resolution. ROADMAP `BR-5` resolution (years already confirmed as 25+) is captured in the log message so the editor can update with leadership once projects/lives counts are confirmed.

**Rationale**: Matches CONTENT_MIGRATION.md §11 ("Do not pre-resolve"). Phase 2 owns the import; the conflict resolution is a leadership-driven content decision tracked in the ROADMAP, not a code change.

---

## R-15 — Editor `editorConfig` location + reuse

**Decision**: A single exported `editorConfig` (`lexicalEditor({ features: [...] })`) lives in `src/payload/editor/editorConfig.ts`. Imported by `payload.config.ts` for the admin and by `src/payload/seed/htmlToLexical.ts` for seed-time Lexical-AST construction, so both produce structurally identical JSON. The shared feature list includes link, list, heading (h2/h3/h4), blockquote, plus `BlocksFeature({ inlineBlocks: [...] })` for the 7 inline blocks. Per-`richText`-field narrowing (e.g., `caseStudies.problem` may omit some inline blocks) overrides at the field level — `editor: lexicalEditor({ features: [...] })` on the field.

**Rationale**: FR-013 explicitly requires a shared `editorConfig` module so seed and admin agree. Co-locating with the `payload/editor/` subtree keeps editor concerns together. Per-field overrides match the existing Payload contract.

**Alternatives considered**:

- Define the editor config inline in `payload.config.ts` — rejected: seed script needs to import it; cross-importing the whole Payload config is heavy.

---

## R-16 — `migration-errors.log` location + format

**Decision**: Single newline-delimited text file at the repo root, gitignored: `migration-errors.log`. Each line: `${timestamp} ${level} ${kind} ${collection}/${slug} ${detail}` (e.g. `2026-05-29T14:00:00Z WARN MISSING_IMAGE caseStudies/healthcare-ux-redesign hero`). Phase 2 ships this as a plain log — surfacing in the admin UI is explicitly out of scope per spec Assumption.

**Rationale**: Spec assumption is explicit ("local file at the repo root (gitignored) — not committed and not surfaced through the admin UI"). The flat format is greppable, sortable, and trivial to convert to a punch list later if needed.

---

## R-17 — Tests: integration vs E2E split for the access matrix

**Decision**: SC-005 (every role × op × collection matches the matrix) is implemented as a single Vitest integration test (`tests/int/collections/access.test.ts`) that iterates a data-driven matrix: for each of 13 collections × 3 roles (public/editor/admin) × 5 ops (read-published, read-draft, create, update, delete), it asserts the expected result against the Payload Local API. ~195 cases run in well under a minute against `testcontainers/postgresql`. The Playwright suite covers the UI affordance (e.g., editor doesn't see a delete button on case studies) only for one collection as a smoke test — the API-level matrix is the load-bearing assertion.

**Rationale**: Constitution II — "test what matters … access control functions" — and the access matrix is mechanical/data-driven. Integration tests give us per-case granularity that Playwright can't match without exploding test time.

---

## R-18 — `@aws-sdk/client-cloudfront` vs reusing an existing SDK

**Decision**: Install `@aws-sdk/client-cloudfront` directly (not via a wrapper). Already present transitively under `@payloadcms/storage-s3` is the S3 client — CloudFront is a separate modular client. The CloudFront client is instantiated lazily inside `src/lib/cloudfront/invalidate.ts` (one module-level instance, cached) so we don't pay the cold-start cost on every save.

**Rationale**: AWS SDK v3 ships modular clients; pulling in only `client-cloudfront` keeps the bundle lean. First-party AWS; no trust-review concern.

**Alternatives considered**:

- Shell out to `aws cloudfront create-invalidation` — rejected: requires AWS CLI on the EC2 image, brittle.

---

## R-19 — Layout block files: monolithic vs one-per-file

**Decision**: One file per block under `src/payload/blocks/layout/` and `src/payload/blocks/inline/`, with an `index.ts` re-export for `payload.config.ts` and the `RenderBlocks` registry. The renderer for each block lives in `src/components/sections/<BlockName>.tsx` with a single registry at `src/components/sections/registry.ts`. Naming convention: PascalCase filename, kebab-case `blockType` slug (e.g., `CaseStudyHero.ts` with `slug: 'case-study-hero'`).

**Rationale**: BLOCK_LIBRARY.md §9 rule 6: "One file per block config. Easier diffs, easier discovery." Splitting the schema (under `src/payload/blocks/`) from the renderer (under `src/components/sections/`) keeps server-only config out of client bundles.

---

## R-20 — Open NEEDS CLARIFICATION items intentionally deferred

None. Every NEEDS CLARIFICATION the spec template surfaces (Technical Context unknowns) is resolved above. The two BLOCK_LIBRARY questions the deeper research surfaced (per ARCHITECTURE.md §1 wording on Lexical inline blocks, and the `/api/revalidate` shape) are answered in R-15 and (separately) in `contracts/revalidate-route.md`.
