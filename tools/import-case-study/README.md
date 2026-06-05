# import-case-study

Create or update a single case study from a JSON file, over the Payload REST
API — no admin UI clicking. Idempotent by slug (re-running updates in place),
lands as a **draft** by default, and works against local, staging, or prod by
pointing `--base-url` at the right origin.

It reuses the same text→Lexical converter as the audit-seed pipeline
(`src/payload/seed/htmlToLexical.ts`), so prose lands in the exact shape the
admin and seed produce.

## Usage

```bash
# Preview against local dev (no token needed, no writes):
tsx tools/import-case-study/index.ts ./study.json --dry-run

# Import to local dev (server on :3100), leaves a draft:
IMPORT_TOKEN=<session-jwt> tsx tools/import-case-study/index.ts ./study.json

# Import to staging and publish immediately:
IMPORT_TOKEN=<session-jwt> tsx tools/import-case-study/index.ts ./study.json \
  --base-url=https://seqtek-preview.com --publish
```

| Flag / env         | Meaning                                                               |
| ------------------ | --------------------------------------------------------------------- |
| `<file.json>`      | Path to the case-study JSON (positional, required).                   |
| `--base-url=<url>` | Target origin. Default `http://localhost:3100`, or `IMPORT_BASE_URL`. |
| `--publish`        | Publish on import. Default: leave a draft for editor review.          |
| `--dry-run`        | Resolve relations + assemble the payload, print it, write nothing.    |
| `IMPORT_TOKEN`     | Your `/admin` session JWT. Required unless `--dry-run`.               |

## Getting `IMPORT_TOKEN`

Auth is your own Google-SSO session — no API key, no schema change. The tool
sends `Authorization: JWT <token>`, which Payload's built-in JWT strategy reads.

1. Log into `/admin` on the target environment (Google SSO).
2. Open DevTools → Application → Cookies → copy the value of `payload-token`.
   (Or run `document.cookie.split('; ').find(c => c.startsWith('payload-token='))?.split('=')[1]` in the console.)
3. Export it: `export IMPORT_TOKEN=<that-value>`

The token expires with your session, so grab a fresh one per import run. Your
role (`admin`/`editor`) must allow `create`/`update` on `caseStudies` — it does
by default for both roles.

## JSON shape

See [`example.json`](./example.json) for a complete, valid example.

- **Required:** `slug`, `title`, `industry` (an existing `industries` slug),
  `heroImage` (`{ file | url, alt }`).
- **Relations by slug:** `industry` (required, hard error if missing),
  `services[]` and `relatedCaseStudies[]` (optional; unknown slugs warn + skip,
  related is capped at 3).
- **Images:** `heroImage`, `client.logo`, `seo.ogImage` each take
  `{ file: "./local/path" }` **or** `{ url: "https://…" }`, plus a required
  `alt`. Uploaded to the media collection first, then referenced. Same 25 MB /
  MIME guards as the collection (jpeg, png, webp, avif, gif, pdf).
- **Prose:** `problem`, `solution`, `impact` are plain text. Blank lines split
  paragraphs; `- ` / `•` lines become bullet lists; a leading `N. ` line
  becomes a heading; a fully quoted line becomes a blockquote.
- **`testimonial`:** testimonials have no slug, so pass a document **ID** here,
  or omit it and link the testimonial in `/admin` afterward.
- **`metrics`:** `[{ number, label, context? }]`. **`technologies`:** a string
  array, stored as `{ label }[]`.

## Notes

- **Drafts skip required-field validation** in Payload, but this tool still
  enforces `industry` + `heroImage` up front so a draft is never half-built.
- Run `--dry-run` first when authoring a new file; it validates the JSON and
  confirms every relation slug resolves before you write anything.
