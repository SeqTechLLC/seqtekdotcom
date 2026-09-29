# Contract: admin presentation metadata

What every collection, global, block and field must declare to appear properly in `/admin`.
`tests/int/adminMetadata.int.spec.ts` enforces it unless a clause names another test.

## C1 — Every block declares its identity

Applies to every entry in `layoutBlocks` (`src/payload/blocks/layout/index.ts`). `blockAdmin()`
(`src/payload/blocks/blockAdmin.ts`) builds these from one call:

```ts
{
  slug: string,
  interfaceName: string,
  labels: { singular: string, plural: string },
  admin: {
    group: string,              // a BLOCK_CATEGORY_LABELS heading (BLOCK_LIBRARY.md §5)
    disableBlockName: true,
    images: { thumbnail: { url: string, alt: string } },   // a file under public/block-previews/
    components: { Label: … },   // BlockRowLabel, named with labels.singular (C4.4)
  },
  fields: Field[],
}
```

The test fails when:

- a block lacks `admin.group`, the thumbnail or `disableBlockName: true`;
- the group is not a known category;
- the thumbnail file is missing, or two blocks share one;
- two blocks in the same picker share a `labels.singular`, or one label is a substring of another.

**Why the label carries it.** Payload's block picker shows only the group heading, the thumbnail
and `labels.singular`, and its search reads only the label. There is no block description to put
guidance in, so the label is what tells two blocks apart. The layout drawer (`layoutBlocks`) and
the Lexical menu (`richTextBlocks ∪ richTextInlineBlocks`) are checked separately. Longer
"when to use it" guidance lives in `docs/BLOCK_LIBRARY.md` §5.

## C2 — Inline blocks declare an icon

Every entry in `richTextBlocks` and `richTextInlineBlocks` (`src/payload/blocks/inline/index.ts`)
sets `admin.images.icon` to a committed SVG under `public/block-previews/inline/`. The Lexical menu
draws it at 20×20 and shows a label beside it, nothing else.

## C3 — Every collection and global declares its purpose

```ts
admin: {
  group: 'Content' | 'Reference data' | 'Site' | 'Admin',   // ADMIN_GROUPS, src/collections/groups.ts
  description: string,     // one line, in an editor's words
  useAsTitle: string,
  defaultColumns: string[],
}
```

The test fails when:

- a collection or global lacks `group` or `description`, or uses a group outside `ADMIN_GROUPS`;
- a collection with drafts does not have `useAsTitle` first and `_status` second in
  `defaultColumns`;
- a collection without drafts lists `_status`.

Collections with `admin.hidden` are exempt. `_status` goes second because Payload makes the first
column the link to the record; a leading status column would turn every row into a clickable
"Published".

## C4 — Every field is legible without schema knowledge

Applies to every leaf field in every collection, global and block. Hidden fields, including
children of a hidden container (`tests/int/helpers/flattenFields.ts`), are skipped.

1. **No title-cased acronyms in labels.** The effective label (the declared `label`, or Payload's
   `toWords(name)`) may not contain a title-cased acronym or brand from the test's lexicon:
   `Api`, `Cms`, `Cta`, `Faq`, `Html`, `Hubspot`, `Id`, `Ids`, `Linkedin`, `Og`, `Seo`, `Ui`,
   `Url`, `Urls`, `Youtube`. A hand-typed `label: 'Seo'` fails like a missing one.
2. **Help text where the panel cannot show the effect.** A field needs `admin.description` when it
   declares `admin.condition`, when it is a `select`, or when its name contains a lexicon word.
3. **Conditional fields hide.** A field that applies only for some values of a sibling select
   declares `admin.condition`, through `requiredWhen` in `src/payload/blocks/conditional.ts`.
   `tests/e2e/admin/variantFields.e2e.spec.ts` drives each option of each select whose value changes
   which fields apply, and checks the rendered fields against the config's own predicates.
4. **Rows are named like their block.** Every layout block declares `admin.components.Label`, and
   the name it passes equals `labels.singular`, so a collapsed row reads like the card the editor
   picked.

## C6 — Media always previews

`upload.adminThumbnail` (`src/collections/Media.ts`) returns the `mobile_webp` derivative's stored
`/api/media/file/<filename>` path, or `null` when there is none, so Payload falls back to its
file-type icon. The stored path is used rather than the CloudFront URL because Payload's list query
does not select the storage `prefix` the CDN URL is built from. No dedicated thumbnail size exists.

Enforced by `tests/int/adminThumbnail.int.spec.ts`: an image with the derivative, an image without
one, and a non-image. `tests/e2e/admin/mediaThumbnails.e2e.spec.ts` proves Payload draws the
result in the list and in the upload picker.

### C6a — A collapsed row of media identifies itself

Every array whose rows hold an `upload` declares `admin.components.RowLabel: mediaRowLabel(…)`.
`MediaRowLabel` (`src/components/admin/MediaRowLabel.tsx`) names the row from the first of these
that has a value:

1. a text field on the row;
2. the linked media's alt text;
3. the media's filename;
4. Payload's row number.

It also shows the thumbnail, at the cost of one `GET /api/media/:id` per row. The test fails any
such array without a `RowLabel`.

## C7 — Slugs derive, and never collide silently

Slugs are `urlPathField` (`src/payload/fields/slug.ts`), built on Payload's `slugField`:

| Input                                | Result                                                                                          |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Title only                           | The slug is derived from the title on save                                                      |
| Explicit, well-formed, free slug     | Used unchanged                                                                                  |
| Malformed slug on a new record       | Normalised by the `generateSlug` hook                                                           |
| Malformed slug on an existing record | Rejected with the required format                                                               |
| Title renamed on an existing record  | Slug unchanged                                                                                  |
| Slug already in use                  | Rejected by the `rejectSlugCollision` `beforeChange` hook, naming the record and an alternative |

- **`required` stays on**, and `validateSlug` passes an empty value while the `generateSlug`
  checkbox is on.
- **The box starts locked** behind Unlock and Generate.
- **Nothing auto-suffixes.** The URL map is curated, so a silent `/contact-2` would be a junk URL.
- **The collision check is a hook.** Payload skips `validate` on Save Draft, so a validator would
  miss draft saves.

`slugField` is marked experimental by Payload.

Enforced by `tests/e2e/admin/slugField.e2e.spec.ts` and `tests/int/collections/urlPathField.int.spec.ts`.
