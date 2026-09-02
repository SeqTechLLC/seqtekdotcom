# payload-seed

A generic Payload **seeder**: upsert any collection document or global from a
JSON request file, over the REST API — no admin UI clicking, no DB access. It
resolves relations, images, and rich text at write time via directives.

This is the committed, generic counterpart to the per-type importers
(the case-study importer retired in spec 011). It shares the same REST client
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
| `--dry-run`            | Resolve + report intended ops; write nothing, upload nothing.         |
| `--allow-missing-refs` | Downgrade an unresolved non-omittable `$ref` from error to warn+drop. |
| `--json`               | One JSON result object on stdout; human log moves to stderr.          |
| `--check-orphans`      | After writing, warn about published docs this file does not mention.  |
| `IMPORT_TOKEN`         | Your `/admin` session JWT. Required unless `--dry-run`. Never logged. |
| `IMPORT_BASE_URL`      | Alternative to `--base-url`.                                          |
| `IMPORT_COOKIE`        | Raw `Cookie` header for a target behind an auth proxy. Unset locally. |
| `IMPORT_TIMEOUT_MS`    | Per-request timeout, default `60000`.                                 |

### Getting `IMPORT_TOKEN`

Auth is your own Google-SSO session — no API key, no schema change. Log into
`/admin` on the target environment, then copy the `payload-token` cookie value
(DevTools → Application → Cookies). Export it: `export IMPORT_TOKEN=<value>`.
The token expires with your session, so grab a fresh one per run.

### Getting `IMPORT_COOKIE` (gated environments only)

An environment can also sit behind an authenticating proxy in **front** of the
app. The pre-launch production site is gated by an ALB + Cognito rule, so every
path — `/api/*` included — 302s to the IdP before Payload ever sees the request,
and `IMPORT_TOKEN` alone gets you nowhere.

`IMPORT_COOKIE` carries that proxy's session cookie. It is a separate concern
from the token: **the proxy decides whether the request reaches the origin, the
JWT decides who you are once it does.** Both are needed to write to a gated
environment.

Sign in to the gated site in a browser, then copy the ALB session cookies
(DevTools → Application → Cookies) into one header value:

```sh
export IMPORT_COOKIE='AWSELBAuthSessionCookie-0=<value>; AWSELBAuthSessionCookie-1=<value>'
```

Leave it unset for local and staging, which are ungated. When it is missing or
expired the gate answers with an HTML sign-in page instead of JSON; the client
detects that and says so, rather than failing on an opaque JSON parse error.

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
  "global": "homepage",
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

**`--json`** replaces that with a single object on stdout — `ok`, `counts`,
`aborted`, `orphanCheck`, `orphanCheckError`, `orphans`, and a `results` entry
per spec — and moves the human log to stderr, so an unattended caller can assert
on a result rather than scrape log lines.

`orphanCheck` exists because an empty `orphans` list is ambiguous four ways:

| value             | meaning                                                           |
| ----------------- | ----------------------------------------------------------------- |
| `not-requested`   | `--check-orphans` was not passed                                  |
| `skipped-dry-run` | requested, but a dry-run writes nothing to compare against        |
| `skipped-aborted` | the run aborted before the check                                  |
| `failed`          | the check itself errored — `ok` is `false` and the exit code is 1 |
| `ok`              | the check ran; `orphans` is the answer                            |

Without it a failed check wrote to stderr while stdout still reported
`orphans: []` beside `ok: true` — a clean bill of health from a check that never
ran.

## What `--dry-run` now tells you

It performs no **writes** — but it does perform reads, when a token is present,
because that is what lets it say whether each spec would **create** or
**update**:

```
[dry-run] would update services:localshoring [published]
[dry-run] would create services:what-we-do [published]
```

It also resolves `$ref`s pointing at documents an **earlier spec in the same
file** would create, rather than reporting them as failures. Previously a
dry-run of `case-studies.json` always printed three unresolved `$ref`s that the
docs told you to ignore — noise a caller learns to skip past is worse than no
check, because the one real failure hides in it.

