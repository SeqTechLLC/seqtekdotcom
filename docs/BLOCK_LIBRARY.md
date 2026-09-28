# SEQTEK Website — Block & Component Library

**Date:** 2026-05-14
**Updated:** 2026-09-24 — thirteen blocks (ADR 0013)
**Status:** Reference

This is the engineering bridge between **what** content lives on the site (CONTENT-REQUIREMENTS.md) and **how** Payload + React represent it. It enumerates every block, primitive, and section component, with field schemas and page-composition mappings.

For Payload field-type reference, see PAYLOAD_DEVELOPMENT.md §5–6.
For visual treatment (color, type, spacing), see DESIGN_SYSTEM.md.

---

## 1. Schema philosophy: when to use blocks vs structured fields

Payload supports two ways to model page content:

- **Structured fields** — fixed schema, predictable shape (e.g., a `CaseStudies` collection always has `problem`, `solution`, `impact`).
- **Blocks (`type: blocks`)** — polymorphic, repeatable, editor-arranged (e.g., a `Page` can stack Hero + Stats + Content + CTA in any order).

**As of spec 010 / ADR 0009 this choice is largely settled: two content primitives.** Every non-blog page renders its body from a `layout` blocks array through `RenderBlocks`; only the blog Post keeps a bespoke richText article body. The "structured vs blocks" tension below is now mostly historical context — the rule of thumb still governs _new_ models, but the specialized detail types have all moved to blocks (keeping their typed metadata: slug, listing image, SEO, relationships).

