# Architecture Decision Records

Non-obvious technical decisions and the trade-offs accepted.

## When to add an ADR

Write one when a decision has real alternatives that a later reader would ask about, is costly to reverse, rests on
facts that may change (a vendor, a library's maturity, a regulation), or differs from what an experienced engineer
would assume. Skip conventions without trade-offs, descriptions that belong in `ARCHITECTURE.md`, and details the code
makes obvious.

## Format

`NNNN-kebab-case-title.md`, numbered in sequence and never reused. A superseded ADR stays, with
`Status: Superseded by NNNN`.

```markdown
# NNNN. Decision Title

**Status:** Accepted | Superseded by NNNN | Deprecated
**Date:** YYYY-MM-DD
**Revised:** YYYY-MM-DD (#PR, what changed)

## Context

The situation, the forces at play, the constraints.

## Options considered

- Option A — summary, key trade-off
- Option B — summary, key trade-off

## Decision

What we chose and why, in one tight paragraph.

## Consequences

- What we gain
- What we accept as cost

## Revisit when

A concrete trigger that reopens the decision.
```

**When a decision changes, revise it in place.** Rewrite the Decision (and whatever else it invalidates) to say what is
true now, and add one `Revised YYYY-MM-DD (#PR)` entry to the header. Don't stack dated notes above text that no longer
holds; the history is in git and `PROJECT_HISTORY.md`.

## Index

| #                                                | Title                                                           | Status   | Date       |
| ------------------------------------------------ | --------------------------------------------------------------- | -------- | ---------- |
| [0001](0001-tailwind-v3.md)                      | Use Tailwind CSS v3, not v4 or plain CSS                        | Accepted | 2026-05-14 |
| [0002](0002-auth-strategy.md)                    | Google Workspace SSO for `/admin` through custom OAuth handlers | Accepted | 2026-05-14 |
| [0003](0003-sequoyah-brand-narrative.md)         | Carry the Sequoyah heritage as brand depth                      | Accepted | 2026-05-20 |
| [0004](0004-postgres-18.md)                      | PostgreSQL 18                                                   | Accepted | 2026-05-29 |
| [0005](0005-isr-unstable-cache-tag-parity.md)    | ISR data caching via `unstable_cache` with tag parity           | Accepted | 2026-06-01 |
| [0006](0006-hubspot-consent-bridge.md)           | HubSpot consent bridge on `addPrivacyConsentListener`           | Accepted | 2026-06-03 |
| [0007](0007-read-timeout.md)                     | Server-read timeout: `Promise.race` as the outermost layer      | Accepted | 2026-06-05 |
| [0008](0008-media-cloudfront-serving.md)         | Serve Payload media from CloudFront `/media/*`                  | Accepted | 2026-06-09 |
| [0009](0009-block-first-composition.md)          | Two content primitives: block-composed Pages and Posts          | Accepted | 2026-06-14 |
| [0010](0010-site-chrome-code-owned.md)           | Site chrome is code-owned; the header menu is a collection      | Accepted | 2026-08-21 |
| [0011](0011-block-previews-committed-rasters.md) | Block picker previews are committed, derived rasters            | Accepted | 2026-08-26 |
| [0012](0012-one-shell-geometry.md)               | One source of truth for shell geometry                          | Accepted | 2026-09-05 |
| [0013](0013-thirteen-blocks.md)                  | Thirteen blocks, modelled on WordPress core                     | Accepted | 2026-09-24 |
| [0014](0014-tooling-works-from-live-database.md) | After launch, content tooling works from the live database      | Accepted | 2026-10-05 |
