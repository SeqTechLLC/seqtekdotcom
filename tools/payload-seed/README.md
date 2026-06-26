# payload-seed

A generic Payload **seeder**: upsert any collection document or global from a
JSON request file, over the REST API — no admin UI clicking, no DB access. It
resolves relations, images, and rich text at write time via directives.

This is the committed, generic counterpart to the per-type importers
(`tools/import-case-study/`). It shares the same REST client
(`tools/payload-rest/client.ts`) and the same text→Lexical converter
(`src/payload/seed/htmlToLexical.ts`), so content lands in the exact shape the
admin and the audit-seed pipeline produce.

The actual content data files are **not** committed — they live in the
gitignored `docs/content-drafts/*.json` and are fed to this tool. This tool is
the engine; those JSON files are the input.

## Usage

```bash
# Preview against local dev (no token, no writes):
tsx tools/payload-seed/index.ts ./seed.json --dry-run

# Seed local dev (server on :3100), publishes by default:
IMPORT_TOKEN=<session-jwt> npm run payload:seed ./seed.json

# Seed staging, force everything to draft:
IMPORT_TOKEN=<session-jwt> npm run payload:seed ./seed.json \
  --base-url=https://seqtek-preview.com --draft
```

| Flag / env             | Meaning                                                               |
| ---------------------- | --------------------------------------------------------------------- |
| `<file.json>`          | Path to the seed JSON (positional, required).                         |
| `--base-url=<url>`     | Target origin. Default `http://localhost:3100`, or `IMPORT_BASE_URL`. |
| `--draft`              | Force every spec to draft. Default: publish.                          |
| `--dry-run`            | Resolve + print intended ops; write nothing, upload nothing.          |
| `--allow-missing-refs` | Downgrade an unresolved non-omittable `$ref` from error to warn+drop. |
| `IMPORT_TOKEN`         | Your `/admin` session JWT. Required unless `--dry-run`. Never logged. |
| `IMPORT_BASE_URL`      | Alternative to `--base-url`.                                          |

### Getting `IMPORT_TOKEN`

Auth is your own Google-SSO session — no API key, no schema change. Log into
`/admin` on the target environment, then copy the `payload-token` cookie value
(DevTools → Application → Cookies). Export it: `export IMPORT_TOKEN=<value>`.
The token expires with your session, so grab a fresh one per run.

## Spec format

The file is **one spec** or an **array of specs**. An array is processed
**sequentially**, so a document created by an earlier spec is findable as a
`$ref` from a later spec (see the ordering caveat below).

A **collection** spec upserts one document, idempotent by an identity field:

```jsonc
{
  "collection": "caseStudies",
  "identity": "slug", // optional, default "slug"
  "status": "published", // optional, default "published"; or "draft"
  "data": {
    "slug": "acme-platform", // data[identity] is REQUIRED (the upsert key)
    "title": "Rebuilding Acme",
    // ...any fields the collection accepts, with directives below
  },
}
```

A **global** spec updates one global (it has a `global` key instead of
`collection`):

```jsonc
{
  "global": "siteSettings",
  "status": "published",
  "data": {
    /* ...global fields... */
  },
}
```

### Idempotency

Collection upserts find an existing doc by `data[identity]` (default `slug`) and
**PATCH** it if found, else **POST** a new one. Re-running a seed file is safe —
it updates in place. Globals are always an update. `status: "published"` (the
default) writes `_status: "published"` and publishes; `status: "draft"` (or the
`--draft` flag) leaves the record unpublished.

## Directives

Anywhere inside `data` (recursively, through objects and arrays), a value may be
a **directive** — a plain object whose **sole** key is one of the following.
Directives are resolved to concrete values _before_ any write.

### `$ref` — resolve a relation to a document id

```jsonc
{ "$ref": { "collection": "industries", "field": "slug", "value": "healthcare" } }
```

- `field` defaults to `"slug"`.
- `value` may be a **string** or an **array of strings** — each is tried in
  order and the first match wins (powers an ordered "featured doc with
  fallback" list).
- `createIfMissing` — if nothing resolves, create the doc (published) and use
  its id. Find-or-create for taxonomy by title:
  ```jsonc
  {
    "$ref": {
      "collection": "industries",
      "field": "title",
      "value": "Healthcare",
      "createIfMissing": { "title": "Healthcare", "slug": "healthcare" },
    },
  }
  ```
  (`createIfMissing` is written verbatim — put a `slug`/`_status` in it if the
  target collection needs one. It is **not** recursively directive-resolved.)
- `omitIfMissing: true` — if nothing resolves, **drop**. If the `$ref` is a
  field on an object that is itself an array element, the **whole element** is
  dropped (e.g. a conditional `featuredCaseStudy` layout block); if it's a
  plain field, just that field is omitted; if it's a direct array element, that
  element is dropped.
- Otherwise an unresolved `$ref` is an **error**, unless you pass
  `--allow-missing-refs` (then it warns and drops, like `omitIfMissing`).

### `$file` — upload (or reuse) an image, resolve to a media id

```jsonc
{ "$file": { "path": "../photos-normalized/team/hank.jpg", "alt": "Hank Haines" } }
// or: { "$file": { "url": "https://…/hero.png", "alt": "Hero" } }
```

- Exactly one of `path` / `url`; `alt` is required (media alt text is
  mandatory).
- **Deduped by filename**: if a media doc with that basename already exists it
  is reused (no re-upload). Same 25 MB / MIME guards as the media collection.
- In `--dry-run`, nothing is uploaded — the node becomes a `"<file:name>"`
  placeholder.

### `$lexical` — expand prose into a Lexical editor state

```jsonc
{ "$lexical": "A paragraph.\n\nAnother paragraph.\n\n- a bullet\n- another" }
```

Plain text / light markdown is converted to the same `SerializedEditorState`
the admin and audit seed produce (blank lines split paragraphs; `- ` / `•`
lines become bullet lists; a leading `N. ` line becomes a heading; a fully
quoted line becomes a blockquote).

## Sequential-array ordering caveat

When the file is an array, specs run **top to bottom**. A later spec's `$ref`
can resolve a document an earlier spec just created — so put the referenced
docs (industries, services, case studies) **before** the documents that point at
them. There is no dependency sorting; ordering is your responsibility. A single
spec that `$ref`s itself, or a forward reference to a doc defined later in the
same file, will not resolve.

## Output

One line per spec plus a final summary:

```
created=X updated=Y globals=Z errors=N
```

The process exits non-zero if any spec errors. A spec failure is logged and the
run continues to the next spec (so a bad ref late in a file doesn't undo earlier
writes), but the non-zero exit flags that the run was not clean.
