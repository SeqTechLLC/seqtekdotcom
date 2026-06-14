# 0009. Two content primitives: block-composed Pages and Posts; no bespoke templates

**Status:** Accepted
**Date:** 2026-06-14

## Context

The site grew two parallel content models:

- **Shape A — block composition.** The `pages` collection has a `layout` blocks array rendered by `RenderBlocks`; editors compose pages from a ~34-block library (Content, TwoColumn, HubspotForm, DownloadCard, VideoEmbed, Deliverables, TestimonialBlock, TeamGrid, MetricDisplay, ClientLogoGrid, …). Layout is editable in the admin with **no code change**. `/about` uses this.
- **Shape B — bespoke structured templates.** `caseStudies`, `workshops`, `services` (and the homepage global, `team`, localshoring) expose discrete typed richText/array fields rendered by hand-coded per-route templates (`<type>/[slug]/page.tsx`). Content is editable; **layout is hardcoded in React.**

Shape B was chosen in spec 004 (route-render "shapes") to guarantee uniform structure and reliable listing-card + JSON-LD/SEO data per type. In practice it has cost more than it returned:

- **Layout changes require code + deploy.** A single reading-column/centering bug had to be fixed in four separate templates because each re-implements layout. Swapping two sections, or enriching a page, is a code change.
- **It re-implements blocks that already exist.** The workshop template hand-codes a deliverables list, testimonial, video embed, HubSpot form, and download card inline — every one of which is already a registered block (`deliverables`, `testimonial-block`, `video-embed`, `hubspot-form`, `download-card`, `team-grid`).
- The marquee pages need to get richer (images, diagrams, infographics) — exactly what the rigid templates obstruct.

The product requirement, stated plainly by the owner: **rearranging, swapping, or enriching content on a page must never require a code change or deploy. Only adding or fixing an element _type_ (a block) may require code.** The mental model is WordPress: there are _Pages_ and _Posts_; specialized content is "a page plus some metadata," not a new rendering engine.

## Options considered

- **A — Keep Shape B, fix templates as needed.** Cheapest now. Fails the requirement: every layout change stays a code change and the bug surface is duplicated per template.
- **B — Per-type `layout` arrays (hybrid).** Give each marquee type a blocks array alongside its discrete fields. Fixes layout-in-code, but leaves N special collections and a half-structured/half-block model to reason about.
- **C — Two primitives + metadata collections (chosen).** Collapse the model to two render paths — **Page** (block-composed) and **Post** (blog) — and nothing else. Specialized types exist only as collections that attach typed metadata (SEO, navigation, listing, relationships) to a Page-shaped block body. No type gets a bespoke render template.

## Decision

Adopt **Option C**. The site has exactly two content primitives:

1. **Page** — a `layout` blocks array composed from the shared block library and rendered by `RenderBlocks`. All page layout lives here.
2. **Post** — the blog/insights long-form type, body also block-composable.

Every specialized type (case study, workshop, service, team member, …) is **a Page + typed metadata**: a collection that adds the SEO/navigation/listing/relationship fields its index pages and schema genuinely need, over a block-composed body. Bespoke per-type render templates are retired in favour of `RenderBlocks`. The block library is the single place layout lives. **The only change that requires code and a deploy is creating or fixing a block type.** Uniformity, where wanted, comes from seeding new documents with a default block skeleton (a content-level template), not from code.

To make this usable, two supporting deliverables are in scope (defined by the follow-on spec): a **content-authoring skill** that designs pages from the existing block library, and a **block-curation loop** — when a desired layout can't be expressed, the resolution is to fix or add a block (the one legitimate code path), not to hand-build a page.

## Consequences

- **Gain:** layout, ordering, and richness of every page are editor-controlled with no code or deploy; one fix to a block fixes it everywhere; marquee pages can reach `/about`-level richness; we stop re-implementing blocks that already exist.
- **Gain:** the demonstration goal — a genuinely CMS-driven site — holds end to end, and the mental model collapses to two primitives anyone can reason about.
- **Cost:** a real migration — add `layout` to the specialized collections (or fold them into `pages`), migrate discrete-field content into equivalent blocks, retire the bespoke template bodies, preserve listings/SEO off the metadata, and build the few missing blocks (e.g. an image/gallery block). One-time effort + content re-seed.
- **Cost:** structure is no longer enforced by the schema; consistency relies on the default skeleton, the authoring skill, and a curated block set rather than required per-section fields.
- **Cost:** new tooling to own — the content-authoring skill and the block-curation process — and ongoing block-library stewardship (`BLOCK_LIBRARY.md`).

## Revisit when

A content type emerges whose structure is genuinely fixed and machine-consumed (not presentational) such that free composition is a liability, or editors routinely produce off-brand pages that the curated block set + seeded skeleton can't contain — in which case a tighter structured shell for that specific type may again beat free composition.
