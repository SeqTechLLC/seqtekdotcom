---
name: compose-page
description: "Compose a net-new SEQTEK page as a block `layout` from the existing block library, or name the single missing block. Use when asked to author, design, lay out, or draft a new page (workshop, case study, service, team, homepage, or a generic page) from a brief. Never hand-codes a page template."
argument-hint: "A page brief (purpose, sections, audience), optionally a target collection (page | workshop | case-study | service | team | homepage)"
user-invocable: true
disable-model-invocation: false
metadata:
  spec: "specs/010-block-page-composition"
  contract: "specs/010-block-page-composition/contracts/authoring-skill.md"
  requirement: "FR-010 (US3)"
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty). It is a page **brief**: the page's purpose, the sections it needs, its audience, and optionally a target collection.

## What this skill does

Turns a page brief into **exactly one** of:

1. A valid block **`layout`** — an ordered array of blocks drawn **only** from the existing block library, each block's fields populated, emitted as JSON ready to seed via the Local API `upsertBySlug` pattern. **No bespoke page code.**
2. A single named **block gap** — when the brief needs a capability no existing block provides, the one specific missing block (name + why), routed to the block-curation loop, **not** hand-coded.

This is ADR 0009's rule made operational: rearranging or building a page is a content edit; the only thing that needs code is a **new or fixed block type**. This skill never emits React/template code for a page (SC-006).

It is distinct from `convert-to-blocks` (which reproduces an *existing* page's content) — this one authors *net-new* pages from a brief.

## Procedure

### 1. Read the authoritative block list

`src/components/sections/registry.ts` is the **source of truth** for valid block slugs (the keys of the `registry` object). Read it first.

`docs/BLOCK_LIBRARY.md` §5 is the descriptive catalog (what each block is for, its fields, its category) and §6 is the page-composition matrix (which blocks typically build which page). Use it to choose blocks — but note it intentionally uses some friendlier names that are **not** slugs (e.g. it says `testimonial-single`/`testimonial-carousel`, the real slugs are `testimonial-block`/`featured-testimonials`; it says `latest-insights`, the slug is `post-list`; `related-content` → `related-posts`; `markets-map` → `map`; `newsletter-signup` → `newsletter-cta`; `workshop-progression` is a documented concept with no standalone slug). **When the doc and the registry disagree, the registry wins.** Only emit slugs that are keys in `registry`.

### 2. Start from the per-type skeleton (when a target collection is given)

If the brief names one of the collections that has a default skeleton (workshop, case study, service, team), read it under `src/payload/seed/skeletons/<type>.ts` and use it as the starting frame — it encodes the expected block order and the per-type SEO/JSON-LD-bearing blocks (hero, testimonial, contact CTA, etc.). A generic `pages` page and the `homepage` global have **no** skeleton (the homepage is composer-driven, `homepageToLayout.ts`); compose from the brief's sections directly. Specialized collections keep their typed metadata (slug, listing image, order, SEO, relationships) outside the `layout`; only the page **body** is composed here.

### 3. Map each section of the brief to a block

For each section the brief calls for, pick the **best-fit existing block**:

- Opening / banner → `hero` (generic), `case-study-hero`, `service-pillar-hero`, or `homepage-hero` by type.
- Prose / narrative → `content` (rich text; honors the reading column automatically — see §5). Side-by-side prose + media → `two-column`.
- Pictures → `image` (single captioned figure) or `gallery` (1..N images).
- Lists / methodology → `deliverables`, `process-steps`, `timeline`, `comparison-table`.
- Proof → `stats-bar`, `metric-display`, `logo-bar`/`client-logo-grid`, `testimonial-block`, `featured-testimonials`.
- Collection rollups → `case-study-grid`, `featured-case-study`, `service-cards`, `service-pillar-cards`, `team-grid`, `industry-grid`, `post-list`, `related-posts`, `workshop-list`.
- Conversion → `cta-section`, `contact-cta`, `newsletter-cta`, `hubspot-form`, `hubspot-meetings`, `download-card`.
- Q&A / progressive disclosure → `faq`, `accordion`, `tabs`.
- Media / external → `video-embed`, `embed`, `map`.
- Specialty → `mission-vision-values`, `brand-teaser`, `nav-cards`, `key-takeaways`, `tech-stack`, `locations-list`.

Populate each block's fields using its config in `src/payload/blocks/layout/<Block>.ts` for the exact field names and required fields. For `content`/`faq` answers, the body is a Lexical `richText` state (see the example fixtures and `src/payload/seed/showcase/lexical.ts` for the node shape).

### 4. Honor the cross-cutting rules

- **Reading column** (DESIGN_SYSTEM §11.4): enforced **centrally inside the block components**, not per page. Do not add wrapper markup or widths to fake it — just pick the block and, where offered, its `width` (e.g. `content.width`). The block centers the reading axis itself.
- **AICO / SEO** (CONTENT-REQUIREMENTS §8): for content-collection and homepage pages, include the blocks that carry the page's structured-data and conversion signals (hero, testimonial, stats, contact CTA) so JSON-LD and analytics stay intact.
- **Public copy**: no em dashes (an AI tell in SEQTEK copy). Every `image`/`gallery` upload needs alt text.

### 5. Decide: layout or gap

- If every section maps to an existing block → emit a **layout**.
- If a section needs a capability **no** block provides (e.g. a stateful client-side widget, a chart type nothing renders) → emit a **gap** naming the one missing block. Prefer the smallest, most reusable block that closes the gap, and point at the nearest existing block. Do **not** invent a slug into a layout, and do **not** hand-code the page. If more than one capability is missing, name the single highest-leverage one first; the curation loop adds it, then re-run.

### 6. Validate before returning

Every `blockType` you emit in a layout **must** be a key in `registry`. If any is not, it is a gap, not a layout. (`tests/int/skills/composePage.int.spec.ts` enforces exactly this against the committed examples.)

## Output format

Emit a single JSON object. **Exactly one** of these two shapes:

**Layout:**

```json
{
  "kind": "layout",
  "brief": "<the brief, paraphrased>",
  "collection": "pages | workshops | caseStudies | services | teamMembers | homepage",
  "layout": [
    { "blockType": "<registry slug>", "<field>": "<value>" }
  ]
}
```

**Gap:**

```json
{
  "kind": "gap",
  "brief": "<the brief, paraphrased>",
  "collection": "pages | workshops | caseStudies | services | teamMembers | homepage",
  "missingBlock": {
    "name": "<proposed-new-slug>",
    "reason": "<what capability is missing and why no existing block covers it>",
    "nearestExisting": "<closest registry slug, or omit>"
  }
}
```

`collection` is optional. For a layout, the JSON is ready to paste into a seed/upsert call as the record's `layout`. For a gap, hand the `missingBlock` to the block-curation loop (BLOCK_LIBRARY / FR-011) — adding the block is the one legitimate code path; once it lands, re-run this skill.

## Worked examples

Live, test-guarded examples are in `examples/`:

- [`examples/careers-page.json`](examples/careers-page.json) — a brief fully expressible with existing blocks → a `layout` (hero → content → stats-bar → deliverables → team-grid → faq → contact-cta).
- [`examples/savings-calculator-gap.json`](examples/savings-calculator-gap.json) — a brief whose centerpiece is an interactive widget no block provides → a single named `savings-calculator` gap.

These files are validated by `tests/int/skills/composePage.int.spec.ts`, so they cannot drift from the registry: every example layout uses only real slugs, and every named gap is a real gap.
