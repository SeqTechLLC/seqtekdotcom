# payload-export

Reads a Payload database over REST and writes it back out as request files for
[`payload-seed`](../payload-seed/README.md), with the media they reference. After cutover the database is the
content master and this is how its content comes back out as JSON (ADR 0014).

## Usage

```bash
IMPORT_TOKEN=<session-jwt> npm run payload:export -- <out-dir> [--base-url=<url>] [--only=services,homepage]
```

| Flag / env          | Meaning                                                                      |
| ------------------- | ---------------------------------------------------------------------------- |
| `<out-dir>`         | Where the files go. Created if missing.                                      |
| `--base-url=<url>`  | Source origin. Default `http://localhost:3100`, or `IMPORT_BASE_URL`.        |
| `--only=<a,b>`      | Write only these collections or globals. Every collection is still read.     |
| `IMPORT_TOKEN`      | Your `/admin` session JWT. Without it you read as a visitor and miss drafts. |
| `IMPORT_COOKIE`     | The gate cookie for a lane behind the ALB sign-in.                           |
| `IMPORT_TIMEOUT_MS` | Per-request timeout, default `60000`.                                        |

Getting the token and cookie is the same as for the seeder.

## Output

- One `NN-<slug>.json` per collection and global, numbered in load order, documents sorted by identity (`slug`;
  `label` for `navigation`, `quote` for `testimonials`). An empty collection writes no file, and removes a stale one.
- Relations become `$ref`, including the ids Lexical stores inside rich text. Media becomes `$file`, downloaded to
  `<out-dir>/media/`; a file already there at the same size is not fetched again.
- `$file` paths are relative to the directory the export ran from. Seed from the same directory.
- A published document exports as `published`; one that is not live exports as `unpublished`.
- Left out: ids, timestamps, array and block row ids, users, and media nothing references. `$file` carries alt text
  only, so a media focal point resets to the centre.

## Editing through JSON

Export the collection, edit it, load it as a draft, and publish from `/admin` after checking the version diff:

```bash
npm run payload:export -- out --only=services
npm run payload:seed -- out/07-services.json --draft
```

## Restoring an empty database

Load every file twice. The first pass creates every document as a draft, which skips validation; the second
resolves the references the first could not and sets each document's status.

```bash
for f in out/*.json; do npm run payload:seed -- "$f" --draft --allow-missing-refs; done
for f in out/*.json; do npm run payload:seed -- "$f"; done
```

Locally, start from an empty `media/`: Payload renames an upload whose filename is already on disk, and the second
pass then uploads everything again. Payload re-encodes an uploaded WebP, so a restored WebP is not byte-identical to
the export; PNG and JPEG are.
