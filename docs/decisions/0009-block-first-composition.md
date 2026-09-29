# 0009. Two content primitives: block-composed Pages and Posts; no bespoke templates

**Status:** Accepted
**Date:** 2026-06-14
**Revised:** 2026-09-02 (#131, services are a routed metadata collection). Constrained by ADR 0012 and ADR 0013.

## Context

The site had two content models: block-composed `pages`, whose layout editors control, and typed collections (case
studies, workshops, services, team) rendered by hand-written per-type templates whose layout lived in React. Layout
changes needed code and a deploy, one layout bug had to be fixed in four templates, and the templates re-implemented
blocks that already existed. The requirement: rearranging, swapping or enriching a page must never need code; only
adding or fixing a block type may.

## Options considered

- **Keep the templates** — fails the requirement.
- **A `layout` array beside each type's discrete fields** — half-structured, half-blocks.
- **Two primitives plus metadata collections** — chosen.

## Decision

Two content primitives: a **Page**, a `layout` of blocks rendered by `RenderBlocks`, and a **Post**, the blog's
rich-text long-form type. Every specialised type is a collection of typed metadata (SEO, listing, relationships, route)
over a block-composed body, with no bespoke template; `partners` is the reference implementation (P5-22). The only
change that needs code and a deploy is creating or fixing a block. Consistency comes from seeded skeletons, not code.

`/case-studies`, `/insights` and `/contact` remain route files: converting them needs pagination in a block-composed
listing, and would replace the curated contact form.

## Consequences

- Layout, order and richness are editor-controlled with no deploy, and one block fix applies everywhere.
- The schema no longer enforces structure; consistency relies on skeletons, the compose-page skill and the curated block
  set.
- The block library needs ongoing stewardship (`BLOCK_LIBRARY.md`).

## Revisit when

A type's structure is fixed and machine-consumed rather than presentational, or editors routinely produce off-brand
pages that the block set and skeletons cannot contain.