| Collection / Global  | Body approach                              | Notes                                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pages`              | **Blocks** (`layout`)                      | The reference model; generic content pages composed freely                                                                                                                                                                                                 |
| `homepage` (global)  | **Blocks** (`layout`)                      | spec 010: was structured; now block-composed and editor-reorderable (composer adds the dual-CTA hero defaults)                                                                                                                                             |
| `caseStudies`        | **Blocks** (`layout`)                      | spec 010: was structured (problem/solution/impact/metrics/…); composed into blocks, typed metadata retained                                                                                                                                                |
| `services`           | **Blocks** (`layout`)                      | spec 010: was structured; composed. SVC-2: **publicly routed again** at a flat `/services/<slug>`, one collection carrying `tier` (`leaf`/`group`/`axis`). The nested `/services/[pillar]/[slug]` URL and the later four-Pages-by-slug IA are both retired |
| `workshops`          | **Blocks** (`layout`)                      | spec 010 pilot (US1): the acceptance gate; composed (incl. `gallery` proof photos + `embed` video)                                                                                                                                                         |
| `teamMembers`        | **Blocks** (`layout`)                      | spec 010: gained `layout` + drafts/live-preview; new `/team/[slug]` detail renders via `RenderBlocks` + Person JSON-LD                                                                                                                                     |
| `posts`              | **Structured + inline blocks in richText** | **The sanctioned exception** (ADR 0009): title/excerpt/author fixed; body is rich text with embedded inline blocks                                                                                                                                         |
| ~~`servicePillars`~~ | **REMOVED (SVC-2)**                        | Absorbed into `services` as `tier: 'group'`; the collection and its tables are gone                                                                                                                                                                        |
| `industries`         | **Block-composed** (IND-1)                 | `layout` renders at `/industries/[slug]`; also a taxonomy target                                                                                                                                                                                           |
| `locations`          | **Structured**                             | Market landing taxonomy; no body composition                                                                                                                                                                                                               |

Net (post-spec-010): every non-blog detail type **and** the homepage global render their body from `layout` blocks via `RenderBlocks` — the single render path. Rearranging or enriching any of them is a content edit with no deploy; the only change that needs code is fixing a block or giving it a new option, and a new block needs sign-off (§9, ADR 0013). `posts` is the one bespoke richText body that remains by design. `locations` stays structured because it is a listing/taxonomy target; `industries` joined the block-composed set under IND-1 (routed at `/industries/<slug>`) and `services` under SVC-2 (three tiers in one collection, all routed at `/services/<slug>`) and `servicePillars` was absorbed into it. The old discrete body columns were retained one release (hidden + read-only, expand/contract) and **were dropped in spec 011** — `layout` is now the only body.

---

## 2. Conventions

- **Payload slug:** kebab-case, used as `blockType` discriminator (`hero`, `media-text`, `hubspot-form`).
- **Interface name:** PascalCase suffix `Block` (`HeroBlock`, `MediaTextBlock`).
- **React component:** PascalCase, in `src/components/sections/` for blocks, `src/components/ui/` for primitives.
- **Renderer:** a single `<RenderBlocks blocks={...} />` component looks up `blockType` and dispatches to the registered React component.
- **Variants:** prefer a `variant` select field over multiple near-identical blocks. Three blocks become one with a select.
- **Required fields:** `required: true` everywhere the design assumes presence. Don't write conditional render fallbacks for fields the schema says are required.

---

## 3. UI primitives (`src/components/ui/`)

Pure React, no Payload coupling. Used by sections and pages.

The real surface is small — nine primitives. `Section` and `ReadingColumn` were built in ADR 0012, which moved the page shell and the §11.4 reading measure out of 46 hand-written copies and into one owner each. (Earlier drafts of this doc also listed Card/Badge/Tag/Avatar/Icon/Breadcrumbs/Pagination/ScrollToTop and a `ui/form/` subdir; none of those were built. Form UI lives in `src/components/forms/`, see §7.)

| Component         | Props                                                                | Variants                                                                                                                    | Notes                                                                                                                                                                                          |
| ----------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`          | `variant`, `size`, `href`, `cta`, + native button/anchor attrs       | `primary` / `secondary` / `ghost` / `link`; sizes `sm` / `md` / `lg`                                                        | Renders `<a>` (via `next/link`) when `href` is set, else `<button>`; link-mode opts into `cta_click` tracking via `cta`                                                                        |
| `Container`       | `size`, `padded`, + native div attrs                                 | `sm` / `md` / `lg` / `xl` / `full`; defaults to `SHELL_RAIL`                                                                | The shell for page chrome. Same model as `Section` and shares its rail, so the header cannot drift from the blocks below it                                                                    |
| `Section`         | `padding`, `background`, `border`, `rail`, `innerClassName`, `bleed` | padding `none`/`tight`/`default`/`spacious`; background `none`/`subtle`/`accent`/`inverse`/`brand`; border `none`/`y`/`top` | The block shell (ADR 0012). Every block uses it; `shellOwnership.int.spec.ts` fails any that does not. `bleed` renders inside the `<section>` but outside the rail, for full-bleed backgrounds |
| `ReadingColumn`   | `flush`, `flushFrom`, + native div attrs                             | —                                                                                                                           | §11.4's 65ch measure, centred by default. Put the heading inside it, with its body; `flush`/`flushFrom` are for a column a grid has already positioned                                         |
| `Prose`           | `size`, `tone`                                                       | size `compact` / `default` / `large`; tone `default` / `inverse`                                                            | Typographic wrapper for Lexical output (`@tailwindcss/typography`)                                                                                                                             |
| `ResponsiveImage` | `media`, `sizes`, `className`, `loading`, `fetchPriority`            | —                                                                                                                           | `<picture>` with webp + jpeg `srcSet` built from the Media collection's responsive sizes                                                                                                       |
| `SmartLink`       | `href`, `external` (auto-detected), + native anchor attrs            | —                                                                                                                           | Internal hrefs render via `next/link`; off-site hrefs get `rel="noopener noreferrer"`                                                                                                          |
| `TabSet`          | `items` ({key, label, panel}), `labelledBy`, `inverse`               | —                                                                                                                           | Client component; the ARIA tabs pattern behind `accordion`'s `tabs` display                                                                                                                    |
| `VideoFacade`     | `provider`, `videoId`, `title`, `poster`                             | —                                                                                                                           | 16:9 player; with a poster it shows the still and a Play button and loads the player only on click. Used by `embed`                                                                            |

`tone.ts` is not a component: `toneFor(background)` returns the secondary, muted, accent, rule and highlight classes that stay legible on each `Section` background (DESIGN_SYSTEM §2.4, bands). `brand` is offered by `cta` only.

---

## 4. Layout components (`src/components/layout/`)

Not blocks — these are global chrome.

