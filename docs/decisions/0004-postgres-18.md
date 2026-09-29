# 0004. PostgreSQL 18

**Status:** Accepted
**Date:** 2026-05-29
**Revised:** 2026-05-31 (#17, shipped)

## Context

The stack spike pinned PostgreSQL 16.4 without checking the current stable release. PostgreSQL 18 was stable and
supported on RDS. Payload's Postgres adapter uses `pg` v8, which speaks the stable wire protocol and has no
version-specific code paths.

## Options considered

- **Stay on 16** — validated, and drifting further behind.
- **17** — no longer current, so two upgrades within a year.
- **18** — current stable, on RDS and in the `postgres:18` image.

## Decision

PostgreSQL 18: `rds.PostgresEngineVersion.VER_18_3` in `infra/lib/data-stack.ts`, and `postgres:18` in
`docker-compose.yml`. It shipped in #17 with no application change.

## Consequences

- Current stable, with PostgreSQL 18's features (async I/O, skip-scan indexes, UUIDv7) available if a task needs them.
- Local databases needed a volume reset at the upgrade.

## Revisit when

Payload publishes a compatibility matrix that excludes 18, or RDS deprecates it.
