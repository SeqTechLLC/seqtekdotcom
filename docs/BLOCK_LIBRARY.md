# SEQTEK Website — Block & Component Library

Every layout block, UI primitive and piece of global chrome, and how pages are composed from them. Field
metadata rules are in PAYLOAD_DEVELOPMENT.md §5–6; visual treatment is in DESIGN_SYSTEM.md.

---

## 1. Two content primitives

Every page except a blog post renders its body from a top-level `layout` blocks array through `RenderBlocks`
(ADR 0009). A post is rich text with inline blocks. Rearranging a page is a content edit; only fixing a block or
giving it an option needs code, and a new block needs sign-off (§9, ADR 0013).

| Collection / global | Body                                      | Route                           |
| ------------------- | ----------------------------------------- | ------------------------------- |
| `pages`             | `layout`                                  | `/[slug]`                       |
| `homepage` (global) | `layout`                                  | `/`                             |
| `caseStudies`       | `layout`                                  | `/case-studies/[slug]`          |
| `services`          | `layout`; `tier` is `leaf`/`group`/`axis` | `/services/[slug]` (every tier) |
| `industries`        | `layout`                                  | `/industries/[slug]`            |
| `workshops`         | `layout`                                  | `/workshops/[slug]`             |
| `teamMembers`       | `layout`                                  | `/team/[slug]`                  |
| `partners`          | `layout`                                  | `/partners/[slug]`              |
| `posts`             | Rich text with inline blocks              | `/insights/[slug]`              |
| `locations`         | None; a taxonomy and listing target       | —                               |

---

## 2. Conventions

- **Payload slug:** kebab-case, the `blockType` discriminator (`hero`, `media-text`, `hubspot-form`).
- **Interface name:** PascalCase with a `Block` suffix (`HeroBlock`, `MediaTextBlock`).
- **React component:** PascalCase; blocks in `src/components/sections/`, primitives in `src/components/ui/`.

---

## 3. UI primitives (`src/components/ui/`)

Pure React, no Payload coupling. Form UI lives in `src/components/forms/`.

