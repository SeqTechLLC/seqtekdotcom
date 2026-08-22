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
      thumbnail: { url: string, alt: string },   // MUST resolve to a file under public/admin/blocks/
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

## C5 — Every field reaches the rendered site

**Applies to**: every leaf field path in the Payload config.

```ts
// src/payload/admin/consumedFields.ts
export const CONSUMED_FIELDS: Record<string, string> = {
  'pages.title': 'metadata + breadcrumb JSON-LD',
  'pages.layout': 'RenderBlocks on /[slug]',
  'teamMembers.expertise': 'structured-data.ts personLd → knowsAbout',
  // ...
}
```

Every path maps to a one-line human claim about where its value surfaces. A field that genuinely has no consumer does not get an entry — it gets deleted.

**Enforced by**: `tests/int/fieldConsumerRegistry.int.spec.ts`

- flattens the full config field tree to leaf paths
- fails when any path is absent from `CONSUMED_FIELDS`
- fails when `CONSUMED_FIELDS` names a path that no longer exists (catches stale entries after a removal)
- exempts Payload's own auth and versioning fields via an explicit prefix list

**Rationale**: FR-001, FR-008, SC-002. This check is deliberately a _human assertion made mandatory_, not static analysis. `RenderBlocks` dispatches by `blockType` through a component map, so a field's consumer sits behind two levels of indirection that a static pass cannot follow (research R6). The registry does not prove a field is consumed; it makes claiming so a reviewable, diffable act, which is precisely what was missing while fields went inert across four specs.

---

## C6 — Media always previews

```ts
upload: {
  adminThumbnail: ({ doc }) => string | null,
  imageSizes: [ /* ..., { name: 'thumbnail', ... } */ ],
}
```

Resolution order: the `thumbnail` derivative when present → the existing `mobile_webp` derivative → `null`.

Returning `null` (rather than a broken URL) for non-image uploads is required so Payload falls back to its file-type icon.

**Enforced by**: `tests/int/adminThumbnail.int.spec.ts`, over three fixtures — a record with the new size, a record with only the legacy derivatives (the state of all 78 existing records), and a non-image record.

**Rationale**: FR-015, FR-016. The fallback clause is the whole point: without it, adding the size fixes thumbnails only for media uploaded after this feature ships (research R7).

---

## C7 — Non-regression

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

> A new layout block needs a category from `BLOCK_LIBRARY.md` §5, a one-line description that says when to choose it over its neighbours, `disableBlockName: true`, and a thumbnail. Generate the thumbnail by seeding the showcase (`npm run seed:showcase`), capturing it (`npm run visual:capture`), and running `tools/block-thumbnails`; commit the resulting webp under `public/admin/blocks/`. Register every new field in `CONSUMED_FIELDS` with a note on where its value surfaces, or delete the field. CI fails on all of these.
