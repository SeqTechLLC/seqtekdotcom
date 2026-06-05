# Architecture Decision Records

This directory captures non-obvious technical decisions and the trade-offs accepted.

## When to add an ADR

Write one when:

- A decision has real alternatives, and someone reading the code later would ask "why this and not X?"
- The decision will be costly to reverse
- The reasoning depends on facts that might change (a vendor's roadmap, a library's maturity, a regulatory constraint)
- The decision differs from what an experienced engineer would assume by default

Skip when:

- It's a convention without trade-offs (e.g., "use 2-space indent")
- It's documented in the active design docs already (ARCHITECTURE.md, INTEGRATIONS.md, etc.) and isn't really a "decision," just a description
- It's an implementation detail that will be obvious from the code

## Format

Each ADR is a short Markdown file at `NNNN-kebab-case-title.md`, where `NNNN` is a zero-padded sequence number. Numbers are never reused — superseded decisions stay in place with a `Status: Superseded by NNNN` line.

```markdown
# NNNN. Decision Title

**Status:** Accepted | Superseded by NNNN | Deprecated
**Date:** YYYY-MM-DD

## Context

What's the situation, what forces are at play, what constraints matter.

## Options considered

- Option A — short summary, key trade-off
- Option B — short summary, key trade-off
- Option C — short summary, key trade-off

## Decision

What we chose and why, in one tight paragraph.

## Consequences

- What we gain (be specific)
- What we accept as cost (be specific)

## Revisit when

A concrete trigger that should reopen this decision (e.g., "we hit X scale," "vendor Y changes pricing model," "library Z reaches 1.0").
```

## Index

| #                                             | Title                                                  | Status   | Date       |
| --------------------------------------------- | ------------------------------------------------------ | -------- | ---------- |
| [0001](0001-tailwind-v3.md)                   | Use Tailwind CSS v3, not v4 or plain CSS               | Accepted | 2026-05-14 |
| [0002](0002-auth-strategy.md)                 | Payload local auth in spike, Google OAuth in Phase 1   | Accepted | 2026-05-14 |
| [0003](0003-sequoyah-brand-narrative.md)      | Lean into the Sequoyah heritage as brand depth         | Accepted | 2026-05-20 |
| [0004](0004-postgres-18.md)                   | Move to PostgreSQL 18                                  | Accepted | 2026-05-29 |
| [0005](0005-isr-unstable-cache-tag-parity.md) | ISR caching via `unstable_cache` with tag parity       | Accepted | 2026-06-01 |
| [0006](0006-hubspot-consent-bridge.md)        | HubSpot consent bridge: official listener, fail-closed | Accepted | 2026-06-03 |
| [0007](0007-read-timeout.md)                  | Server-read timeout: `Promise.race` outermost layer    | Accepted | 2026-06-05 |