| Component            | Data source                                          | Notes                                                                                                         |
| -------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `SiteHeader`         | `navigation` / `siteSettings` (`@/lib/site-content`) | Logo, primary nav, mobile menu trigger, primary CTA button                                                    |
| `SiteFooter`         | `navigation` / `siteSettings` (`@/lib/site-content`) | Multi-column nav, contact info, social, copyright, legal links                                                |
| `MobileNav`          | `navItems`, `ctaButton` props                        | Slide-over drawer, focus-trapped                                                                              |
| `PreviewBanner`      | Next.js draft-mode state                             | Server-rendered amber bar shown above content when draft mode is on (FR-020); dropped once per template       |
| `ConsentPreferences` | HubSpot `_hsp` command queue                         | Footer control that re-opens HubSpot's own consent banner / withdraws consent — no custom consent UI is built |
| `SkipToContent`      | `targetId` prop (default `main`)                     | Accessibility — first focusable element                                                                       |

---

## 5. Payload block catalog

Thirteen layout blocks (ADR 0013; spec and the old → new mapping: `docs/planning/block-consolidation.md`). Each is
a config in `src/payload/blocks/layout/`, a renderer in `src/components/sections/`, and an entry in both
`layoutBlocks` and `registry.ts`. Every collection's `layout` spreads the same `layoutBlocks`, so every block is
available on every page type. **The config is the source of truth for fields**; this section says what each block
is for and what its options draw.

**The §5.1–§5.6 categories are load-bearing (spec 011 US2).** Each is a heading in the admin block picker, set
by the block's `admin.group` through `blockAdmin()` (`src/payload/blocks/blockAdmin.ts`).
`src/payload/blocks/categories.ts` holds the slugs and headings; `tests/int/adminMetadata.int.spec.ts` fails a
block with no category, no preview, or a label it shares with a neighbour. The picker draws headings in the order
`layoutBlocks` registers its blocks, so that array stays sorted by category.

| §   | Category             | Picker heading        | Blocks                                                                     |
| --- | -------------------- | --------------------- | -------------------------------------------------------------------------- |
| 5.1 | `hero`               | Page openers          | `hero`                                                                     |
| 5.2 | `content`            | Body content          | `content`, `media-text`, `items`, `image`, `gallery`, `table`, `accordion` |
| 5.3 | `social-proof`       | Proof and credibility | `quote`                                                                    |
| 5.4 | `cta`                | Calls to action       | `cta`                                                                      |
| 5.5 | `content-collection` | Lists and collections | `cards`                                                                    |
| 5.6 | `specialty`          | Specialty             | `embed`, `hubspot-form`                                                    |

**Shared fields.** Every block except `hero` takes `background`: `none` (default) · `subtle` · `accent` ·
`inverse`. `cta` adds `brand` and defaults to it; `quote` defaults to `subtle`. The blocks that hold several things
(`items`, `cards`, `gallery`, `quote`, `table`, `accordion`) take `heading` and `intro`; `cta` (required), `embed` and
`hubspot-form` take `heading` alone. Buttons are `ctaField` groups `{label, url}`; `hero.primaryCta` and
`cta.primaryCta` add `variant` (`primary` · `secondary` · `ghost`).

Notation: `!` = required; "when X" = shown only then.

### 5.1 Page openers

#### `hero`

The page's opener and its `h1`. `split` with an image is the default; `cover` for the homepage or a campaign page.

- `variant`!: `text-only` · `split` (default; copy beside the image) · `cover` (full-bleed photo under a navy
  scrim, white text) · `with-video`
- `eyebrow`, `headline`!, `subheadline`
- `media` (when `split` or `cover`, and required then)
- `videoUrl` (when `with-video`, and required then): a `youtube-nocookie.com/embed/` or `player.vimeo.com/video/`
  address; anything else is dropped at render
- `primaryCta` {label, url, variant}, `secondaryCta` {label, url}: each optional and independent
- `alignment`: `left` (default) · `center`

Replaces `homepage-hero` (as `cover`), `case-study-hero`, `service-pillar-hero`, and the old `with-image` variant
(as `split`).

### 5.2 Body content

#### `content`

Prose: one idea, a heading and a few paragraphs.

- `width`: `narrow` · `standard` (default) · `wide`
- `body`!: rich text

Inline blocks in the body (`src/payload/blocks/inline/`): `callout`, `image-with-caption`, `figure`,
`quote-pullquote`, `testimonial-embed` and `disclosure` at paragraph level; `inline-cta` inline. The text takes the
centred reading column (DESIGN_SYSTEM §11.4); on `inverse` the prose inverts.

#### `media-text`

