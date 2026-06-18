---
name: convert-to-blocks
description: "Convert an EXISTING SEQTEK page into a block `layout` that reproduces its content, or name the single missing block. Use when asked to convert, port, migrate, or re-express an existing page (a migrated Payload record, a legacy Wix-audit page, or a hand-built page) as blocks. Reproduces source content; never authors new copy and never hand-codes a page."
argument-hint: "A pointer to an existing page: a collection+slug (e.g. workshops/touchstone), an audit page key, or a path to hand-built markup"
user-invocable: true
disable-model-invocation: false
metadata:
  spec: "specs/010-block-page-composition"
  contract: "specs/010-block-page-composition/contracts/conversion-skill.md"
  requirement: "FR-014 (US6)"
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty). It is a **pointer to an existing page** to convert: a migrated Payload record (collection+slug), a legacy Wix-audit page (a key into the audit JSON under `AUDIT_DIR`), or a hand-built page (a route/markup path).

## What this skill does

Reads an **existing** page and emits **exactly one** of:

1. A block **`layout` that reproduces the source** — an ordered array of blocks drawn **only** from the existing block library, reproducing the source's headings, prose, media, lists, CTAs, and embeds. Emitted as JSON ready to review and publish via the Local API `upsertBySlug` pattern. **No bespoke page code.**
2. A single named **block gap** — when the source layout cannot be expressed with existing blocks, the one specific missing block (name + why), routed to the block-curation loop, **not** hand-coded.

### How this differs from its two siblings

| | Reads the source? | Authors new copy? | Mechanism |
| --- | --- | --- | --- |
| **per-type seed composer** (`src/payload/seed/compose/*.ts`, FR-007) | yes — the migrated record's discrete fields | no | **code**: runs over the DB, writes `layout` via `upsertBySlug`, the migration mechanism of record |
| **`compose-page`** (FR-010) | no — works from a brief | **yes** — net-new copy | skill |
| **`convert-to-blocks`** (this, FR-014) | **yes** — any existing page | **no** — reproduces source | skill |

Use `compose-page` to design a *new* page from a brief. Use this skill to re-express an *existing* page as blocks. The per-type composer is the automated migration for the four specialized collections; this skill is the general, re-runnable converter for anything else (legacy Wix pages, hand-built pages) and for spot-converting a single record.

## Procedure

### 1. Read the source — do not assume it

- **Migrated Payload record** (`collection/slug`): read the live record via the Local API at depth 0 (`draft:false`, `overrideAccess:true`) and inventory its discrete body fields. For these, **mirror the per-type composer's mapping** in `src/payload/seed/compose/<type>ToLayout.ts` (and data-model.md) so this skill and the migration mechanism of record do not diverge — same block order, same field→block choices.
- **Wix-audit page**: read the page's JSON under `AUDIT_DIR` and inventory its sections (hero, prose, images, galleries, embeds, CTAs).
- **Hand-built page**: read the route/markup and inventory the rendered content.

### 2. Inventory the source content units

List every content unit the source carries: headings, prose paragraphs, images, galleries, video/embeds, lists, CTAs, testimonials, forms. This inventory is the reproduction checklist — nothing in it may be dropped.

### 3. Map each unit to an existing block (reproduction, not invention)

`src/components/sections/registry.ts` is the **authoritative slug set**; `docs/BLOCK_LIBRARY.md` §5 is the descriptive catalog and §5.8 is the retired-template coverage audit (the canonical "this capability → these blocks" mapping). The registry wins over any friendlier name in the docs.

Reproduce — do not rewrite. Carry the source's actual words, images, and links into block fields:

- headings + prose → `content` (Lexical body; reuse the source's own heading text)
- single figure → `image`; multiple images → `gallery`
- video / third-party widget → `video-embed` / `embed`
- lists → `deliverables`, `key-takeaways`, `process-steps`
- proof → `stats-bar`, `metric-display`, `testimonial-block`, `logo-bar`
- CTAs / forms → `cta-section`, `contact-cta`, `hubspot-form`, `download-card`

If the source asks for new wording the page does not already have, that is the authoring skill's job (`compose-page`), not this one.

### 4. Honor the cross-cutting rules

Reading column (DESIGN_SYSTEM §11.4) is enforced inside the block components — pick the block, don't fake widths. No em dashes in public copy. Every `image`/`gallery` upload needs alt text (carry the source's, or flag missing alt).

### 5. Decide: layout or gap

If every source unit maps to an existing block → emit a **layout** reproducing the source. If a unit needs a capability **no** block provides (a stateful client-side widget, an interaction nothing renders) → emit a **gap** naming the one missing block and pointing at the nearest existing block. Do **not** invent a slug into a layout, and do **not** hand-code the page.

### 6. Re-runnable

Conversion is a pure function of the source: the same source must always yield the same `layout`. Order blocks by the source's order (and, for migrated records, by the per-type composer's documented order). Re-pointing the skill at a future import (e.g. the full Wix audit) must reproduce, not churn.

### 7. Validate before returning

Every `blockType` must be a key in `registry`. For a migrated record, the block-type sequence must match the per-type composer's output for that record. (`tests/int/skills/convertToBlocks.int.spec.ts` enforces both, plus that every declared source unit is reproduced.)

## Output format

Emit a single JSON object — **exactly one** of these shapes. Both carry a `source` pointer and the `mustReproduce` content checklist.

**Layout:**

```json
{
  "kind": "layout",
  "source": {
    "ref": "workshops/touchstone",
    "type": "migrated-record | wix-audit | hand-built",
    "content": { "mustReproduce": ["<source unit>", "..."] }
  },
  "layout": [{ "blockType": "<registry slug>", "<field>": "<value>" }]
}
```

**Gap:**

```json
{
  "kind": "gap",
  "source": {
    "ref": "audit:localshoring-vs-offshore",
    "type": "migrated-record | wix-audit | hand-built",
    "content": { "mustReproduce": ["<source unit>", "..."] }
  },
  "missingBlock": {
    "name": "<proposed-new-slug>",
    "reason": "<what capability is missing and why no existing block covers it>",
    "nearestExisting": "<closest registry slug, or omit>"
  }
}
```

For a layout, the JSON is ready to review and publish via the upsert pattern. For a gap, hand the `missingBlock` to the block-curation loop (BLOCK_LIBRARY §5.9 / FR-011); once the block lands, re-run this skill.

## Worked examples

Live, test-guarded examples are in `examples/`:

- [`examples/migrated-workshop.json`](examples/migrated-workshop.json) — a migrated workshop record → a `layout` whose block sequence matches `composeWorkshopLayout` exactly (consistency with the composer of record) and reproduces every source unit.
- [`examples/wix-audit-page-gap.json`](examples/wix-audit-page-gap.json) — a legacy Wix page whose draggable before/after slider no block provides → a single named `image-comparison-slider` gap (the surrounding prose + CTA convert cleanly).

These files are validated by `tests/int/skills/convertToBlocks.int.spec.ts`: only real slugs, source content reproduced, migrated records consistent with the deterministic composer, and every named gap a real gap.
