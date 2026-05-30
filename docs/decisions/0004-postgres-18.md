# 0004. Move to PostgreSQL 18

**Status:** Accepted
**Date:** 2026-05-29

## Context

The stack-validation spike (ROADMAP D-13) pinned both local Docker Compose Postgres and the staging/prod RDS CDK (`infra/lib/data-stack.ts:54`, `rds.PostgresEngineVersion.VER_16_4`) to **PostgreSQL 16.4**. The choice was framed as "match prod parity, conservative pin," but the underlying reason was that the latest stable version wasn't checked during the spike. PostgreSQL 17 had been GA for over a year and PostgreSQL 18 (the current stable) had been GA for ~8 months at the time of the spike.

The original Constitution principle V ("Bleeding-Edge Stack, Pinned and Defensive") explicitly asks us to track current stable releases. PG 16 silently violated that for the database layer. The other parts of the stack (Next 16, React 19, Payload 3.85) are on current stable; the DB lagged.

## Options considered

- **Stay on PG 16.4.** Conservative, validated by D-13. Loses async I/O, skip-scan, UUIDv7, and other PG 17/18 features. Drifts further from current stable on every Postgres release.
- **Bump to PG 17.x.** Halfway. PG 17 is no longer the current stable. Two bumps in 12 months instead of one.
- **Bump to PG 18.x.** Current stable, RDS-supported, available in `postgres:18` Docker image. Payload's `@payloadcms/db-postgres@^3.85` has no `engines` field, no peer dep on `pg`, and no version constraint in the public docs; the internal dep is `pg@8.20.0` (node-postgres v8) which speaks PG 10+. The wire protocol is backwards-compatible, so the adapter has no PG-version-specific code paths.

## Decision

Move to **PostgreSQL 18** at the next convenient infrastructure-touching milestone — most likely **Phase 5.5** when `payload migrate:create` becomes routine and `push: true` flips off. Bumping at that point pairs naturally with cutting the first real migration baseline.

The bump is a small mechanical change:

1. `infra/lib/data-stack.ts:54` — `rds.PostgresEngineVersion.VER_18_x` (whichever minor is current on RDS at the time)
2. `docker-compose.yml` — `image: postgres:18`
3. `docs/LOCAL_DEVELOPMENT.md:106` — update the "matches the same Postgres major version as production RDS" copy if it cites a number elsewhere
4. Re-verify the stack with a small spike (Payload boot + admin login + `npm run test`) — this changes a load-bearing pin

No application code changes expected — Payload's adapter is version-agnostic at the SQL layer.

## Consequences

- **Gain:** Current stable, in line with Constitution V. We stop accruing version debt on the DB.
- **Gain:** Optional access to PG 18 features (async I/O, skip-scan indexes, UUIDv7 generation) if/when a perf or schema task warrants them.
- **Gain:** Closes a documented spec-design failure: the original pin wasn't justified by trade-off, it was justified by "I didn't check."
- **Cost:** A small re-verification spike (≈half day) when the bump lands.
- **Cost:** Local dev Docker volume needs `docker compose down -v` on cutover; data is re-seeded by the showcase + audit seeds, so no real loss.

## Revisit when

- Phase 5.5 actually lands, to confirm the bump is still ergonomic at that moment.
- If a Payload release ever publishes an explicit PG version compatibility matrix that excludes 18 (currently it doesn't).
- If RDS deprecates PG 18 before we've shipped — at which point we re-pin to whatever's current stable.

## Related

- **0001-tailwind-v3** — same Constitution V pattern: pinning a stack component required checking what was actually stable at the time, not what training data suggested.
- ROADMAP Phase 5.5 (migrations cutover) — the natural moment to ship this bump.
