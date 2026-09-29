# Payload development

The rules this repo holds Payload 3 to. For Payload itself, read the
[Payload docs](https://payloadcms.com/docs); this file covers what this codebase does
differently or enforces in tests.

## 1. Where things live

- **Config:** `src/payload.config.ts`. It sets up the Postgres adapter, `editorConfig`,
  `s3Plugin`, one global (`Homepage`), and the collections array from
  `src/collections/index.ts`, whose order is the admin sidebar's order.
- **Schema push:** on only when `NODE_ENV !== 'production'` and
  `PAYLOAD_DISABLE_PUSH !== 'true'`. The lanes and CI migrate instead (§12).
- **Generated files:** `npm run generate:types` writes `src/payload-types.ts`.
  `npm run generate:importmap` writes `src/app/(payload)/admin/importMap.js` (§7).
- **Reference implementation** of a metadata collection with a block-composed body:
  `src/collections/Partners.ts`.
- **Collection slugs** are camelCase (`caseStudies`, `teamMembers`), and so are their
  REST paths.

## 2. Globals and site chrome

The one global is `Homepage`. Company details, the footer nav and the legal nav are
code in `src/lib/site-content.ts` (ADR 0010). The header menu is the `navigation`
collection; `site-content.ts` supplies the fallback while that collection is empty.

## 3. Collections

### Sidebar grouping

`tests/int/adminMetadata.int.spec.ts` requires every collection and global to declare
`admin.group` and `admin.description`.

- `admin.group` comes from `src/collections/groups.ts`, never a literal. A typo would
  open a group of its own, since Payload types the field as `string`.
- `admin.description` is one line written for an editor, saying what belongs there. It
  must not just restate the collection's name.
- Group headings draw in the order each group first appears in
  `src/collections/index.ts`, not in `groups.ts` order.
- Globals always draw after every collection. That is why `Homepage` sits in `Content`.

### URL paths

Every routed collection's `slug` comes from `urlPathField` (`src/payload/fields/slug.ts`),
which `urlPathField.int.spec.ts` enforces.

- It adds a hidden `generateSlug` checkbox, which derives the slug from the title until
  a slug exists. The column defaults to `true`, so adding the field to a collection
  that already has rows needs a backfill to `false` in the same migration. Otherwise
  every existing record regenerates its slug on its next save.
- Save Draft skips validation. Collisions are caught by `rejectSlugCollision`, a
  `beforeChange` field hook, so they are caught on drafts too.
- `src/components/admin/UrlPathField.tsx` wraps Payload's `SlugField` to add a
  description.
- Payload marks `slugField` experimental. `urlPathField` is the one place to repoint if
  an upgrade breaks it.

### List views

- Collections with drafts list `useAsTitle` first and `_status` second in
  `defaultColumns`. Payload links the first column to the record, so `_status` must
  not come first. A collection without drafts must not name `_status` at all.
- `Media` uses the function form of `upload.adminThumbnail` (`mediaAdminThumbnail`). It
  returns the smallest WebP derivative's `/api/media/file/<filename>` path, or `null`
  for anything that isn't an image.

### Array fields holding media

An array whose rows contain an `upload` must declare a row label, or the test fails:

```typescript
admin: {
  components: {
    RowLabel: mediaRowLabel({ singular: 'Logo', textFields: ['caption'], uploadField: 'logo' }),
  },
},
```

`mediaRowLabel` (`src/payload/fields/mediaRowLabel.ts`) names the row from the text
fields, then from the media's alt text or filename, and shows the thumbnail.

## 4. Drafts and access

- Draftable collections use `versions: { drafts: true, maxPerDoc: 50 }`. Publish state
  is Payload's `_status`; there is no separate status field.
- **Access helpers:** `src/payload/access/byRole.ts` (`isAdmin`, `isAdminOrEditor`) and
  `publishedOrAuthed.ts`. With the latter, admins and editors read drafts and everyone
  else gets `_status = published`.
- **Users** sign in with Google only (`disableLocalStrategy`). On an empty database, the
  first account to sign in becomes the admin.

## 5. Fields

### Required field metadata

`tests/int/adminMetadata.int.spec.ts` (contract C4) checks every collection, global and
block against three rules:

1. **No rendered label may be machine text.** Payload title-cases a field name that has
   no `label`, which turns `cta` into "Cta" and `ogImage` into "Og Image". Correctly
   cased acronyms pass: `CTA`, `SEO`, `URL`, `ID`, `HubSpot`, `LinkedIn`.
2. **Non-obvious fields carry `admin.description`.** That means conditional fields,
   `select` fields, and fields whose name is jargon. Say what the field changes, where
   it appears, and what happens if it is left blank.
3. **Variant-only fields declare `admin.condition`** through `requiredWhen()`
   (`src/payload/blocks/conditional.ts`). Pass any other `admin` properties as its second
   argument; a sibling `admin` key would replace the condition.
   `tests/e2e/admin/variantFields.e2e.spec.ts` checks the rendered fields in a browser.

Hidden fields are exempt from rules 1 and 2. Use the shared factories rather than
hand-rolled fields:

| Factory                                                       | File                              | Used by                          |
| ------------------------------------------------------------- | --------------------------------- | -------------------------------- |
| `seoField({ noun, hidden, summaryFallback })`                 | `src/payload/fields/seo.ts`       | the `seo` group on 9 collections |
| `ctaField({ name, label, description, required, withStyle })` | `src/payload/fields/cta.ts`       | `hero`, `media-text` and `cta`   |
| `headingField({ required, fallback })`                        | `src/payload/fields/blockCopy.ts` | the `heading` on 9 blocks        |
| `eyebrowField()`                                              | `src/payload/fields/blockCopy.ts` | the `eyebrow` on 2 blocks        |

## 6. Blocks

- The layout library is 13 blocks (ADR 0013), pinned by
  `tests/int/blocks/allowedBlocks.int.spec.ts`. Adding one needs the owner's sign-off.
- `tests/int/blocks/noCaps.int.spec.ts` bans `maxRows`, `maxLength`, `max`, and
  `minRows` above 1.
- Each block is defined in `src/payload/blocks/layout/<Block>.ts` (see `Hero.ts`) and
  registered in `layoutBlocks`. It renders through `RenderBlocks`
  (`docs/contracts/render-blocks.md`).
- A block has no `admin.description`: neither the picker nor the Lexical menu shows one.
  Put anything that tells blocks apart in `labels.singular` (ADR 0011).

### Required block metadata

Every layout block declares its admin presentation through `blockAdmin()`
(`src/payload/blocks/blockAdmin.ts`), and every rich-text block through
`inlineBlockAdmin()`. `tests/int/adminMetadata.int.spec.ts` fails CI otherwise. When
adding a block:

1. `admin: blockAdmin('<category>', '<slug>', '<Label>')`. The category is one of the
   six in `src/payload/blocks/categories.ts`. The third argument must equal
   `labels.singular`, because it is both the preview's alt text and the collapsed row's
   name.
2. Register it in its category's run of `layoutBlocks`; the picker draws headings in
   registration order.
3. Give it a label that is unique within its picker and is not a substring of another
   label there.
4. Build and commit its preview:

   ```bash
   npm run seed:showcase && npm run visual:capture && npm run block:thumbnails
   ```

   That writes a 480×320 WebP to `public/block-previews/`. A block that cannot be
   captured deterministically gets a hand-drawn SVG instead: pass `'svg'` as
   `blockAdmin()`'s fourth argument and commit `public/block-previews/<slug>.svg`.

5. Run `npm run generate:importmap` (§7).

## 7. Rich text

`src/payload/editor/editorConfig.ts` configures the editor:

- headings h2–h4;
- bold, italic and underline;
- blockquote and lists;
- links to pages, posts, case studies and services;
- the inline and fixed toolbars;
- `BlocksFeature` for the inline blocks.

`src/components/richText/RichText.tsx` renders it; the inline-block converter contract is
`docs/contracts/inline-block-converter.md`.

**After adding or removing an inline block, or any custom admin component,** run
`npm run generate:importmap` and commit `src/app/(payload)/admin/importMap.js` in the
same PR. Otherwise the admin fails to mount it. See
[LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md#regenerating-the-payload-importmap).

## 8. Hooks

| Hook                           | Where                                                     | What it does                                                                                                                                   |
| ------------------------------ | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `revalidateOnChange('<slug>')` | `afterChange` on every collection but `Media` and `Users` | Clears the cache tags and paths from `buildRevalidatePlan` with `revalidateTag(tag, { expire: 0 })`, and invalidates those paths in CloudFront |
| `enforceDraftWhenScheduled`    | `beforeChange` on collections with `publishedAt`          | Forces `_status: 'draft'` while `publishedAt` is in the future                                                                                 |
| `invalidateMediaOnChange`      | `Media`                                                   | Invalidates the file's CloudFront `/media/*` paths when a file is replaced or deleted                                                          |
| `rejectSlugCollision`          | the `slug` field, via `urlPathField`                      | Refuses a slug another record already uses, drafts included                                                                                    |

## 9. Reading content from Next.js

Public pages read through the cached readers in `src/lib/payload.ts`. Each is wrapped in
`unstable_cache` with tags that mirror `buildRevalidatePlan` (ADR 0005), and in a read
timeout (ADR 0007). Don't call `getPayload().find()` from a page, and set `depth`
explicitly.

## 10. Media

- Allowed types are JPEG, PNG, WebP, AVIF, GIF and PDF, with no SVG.
- Each image gets WebP and JPEG derivatives at four breakpoints: mobile 640, tablet 1024,
  desktop 1600 and wide 2400.
- The S3 plugin is always registered and switches on when `S3_BUCKET` and `S3_REGION`
  are set. Without them, uploads fall back to local disk.
- Files are served from CloudFront `/media/<filename>` (`docs/contracts/media-url.md`,
  ADR 0008).

## 11. Live preview

`livePreviewFor(collection)` in `src/payload/livePreview/url.ts` configures each
previewable collection. The preview route is
`src/app/(frontend)/preview/[collection]/[slug]/route.ts`, and the URL contract is
`docs/contracts/live-preview-urls.md`.

## 12. Migrations

- The history is one baseline, `src/migrations/20260924_200338_baseline.ts`. Every
  database, local ones included, is created empty, migrated, then loaded from the
  content JSON (LOCAL_DEVELOPMENT.md; INFRASTRUCTURE_RUNBOOK.md §1).
- **A schema change needs a migration before merge.** Run
  `npm run payload migrate:create <name>` and commit the `.ts` and `.json` it writes.
  - It diffs against the last snapshot, and it can stop at an interactive "created or
    renamed?" prompt.
  - Read the SQL. Enum rebuilds and type changes can need a `USING` clause.
  - A block change touches every collection's block tables.
- Each lane's container runs `npx payload migrate` before `node server.js`. Deploys are
  ECS rolling updates, so old and new tasks overlap and a migration must not break the
  running image.
  - Additive changes (a nullable column, an index, a new table) ship in one deploy.
  - A drop or rename takes two deploys: add the new shape first, and remove the old one
    after every task runs the new image.
  - Snapshot the database before a destructive one (INFRASTRUCTURE_RUNBOOK.md §2).
