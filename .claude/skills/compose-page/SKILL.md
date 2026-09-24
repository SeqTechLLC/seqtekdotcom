---
name: compose-page
description: "Compose a SEQTEK page as a block `layout` from the thirteen-block set. Use when asked to author, lay out, or draft a page (service, industry, market, case study, workshop, team member, homepage, or a generic page) from a brief or source material. Never hand-codes a page template and never adds a block."
argument-hint: "A page brief or source material, optionally a target collection (pages | services | industries | caseStudies | workshops | teamMembers | homepage)"
user-invocable: true
disable-model-invocation: false
metadata:
  contract: "docs/contracts/authoring-skill.md"
  requirement: "ADR 0013"
---

## User Input

```text
$ARGUMENTS
```

The input is a brief or source material for one page. Consider it before proceeding.

## What this skill does

Turns the brief into a block `layout` (an ordered array of blocks) ready to go into the content JSON and load with
`tools/payload-seed`. It uses only the thirteen blocks in `src/components/sections/registry.ts`. It never writes page
code and never adds a block (ADR 0013).

If a page genuinely cannot be composed, return a **gap** instead (shape below) and stop. A gap goes to Kenn; it is
not built without his sign-off, and the fix is almost always an option on an existing block.

## The blocks

Exact fields: `src/payload/blocks/layout/<Block>.ts`. Spec: `docs/planning/block-consolidation.md`.

| Block | Use it for |
| --- | --- |
| `hero` | The page opener. `split` with an image is the default; `cover` for the homepage or a campaign page; `text-only` only when there is truly no image. |
| `content` | Prose. Short: one idea, a heading and two or three paragraphs. |
| `media-text` | A point that has a picture: image on one side, a short heading, text and a link on the other. Alternate left and right. |
| `items` | Anything that is several parallel things: steps (`numbers`, or `line` down the page), principles or an acronym (`line` + `custom` letters), features (`grid`, plain or card), stats (`grid` + `custom` markers like "25+"), a timeline (`line` + dates), deliverables (`list`), technologies (`tags`). |
| `cards` | Documents from a collection: case studies, posts, services, industries, workshops, team, locations, partners. Automatic (all, filtered) or hand-picked. `featured` makes the first one large. |
| `image` / `gallery` | A picture, a set of pictures, or a logo strip (`gallery` layout `logos`). |
| `quote` | A testimonial, or a pull quote with attribution. |
| `cta` | The close: buttons, book a meeting, newsletter signup, or a download. |
| `table` | A real comparison across columns. |
| `accordion` | FAQs or details, as an accordion or tabs. |
| `embed` | A video, a map, or an embedded page. |
| `hubspot-form` | A HubSpot form. |

## Composition rules (these are what keep a page from reading as a wall of text)

1. **Open with a `split` hero** carrying the page's art.
2. **Never put two `content` blocks in a row.** If a section of prose lists several things, it is an `items` block.
   If it makes one point that has a picture, it is `media-text`.
3. **Keep every section short.** A `content` block is one idea of about 150 words at most. Split anything longer.
4. **Vary the rhythm.** Consecutive sections use different blocks or different layouts. Alternate `media-text` sides,
   and use `background` (subtle, accent, inverse) to separate bands.
5. **Put proof where the claim is.** Numbers become an `items` stats row, a client's words become a `quote`, and the
   work becomes `cards` of case studies.
6. **End with a `cta`.**

## Facts

Copy comes from the source material and the existing content. Never invent a client, a number, a quote, an office, a
date or a claim. If the page needs a fact nobody has supplied, leave that section out and name the missing fact in
your response. Public copy has no em dashes. Every image needs plain alt text.

## Validate before returning

Every `blockType` must be a key in `registry`. Required fields must be present. Relationship and upload values in the
content JSON use the seeder's directives (`$ref`, `$file`, `$lexical`; see `tools/payload-seed/README.md`).

## Output

Exactly one of:

```json
{ "kind": "layout", "brief": "<paraphrased>", "collection": "<collection>", "layout": [{ "blockType": "<slug>" }] }
```

```json
{
  "kind": "gap",
  "brief": "<paraphrased>",
  "missingBlock": { "name": "<what is missing>", "reason": "<why no block or option covers it>", "nearestExisting": "<slug>" }
}
```

Examples in `examples/` are validated by `tests/int/skills/composePage.int.spec.ts`.
