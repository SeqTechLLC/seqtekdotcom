# ADR 0013 — Thirteen blocks, modelled on WordPress core

**Status:** Accepted
**Date:** 2026-09-24
**Constrains:** ADR 0009 (block-first composition)

## Context

ADR 0009 made every page a composition of blocks. The library then grew one block per page type: a hero per
page type, a card grid per collection, a call to action per conversion type. By 2026-09-24 it held 45 layout
blocks. Measured against the published content that day:

|                                                             |     |
| ----------------------------------------------------------- | --- |
| Blocks never used                                           | 18  |
| Blocks used once                                            | 11  |
| Share of all block uses taken by the top seven              | 78% |
| Share taken by `content` (rich text) alone                  | 35% |
| Numeric caps on fields (`maxRows`, `maxLength`, `max`, ...) | 40  |

The visual blocks (`image`, `gallery`, `timeline`, `two-column`, `stats-bar`) were almost unused, so pages read
as walls of text. New content kept needing code: a seventh CADENCE principle against a six-step cap, a new look
built as a new block rather than an option on an existing one. Content is loaded from JSON by tooling, with
LLM-assisted composition to come, so every content-driven code change breaks that pipeline.

## Options considered

- **Keep the 45, fix the caps** — cheapest, but an author or an LLM still chooses among overlapping blocks, and the
  per-page-type pattern keeps adding more.
- **Free nesting (WordPress Group and Columns inside everything)** — most flexible, but design drift and deep JSON
  that is harder to compose correctly.
- **A small fixed set shaped by content, not by page type, modelled on WordPress core** — chosen.

## Decision

Thirteen section-level blocks (`hero`, `content`, `media-text`, `items`, `cards`, `image`, `gallery`, `quote`, `cta`,
`table`, `accordion`, `embed`, `hubspot-form`), each with options where the old library had separate blocks. No numeric
caps. The list is pinned by a test, and adding to it needs the site owner's sign-off. Spec and mapping:
`docs/planning/block-consolidation.md`.

## Consequences

- Any ordinary page composes from the set with no code change. Market pages are the standing test.
- An LLM composing a page picks from 13 distinct blocks with explicit options instead of 45 overlapping ones.
- A new look costs an option and a test, not a block, a migration and a picker entry.
- Cost: one large migration and a rewrite of the content JSON. The migration drops every old block table and
  converts three legacy values in place (hero `with-image`, embed pixel heights, plain-text accordion bodies);
  environments then reload the content from the JSON.

## Revisit when

A page genuinely cannot be composed from the set. Record the page and what it needed, and add an option before
considering a block.
