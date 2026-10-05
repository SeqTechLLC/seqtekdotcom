# 0014. After launch the database is the content master

**Status:** Accepted
**Date:** 2026-10-05

## Context

Content is written as JSON in the private content repo and loaded with `tools/payload-seed` into an empty database.
That carried the site through the block consolidation, the baseline squash and every lane rebuild.

The seeder writes every field a file carries. Once anyone edits a document in `/admin`, reloading that file
overwrites the edit without warning, so the JSON and the database cannot both be edited. The marketing editor has
asked to make small changes in `/admin`. Payload already gives editors drafts, 50 versions per document with
restore, live preview, scheduled publishing and roles. The lane databases are reachable only over REST.

## Options considered

- **The JSON stays the master after launch.** Every edit, a typo included, goes through git and a load, and edits in
  `/admin` are forbidden or reconciled by hand.
- **Two masters, reconciled.** A three-way merge of each file against the live document before every load; conflicts
  surface at load time to whoever runs it.
- **The database becomes the master; JSON becomes the import and export format.** Chosen.
- **Retire the JSON pipeline.** Loses bulk and LLM-composed loading, and the only portable copy of the content.

## Decision

Until cutover the content JSON is the master and databases are rebuilt from it. From cutover the production
database is the master:

- Editors work in `/admin`.
- `tools/payload-seed` loads new and bulk content. Against an existing document it runs with `--draft`, which stages a
  draft version beside the published one for review in `/admin`.
- `tools/payload-export` reads a database over REST into seeder-format JSON and its media files. An edit made through
  JSON starts from a fresh export, so it cannot overwrite an `/admin` edit. Exports are committed to the content repo.
- AI-assisted editing writes drafts into Payload; a person publishes in `/admin`.

## Consequences

- One master, so no drift. Content still never needs a deploy (ADR 0009, ADR 0013).
- Content recovery after cutover is RDS backups, document versions and the latest export, not a rebuild from
  hand-written JSON. A schema change becomes a migration over live data (runbook §2).
- An export is only as current as its last run. Hand-written JSON in the content repo stops being authoritative.
- A database restored from an export is loaded twice: the first pass creates every document, the second resolves the
  references the first could not.

## Revisit when

More edits arrive through JSON than through `/admin`, or publishing needs a review gate that Payload's drafts do not
provide.
