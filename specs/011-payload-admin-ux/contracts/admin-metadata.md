# Contract: Admin presentation metadata

**Feature**: `specs/011-payload-admin-ux` | **Date**: 2026-08-21

The interface this feature exposes is not an HTTP API — it is the **authoring contract** that every future collection, global, block, and field must satisfy to appear in the admin. This document is that contract; the tests named in each section are what enforce it.

Without enforcement, this spec is a one-time cleanup that decays over four more specs, which is exactly how the current state was reached. Every clause below is CI-checked.

---

## C1 — Every block declares its identity

**Applies to**: every entry in `layoutBlocks` (`src/payload/blocks/layout/index.ts`).

```ts
{
  slug: string,
  interfaceName: string,
  labels: { singular: string, plural: string },   // singular is the ONLY text the picker renders and searches
  admin: {
    group: string,              // MUST be a BLOCK_CATEGORY_LABELS heading (BLOCK_LIBRARY.md §5 categories)
    disableBlockName: true,     // MUST be set — the blockName field is unused in this project
    images: {
      thumbnail: { url: string, alt: string },   // MUST resolve to a file under public/block-previews/
    },
    components?: { Label?: string },             // SHOULD be set where a content-derived row title helps
  },
  fields: Field[],
}
```

**Enforced by**: `tests/int/adminMetadata.int.spec.ts`

- fails when any block lacks `admin.group`, `admin.images.thumbnail`, or `disableBlockName: true`
- fails when `admin.group` is not a known category heading
- fails when the thumbnail path does not exist on disk
- fails when two blocks share a thumbnail path
- fails when two blocks reachable from the same picker share a `labels.singular`, **or when one block's label is a substring of another's** — the mechanical form of "similar names must be disambiguated" (see the amendment below)

**Rationale**: FR-009, FR-010, FR-012, FR-013.

### Amendment 2026-08-26 — `admin.description` does not exist, so disambiguation lives in the label

The original contract required `admin.description` on every block, and FR-011 required
a description that says "when to choose it". **Payload has no such property**, on this
version or any other, and there is nowhere on the picker card for that text to appear.
Verified three ways before amending:

1. `payload@3.85.0`'s `Block` type (`payload/dist/fields/config/types.d.ts`) declares
   `admin` as exactly `{ components, custom, disableBlockName, group, images, jsx }`.
   `admin.description` is a type error, not a silently-ignored extra.
2. `@payloadcms/ui`'s `BlockSelector` (`dist/fields/Blocks/BlockSelector/index.js`)
   renders a block card as three things and no more: the `admin.group` heading, the
   `admin.images.thumbnail` image, and `getTranslation(labels.singular)`. Its search
   box filters on `labels.singular` alone.
3. `@payloadcms/richtext-lexical`'s block menu (`features/blocks/client/index.js` via
   `getBlockImageComponent`) renders an icon plus a label, with keywords fixed to
   `['block', 'blocks', slug]`. Same shape: no description.
4. Upstream `docs/fields/blocks.mdx` enumerates the same six admin options.

So a block `description` would be a field the compiler rejects, holding prose no editor
can ever read — the "assert a human typed a sentence" failure that retired C5 in PR #107.

**What replaces it.** `labels.singular` is the only editor-visible, editor-searchable
text on a block, so it is where disambiguation has to live, and the check is mechanical
rather than prose-quality:

> No two blocks offered by the same picker may share a `labels.singular`, and no label
> may be a substring of another label in the same picker.

Both pickers are checked independently: the layout drawer is populated from
`layoutBlocks`, the Lexical menu from `richTextBlocks ∪ richTextInlineBlocks`.

The substring clause is what carries the original intent. It is what forces bare `Hero`
to become `Hero (standard page)` when `Case study hero`, `Homepage hero` and
`Service pillar hero` are on the same screen, `Embed` to become `Embed (iframe)` beside
`Video embed`, and `Testimonial` to become `Testimonial (single)` beside
`Featured testimonials`. Those three were the entire real-world ambiguity in the
45-block set.

**FR-011 is therefore NOT MET as written** and is amended in `spec.md` rather than
declared satisfied. The long-form "what it produces and when to choose it" prose stays
in `docs/BLOCK_LIBRARY.md` §5, which is where it was already maintained.

---

## C2 — Inline blocks declare an icon

**Applies to**: every entry in `richTextBlocks` and `richTextInlineBlocks`
(`src/payload/blocks/inline/index.ts`).

```ts
admin: {
  images: { icon: { url: string, alt: string } },   // 20×20, for the Lexical insertion menu
}
```

Payload renders the icon at `maxWidth: 20, maxHeight: 20` and falls back to
`images.thumbnail`, then to the generic block glyph, when `icon` is absent. Committed
SVGs under `public/block-previews/inline/` are used rather than rasters — at 20px a
screenshot crop is unreadable, and an SVG costs well under a kilobyte.