Order matters, and the check respects it: a `$ref` pointing at a document a
**later** spec creates is still reported unresolved, because that is what the
real run does. Only backward references resolve.

**With a token, a dry-run makes one read per spec** — that is what buys
create-vs-update. Against an unreachable or cookie-less gated lane, that means
one timeout per spec rather than an instant offline rehearsal. Unset
`IMPORT_TOKEN` (or lower `IMPORT_TIMEOUT_MS`) for a purely offline pass; it then
resolves as an anonymous reader, sees only published documents, and reports
`would unknown` rather than guessing.

On failure, `--json` still emits an object — `{ ok: false, stage, errors }`
where `stage` is `read`, `envelope`, `directives` or `auth`. The early exits are
the most likely outcomes for an unattended caller, so they are the last place
that should print nothing.

## What fails before anything is written

Two checks run up front, and neither needs a token or a server:

1. **Envelope** — `collection`/`global`, `identity`, `data`, `status`, and the
   identity value's presence in `data`.
2. **Directive structure** — `$ref` / `$file` / `$lexical` shapes, plus whether
   each local `$file.path` exists on disk.

Both collect every problem before returning, so one run tells you everything to
fix. Directive checks used to live inside the resolver, which runs per spec
interleaved with writes — so a malformed `$file` in spec 19 of 20 was found
_after_ eighteen documents had been written.

**Unknown top-level keys are still ignored** (content files park editorial notes
beside `collection`, and `_note` documents a spec in place) — but a key within
one edit of **`status`** or **`identity`** is an **error**. Those two are the
only keys where a typo is silently harmful, because they are the only two with
defaults: `"stauts": "unpublished"` publishes what you meant to retire, and a
misspelled `identity` silently falls back to `slug`. A typo in `collection`,
`global` or `data` leaves a required key absent and is already rejected with a
clear message. Prefix a key with `_` to mark it deliberate.

The net is deliberately narrow — one edit (counting a transposition as one, so
`stauts` is caught), against two targets. `date`, `meta`, `state`, `entity`,
`notes`, `title` and `tags` all pass.

## What it will not do: retire

The tool is **upsert-only**. A request file says what to write; it never says
what to remove, so **deleting a document from a file leaves it published**. This
has bitten twice — the `taurex` umbrella stayed live for weeks, and nine legacy
service documents survived a restructure and stayed in the sitemap.

To take a document down, say so:

```json
{
  "collection": "services",
  "identity": "slug",
  "status": "unpublished",
  "data": { "slug": "old-thing" }
}
```

`unpublished` writes `_status: 'draft'` — the document and its version history
survive, so it can be re-published. Pass **`--check-orphans`** to have the run
warn about published documents in the touched collections that the file does not
mention. It is opt-in because seeding one document on purpose would otherwise
report every other document as an orphan. Documents already retired
(`_status: 'draft'`) are **not** reported — the check filters them out
client-side, since an admin token bypasses the access rule that would otherwise
do it, and `categories` / `industries` / `locations` have no `_status` field to
filter on server-side.

## Failure modes worth knowing

- **Auth is fatal, not per-document.** A 401/403 aborts the run rather than
  repeating against every remaining spec. Re-running after minting a fresh token
  is safe — every write is an idempotent upsert.
- **Requests time out** (default 60s). A gated lane reached without its session
  cookie stalls rather than refusing, and a hang is indistinguishable from slow
  progress; `IMPORT_TIMEOUT_MS` adjusts it.
- **Partial application leaves side effects.** A spec that uploads media and
  creates a taxonomy doc, then fails on the main upsert, leaves those behind.
  Re-running dedupes rather than duplicating, so this is litter, not corruption.
- **A 2xx is not proof the page renders.** The seeder cannot tell you that the
  document it wrote has a body worth showing.
