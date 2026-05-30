# Contract: `migrateFromAudit.ts` seed CLI

**File**: `src/payload/seed/migrateFromAudit.ts`

**Cited from**: `docs/CONTENT_MIGRATION.md` §1, §7, §8.

## Invocation

```bash
AUDIT_DIR=~/projects/seqtek-internal/audit \
DATABASE_URL=postgres://... \
PAYLOAD_SECRET=... \
npx tsx src/payload/seed/migrateFromAudit.ts [flags]
```

## Flags

| Flag                  | Type    | Default | Effect                                                                                                                    |
| --------------------- | ------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`           | boolean | `false` | Planned upserts printed to stdout; no writes. (FR-033)                                                                    |
| `--collection=<name>` | string  | (all)   | Narrows processing to one collection. Valid values: `caseStudies`, `pages`, `posts`, `homepage`, `siteSettings`. (FR-033) |
| `--recrawl-images`    | boolean | `false` | Enables the per-record image download → media upload path. (R-10)                                                         |
| `--help`              | boolean | `false` | Prints usage and exits 0.                                                                                                 |

Unknown flags exit 2 with a usage message.

## Environment

| Variable         | Required | Default                                      | Purpose                                                   |
| ---------------- | -------- | -------------------------------------------- | --------------------------------------------------------- |
| `AUDIT_DIR`      | yes      | `~/projects/seqtek-internal/audit/` (FR-034) | Where the audit JSON files live.                          |
| `DATABASE_URL`   | yes      | none                                         | Postgres connection.                                      |
| `PAYLOAD_SECRET` | yes      | none                                         | Payload's signing secret.                                 |
| `S3_BUCKET`      | no       | none → local FS fallback                     | When set, media uploads go to S3 via the storage adapter. |

Missing required env vars → exit 1 with a message naming the missing variable.

## Exit codes

| Code | Meaning                                                                                              |
| ---- | ---------------------------------------------------------------------------------------------------- |
| 0    | Success (including dry-run that completed cleanly).                                                  |
| 1    | Setup error (missing env var, audit dir not readable, schema missing — run `payload migrate` first). |
| 2    | Bad CLI usage (unknown flag).                                                                        |
| 3    | Parse error in audit JSON (file present but malformed). Includes file path in stderr.                |
| 4    | Payload Local API error during upsert. Includes collection + slug in stderr.                         |

A run that completes with `migration-errors.log` entries still exits 0 — those are content gaps, not script failures.

## Output

- **stdout**: per-collection progress (e.g., `caseStudies: 8 processed, 5 created, 3 updated, 0 skipped`). `--dry-run` prints planned upserts in JSON-Lines format.
- **stderr**: warnings (audit-file boilerplate stripped lines surfaced for review, exit-code errors).
- **`./migration-errors.log`**: append-only structured log of content gaps per R-16 + FR-032. Gitignored.

## Idempotency

Per FR-030 and R-09: every upsert is `upsertBySlug(collection, doc)` via the Payload Local API. Re-running against a previously-seeded database produces zero new rows in every collection (SC-004). Verified by an integration test that runs the seed against a testcontainer twice and asserts row counts are equal across runs.

## Test contract

- `tests/int/seed/upsertIdempotency.test.ts` — SC-004 + FR-030.
- `tests/int/seed/slugRewrites.test.ts` — FR-031: feed an audit fixture with `case-study-3`; assert the created `caseStudies` doc has slug `mobile-apps-remote-operations`.
- `tests/int/seed/dryRun.test.ts` — FR-033: `--dry-run` produces stdout but zero database writes.
- `tests/int/seed/collectionFilter.test.ts` — FR-033: `--collection=posts` processes only posts and skips everything else.
- `tests/int/seed/migrationErrorsLog.test.ts` — SC-011 + FR-032: every known content gap in CONTENT_MIGRATION.md §11 is enumerated on a fresh run.

## Stability

- `AUDIT_DIR` defaulting to a user-home path (FR-034) keeps the audit out of the public repo per CLAUDE.md.
- The Local-API path (vs raw SQL) means schema changes flow through automatically — no SQL to update when a field is added.
