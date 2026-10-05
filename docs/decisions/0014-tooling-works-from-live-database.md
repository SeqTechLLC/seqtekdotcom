# 0014. After launch, content tooling works from the live database

**Status:** Accepted
**Date:** 2026-10-05

## Context

Content is generated and edited as JSON with AI-assisted tooling and loaded with `tools/payload-seed`. That carried
the site through the block consolidation, the baseline squash and every lane rebuild, and it stays the main way
content is made after launch.

The marketing editor will also make small changes in `/admin`. The seeder writes every field a file carries, so
loading a file written before such an edit overwrites the edit without warning. Hand-maintained JSON also goes stale
when the schema changes. The lane databases are reachable only over REST.

## Options considered

- **The JSON stays the master.** `/admin` edits are forbidden, or copied back into the JSON by hand.
- **Two masters, reconciled.** A three-way merge of each file against the live document before every load.
- **The database holds the state; tooling pulls it before changing it.** Chosen.
- **Retire the JSON pipeline after launch.** Content would be made by hand in `/admin`.

## Decision

Until cutover the content JSON is the master and databases are rebuilt from it. From cutover the production
database holds the content and the JSON is a working copy of it:

- Most changes are made by tooling. `tools/payload-export` pulls the current content as seeder files, AI-assisted
  tooling generates or edits them, and `tools/payload-seed` loads them back.
- The marketing editor makes small changes in `/admin`. Tooling starts from a fresh export, so it does not overwrite
  them, and the seeder refuses a file older than the document it would overwrite (ROADMAP CM-2).
- Loading with `--draft` stages a change for review in `/admin` instead of publishing it.
- Exports are committed to the content repo.

## Consequences

- One copy of the state, so nothing drifts. The JSON is regenerated rather than kept in step by hand, so it is
  always in the current schema's shape.
- Content still never needs a deploy (ADR 0009, ADR 0013).
- Recovery after cutover is RDS backups, document versions and the latest export, not a rebuild from hand-written
  JSON. A schema change becomes a migration over live data (runbook §2).
- A database restored from an export is loaded twice: the first pass creates every document, the second resolves the
  references the first could not.

## Revisit when

The seeder's stale-file check refuses loads often enough to slow the tooling down: tooling and `/admin` are then
editing the same documents.
