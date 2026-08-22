# Phase 0 Research: Payload admin UX for content self-serve

**Feature**: `specs/011-payload-admin-ux` | **Date**: 2026-08-21

All investigation was run against the live config and the local mirror database
(`seqtek_dev` on :5433, 57 pages / 78 media / 10 case studies), plus the installed
Payload 3.85.0 type definitions and source. Staging was torn down 2026-08-14, so the
local mirror is the reference environment.

---

## R1 — Is deleting `Pages.hero` safe?

**Decision**: Yes. Delete the field group and drop the five columns in one migration.

**Rationale**: Two independent checks agree.

- **Consumers**: `src/app/(frontend)/[slug]/page.tsx` renders `page.layout` only. A repo-wide
  search for readers of `page.hero` returns nothing outside generated types.
- **Stored data**: all five columns are empty across all 57 rows.

```sql
select count(*) from pages where hero_headline is not null or hero_subheadline is not null
  or hero_background_image_id is not null or hero_cta_label is not null or hero_cta_url is not null;
-- 0
```

**Alternatives considered**: hiding the group instead of deleting it. Rejected — hidden
columns are exactly the state this spec is trying to clear (see R2), and there is no data
to preserve.

---

## R2 — Which "legacy" columns are actually safe to drop?

**Decision**: Drop all retained legacy body fields **except `teamMembers.expertise`**, which
has a live consumer and must be re-homed first.

**Rationale**: The ADR 0009 expand/contract left these fields hidden and read-only as a
one-release rollback net. Two things turned out to be true that the "just drop them" framing
missed:

1. **They still hold data.** The rollback net was never emptied:

   | Column                                           | Rows populated |
   | ------------------------------------------------ | -------------- |
   | `case_studies.problem` / `.solution` / `.impact` | 7 each         |
   | `services.description` / `.approach`             | 9 each         |
   | `workshops.description` / `.audience`            | 3 each         |
   | `workshops.format`                               | 1              |
   | `team_members.bio`                               | 3              |
   | `team_members.quote`                             | 1              |

   Every case study holding legacy prose also has 3 composed content blocks, consistent with
   spec 010's composers having run. That makes the drop _probably_ safe, but "has 3 blocks"
   is not "the blocks contain the same prose". The migration must be gated on an equivalence
   check, not a row count.

