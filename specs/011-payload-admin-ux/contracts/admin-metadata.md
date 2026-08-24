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
  labels: { singular: string, plural: string },
  admin: {
    group: string,              // MUST be one of the BLOCK_LIBRARY.md §5 categories
    description: string,        // MUST be non-empty; MUST disambiguate same-named siblings
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

- fails when any block lacks `admin.group`, `admin.description`, or `admin.images.thumbnail`
- fails when `admin.group` is not a known category
- fails when the thumbnail path does not exist on disk
- fails when two blocks share a thumbnail path
- fails when any block whose `labels.singular` shares a word with another block's has an empty or non-disambiguating description

**Rationale**: FR-009 through FR-013. The four hero blocks are the motivating case — a category and a preview alone do not separate them, so the description clause is not decorative.

---

## C2 — Inline blocks declare an icon

**Applies to**: every entry in `richTextBlocks` and `richTextInlineBlocks` (`src/payload/blocks/inline/index.ts`).

```ts
admin: {
  images: { icon: { url: string, alt: string } },   // 20×20, for the Lexical insertion menu
  description: string,
}
```

**Enforced by**: same spec as C1. **Rationale**: FR-012.

---

## C3 — Every collection and global declares its purpose

```ts
admin: {
  group: 'Content' | 'Reference data' | 'Site' | 'Admin',
  description: string,          // one line, what it is for, in an editor's words
  useAsTitle: string,
  defaultColumns: string[],     // MUST begin with '_status' when versions.drafts is enabled
}
```

**Enforced by**: `tests/int/adminMetadata.int.spec.ts`

- fails when any collection or global lacks `group` or `description`
- fails when `group` is outside the allowed set
- fails when a collection has `versions.drafts === true` and `_status` is absent from `defaultColumns`
- exempts collections marked `admin.hidden`

**Rationale**: FR-014, FR-026, FR-027.

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

**Enforced by**: `tests/int/adminThumbnail.int.spec.ts`, over three fixtures — a record with `mobile_webp` (the state of all 78 existing records), a record with no derivatives at all, and a non-image record.

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

> A new layout block needs a category from `BLOCK_LIBRARY.md` §5, a one-line description that says when to choose it over its neighbours, `disableBlockName: true`, and a thumbnail. Generate the thumbnail by seeding the showcase (`npm run seed:showcase`), capturing it (`npm run visual:capture`), and running `tools/block-thumbnails`; commit the resulting webp under `public/block-previews/`. Register every new field in `CONSUMED_FIELDS` with a note on where its value surfaces, or delete the field. CI fails on all of these.