The `description` clause of this contract is withdrawn for the same reason as C1's:
the Lexical menu renders an icon and a label, nothing else.

**Enforced by**: same spec as C1. **Rationale**: FR-012.

---

## C3 — Every collection and global declares its purpose

```ts
admin: {
  group: 'Content' | 'Reference data' | 'Site' | 'Admin',
  description: string,          // one line, what it is for, in an editor's words
  useAsTitle: string,
  defaultColumns: string[],     // [useAsTitle, '_status', ...] when versions.drafts is enabled
}
```

**Enforced by**: `tests/int/adminMetadata.int.spec.ts`

- fails when any collection or global lacks `group` or `description`
- fails when `group` is outside the allowed set
- fails when a collection has `versions.drafts === true` and `_status` is not the **second** entry of `defaultColumns`, or when the first entry is not `useAsTitle`
- fails when a collection without drafts names `_status` at all — the column exists only when drafts are enabled
- exempts collections marked `admin.hidden`

**Rationale**: FR-014, FR-026, FR-027.

### Amendment 2026-08-27 — `_status` is the second column, not the first

The clause above originally read "MUST begin with `_status`". It was implemented
that way, screenshotted, and reverted the same session.

`@payloadcms/ui`'s `buildColumnState` makes the first active column the link to
the record — `isLinkedColumn: enableLinkedCell && colIndex === activeColumnsIndices[0]`
— and nothing configures which column that is. Leading with `_status` therefore
turned every row of every content list into an underlined **Published** that
opened the record, with the title beside it inert. Fifteen rows of the Pages
list read `Published / Published / Published …` in the leftmost, most
prominent, only-clickable position.

The requirement it serves (US3 acceptance scenario 1) is that publish state is
"visible as a column without changing column settings" — it says nothing about
position. Second place satisfies it, keeps the state adjacent to the name it
qualifies, and leaves the name as the thing you click.

---

## C4 — Every field is legible without schema knowledge

**Applies to**: every leaf field in every collection, global, and block.

1. **Label** — where Payload's automatic title-casing of the field name would produce something an editor would not say out loud, an explicit `label` is required. The check is mechanical: a field fails if its auto-generated label differs from its declared label by more than case and spacing **and** no `label` is declared. Concretely this catches `cta` → "Cta", `seo` → "Seo", `ogImage` → "Og Image", `url` → "Url".
2. **Help text** — a field listed in the spec's non-obvious set MUST carry `admin.description` stating what it does and where it appears.
3. **Variant conditionality** — a field that applies only to a subset of a block's `variant` values MUST declare `admin.condition` (via the existing `requiredWhen` helper in `src/payload/blocks/conditional.ts`), so it is hidden rather than shown blank.

**Enforced by**: `tests/int/adminMetadata.int.spec.ts` for (1) and (2); a Playwright admin spec for (3), which selects each variant of each multi-variant block and asserts other-variant fields are not rendered.

**Rationale**: FR-018, FR-019, FR-020.

---

## C5 — ~~Every field reaches the rendered site~~ (RETRACTED)

Retracted during PR #107 review. The contract specified a registry mapping every
field to a written consumer claim, enforced by a test asserting the claim was
non-empty — which verifies that a human typed a sentence, not that the sentence
is true. FR-008 is marked NOT MET in the spec rather than satisfied by ceremony.

The audit it produced was still worth something: 24 fields on four unrouted
collections have no consumer today. Those are tracked as ROADMAP **INERT-1**.

## C6 — Media always previews

```ts
upload: {
  adminThumbnail: ({ doc }) => string | null,
  // imageSizes unchanged — no new derivative is introduced
}
```

Resolution order: the existing `mobile_webp` derivative → `null`.

Returning `null` (rather than a broken URL) for non-image uploads, and for any record with no usable derivative, is required so Payload falls back to its file-type icon.

**Enforced by**: `tests/int/adminThumbnail.int.spec.ts`, over three fixtures — a record with `mobile_webp` (the state of all 78 existing records), a record with no derivatives at all, and a non-image record. `tests/e2e/admin/mediaThumbnails.e2e.spec.ts` proves Payload actually draws the result, in the list and in the picker a block's upload field opens.

**Which URL the resolver returns** (decided 2026-08-27): the derivative's own stored `/api/media/file/<filename>` path, **not** the CloudFront `/media/*` URL from `mediaFileURL`. The CDN URL is what the public site renders and would be the cheaper fetch, but it is built from the document's storage `prefix`, and Payload narrows the list-view query to `{ mimeType, thumbnailURL, sizes.* }` (`appendUploadSelectFields`) — `prefix` is not in that set, so the CDN URL is unbuildable exactly where the thumbnails are needed most. The stored path resolves on every lane: against the filesystem locally and in CI, and through the S3 static handler on the deployed lanes, which is the same route the admin already uses for the full-size preview on the edit screen.