2. **`teamMembers.expertise` is not legacy.** `src/lib/structured-data.ts:90` reads it and
   emits it as `knowsAbout` in the Person JSON-LD:

   ```ts
   const expertise = (member.expertise ?? [])
   ...(expertise.length ? { knowsAbout: expertise } : {}),
   ```

   The `CLAUDE.md`-adjacent comment in `TeamMembers.ts` flags this ("`expertise` is still read
   by personLd for knowsAbout until the drop") but the field is nonetheless marked
   `hidden: true, readOnly: true` — so an editor cannot maintain the structured-data keywords
   for a team member today. Dropping it would silently degrade AICO/E-E-A-T output, which
   `docs/CONTENT-REQUIREMENTS.md` §8 treats as load-bearing.

   A repo-wide consumer sweep of the other candidates (`problem`, `solution`, `impact`, `bio`,
   `certifications`, `education`, `personalFacts`, `deliverables`, `faq`, `metrics`,
   `technologies`) returns zero render-path readers. The single `.quote` hit is
   `Testimonials.quote` in `FeaturedTestimonials.tsx`, a live field on a different collection,
   not `teamMembers.quote`.

**Consequence for the plan**: `expertise` becomes a **visible, editable** field on Team
Members (grouped with the other SEO/metadata inputs and labelled for what it does), not a
dropped one. This is a small scope addition the spec's FR-001 demands anyway — a field that
affects public output must be editable.

**Alternatives considered**: dropping `expertise` and hard-coding `knowsAbout`. Rejected —
it is per-person content, which is the definition of something that belongs in the CMS.

---

## R3 — How do 45 block previews get produced and served?

**Decision**: Derive 3:2 thumbnails from the existing showcase captures with a committed
tool (`tools/block-thumbnails`), and commit the optimised output under
`public/admin/blocks/<blockType>.webp`.

**Rationale**:

- **Serving is unblocked.** `src/lib/csp.ts:80` sets `img-src` to `'self' data:` plus the
  media host, and `src/proxy.ts:122`'s matcher excludes static image extensions outright, so
  same-origin files under `public/` load in the admin with no CSP work at all.
- **The source already exists.** `tests/e2e/visual/showcase.e2e.spec.ts` renders every block
  in isolation at `/showcase-block-<blockType>` and captures a full-page PNG per viewport.
  The desktop capture is the natural input; only crop-and-resize is missing.
- **It stays truthful.** A derived thumbnail cannot drift from what the block renders,
  because it _is_ what the block renders. Hand-authored artwork drifts silently.
- **At picker card size (~240×160) a screenshot reads as layout shape** — image-left vs
  image-right, single column vs grid, banner vs card row — which is precisely the axis that
  distinguishes the four hero blocks. Illegible placeholder body text is not a problem here;
  the block _name and description_ carry the semantics.

**Committed-binary tradeoff, stated explicitly**: this puts ~45 raster files in git, against
the repo's general "don't commit screenshot artifacts" habit. The distinction is that these
are product assets shipped to the admin UI in every environment, not test output — staging
and production have no showcase fixtures, so they cannot be generated at deploy time. The
plan carries a **size budget of 400 KB total** (≈9 KB per thumbnail at 480×320 webp q70) and
regeneration is an explicit, reviewable command rather than a build side effect.

**Alternatives considered**:

- _Hand-authored SVG schematics._ ~1-2 KB each, diffable, theme-able, and arguably clearer
  about structure. Rejected as the default because 45 hand-drawn assets is real authoring
  work that then needs its own drift guard against the blocks it depicts. Worth revisiting
  for the handful of blocks that photograph badly (see below).
- _Generate at build time._ Rejected — requires the showcase content seeded in every
  environment that builds, which production deliberately does not have.
- _`data:` URIs inline in the block configs._ Rejected — inflates the server bundle and the
  config diffs become unreadable.

**Known weak cases**: blocks that are invisible or near-empty in isolation (`hubspot-form`,
`hubspot-meetings`, `embed`, `map`, `related-posts`, `post-list` with no posts). These get a
hand-authored SVG fallback rather than a screenshot of an empty region. The FR-013 check
asserts a preview exists, not how it was produced.

---

## R4 — How should Services and Service Pillars be "parked"?

**Decision**: Keep both collections visible and editable, but strip the page-composition
body (`layout`) and the live-preview wiring, and move them into a "Reference data" admin
group with a description that says what they are for.

**Rationale**: The three options are not equivalent.

| Option                                            | Effect                                                                                                                      | Verdict                                                                                                                                                                          |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `admin.hidden: true` on the collection            | Removes from nav and dashboard entirely                                                                                     | **Rejected** — an editor could no longer fix a service's title or icon, and those still render inside `ServiceCards` / `ServicePillarCards` blocks and on `caseStudies.services` |
| Strip `layout` + `livePreview`, regroup, describe | Metadata stays editable; the dead page body and the preview pane pointing at a retired route both disappear                 | **Chosen**                                                                                                                                                                       |
| Delete the collections                            | Breaks `ServiceCards`, `ServicePillarCards`, `caseStudies.services`, `posts.relatedServices`, `industries.relevantServices` | **Rejected**                                                                                                                                                                     |

`src/payload/livePreview/url.ts` already carries a comment conceding that the services
preview builder points at routes retired by the services restructure, and the corresponding
E2E spec is skipped. This decision closes that open note.

**Consequence**: `services.layout` and `servicePillars` body content is dropped in the same
migration as R2's legacy columns. The local mirror has 9 services carrying `description` /
`approach` prose that renders nowhere; the same equivalence gate as R2 applies.

---

## R5 — Mechanics of withdrawing Navigation and Site Settings

**Decision**: Relocate the two live metadata consumers into `src/lib/site-content.ts` (which
already holds the hard-coded chrome), then set `admin.hidden: true` on both globals. Do not
remove them from the Payload config.

**Rationale**:

- **What is actually live.** `SiteHeader.tsx:6` and `SiteFooter.tsx:6` already import the
  hard-coded `navigation` / `siteSettings` constants. `getNavigation()` in
  `src/lib/payload.ts:190` has **zero callers**. `getSiteSettings()` has callers, but the only
  values consumed are `siteSettings.tagline` (description fallback) and
  `siteSettings.companyName` (`og:siteName`), both in `src/lib/metadata.ts`. Both values
  already exist on the hard-coded constant, so relocation is a read-site swap, not new data.
- **Blast radius**: `buildMetadata` takes `siteSettings` as a fallback argument, threaded
  through ~10 route files. Removing the parameter is mechanical but touches every public
  route's `generateMetadata`, so it needs the full metadata assertion suite to run.
- **Hide, don't delete.** `admin.hidden` withdraws the screens without dropping tables. The
  globals hold prior content and 50 versions each; deleting the config would drop that with
  no upside, and keeps the door open if the chrome-ownership decision is revisited.

**Alternatives considered**: leaving `getNavigation()` in place as dead code. Rejected under
FR-005 — a reader with no callers is the same trap one layer down, and the next person to
find it will reasonably assume the globals are wired.

---

## R6 — How does the "no inert controls" guarantee get enforced in CI?

**Decision**: Two separate checks, both cheap.

1. **Block metadata check** (FR-013) — an integration test that walks `layoutBlocks` and
   `richTextBlocks` and asserts every entry has `admin.group`, an `admin.images.thumbnail`
   resolving to a file that exists on disk, and a non-empty description. Trivial, exact, no
   false positives.

2. **Field-consumer registry** (FR-008) — a test that walks the full Payload config field
   tree, flattens it to leaf field paths, and asserts every path appears in an explicit
   `CONSUMED_FIELDS` registry checked into the repo. Adding a field without registering it
   fails CI; registering it is a one-line, reviewable claim that a human made.

**Rationale**: static "find the consumer" analysis across a dynamic block renderer was
evaluated and rejected — `RenderBlocks` dispatches by `blockType` through a component map, so
a field's consumer is reached through two levels of indirection that a static pass cannot
follow without a full type-aware analysis. The registry is honest about being a human
assertion; its value is that it makes the assertion _mandatory and diffable_, which is what
actually failed here (fields went inert over four specs and nothing noticed).

**Alternatives considered**: a runtime probe that renders every block with every field
populated and diffs the output per field. Genuinely stronger, and rejected as
disproportionate — it is a whole test harness for a problem the registry catches at review
time.

---

## R7 — Media thumbnails without a 78-row backfill

**Decision**: Use the **function form** of `adminThumbnail`, preferring a new small size when
present and falling back to the existing `mobile_webp` derivative. Add the small size for new
uploads. Do not attempt a mass re-derivation.

**Rationale**: This is the trap in the obvious fix. Payload generates `imageSizes` derivatives
**at upload time only**. Declaring `adminThumbnail: 'thumbnail'` against a newly added size
would leave all 78 existing records with no thumbnail — the exact symptom being fixed —
because none of them has ever been re-uploaded. The API confirms the current state
(`thumbnailURL: null` on every record).

The collection already generates eight derivatives per image, the smallest being
`mobile_webp` at 640px. A function-form `adminThumbnail` can return that URL today, which
makes every one of the 78 existing records show a preview with zero data migration:

```ts
adminThumbnail: ({ doc }) => <thumbnail size url> ?? <mobile_webp url> ?? doc.url
```

640px is heavier than a 40px list thumbnail warrants, but it is already generated and already
served through the long-TTL CloudFront `/media/*` path (ADR 0008), so the marginal cost is a
cache hit. New uploads get the properly sized derivative and the function prefers it
automatically, so the library self-heals as media turns over.

**Media inventory**: 78 records, all images (50 webp / 23 png / 5 jpeg). No PDFs currently
stored, though `application/pdf` is an accepted mime type — FR-016's non-image case is
prospective, not observed, and is satisfied by returning `null` from the function so Payload
falls back to its file-type icon.

**Alternatives considered**: a re-derivation script that reads each original from S3 and
re-runs `sharp`. Rejected for this spec — it is a data migration with real failure modes
(S3 reads, 78 uploads, CloudFront invalidations) to buy a smaller image, when the fallback
costs one line.

---

## R8 — Block row identification

**Decision**: Set `disableBlockName: true` on every block and supply
`admin.components.Label` where a content-derived row title is meaningful.

**Rationale**: The "Untitled" text on every collapsed row is Payload's built-in `blockName`
field, which this project never uses. `disableBlockName` removes it outright (verified on
`BlocksField['admin']` at `node_modules/payload/dist/fields/config/types.d.ts:1153`).
`components.Label` replaces the row label with a component that can read the row's data, so a
hero row can title itself with its headline. Doing both means a collapsed 10-block page reads
as its own outline.

---

## R9 — Framework internals read (Constitution Principle I)

Per the constitution's requirement that plans against framework internals enumerate the
source read, the following installed files were read before settling on the approach above:

| File                                                                         | What it settled                                                                                                                         |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `node_modules/payload/dist/fields/config/types.d.ts` (L1006, L1153-1160)     | `admin.group`, `admin.images.{icon,thumbnail}`, `disableBlockName`, `components.Label` on Blocks; `components.RowLabel` on array fields |
| `node_modules/payload/dist/collections/config/types.d.ts`                    | `CollectionAdminOptions.group` (`false \| Record<string,string> \| string`), `.description`, `.hidden`                                  |
| `node_modules/payload/dist/collections/operations/create.js` (L92-137)       | Hook ordering: `beforeValidate` fields → `beforeValidate` collection → `beforeChange` collection → `beforeChange` fields                |
| `node_modules/payload/dist/fields/hooks/beforeChange/promise.js` (L86-96)    | Field `validate` runs inside the `beforeChange` **fields** phase, i.e. _after_ the collection `beforeChange` hook                       |
| `node_modules/payload/dist/upload/*` (via docs) + live `/api/media` response | `adminThumbnail` string vs function form; derivatives generated at upload only                                                          |

The hook-ordering read is what settled R10 below, and corrects an assumption worth recording:
`slugFromTitle` is **not** dead code. Because the collection `beforeChange` hook runs before
field validation, the server fills the slug before `validateSlug` ever sees it.

---

## R10 — Why slugs must be typed by hand today

**Decision**: Drop `required: true` from every `slug` field. Keep the `validateSlug` format
check, but make it tolerate empty input on create so the hook can fill it.

**Rationale**: Verified empirically against the local mirror — creating a Page with only a
title succeeds and yields the derived slug:

```
payload.create({ collection: 'pages', data: { title: 'Slug Probe ZZZ' } })
→ CREATED with slug = "slug-probe-zzz"
```

So the server-side generation works. What blocks the editor is purely presentational: the
field is marked required, so the admin form refuses to submit before the request is ever
made. Removing `required` lets the existing, working hook reach the UI path.

`validateSlug` currently returns `'Slug is required'` for empty input. Since it runs after the
hook has populated the value, it will not fire on the normal create path — but it would fire
on an explicit empty-string submission, so it is adjusted to return `true` for empty on create
and keep rejecting malformed non-empty values.

Slug immutability on rename is already correct (`slugFromTitle` returns early when a slug
exists), so FR-024 needs no change beyond a regression test.

---

## R11 — Scope sizing for the legibility pass

Measured from the config, to keep the task breakdown honest:

- **49 distinct camelCase field names** across collections, globals, and blocks that
  mechanically title-case into something worse than a written label.
- **The worst repeat offenders**, by occurrence: `url` ×20, `ogImage` ×10, `seo` ×10,
  `primaryCta` ×5, `secondaryCta` ×4, `cta` ×3, `ctaButton` ×1.
- **220 block fields total, 8 with help text** — so ~212 candidates, of which the plan targets
  only those whose purpose or rendered effect is not self-evident, not all of them.
- **45 layout blocks, 8 using `requiredWhen`** — 37 blocks to audit for variant-conditional
  fields. Not all have variants; the audit is per-block and many will be no-ops.
- **13 tables carry `_status`**, of which the draftable content collections in scope are
  pages, posts, case_studies, workshops, team_members, partners (services, service_pillars,
  industries, locations move to reference-data grouping).

The `seo` group appears 10 times with identical shape. It is extracted to a single shared
field definition with labels and help text authored once, rather than 10 parallel edits — the
same treatment for the repeated `cta` group shape.

---

## Open items carried to the plan

1. **SC-003 (block-pick accuracy in 9/10 trials under 30s)** is a usability outcome with no
   CI expression. Handled under the constitution's external-verification carve-out
   (Principle II) as a recorded walkthrough with the marketing lead; the CI-side proxy is
   FR-013's metadata completeness check.
2. **The R2 equivalence gate** — a one-off comparison script that, for each record holding
   legacy prose, asserts the same prose is present in the composed `layout` before the drop
   migration is allowed to run. This is a task, not a shipped artifact.
3. **Content-drafts reconciliation** — `docs/content-drafts/*.json` is gitignored and outside
   this repo's CI. Field removals must be replayed against those files locally and the seed
   re-run to prove FR-029 before the PR merges.