A point that has a picture: the image on one side, rich text and an optional button on the other.

- `media`!
- `mediaPosition`!: `left` (default) · `right`. On a phone the two stack in this order.
- `body`!: rich text, opening with a short heading
- `cta` {label, url}

Replaces `two-column` and `brand-teaser` (the teaser's headline and body become the rich text).

#### `items`

Several parallel short things: steps, principles, features, stats, a timeline, deliverables, technologies. Any
count; the layout adjusts to it.

- `layout`: `grid` (default) · `line` · `list` · `tags`
- `markers` (not for `tags`): `none` (default) · `numbers` · `custom` (typed on each item: "25+", a letter, a year)
- `style` (grid only): `plain` (default; a heavy rule over each item) · `card` (a bordered card)
- `items`! [{`title`!, `body`, `marker` (when `custom`), `image` (grid only), `link` {label, url}}]

| Layout | Draws                                                                                                                                                       |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `grid` | Columns follow the count. One item takes the reading column; one item with a custom marker is a display-size headline figure.                               |
| `line` | Items down a vertical rule. Short markers (a number, a letter) hang in a gutter, so a lettered set spells its word; longer ones (a date) run as a timeline. |
| `list` | Compact bullets, two columns on a wide screen; with `numbers`, one numbered column.                                                                         |
| `tags` | Chips. A link makes the chip a link; `body` is not shown.                                                                                                   |

Replaces `process-steps` (grid, card, numbers), `timeline` (line, dates as markers), `nav-cards` (grid, card,
linked), `deliverables` (list), `key-takeaways` (list, numbers), `tech-stack` (tags), `stats-bar` and
`metric-display` (grid, custom markers), and `mission-vision-values` (`content` plus `items`).

#### `image`

One captioned figure; the one-off counterpart to `gallery`.

- `image`! (alt text lives on the media record)
- `caption`
- `width`: `narrow` · `standard` (default) · `wide` · `full` (the shell rail)
- `alignment` (not for `full`): `center` (default) · `left` · `right`

Widths mirror `content`'s measures, so a figure shares the body's vertical axis.

#### `gallery`

A set of pictures, or a strip of logos.

- `items`! [{`image`!, `caption`}]
- `layout`: `grid` (default) · `carousel` (one swipeable row) · `logos` (grey until pointed at, each on a light card
  so any band works)

No column control: columns follow the count, and a single picture is held to `image`'s standard measure. Rows whose
upload did not populate are dropped at render.

Replaces `logo-bar` and `client-logo-grid` (as `logos`).

#### `table`

A real comparison across columns.

- `columns`! [{`label`!, `tagline`}]
- `rows`! [{`dimension`!, `cells`! [{`value`!}]}]: one cell per column, in column order; a short row is padded,
  extra cells still show
- `bestForRow` [{`value`!}]: an optional closing "Best for" row

Any number of columns: past the screen width the table scrolls sideways inside its own focusable frame, never the
page.

Replaces `comparison-table`.

#### `accordion`

Titled panels of rich text: questions and answers, or detail most readers skip.

- `display`!: `accordion` (default; native `<details>`, no script) · `tabs` (one panel at a time, `ui/TabSet`)
- `items`! [{`title`!, `body`! rich text}]

Emits no `FAQPage` JSON-LD.

Replaces `faq`, the old `accordion`, and `tabs`.

### 5.3 Proof and credibility

#### `quote`

A client's words, or a pull quote.

- `source`!: `testimonials` (default; name, title, company and photo come from the record) · `custom` (typed here)
- `testimonials` (when `testimonials`, and required then; many)
- `quote` (when `custom`, and required then), `attribution`, `role`
- `layout`: `centered` (default) · `with-photo-left` · `with-photo-right`

Only the side `source` names is published. One quote draws large in `layout`; two or more always sit in a grid.
With no photo on file the photo layouts leave it out. Unpopulated or empty testimonials are dropped.

Replaces `testimonial-block` and `featured-testimonials`.

### 5.4 Calls to action

#### `cta`

The close: one ask, and `action` says what answering it means.

- `heading`!, `body`
- `action`!: `buttons` (default) · `meeting` · `newsletter` · `download`
- `variant`!: `centered` (default) · `split` (heading left, the action beside it; stacks on a phone)
- `primaryCta` {label, url, variant}, `secondaryCta` {label, url} (when `buttons` or `meeting`; the main button is
  required for `buttons`, the second draws as a plain link)
- `meetingUrl` (when `meeting`, and required then): a HubSpot meetings address. The panel's button opens it in a
  new tab and mounts the `booking_complete` seam.
- `formId` (when `newsletter` or `download`, and required then): the HubSpot form GUID, submitted through
  `HubspotLeadForm`
- `coverImage`, `fileUrl` (when `download`, and required then)

`download` is a courtesy gate: `fileUrl` appears in the success panel, but it crosses to a client component as a
prop, so it is in the page source. Treat it as public. A `newsletter` with no `formId` renders nothing.

Replaces `cta-section`, `contact-cta`, `newsletter-cta`, `download-card` and `hubspot-meetings`.

### 5.5 Lists and collections

#### `cards`

Any list of documents, drawn as that collection's card (`src/components/cards/*`). The listing routes
(`/case-studies`, `/insights`, `/team`, `/workshops`, `/partners`) and the homepage's latest insights render the same
component.

- `collection`!: `caseStudies` · `posts` · `services` · `industries` · `workshops` · `teamMembers` · `locations` ·
  `partners`
- `source`!: `all` (default) · `filtered` · `manual`
- Filters (when `filtered`): `industry` and `service` for case studies (set both and a study must match both),
  `category`! for posts, `leadershipOnly` for team members, `serviceGroup`! for services (in the group's order).
  The other collections have no filter, so `filtered` lists all of them.
- `manualItems` (when `manual`, and required then): picks from `collection` only, in pick order; a services pick
  may be a service or a group
- `limit`: stops the list after this many; blank shows all
- `display`!: `grid` (default) · `featured` (the first item large, beside its picture; the rest as a grid)

**Resolved at template time.** Every route awaits `resolveLayout(doc.layout)` (`src/lib/resolveLayout.ts`) before
`RenderBlocks`, and it fills `manualItems` whichever way the block chose: `all` and `filtered` read the cached
listing readers in `src/lib/payload.ts` (and so inherit their cache tags, hourly revalidation and
`withReadTimeout`), `manual` unwraps the picks, and `limit` trims. `all` services means leaves only; team members
sort leadership first, then `order`. A read that times out throws. The component never reads `source` or the
filters and never touches the database, so `RenderBlocks` stays synchronous. Pinned by
`tests/int/lib/resolveLayout.int.spec.ts`.

**No items, no section**, heading included (`gridEmptyState.int.spec.tsx`): a list that fills itself can come back
empty long after the editor saw it full. Team cards show `title` (the job title), never `role` (UI-1).

Replaces `case-study-grid`, `post-list`, `related-posts`, `industry-grid`, `locations-list`, `workshop-list`,
`team-grid`, `service-cards`, `service-pillar-cards`, and `featured-case-study` (as `featured`).

### 5.6 Specialty

#### `embed`

Something from another site, framed on the page.

- `kind`!: `video` (default) · `map` · `page`
- `heading`; `eyebrow` (video only)
- `title`!: names the frame for screen readers; not drawn
- Video: `provider`! (`youtube` default · `vimeo`), `videoId`! (the ID only), `thumbnail` (a poster: the page shows
  the still and loads the player on click, `ui/VideoFacade`)
- Map or page: `url`! (https), `caption`, `height`: `short` · `medium` (default) · `tall`

A map must be an OpenStreetMap or Google Maps embed address; any other host renders a notice instead. A page is
framed in a sandbox without `allow-same-origin`.

Replaces `video-embed`, `map`, and the old iframe-only `embed`.

#### `hubspot-form`

A full HubSpot form.

- `heading`, `description`, `formId`! (the HubSpot form GUID)

Renders generic lead fields through `HubspotLeadForm`; the Workshop Inquiry GUID renders `WorkshopInquiryForm`
instead.

---

## 6. Page composition matrix

The starting block order per page type: what an editor or the `compose-page` skill begins from, not a render
template. Only the thirteen blocks. A new case study, workshop, industry, team member or partner starts from its
skeleton (`src/payload/seed/skeletons/*.ts`, the `layout` `defaultValue`; ROADMAP UI-3).

**Composition rules** (`.claude/skills/compose-page/SKILL.md`):

1. Open with a `split` hero carrying the page's art.
2. Never two `content` blocks in a row. Prose that lists several things is `items`; one point with a picture is
   `media-text`.
3. Keep sections short: a `content` block is one idea, about 150 words at most.
4. Vary the rhythm: consecutive sections differ in block or layout. Alternate `media-text` sides; separate bands with
   `background`.
5. Put proof where the claim is: numbers as an `items` stats row, a client's words as a `quote`, the work as `cards`
   of case studies.
6. End with a `cta`.

**Routes that own their header.** Case study, workshop and team member routes render the `h1` themselves, so their
layouts open without a `hero`. The homepage route appends a `cta` (the Touchstone workshop) and a latest-insights
`cards` after the layout, so the homepage layout does not end with its own `cta`.

| Page type                                      | Block order                                                                                                                                                                                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Homepage (`homepage` global)                   | `hero` (cover) → `items` (grid, custom markers: stats) → `cards` (caseStudies, featured) → `media-text` (the Sequoyah story) → `gallery` (logos) → `quote`                                                  |
| Service (`services`, leaf)                     | `hero` → `content` (what it is) → `items` (grid, numbers: the approach) → `items` (list, subtle: deliverables) → `quote` → `cards` (caseStudies filtered by this service) → `accordion` (questions) → `cta` |
| Service group (`services`, group)              | `hero` → `content` → `items` (grid, card: each service, linked) → `quote` → `cards` (caseStudies) → `cta`                                                                                                   |
| Axis (`services`, axis)                        | `hero` → `content` → `items` (grid, card: each group, linked) → `quote` → `cta`                                                                                                                             |
| Industry (`industries`)                        | `hero` → `content` (the sector) → `items` (grid: what we do there) → `cards` (caseStudies filtered by industry) → `gallery` (logos) → `cta`                                                                 |
| Market (`pages`, e.g. `okc-consulting`)        | `hero` → `content` (local context) → `items` (grid, subtle) → `media-text` → `quote` → `cards` (caseStudies) → `cta`                                                                                        |
| Our Story (`pages`)                            | `hero` → `media-text` → `embed` (video, subtle) → `media-text` (other side) → `items` (grid: values) → `cards` (teamMembers) → `cta`                                                                        |
| Industries index (`pages`, `industries`)       | `hero` (text-only) → `cards` (industries) → `cta`                                                                                                                                                           |
| Case study (`caseStudies`; route owns header)  | `content` (the challenge) → `media-text` (the approach) → `items` (grid, custom markers, accent: results) → `content` (the outcome) → `quote` → `items` (tags: technologies) → `cta`                        |
| Workshop (`workshops`; route owns header)      | `content` (what it is) → `items` (list: what you leave with) → `gallery` (photos) → `embed` (recap video) → `quote` → `hubspot-form` (the inquiry form is the close)                                        |
| Team member (`teamMembers`; route owns header) | `content` (bio) → `items` (list: expertise, certifications) → `content` → `cta`                                                                                                                             |
| Partner (`partners`)                           | `hero` → `content` (who they are) → `items` (grid, card: what we do together) → `items` (tags: products) → `cta`                                                                                            |

**Not block-composed.** Blog posts (`posts`) are rich text with inline blocks (§5.2). `/case-studies`, `/insights`,
`/team`, `/workshops` and `/partners` are route files that render a `Container` header over `cards` (DESIGN_SYSTEM
§11.5). `/contact` is a route file with the curated `ContactForm`.

---

## 7. Component file structure

Block configs carry **no** `Block` suffix (`Hero.ts`; `AccordionBlock.ts` is the one exception). Each layout and
inline config has a renderer, and the slug ↔ component pairing is test-enforced (`registryCoverage` /
`inlineRegistryCoverage`). The rest of `src/` is in ARCHITECTURE.md.

```
src/
├── components/
│   ├── ui/                  # Primitives (§3): Button, Container, Prose, ReadingColumn, ResponsiveImage,
│   │                        #   Section, SmartLink, TabSet, VideoFacade, tone.ts
│   ├── layout/              # Global chrome (§4)
│   ├── sections/            # Layout block renderers (§5)
│   │   ├── registry.ts      # blockType (kebab slug) → component
│   │   ├── RenderBlocks.tsx # Walks layout[] and dispatches via registry
│   │   └── AccordionBlock, Cards, Content, Cta, Embed, Gallery, Hero, HubspotForm, Image, Items,
│   │       MediaText, Quote, Table (.tsx)
│   ├── cards/               # One card per collection, behind `cards`: CaseStudy, Industry, Location, Partner,
│   │                        #   Post, Service, Team, Workshop (…Cards.tsx), FeaturedCard.tsx, types.ts
│   ├── richText/            # RichText.tsx (Lexical → React) + inline/ renderers and registry
│   └── forms/               # ContactForm, HubspotLeadForm, WorkshopInquiryForm
├── lib/
│   ├── resolveLayout.ts     # Fills `cards` before RenderBlocks (§5.5)
│   └── cardCollections.ts   # The eight collections `cards` lists
└── payload/
    ├── blocks/
    │   ├── blockAdmin.ts    # Picker category, preview, label
    │   ├── categories.ts    # The six picker categories (§5)
    │   ├── conditional.ts   # requiredWhen and other conditional-field helpers
    │   ├── outputContract.ts # Declared exceptions to the INERT-2 gate
    │   ├── layout/          # The 13 layout block configs + index.ts (`layoutBlocks`)
    │   └── inline/          # The 7 inline block configs + index.ts
    └── fields/              # blockCopy.ts (heading, eyebrow, intro, background), cta.ts, mediaRowLabel.ts,
                             #   url.ts, seo.ts, slug.ts, …
```

---

## 8. Render dispatcher

A route resolves the layout, then hands it to the one dispatcher:

```tsx
const layout = await resolveLayout(doc.layout) // fills `cards` (§5.5)
return <RenderBlocks blocks={layout} />
```

`RenderBlocks` looks each `blockType` up in `registry.ts` and renders the component with the block as props. An
unknown `blockType` is skipped, with a dev-only warning once per type per render. Contract: `docs/contracts/render-blocks.md`.
Inline rich-text blocks follow the same pattern inside `RichText` (`docs/contracts/inline-block-converter.md`).

---

## 9. Block library hygiene rules

1. **The list is pinned at thirteen.** Gate: `tests/int/blocks/allowedBlocks.int.spec.ts`. Adding a block edits that
   list and needs Kenn's sign-off (ADR 0013).
2. **A new look is an option, not a block.** Add a select value or a field to the nearest block. A page the set
   cannot compose goes to Kenn as a gap (the `compose-page` skill's gap output), and the fix is almost always an
   option.
3. **No numeric caps.** No `maxRows`, `maxLength` or `max`; no `minRows` above 1. A layout that degrades past N
   items handles N. Gate: `tests/int/blocks/noCaps.int.spec.ts`.
4. **Every control changes the output.** Gate: `tests/int/blocks/blockOutputContract.int.spec.tsx` (INERT-2).
   Exceptions are declared on the block with `custom: outputContract({...})`.
5. **Required = required.** Don't write fallback renders for fields the schema marks required. Trust Payload
   validation.
6. **Inline blocks for _in-flow_ content; layout blocks for _full-width_ sections.** A `quote-pullquote` inside an
   article is inline; a `quote` between sections is a layout block.
7. **No data fetching in blocks.** Collection lists resolve in `resolveLayout`; components render what they are
   handed.
8. **One file per block config.** Easier diffs, easier discovery.
9. **A block's name must stand alone in its picker.** Payload draws no description, so `labels.singular` is all
   that tells two cards apart, and the only thing the picker's search matches. No label may duplicate or be
   contained in another in the same picker. Enforced by `adminMetadata.int.spec.ts`.

**Changing a block** (an option, a fix): the config, the renderer, a showcase fixture
(`src/payload/seed/showcase/fixtures.ts`) and a test under `tests/int/blocks/`; then `npm run generate:types`,
`npm run generate:importmap` and `npx payload migrate:create` (every collection spreads `layoutBlocks`, so the
migration touches every collection's block tables). If the look changed, rebuild its picker preview:
`npm run seed:showcase`, `npm run visual:capture`, `npm run block:thumbnails` (ADR 0011; checklist in
PAYLOAD_DEVELOPMENT.md §6). Visually verify per CLAUDE.md.

---

## 10. Open questions for this doc

| ID  | Question                                                                                       | Owner                      |
| --- | ---------------------------------------------------------------------------------------------- | -------------------------- |
| B-5 | Inline-blocks inside post body — confirm full list and editor UX (slash command vs button bar) | Content lead + Engineering |