| Component         | Props                                                                | Variants                                                                                                                    | Notes                                                                                                                                                                                          |
| ----------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`          | `variant`, `size`, `href`, `cta`, + native button/anchor attrs       | `primary` / `secondary` / `ghost` / `link`; sizes `sm` / `md` / `lg`                                                        | Renders `<a>` (via `next/link`) when `href` is set, else `<button>`; link-mode opts into `cta_click` tracking via `cta`                                                                        |
| `Container`       | `size`, `padded`, + native div attrs                                 | `sm` / `md` / `lg` / `xl` / `full`; defaults to `SHELL_RAIL`                                                                | The shell for page chrome. Same model as `Section` and shares its rail, so the header cannot drift from the blocks below it                                                                    |
| `Section`         | `padding`, `background`, `border`, `rail`, `innerClassName`, `bleed` | padding `none`/`tight`/`default`/`spacious`; background `none`/`subtle`/`accent`/`inverse`/`brand`; border `none`/`y`/`top` | The block shell (ADR 0012). Every block uses it; `shellOwnership.int.spec.ts` fails any that does not. `bleed` renders inside the `<section>` but outside the rail, for full-bleed backgrounds |
| `ReadingColumn`   | `flush`, `flushFrom`, + native div attrs                             | —                                                                                                                           | DESIGN_SYSTEM §11.4's 65ch measure, centred by default. Put the heading inside it, with its body; `flush`/`flushFrom` are for a column a grid has already positioned                           |
| `Prose`           | `size`, `tone`                                                       | size `compact` / `default` / `large`; tone `default` / `inverse`                                                            | Typographic wrapper for Lexical output (`@tailwindcss/typography`)                                                                                                                             |
| `ResponsiveImage` | `media`, `sizes`, `className`, `loading`, `fetchPriority`            | —                                                                                                                           | `<picture>` with webp + jpeg `srcSet` built from the Media collection's responsive sizes                                                                                                       |
| `SmartLink`       | `href`, `external` (auto-detected), + native anchor attrs            | —                                                                                                                           | Internal hrefs render via `next/link`; off-site hrefs get `rel="noopener noreferrer"`                                                                                                          |
| `TabSet`          | `items` ({key, label, panel}), `labelledBy`, `inverse`               | —                                                                                                                           | Client component; the ARIA tabs pattern behind `accordion`'s `tabs` display                                                                                                                    |
| `VideoFacade`     | `provider`, `videoId`, `title`, `poster`                             | —                                                                                                                           | 16:9 player; with a poster it shows the still and a Play button and loads the player only on click. Used by `embed`                                                                            |

`tone.ts` is not a component: `toneFor(background)` returns the secondary, muted, accent, rule and highlight classes
that stay legible on each `Section` background (DESIGN_SYSTEM §2.4).

---

## 4. Layout components (`src/components/layout/`)

Global chrome, not blocks.

| Component            | Data source                                                                                                               | Notes                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `SiteHeader`         | `getNavigation()` (the `navigation` collection, falling back to `site-content.ts`) and `ctaButton` from `site-content.ts` | Logo, primary nav, mobile menu trigger, CTA button                       |
| `PrimaryNav`         | `SiteHeader`'s navigation                                                                                                 | Desktop menu and its dropdown panels; `NavCaret` is the disclosure caret |
| `MobileNav`          | `navItems`, `ctaButton` props                                                                                             | Slide-over drawer, focus-trapped                                         |
| `SiteFooter`         | `site-content.ts` only                                                                                                    | Nav columns, contact, social, legal links                                |
| `PreviewBanner`      | Next.js draft mode                                                                                                        | Amber bar each route renders above its content when draft mode is on     |
| `ConsentPreferences` | HubSpot `_hsp` command queue                                                                                              | Footer control that re-opens HubSpot's consent banner                    |
| `SkipToContent`      | `targetId` (default `main`)                                                                                               | The first focusable element                                              |

---

## 5. Payload block catalog

Thirteen layout blocks (ADR 0013). Each is a config in `src/payload/blocks/layout/`, a renderer in
`src/components/sections/`, and an entry in both `layoutBlocks` and `registry.ts`. Every collection's `layout` spreads
the same `layoutBlocks`, so every block is available on every page type. **The config is the source of truth for
fields;** this section says what each block is for, what its options draw, and what is not obvious from the config.

**The §5.1–§5.6 categories are load-bearing.** Each is a heading in the admin block picker, set by the block's
`admin.group` through `blockAdmin()`. `src/payload/blocks/categories.ts` holds the slugs and headings;
`tests/int/adminMetadata.int.spec.ts` fails a block with no category, no preview, or a label it shares with a
neighbour. The picker draws headings in the order `layoutBlocks` registers its blocks, so that array stays sorted by
category.

| §   | Category             | Picker heading        | Blocks                                                                     |
| --- | -------------------- | --------------------- | -------------------------------------------------------------------------- |
| 5.1 | `hero`               | Page openers          | `hero`                                                                     |
| 5.2 | `content`            | Body content          | `content`, `media-text`, `items`, `image`, `gallery`, `table`, `accordion` |
| 5.3 | `social-proof`       | Proof and credibility | `quote`                                                                    |
| 5.4 | `cta`                | Calls to action       | `cta`                                                                      |
| 5.5 | `content-collection` | Lists and collections | `cards`                                                                    |
| 5.6 | `specialty`          | Specialty             | `embed`, `hubspot-form`                                                    |

**Shared fields.** Every block except `hero` takes `background`: `none` (default), `subtle`, `accent`, `inverse`.
`cta` adds `brand` and defaults to it; `quote` defaults to `subtle`. Buttons are `ctaField` groups `{label, url}`;
`hero.primaryCta` and `cta.primaryCta` add a `variant`.

### 5.1 Page openers

#### `hero`

The page's opener and its `h1`. `variant`: `split` (default; copy beside the image), `cover` (full-bleed photo under
a navy scrim, white text; the homepage or a campaign page), `text-only`, `with-video`. A `videoUrl` must be a
`youtube-nocookie.com/embed/` or `player.vimeo.com/video/` address; anything else is dropped at render.

### 5.2 Body content

#### `content`

Prose: one idea, a heading and a few paragraphs, in the centred reading column (DESIGN_SYSTEM §11.4). On `inverse`
the prose inverts. Inline blocks in the body (`src/payload/blocks/inline/`): `callout`, `image-with-caption`,
`figure`, `quote-pullquote`, `testimonial-embed` and `disclosure` at paragraph level, `inline-cta` inline.

#### `media-text`

A point that has a picture: the image on one side, rich text and an optional button on the other. On a phone the two
stack in `mediaPosition` order.

#### `items`

Several parallel short things: steps, principles, features, stats, a timeline, deliverables, technologies. Any count;
the layout adjusts to it.

| Layout | Draws                                                                                                                                                       |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `grid` | Columns follow the count. One item takes the reading column; one item with a custom marker is a display-size headline figure.                               |
| `line` | Items down a vertical rule. Short markers (a number, a letter) hang in a gutter, so a lettered set spells its word; longer ones (a date) run as a timeline. |
| `list` | Compact bullets, two columns on a wide screen; with `numbers`, one numbered column.                                                                         |
| `tags` | Chips, wrapped in the reading column with their heading. A link makes the chip a link; `body` is not shown.                                                 |

`markers` (not for `tags`): `none`, `numbers`, or `custom` (typed on each item: "25+", a letter, a year). `style`
(grid only): `plain` (a heavy rule over each item) or `card`.

#### `image`

One captioned figure. Widths mirror `content`'s measures (`full` is the shell rail), so a figure shares the body's
axis. Alt text lives on the media record.

#### `gallery`

A set of pictures (`grid`, or `carousel`: one swipeable row) or a strip of `logos` (grey until pointed at, each on a
light card so any band works). Columns follow the count, and a single picture is held to `image`'s standard
measure. Rows whose upload did not populate are dropped.

#### `table`

A real comparison across columns, with an optional closing "Best for" row. One cell per column; a short row is
padded. Past the screen width the table scrolls sideways inside its own focusable frame, never the page.

#### `accordion`

Titled panels of rich text. `display`: `accordion` (native `<details>`, no script) or `tabs` (`ui/TabSet`). Emits no
`FAQPage` JSON-LD.

### 5.3 Proof and credibility

#### `quote`

A client's words from `testimonials` records (name, title, company and photo come from the record) or `custom`
typed text. Only the side `source` names is published. One quote draws large in `layout`
(`centered`, `with-photo-left`, `with-photo-right`); two or more sit in a grid. With no photo on file, the photo
layouts leave it out.

### 5.4 Calls to action

#### `cta`

The close: one ask, and `action` says what answering it means.

- `buttons`: the main button (required) and an optional second, drawn as a plain link.
- `meeting`: a HubSpot meetings address. The panel's button opens it in a new tab and mounts the
  `booking_complete` seam.
- `newsletter`, `download`: a HubSpot form GUID, submitted through `HubspotLeadForm`. A `newsletter` with no form
  renders nothing.

`variant`: `centered` or `split` (the action beside the heading; stacks on a phone). `download` is a courtesy gate:
`fileUrl` shows in the success panel, but it crosses to a client component as a prop, so it is in the page source.
Treat it as public.

### 5.5 Lists and collections

#### `cards`

Any list of documents, drawn as that collection's card (`src/components/cards/*`). The listing routes
(`/case-studies`, `/insights`, `/team`, `/workshops`, `/partners`) and the homepage's latest insights render the same
component.

- `source`: `all`, `filtered` or `manual`. Filters: `industry` and `service` for case studies (set both and a study
  must match both), `category` for posts, `leadershipOnly` for team members, `serviceGroup` for services (in the
  group's order). Other collections have no filter, so `filtered` lists all of them.
- `manual` picks come from `collection` only, in pick order; a services pick may be a service or a group. Each pick
  must be `{ relationTo, value }`.
- `display`: `grid` or `featured` (the first item large, beside its picture).

**Resolved before render.** Every route awaits `resolveLayout(doc.layout)` (`src/lib/resolveLayout.ts`), which fills
`manualItems` whichever way the block chose: `all` and `filtered` read the cached listing readers in
`src/lib/payload.ts`, `manual` unwraps the picks, and `limit` trims. `all` services means leaves only; team members
sort leadership first. The component never reads `source` or the filters, so `RenderBlocks` stays synchronous.
Pinned by `tests/int/lib/resolveLayout.int.spec.ts`.

**No items, no section,** heading included. Team cards show the job title, never `role`.

### 5.6 Specialty

#### `embed`

Something from another site, framed on the page: a `video` (YouTube or Vimeo by ID; with a `thumbnail` the page
shows the still and loads the player on click), a `map` (an OpenStreetMap or Google Maps embed address; any other
host renders a notice), or a `page` (framed in a sandbox without `allow-same-origin`). `title` names the frame for
screen readers and is not drawn.

#### `hubspot-form`

A full HubSpot form, rendered through `HubspotLeadForm`; the Workshop Inquiry GUID renders `WorkshopInquiryForm`
instead.

---

## 6. Page composition matrix

The composition rules are in `.claude/skills/compose-page/SKILL.md`. The table is the target block order per page
type, not a render template. A new case study, workshop, industry, team member or partner starts from a minimal
skeleton (`src/payload/seed/skeletons/*.ts`, the `layout` `defaultValue`), which an editor builds out to this.

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

**Not block-composed.** Blog posts are rich text with inline blocks. `/case-studies`, `/insights`, `/team`,
`/workshops` and `/partners` are route files that render a `Container` header over `cards` (DESIGN_SYSTEM §11.5).
`/contact` is a route file with the curated `ContactForm`.

---

## 7. Component files

Block configs carry no `Block` suffix (`Hero.ts`; `AccordionBlock.ts` is the one exception). Each layout and inline
config has a renderer, and the slug ↔ component pairing is test-enforced (`registryCoverage`,
`inlineRegistryCoverage`). The rest of `src/` is in ARCHITECTURE.md.

| Path                         | Holds                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| `src/payload/blocks/layout/` | The 13 layout configs; `index.ts` exports `layoutBlocks`                                   |
| `src/payload/blocks/inline/` | The 7 inline configs                                                                       |
| `src/payload/blocks/`        | `blockAdmin.ts`, `categories.ts`, `conditional.ts` (`requiredWhen`), `outputContract.ts`   |
| `src/payload/fields/`        | Shared fields: `blockCopy.ts`, `cta.ts`, `mediaRowLabel.ts`, `url.ts`, `seo.ts`, `slug.ts` |
| `src/components/sections/`   | Layout renderers, `registry.ts`, `RenderBlocks.tsx`                                        |
| `src/components/cards/`      | One card per collection, behind `cards`                                                    |
| `src/components/richText/`   | `RichText.tsx` and the inline renderers and registry                                       |
| `src/lib/resolveLayout.ts`   | Fills `cards` before `RenderBlocks` (§5.5)                                                 |

---

## 8. Render dispatcher

A route resolves the layout, then hands it to the one dispatcher:

```tsx
const layout = await resolveLayout(doc.layout) // fills `cards` (§5.5)
return <RenderBlocks blocks={layout} />
```

`RenderBlocks` looks each `blockType` up in `registry.ts` and renders the component with the block as props. An
unknown `blockType` is skipped, with a dev-only warning. Contract: `docs/contracts/render-blocks.md`. Inline rich-text
blocks follow the same pattern inside `RichText` (`docs/contracts/inline-block-converter.md`).

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
5. **Required = required.** Don't write fallback renders for fields the schema marks required.
6. **Inline blocks for in-flow content; layout blocks for full-width sections.** A `quote-pullquote` inside an
   article is inline; a `quote` between sections is a layout block.
7. **No data fetching in blocks.** Collection lists resolve in `resolveLayout`; components render what they are
   handed.
8. **One file per block config.**
9. **A block's name must stand alone in its picker.** `labels.singular` is all that tells two blocks apart, and the
   only thing the picker's search matches. No label may duplicate or be contained in another in the same picker.
   Enforced by `adminMetadata.int.spec.ts`.

**Changing a block** (an option, a fix): the config, the renderer, a showcase fixture
(`src/payload/seed/showcase/fixtures.ts`) and a test under `tests/int/blocks/`; then `npm run generate:types`,
`npm run generate:importmap` and `npx payload migrate:create` (every collection spreads `layoutBlocks`, so the
migration touches every collection's block tables). If the look changed, rebuild its picker preview:
`npm run seed:showcase`, `npm run visual:capture`, `npm run block:thumbnails` (ADR 0011; checklist in
PAYLOAD_DEVELOPMENT.md §6). Visually verify per CLAUDE.md.