### C6a — a collapsed row of media identifies itself (FR-017)

```ts
// any array field whose rows contain an `upload`
admin: { components: { RowLabel: mediaRowLabel({ singular, textFields?, uploadField }) } }
```

Payload labels array rows by position, so an array of uploads collapses to
`Logo 01` … `Logo 08` and has to be expanded one row at a time. `MediaRowLabel`
(`src/components/admin/MediaRowLabel.tsx`) resolves the row's name cheapest-first:
a text field the editor filled in on the row, then the linked media's alt text,
then its filename, then Payload's numbering. It renders the `adminThumbnail`
image beside the name, so the row answers "which image is this?" too.

Only the two arrays that are nothing but an upload (`logo-bar.logos`,
`industries.clientLogos`) reach the fetch; the other four are named from a
sibling `caption` or `title` with no request at all.

**Enforced by**: `tests/int/adminMetadata.int.spec.ts` walks every collection,
global and block and fails any array with an `upload` child and no `RowLabel`.

**Rationale**: FR-015, FR-016. Clarified 2026-08-21: **no dedicated thumbnail size is added.** Measured on the real photo library, the existing 640px derivative averages 53 KB against 16 KB for a 300px thumbnail, so a 20-item picker costs ~1.04 MB versus ~0.32 MB — a 3.3× saving on an edge-cached internal screen, which does not justify a ninth derivative on every upload plus a backfill migration (research R7).

---

## C7 — Slugs derive, and never collide silently

```ts
{
  name: 'slug',
  type: 'text',
  unique: true,          // retained as the DB backstop, not as the UX
  index: true,
  // required: true      // REMOVED — it blocks the form before the hook can fill the value
  validate: validateSlug, // tolerates empty on create; rejects malformed; rejects collisions
}
```

Behaviour the admin form must exhibit:

| Input                                  | Result                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------- |
| Title only, no slug                    | Saves; slug derived from the title (FR-022)                                                 |
| Explicit, well-formed, free slug       | Saves; the entered value is used unchanged (FR-023)                                         |
| Explicit malformed slug                | Rejected with a plain-language explanation of the required format (FR-023)                  |
| Title renamed on an existing record    | Existing slug unchanged — links keep working (FR-024)                                       |
| Derived or entered slug already in use | **Rejected**, naming the conflicting record and offering an available alternative (FR-024a) |

The collision check lives in the field-level `validate` (which receives `req` and can query), not in `slugFromTitle`, so it fires identically for derived and hand-typed slugs. **Auto-suffixing is prohibited** — this site's URL map is curated and backed by a 301 redirect table, so silently minting `/contact-2` produces a junk URL nobody chose and costs a redirect to unpick after launch.

**Enforced by**: the US5 Playwright admin spec (`tests/e2e/admin/`), covering all five rows above.

**Rationale**: FR-022 through FR-024a, research R10.

---

## C8 — Non-regression

Not a code contract, but the gate every change in this feature passes:

| Obligation                  | Check                                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Public output unchanged     | `npm run visual:capture` before/after, every route, both viewports — zero visual differences (FR-028)      |
| Metadata unchanged          | Full metadata assertion suite across every public route, run before and after the `buildMetadata` refactor |
| Seed pipeline intact        | Local replay of every `docs/content-drafts/*.json` — zero unresolved references (FR-029)                   |
| Existing records intact     | Admin E2E: open, edit, and save a record created before the change (FR-030)                                |
| Generated artifacts current | `npm run generate:types` and `npm run generate:importmap` produce no diff at merge                         |

---

## Adding a new block after this feature

The contract in one paragraph, for `docs/PAYLOAD_DEVELOPMENT.md`:

> A new layout block needs a category from `BLOCK_LIBRARY.md` §5 on `admin.group`, `disableBlockName: true`, a thumbnail, and a `labels.singular` that neither duplicates nor is contained in any sibling label offered by the same picker. Generate the thumbnail by seeding the showcase (`npm run seed:showcase`), capturing it (`npm run visual:capture`), and running `npm run block:thumbnails`; commit the resulting webp under `public/block-previews/`. A block that cannot be captured deterministically declares an `.svg` thumbnail instead and ships a hand-authored wireframe. CI fails on all of these.

**Two things this paragraph used to say, both removed 2026-08-26** — it is staged to be copied into the developer doc, so an error here propagates. It required "a one-line description that says when to choose it over its neighbours", which the C1 amendment above retracted because Payload has no block description; the label rule replaces it. And it required registering every field in `CONSUMED_FIELDS`, which was retracted with C5 in PR #107 and exists nowhere in the codebase.
