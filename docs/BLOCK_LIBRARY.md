# SEQTEK Website — Block & Component Library

**Date:** 2026-05-14
**Status:** Reference — Phase 1 implementation

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
| `workshops`          | **Blocks** (`layout`)                      | spec 010 pilot (US1): the acceptance gate; composed (incl. `gallery` proof photos + `video-embed`)                                                                                                                                                         |
| `teamMembers`        | **Blocks** (`layout`)                      | spec 010: gained `layout` + drafts/live-preview; new `/team/[slug]` detail renders via `RenderBlocks` + Person JSON-LD                                                                                                                                     |
| `posts`              | **Structured + inline blocks in richText** | **The sanctioned exception** (ADR 0009): title/excerpt/author fixed; body is rich text with embedded inline blocks                                                                                                                                         |
| ~~`servicePillars`~~ | **REMOVED (SVC-2)**                        | Absorbed into `services` as `tier: 'group'`; the collection and its tables are gone                                                                                                                                                                        |
| `industries`         | **Block-composed** (IND-1)                 | `layout` renders at `/industries/[slug]`; also a taxonomy target                                                                                                                                                                                           |
| `locations`          | **Structured**                             | Market landing taxonomy; no body composition                                                                                                                                                                                                               |

Net (post-spec-010): every non-blog detail type **and** the homepage global render their body from `layout` blocks via `RenderBlocks` — the single render path. Rearranging or enriching any of them is a content edit with no deploy; the only change that needs code is creating or fixing a **block type** (the curation loop, §5.9). `posts` is the one bespoke richText body that remains by design. `locations` stays structured because it is a listing/taxonomy target; `industries` joined the block-composed set under IND-1 (routed at `/industries/<slug>`) and `services` under SVC-2 (three tiers in one collection, all routed at `/services/<slug>`) and `servicePillars` was absorbed into it. The old discrete body columns were retained one release (hidden + read-only, expand/contract) and **were dropped in spec 011** — `layout` is now the only body.

---

## 2. Conventions

- **Payload slug:** kebab-case, used as `blockType` discriminator (`hero`, `stats-bar`, `cta-section`).
- **Interface name:** PascalCase suffix `Block` (`HeroBlock`, `StatsBarBlock`).
- **React component:** PascalCase, in `src/components/sections/` for blocks, `src/components/ui/` for primitives.
- **Renderer:** a single `<RenderBlocks blocks={...} />` component looks up `blockType` and dispatches to the registered React component.
- **Variants:** prefer a `variant` select field over multiple near-identical blocks. Three blocks become one with a select.
- **Required fields:** `required: true` everywhere the design assumes presence. Don't write conditional render fallbacks for fields the schema says are required.

---

## 3. UI primitives (`src/components/ui/`)

Pure React, no Payload coupling. Used by sections and pages.

The real surface is small — five primitives. (Earlier drafts of this doc listed Card/Badge/Tag/Avatar/Icon/Section/Breadcrumbs/Pagination/ScrollToTop and a `ui/form/` subdir; none of those were built. Form UI lives in `src/components/forms/`, see §7.)

| Component         | Props                                                          | Variants                                                             | Notes                                                                                                                   |
| ----------------- | -------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `Button`          | `variant`, `size`, `href`, `cta`, + native button/anchor attrs | `primary` / `secondary` / `ghost` / `link`; sizes `sm` / `md` / `lg` | Renders `<a>` (via `next/link`) when `href` is set, else `<button>`; link-mode opts into `cta_click` tracking via `cta` |
| `Container`       | `size`, + native div attrs                                     | `sm` / `md` / `lg` / `xl` (default) / `full`                         | Max-width wrapper (`mx-auto`) with horizontal padding                                                                   |
| `Prose`           | `size`, `tone`                                                 | size `compact` / `default` / `large`; tone `default` / `inverse`     | Typographic wrapper for Lexical output (`@tailwindcss/typography`)                                                      |
| `ResponsiveImage` | `media`, `sizes`, `className`, `loading`, `fetchPriority`      | —                                                                    | `<picture>` with webp + jpeg `srcSet` built from the Media collection's responsive sizes                                |
| `SmartLink`       | `href`, `external` (auto-detected), + native anchor attrs      | —                                                                    | Internal hrefs render via `next/link`; off-site hrefs get `rel="noopener noreferrer"`                                   |

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

The complete list of `Block` configs. Each gets:

- A Payload `Block` definition (in `src/payload/blocks/`)
- A React component (in `src/components/sections/`)
- Registration in `Pages.layout` (and selectively in inline rich-text where relevant)

Field-type shorthand below maps to PAYLOAD_DEVELOPMENT.md §5.

**The §5.1–§5.6 categories are load-bearing (spec 011 US2).** They are not a docs
convention any more: each is a heading in the admin block picker, and the assignment
lives in exactly one place — the block's own `admin.group`, set through
`blockAdmin()` in `src/payload/blocks/blockAdmin.ts`. The showcase harness derives its
category from there rather than restating it, `src/payload/blocks/categories.ts` holds
the canonical slugs and their editor-facing headings, and
`tests/int/adminMetadata.int.spec.ts` fails CI when a block has no category, no
preview, a name it shares with a neighbour, or (spec 011 US4) a field whose label reads
as machine text or whose effect the panel cannot show.

| §   | Category             | Picker heading        |
| --- | -------------------- | --------------------- |
| 5.1 | `hero`               | Page openers          |
| 5.2 | `content`            | Body content          |
| 5.3 | `social-proof`       | Proof and credibility |
| 5.4 | `cta`                | Calls to action       |
| 5.5 | `content-collection` | Lists and collections |
| 5.6 | `specialty`          | Specialty             |

The picker draws these headings in the order `layoutBlocks` registers its blocks, so
that array is kept sorted by category and a test pins it.

**Three labels carry a qualifier they would not otherwise need**, because Payload
renders no block description and `labels.singular` is the only text the picker shows or
searches: `Hero (standard page)`, `Embed (iframe)` and `Testimonial (single)`. Each was
otherwise a substring of a sibling's name. See ADR 0011 and
`specs/011-payload-admin-ux/contracts/admin-metadata.md` C1.

### 5.1 Hero blocks

#### `hero` — generic hero

| Field          | Type                        | Required    | Notes                                               |
| -------------- | --------------------------- | ----------- | --------------------------------------------------- |
| `variant`      | select                      | yes         | `text-only` / `with-image` / `with-video` / `split` |
| `eyebrow`      | text                        | no          | Small label above headline                          |
| `headline`     | text                        | yes         | 8-12 words target                                   |
| `subheadline`  | textarea                    | no          | 1-2 sentences                                       |
| `media`        | upload (media)              | conditional | Required when variant is `with-image` or `split`    |
| `videoUrl`     | text                        | conditional | Required when variant is `with-video`               |
| `primaryCta`   | group (label, url, variant) | no          |                                                     |
| `secondaryCta` | group (label, url, variant) | no          |                                                     |
| `alignment`    | select                      | no          | `left` / `center`; default `left`                   |

#### `case-study-hero` — case study page hero

| Field       | Type                           | Required | Notes                       |
| ----------- | ------------------------------ | -------- | --------------------------- |
| `eyebrow`   | text                           | yes      | Client/industry             |
| `headline`  | text                           | yes      | Outcome-focused             |
| `metric`    | group (number, label, context) | yes      | The headline outcome stat   |
| `heroImage` | upload (media)                 | yes      | Project-relevant, not stock |

#### `service-pillar-hero` — pillar landing hero

Its **own registered block**, not a `hero` variant (earlier drafts of this doc claimed otherwise): config at `src/payload/blocks/layout/ServicePillarHero.ts`, renderer at `src/components/sections/ServicePillarHero.tsx`, wired in both `src/components/sections/registry.ts` and `src/payload/blocks/layout/index.ts`. **Now orphaned** by the services restructure (§1): the pillar-landing IA it served is retired, so it ships in the library but no live page composes it.

### 5.2 Content blocks

#### `content` — rich text section

| Field        | Type                                           | Required | Notes                                              |
| ------------ | ---------------------------------------------- | -------- | -------------------------------------------------- |
| `width`      | select                                         | no       | `narrow` / `standard` / `wide`; default `standard` |
| `body`       | richText (Lexical, with inline blocks enabled) | yes      |                                                    |
| `background` | select                                         | no       | `none` / `subtle` / `accent`                       |

Inline blocks available within the `body` richText:

- `inline-cta` (label, url, variant)
- `testimonial-embed` (relationship → testimonials)
- `callout` (tone, body)
- `image-with-caption` (upload, caption, alt — alt sourced from media)
- `figure` (image + figure caption)
- `quote-pullquote` (quote, attribution)
- `disclosure` (summary, body) — accordion for FAQs-in-text

#### `two-column` — content + media side-by-side

| Field           | Type           | Required | Notes            |
| --------------- | -------------- | -------- | ---------------- |
| `mediaPosition` | select         | yes      | `left` / `right` |
| `body`          | richText       | yes      |                  |
| `media`         | upload (media) | yes      |                  |
| `cta`           | group          | no       |                  |

#### `image` — single captioned figure (spec 010, FR-005)

| Field       | Type           | Required | Notes                                                             |
| ----------- | -------------- | -------- | ----------------------------------------------------------------- |
| `image`     | upload (media) | yes      | alt sourced from Media collection                                 |
| `caption`   | text           | no       | rendered as `<figcaption>`                                        |
| `width`     | select         | no       | `narrow` / `standard` / `wide` / `full`; default `standard`       |
| `alignment` | select         | no       | `center` / `left` / `right`; default `center` (reading-axis safe) |

The one-off counterpart to `gallery`. Width variants mirror the `content` reading-column measures so a figure shares the body's vertical axis (DESIGN_SYSTEM §11.4 — owned by the block).

#### `gallery` — 1..N image gallery (spec 010, FR-005)

| Field     | Type   | Required       | Notes                                                       |
| --------- | ------ | -------------- | ----------------------------------------------------------- |
| `heading` | text   | no             | Optional section heading                                    |
| `items`   | array  | yes (min 1)    | Each: `image` (upload, required), `caption` (text)          |
| `layout`  | select | no             | `grid` / `carousel`; default `grid`                         |
| `columns` | select | no (grid only) | `2` / `3` / `4`; default `3`; hidden when `layout=carousel` |

The "drop a one-to-many picture section onto any page layout" block. Workshop `photos[]` migrates here; one-off figures use `image`. Unpopulated rows (depth-0 / missing upload) are dropped at render, never thrown.

#### `process-steps` — numbered methodology

| Field     | Type  | Required           | Notes                                                          |
| --------- | ----- | ------------------ | -------------------------------------------------------------- |
| `heading` | text  | no                 | Optional section heading                                       |
| `steps`   | array | yes (min 2, max 6) | Each step: `number` (auto), `title`, `body`, `icon` (optional) |

#### `deliverables` — bulleted list with icons

| Field     | Type          | Required | Notes        |
| --------- | ------------- | -------- | ------------ |
| `heading` | text          | no       |              |
| `items`   | array of text | yes      | Min 3, max 8 |

#### `comparison-table` — for localshoring vs nearshore vs offshore

| Field        | Type                 | Required | Notes                                              |
| ------------ | -------------------- | -------- | -------------------------------------------------- |
| `heading`    | text                 | yes      |                                                    |
| `columns`    | array (min 2, max 4) | yes      | `label`, `tagline`                                 |
| `rows`       | array                | yes      | `dimension`, `cells` (array matching column count) |
| `bestForRow` | array                | no       | One "best for" cell per column                     |

#### `timeline` — interactive company timeline

| Field     | Type  | Required    | Notes                                       |
| --------- | ----- | ----------- | ------------------------------------------- |
| `heading` | text  | no          |                                             |
| `items`   | array | yes (min 2) | `date`, `title`, `body`, `image` (optional) |

#### `faq` — accordion

| Field     | Type  | Required    | Notes                                  |
| --------- | ----- | ----------- | -------------------------------------- |
| `heading` | text  | no          | Default "Frequently asked questions"   |
| `items`   | array | yes (min 2) | `question` (text), `answer` (richText) |

Frontend emits `FAQPage` JSON-LD automatically.

### 5.3 Social proof blocks

#### `stats-bar` — number callouts

| Field     | Type   | Required    | Notes                                                                              |
| --------- | ------ | ----------- | ---------------------------------------------------------------------------------- |
| `heading` | text   | no          | Optional eyebrow                                                                   |
| `source`  | select | no          | `inline` / `from-site-settings` — when `from-site-settings`, pulls canonical stats |
| `items`   | array  | conditional | Required when `source: inline`. Min 3, max 5. Each: `number`, `label`, `suffix`    |

#### `metric-display` — single full-bleed metric

| Field        | Type   | Required | Notes                |
| ------------ | ------ | -------- | -------------------- |
| `number`     | text   | yes      |                      |
| `label`      | text   | yes      |                      |
| `context`    | text   | no       |                      |
| `background` | select | no       | `accent` / `inverse` |

#### `logo-bar` — client logo strip

| Field       | Type            | Required | Notes                                             |
| ----------- | --------------- | -------- | ------------------------------------------------- |
| `heading`   | text            | no       | Default "Trusted by industry leaders"             |
| `logos`     | array of upload | no       | The only source; with none the section is omitted |
| `treatment` | select          | no       | `grayscale-on-color-hover` / `color`              |

> **`source` dropped (PR #127, ROADMAP INERT-2):** its other option, "reuse the homepage set", mapped to an
> empty list and published an empty band — and there was nothing to reuse, since the `homepage` global carries
> only a `layout`. With that gone one option remained, so the select went with it.

#### `testimonial-single` — featured testimonial

| Field         | Type                        | Required | Notes                                               |
| ------------- | --------------------------- | -------- | --------------------------------------------------- |
| `testimonial` | relationship → testimonials | yes      |                                                     |
| `layout`      | select                      | no       | `centered` / `with-photo-left` / `with-photo-right` |

#### `testimonial-carousel` — multiple testimonials

| Field          | Type                                  | Required | Notes        |
| -------------- | ------------------------------------- | -------- | ------------ |
| `heading`      | text                                  | no       |              |
| `testimonials` | relationship → testimonials (hasMany) | yes      | Min 2, max 6 |

> **`autoplay` dropped (PR #127, ROADMAP INERT-2):** the block renders a static grid, so nothing read it.
> Re-add it with the carousel, not before.

### 5.4 CTA blocks

#### `cta-section` — standalone CTA

| Field             | Type               | Required    | Notes                            |
| ----------------- | ------------------ | ----------- | -------------------------------- |
| `variant`         | select             | yes         | `centered` / `split` / `inverse` |
| `headline`        | text               | yes         |                                  |
| `body`            | textarea           | no          |                                  |
| `primaryCta`      | group (label, url) | yes         |                                  |
| `secondaryCta`    | group (label, url) | no          |                                  |
| `background`      | select             | no          | `default` / `accent` / `image`   |
| `backgroundImage` | upload             | conditional | When `background: image`         |

### 5.5 Content collection blocks

#### `featured-case-study` — single highlighted case study

| Field       | Type                       | Required | Notes                         |
| ----------- | -------------------------- | -------- | ----------------------------- |
| `caseStudy` | relationship → caseStudies | yes      |                               |
| `heading`   | text                       | no       | Default "Featured case study" |

#### `case-study-grid` — listing of case studies

| Field         | Type                                 | Required    | Notes                                              |
| ------------- | ------------------------------------ | ----------- | -------------------------------------------------- |
| `heading`     | text                                 | no          |                                                    |
| `source`      | select                               | yes         | `manual` / `latest` / `by-industry` / `by-service` |
| `manualItems` | relationship → caseStudies (hasMany) | conditional |                                                    |
| `industry`    | relationship → industries            | conditional |                                                    |
| `service`     | relationship → services              | conditional |                                                    |
| `limit`       | number                               | no          | Default 3, max 9                                   |

#### `service-pillar-cards` — 3-up pillar grid

| Field     | Type                                                           | Required | Notes           |
| --------- | -------------------------------------------------------------- | -------- | --------------- |
| `heading` | text                                                           | no       |                 |
| `pillars` | relationship → services, filtered to `tier: 'group'` (hasMany) | yes      | Typically all 3 |

#### `service-cards` — sub-service grid

| Field         | Type                                                 | Required    | Notes                                  |
| ------------- | ---------------------------------------------------- | ----------- | -------------------------------------- |
| `heading`     | text                                                 | no          |                                        |
| `source`      | select                                               | yes         | `by-pillar` / `manual`                 |
| `pillar`      | relationship → services, filtered to `tier: 'group'` | conditional | The group whose ordered `items` render |
| `manualItems` | relationship → services (hasMany)                    | conditional |                                        |

#### `team-grid` — team members display

| Field         | Type                                 | Required | Notes                                                              |
| ------------- | ------------------------------------ | -------- | ------------------------------------------------------------------ |
| `heading`     | text                                 | no       |                                                                    |
| `filter`      | select                               | yes      | `leadership-only` / `all`, resolved by `resolveLayout` (see below) |
| `layout`      | select                               | no       | `cards` / `compact`                                                |
| `manualItems` | relationship → teamMembers (hasMany) | no       | In practice the only path that renders anyone                      |

Cards show `teamMembers.title` (the job title), never `role` (the one-sentence description) — `role`
belongs to the `/team/[slug]` header, which renders both. See ROADMAP UI-1 / PROJECT_HISTORY P5-27.

The `featured` option was **withdrawn** (UI-2): `teamMembers` carries `isLeadership` and `order` and
nothing else to select on, so it had no backing field and rendered an empty section.

#### `latest-insights` — blog post cards

| Field      | Type                      | Required | Notes                     |
| ---------- | ------------------------- | -------- | ------------------------- |
| `heading`  | text                      | no       | Default "Latest insights" |
| `limit`    | number                    | no       | Default 3                 |
| `category` | relationship → categories | no       | Optional filter           |

#### `industry-grid` — industry navigation cards

| Field        | Type                                | Required | Notes |
| ------------ | ----------------------------------- | -------- | ----- |
| `heading`    | text                                | no       |       |
| `industries` | relationship → industries (hasMany) | yes      |       |

### 5.6 Specialty blocks

#### `mission-vision-values` — MVV block (about page)

| Field     | Type     | Required           | Notes                                                                              |
| --------- | -------- | ------------------ | ---------------------------------------------------------------------------------- |
| `mission` | textarea | yes                |                                                                                    |
| `vision`  | textarea | yes                |                                                                                    |
| `values`  | array    | yes (min 3, max 8) | `name`, `description`                                                              |
| `layout`  | select   | no                 | `grid` / `stacked` (`tabs` dropped in PR #127 — it rendered identically to `grid`) |

#### `markets-map` — 4-market visual

> **Category note (spec 011 US2):** Ships as **`locations-list`**, category **`content-collection`** (§5.5 — "Lists and collections" in the picker), not specialty. Kept in this section under its pre-rename name; see the §5.7 rename table.

| Field     | Type                               | Required | Notes |
| --------- | ---------------------------------- | -------- | ----- |
| `heading` | text                               | no       |       |
| `markets` | relationship → locations (hasMany) | yes      |       |

#### `workshop-progression` — 3-workshop sequence visual

> **Category note (spec 011 US2):** Ships as **`workshop-list`**, category **`content-collection`** (§5.5), not specialty. Kept in this section under its pre-rename name; see the §5.7 rename table.

| Field       | Type                               | Required | Notes |
| ----------- | ---------------------------------- | -------- | ----- |
| `workshops` | relationship → workshops (hasMany) | yes      | Min 3 |

#### `video-embed` — YouTube/Vimeo with facade

| Field       | Type   | Required | Notes                                      |
| ----------- | ------ | -------- | ------------------------------------------ |
| `provider`  | select | yes      | `youtube` / `vimeo`                        |
| `videoId`   | text   | yes      |                                            |
| `title`     | text   | yes      | For caption + a11y                         |
| `thumbnail` | upload | no       | Custom thumbnail; falls back to provider's |

#### `download-card` — lead magnet CTA

| Field         | Type     | Required | Notes                                |
| ------------- | -------- | -------- | ------------------------------------ |
| `title`       | text     | yes      |                                      |
| `description` | textarea | yes      |                                      |
| `coverImage`  | upload   | yes      |                                      |
| `formId`      | text     | yes      | HubSpot form GUID for gated download |
| `fileUrl`     | text     | yes      | S3 URL to the asset                  |

> **A courtesy gate, not a real one (PR #125, ROADMAP INERT-2):** the block used to draw a disabled form and
> print `Asset: <fileUrl>` beside it, so the asset was neither gated nor downloadable. It now mounts the shared
> `HubspotLeadForm` and reveals the link in the success panel, so a reader does not see it on the page.
> **The address is still in the page source**: `successCta` is a prop to a client component, so Next serialises
> it into the RSC flight payload. Anyone viewing source, or any scraper, has the link without submitting.
> A real gate needs the asset served through a token-bearing route (signed S3 URL) — not built.

#### `newsletter-signup` — inline email capture

> **Category note (spec 011 US2):** Ships as **`newsletter-cta`**, category **`cta`** (§5.4 — "Calls to action"), not specialty. Kept in this section under its pre-rename name; see the §5.7 rename table.

> **Dormant (spec 005, 2026-06-02):** no newsletter program exists and the old site had none, so this block is unused in templates and `NEXT_PUBLIC_HUBSPOT_NEWSLETTER_FORM_ID` was removed. The definition stays in the library; wire it only if a newsletter program starts.

> **No longer a mock (PR #125, ROADMAP INERT-2):** it was a disabled input and a caption naming that removed env var. It now mounts the shared `HubspotLeadForm` with one email field, against whatever `formId` the block carries. With no `formId` the whole section is left off the page, so a dormant block publishes nothing rather than a dead form.

| Field     | Type     | Required | Notes                                                                |
| --------- | -------- | -------- | -------------------------------------------------------------------- |
| `heading` | text     | no       | Default "Subscribe to SEQTEK Insights"                               |
| `body`    | textarea | no       |                                                                      |
| `formId`  | text     | yes      | HubSpot form GUID; validated, and the section is omitted without one |

#### `hubspot-form` — full HubSpot form embed

| Field         | Type     | Required | Notes             |
| ------------- | -------- | -------- | ----------------- |
| `heading`     | text     | no       |                   |
| `description` | textarea | no       |                   |
| `formId`      | text     | yes      | HubSpot form GUID |

> **`submitRedirect` dropped (PR #127, ROADMAP INERT-2):** the form shows an inline success panel and never
> navigates, so nothing read it.

#### `hubspot-meetings` — booking embed

| Field        | Type | Required | Notes                     |
| ------------ | ---- | -------- | ------------------------- |
| `meetingUrl` | text | yes      | Full HubSpot meetings URL |
| `heading`    | text | no       |                           |

> **A button, not an embed (PR #125, ROADMAP INERT-2):** it used to draw a bordered box printing the raw URL
> and "loads in production". It now renders a "See available times" button opening that scheduler. The inline
> iframe would mean shipping HubSpot's `MeetingsEmbedCode.js` and widening the CSP (INTEGRATIONS.md §8);
> `BookingCompleteSeam` is already wired for it when that happens.

#### `brand-teaser` — Sequoyah story teaser (homepage)

| Field       | Type     | Required | Notes                                                                |
| ----------- | -------- | -------- | -------------------------------------------------------------------- |
| `headline`  | text     | yes      |                                                                      |
| `body`      | textarea | yes      | 2-3 sentences                                                        |
| `linkLabel` | text     | yes      |                                                                      |
| `linkUrl`   | text     | yes      | Default `/our-story` (the story lives on the flat `/our-story` Page) |
| `image`     | upload   | no       |                                                                      |

#### `nav-cards` — 3-up navigation cards (about landing)

| Field   | Type  | Required           | Notes                                      |
| ------- | ----- | ------------------ | ------------------------------------------ |
| `cards` | array | yes (min 2, max 4) | `title`, `description`, `image`, `linkUrl` |

#### `key-takeaways` — bulleted lessons (case study)

| Field     | Type          | Required           | Notes                   |
| --------- | ------------- | ------------------ | ----------------------- |
| `heading` | text          | no                 | Default "Key takeaways" |
| `items`   | array of text | yes (min 3, max 6) |                         |

#### `tech-stack` — technology tag display (case study)

| Field     | Type  | Required | Notes                                           |
| --------- | ----- | -------- | ----------------------------------------------- |
| `heading` | text  | no       | Default "Technologies"                          |
| `items`   | array | yes      | `label`, `linkUrl` (optional — to service page) |

#### `related-content` — related case studies / posts / services

> **Category note (spec 011 US2):** Ships as **`related-posts`**, category **`content-collection`** (§5.5), not specialty. Kept in this section under its pre-rename name; see the §5.7 rename table.

| Field     | Type                                                      | Required | Notes |
| --------- | --------------------------------------------------------- | -------- | ----- |
| `heading` | text                                                      | no       |       |
| `items`   | relationship (polymorphic → posts, caseStudies, services) | yes      | Max 3 |

### 5.7 Phase 2 implementation status

Spec 003 Phase 2 (T050–T056) shipped 32 layout blocks. The mapping below reconciles the §5.1–§5.6 catalog above with the implementation in `src/payload/blocks/layout/`. Per Constitution III, this section is authoritative until the catalog tables themselves are rewritten in a follow-up doc pass.

**Renames** (catalog name → implemented slug):

| Catalog name           | Implemented slug        | Note                                                                                             |
| ---------------------- | ----------------------- | ------------------------------------------------------------------------------------------------ |
| `testimonial-single`   | `testimonial-block`     | Same field shape; `layout` select includes the catalog's three variants                          |
| `testimonial-carousel` | `featured-testimonials` | Static grid; the carousel was never built and the `autoplay` field was dropped in PR #127        |
| `latest-insights`      | `post-list`             | Adds explicit `source` (latest / by-category / manual)                                           |
| `markets-map`          | `locations-list`        | Renamed to reflect that the Phase 2 renderer is a card grid, not a map; map is `map` block below |
| `workshop-progression` | `workshop-list`         | Numbered list rendering; horizontal flow can be added without schema change                      |
| `newsletter-signup`    | `newsletter-cta`        | CTA naming aligns with sibling `contact-cta`                                                     |
| `related-content`      | `related-posts`         | Phase 2 ships the post-typed variant; polymorphic variant deferred                               |

**New blocks added in Phase 2** (beyond the §5.1–§5.6 catalog, per spec 003 tasks.md T050/T052/T053/T055):

| Slug               | Category     | Purpose                                                                                  |
| ------------------ | ------------ | ---------------------------------------------------------------------------------------- |
| `homepage-hero`    | Hero         | Display-size hero with required dual CTAs (homepage row 1 of §6)                         |
| `client-logo-grid` | Social proof | Denser captioned-logo grid distinct from the linear `logo-bar`                           |
| `contact-cta`      | CTA          | CTA with optional HubSpot meetings embed affordance (separate intent from `cta-section`) |
| `accordion`        | Specialty    | Generic disclosure pattern (vs. FAQ which emits FAQPage JSON-LD)                         |
| `tabs`             | Specialty    | Tab-strip representation; Phase 2 renderer is static (server-rendered)                   |
| `map`              | Specialty    | Static map iframe (OpenStreetMap / Google Maps allow-list)                               |
| `embed`            | Specialty    | Generic sandboxed iframe for third-party widgets                                         |

**Catalog blocks landed in the same PR** (built in the second pass after initial deferral): `deliverables` (§5.2), `metric-display` (§5.3), `service-pillar-cards` (§5.5), `team-grid` (§5.5), `download-card` (§5.6), `hubspot-form` (§5.6), `hubspot-meetings` (§5.6), `brand-teaser` (§5.6), `nav-cards` (§5.6), `key-takeaways` (§5.6), `tech-stack` (§5.6).

**Final Phase 2 layout block count: 43** — every block enumerated in §5.1–§5.6 is implemented, plus the 7 additions beyond the catalog from the table above. HubSpot-driven blocks (`hubspot-form`, `hubspot-meetings`, `download-card`, `newsletter-cta`) shipped with static placeholder affordances in the Phase 2 renderer. **That is no longer true (PR #125):** all four now do the real thing — the three form blocks share `HubspotLeadForm` and its live submit path, and `hubspot-meetings` links to the scheduler. What is still deferred is the inline HubSpot _script_ embeds per `docs/INTEGRATIONS.md` §1–§3.

**Spec 010 additions (ADR 0009, FR-005): +2 → 45 blocks.** `image` (§5.2) and `gallery` (§5.2) close the image gap surfaced by the block-coverage audit (§5.8). These are the only new blocks the block-composed-pages migration required.

### 5.8 Block-coverage audit (spec 010 / SC-005)

ADR 0009 retires every bespoke per-type render template (workshops, case studies, services, team, homepage) in favor of `RenderBlocks(layout)`. SC-005 requires that **every capability of each retired template maps to ≥1 existing block — zero capabilities lost.** The audit below is the proof; the only gap was images, closed by `image` + `gallery`.

| Retired template capability                                     | Block(s) that cover it                                                                                           |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Workshop description / format / audience (richText)             | `content`                                                                                                        |
| Workshop deliverables (array)                                   | `deliverables`                                                                                                   |
| Workshop photos (1..N images)                                   | **`gallery`** (new)                                                                                              |
| Workshop recap video                                            | `video-embed`                                                                                                    |
| Workshop testimonial                                            | `testimonial-block`                                                                                              |
| Workshop download + inquiry form                                | `download-card`, `hubspot-form`                                                                                  |
| Case study hero + lead metric                                   | `case-study-hero`                                                                                                |
| Case study problem / solution / impact (richText)               | `content`                                                                                                        |
| Case study metrics                                              | `stats-bar`, `metric-display`                                                                                    |
| Case study technologies                                         | `tech-stack`                                                                                                     |
| Case study key takeaways                                        | `key-takeaways`                                                                                                  |
| Service description / approach (richText)                       | `content`                                                                                                        |
| Service deliverables                                            | `deliverables`                                                                                                   |
| Service FAQ (preserves FAQPage JSON-LD)                         | `faq`                                                                                                            |
| Team member bio / narrative                                     | `content`                                                                                                        |
| Team member expertise / certs / education / facts               | `deliverables`, `key-takeaways`, `content`                                                                       |
| Team member quote                                               | `testimonial-block`                                                                                              |
| Homepage hero / stats / featured / brand / logos / testimonials | `homepage-hero`, `stats-bar`, `featured-case-study`, `brand-teaser`, `client-logo-grid`, `featured-testimonials` |
| One-off figure (any page)                                       | **`image`** (new)                                                                                                |

Result: 0 lost capabilities. The reading-column rule (DESIGN_SYSTEM §11.4) is enforced inside the block components, so it travels with the block onto any page (FR-009).

### 5.9 Block-curation loop — the one code path (spec 010 / ADR 0009 / FR-011)

Under ADR 0009 every non-blog page is `RenderBlocks(layout)`. Rearranging, enriching, or building a page is a **content edit with no deploy**. The single change that legitimately requires code is **adding or fixing a block type** — and once a block lands it is usable on every page type with no per-type code. This is that loop. `image` + `gallery` (the only gap the §5.8 audit found) are its worked example.

1. **Surface the gap.** A page cannot be expressed with the current library — discovered while composing (the [`compose-page`](../.claude/skills/compose-page/SKILL.md) authoring skill emits a single **named block gap** instead of a layout) or by hand. The skill never hand-codes a page; it names exactly one missing block and stops.
2. **Confirm it is really a gap.** Re-run the §5.8 audit method against the need: does an existing block (or an existing block plus one new field/variant) already cover it? Prefer **extending an existing block** over a new slug when the capability is a variant of something we already render (e.g. a new `content.width` value, a `testimonial-block` layout option). Only a genuinely new capability earns a new block. If more than one capability is missing, close the highest-leverage one first, then re-run the skill.
3. **Add or fix the block (the only code).** This is the whole code path:
   - Block config: `src/payload/blocks/layout/<Name>.ts` (kebab-case `slug`), then register it in `src/payload/blocks/layout/index.ts` **and** add it to the exported `layoutBlocks` array.
   - Render component: `src/components/sections/<Name>.tsx`, then register the slug in `src/components/sections/registry.ts`. The reading-column rule (DESIGN_SYSTEM §11.4) lives **inside the component** so it travels with the block onto every page (FR-009).
   - Run `npm run generate:types` and `npm run generate:importmap`.
   - Add the Payload migration for the new block tables (`<collection>_blocks_<slug>*` live **and** `_<collection>_v_blocks_<slug>*` version tables) — never `drizzle-kit push` (Constitution V). Because `layout` is the same `[...layoutBlocks]` array on every collection, the generated migration adds the block's tables for **every** collection at once.
   - Add a showcase fixture (`src/payload/seed/showcase/fixtures.ts`) and visually verify per CLAUDE.md.
     The fixture no longer declares a category — it is read from the block's `admin.group`.
   - Give the block its admin presentation: `admin: blockAdmin('<category>', '<slug>', '<Label>')`,
     where `<Label>` is the block's own `labels.singular` — one name feeds the preview's alt text,
     the picker card and the collapsed row's pill (spec 011 US4).
     Then build its picker preview — `npm run seed:showcase`, `npm run visual:capture`,
     `npm run block:thumbnails` — and commit the generated `public/block-previews/<slug>.webp`.
     `tests/int/adminMetadata.int.spec.ts` fails without it (ADR 0011).
4. **Document it.** Add the block to the §5 catalog (category + field table) and bump the count in §5.7. The §5 category you file it under and the `admin.group` you gave it in step 3 must agree — the picker heading is what an editor actually sees. The registry↔library coupling is guarded by `tests/int/render/registryCoverage.int.spec.ts` (every layout export has a registry entry and vice-versa — no orphans).
5. **Available everywhere, no per-type code.** Every collection's `layout` field spreads the **same** `layoutBlocks` array and every page renders through the **one** `RenderBlocks` dispatcher, so the new block is immediately usable on pages, workshops, case studies, services, and team with zero per-type code. This reuse property is pinned by `tests/int/blocks/blockReuseAcrossTypes.int.spec.tsx` (the `gallery` worked example renders identically on page + case study + workshop from one definition).

The loop is deliberately the **only** exception to "no code for layout" (SC-006): if a change is not "add or fix a block type," it should not require a deploy.

---

### 5.10 Collection-backed blocks resolve at template time (ROADMAP UI-2)

Four blocks let an author pick a **source** instead of hand-picking rows:

| Block             | Field    | Non-manual values                     | Resolved from     |
| ----------------- | -------- | ------------------------------------- | ----------------- |
| `team-grid`       | `filter` | `leadership-only`, `all`              | `listTeamMembers` |
| `post-list`       | `source` | `latest`, `by-category`               | `listPosts`       |
| `case-study-grid` | `source` | `latest`, `by-industry`, `by-service` | `listCaseStudies` |
| `service-cards`   | `source` | `by-pillar`                           | `listServices`    |

**`src/lib/resolveLayout.ts` is where those selects are consumed.** Every route that renders a
`layout` awaits `resolveLayout(doc.layout)` before handing it to `RenderBlocks`, and the resolver fills
each block's `manualItems` from the cached readers in `lib/payload.ts` (so the reads inherit the cache
tags, the hourly revalidation and the `withReadTimeout` guard). An explicit manual pick always wins over
the source, and a read that times out throws rather than degrading to a silently empty section.

**The render components never read `source`/`filter`.** They draw whatever `manualItems` they are handed
and nothing else, which is what keeps them pure, synchronous and renderable by React Testing Library —
`RenderBlocks` stays synchronous, and blocks never touch the database. Adding a new collection-backed
block means adding a case to `resolveLayout`, not making the component async.

Before UI-2 nothing consumed these selects: a block set to any non-manual source rendered the literal
string `Source: latest (resolves at template time)` as public body copy. `team-grid` was the worst,
because `filter` is its one **required** field while `manualItems` is optional — the natural authoring
path produced the broken page. Pinned by `tests/int/lib/resolveLayout.int.spec.ts`.

---

## 6. Page composition matrix

Block order per page type. This is the canonical reference — content layouts should follow these unless there's a documented reason to vary.

> **Post-spec-010 note (ADR 0009):** the entries below that describe a type as "structured fields rendered through fixed sequence" (e.g. case study) are **historical** — those bodies are now `layout` blocks rendered by `RenderBlocks`. The per-type composers that produced these orderings during the spec-010 migration were deleted in spec 011 once the fields they read were dropped; the equivalent starting point for a new record is now the per-type skeleton (`src/payload/seed/skeletons/*.ts`, wired as each collection's `layout` `defaultValue`). So this matrix is the **editor's starting block order**, not a hardcoded render template. Component names like `<Prose>`/`<MetricsGrid>`/`<TestimonialSingle>` map to the real block slugs `content`/`metric-display`+`stats-bar`/`testimonial-block` (see §5.7 renames). The old "service pillar landing" / "service detail" rows are retired — both fold into the single **Service offering** entry below (§1: offerings are now four Pages by slug). Only the blog Post still renders a bespoke richText body.

### Homepage (`homepage` global — `layout` blocks via `RenderBlocks`)

Spec 010 moved the homepage off structured fields onto an editor-reorderable `layout` blocks array (§1). The order below is the composer's default starting point, not a fixed renderer:

1. `homepage-hero` (above the fold; required dual CTA)
2. `stats-bar` (`source: from-site-settings`)
3. `service-pillar-cards` (3-up)
4. `featured-case-study`
5. `brand-teaser` (Sequoyah hook)
6. `client-logo-grid` (`treatment: grayscale-on-color-hover`)
7. `featured-testimonials` (max 3)
8. `cta-section` (`variant: split` — Touchstone teaser)
9. `post-list` (`limit: 3` — latest insights)
10. `cta-section` (`variant: centered` — dual CTA: book call + assessment)

### About landing (`pages` collection — `layout` blocks)

`hero` → `stats-bar` → `content` (who we are) → `mission-vision-values` → `two-column` (localshoring preview) → `logo-bar` → `nav-cards` (sub-page routing)

### Our Story (`pages` — `layout` blocks)

`hero` → `content` (Sequoyah brand story) → `timeline` (company milestones) → `content` (founding philosophy) → `content` (localshoring origin) → `cta-section` (dual)

### Team (`pages` — `layout` blocks)

`hero` → `team-grid` (filter: leadership-only) → `content` (collective expertise narrative) → `team-grid` (filter: all) → `content` (culture) → `cta-section`

### Localshoring (`pages` — `layout` blocks)

`hero` → `content` (definition + callout) → `comparison-table` → `content` (business case with stats) → `markets-map` → `testimonial-single` → `cta-section`

### Services overview (`pages` — `layout` blocks)

`hero` → `content` (overview) → `service-pillar-cards` → `featured-case-study` → `cta-section`

### Service offering (`pages` — `layout` blocks; one Page per offering, addressed by slug)

The retired `/services/[pillar]/[slug]` pillar→detail IA (the two rows that used to sit here) is replaced by **four offering Pages**, each composed from the block library. Default composer order:

`hero` → `content` (what it is / approach) → `process-steps` → `deliverables` → `featured-case-study` → `faq` → `cta-section`

### Case study (`caseStudies` — structured fields rendered through fixed sequence)

`<CaseStudyHero>` + sidebar (industry, services, technologies) → `<Prose>` (Challenge) → `<Prose>` (Approach) → `<MetricsGrid>` (Results — from `metrics` array) → `<KeyTakeaways>` → `<TechStack>` → `<TestimonialSingle>` → `<RelatedContent type="caseStudies">` → `<CtaSection>`

### Blog post (`posts` — structured fields with inline-block rich text body)

`<BlogPostHeader>` (title, eyebrow, author byline, date, hero image) → `<Prose>` (body with inline CTAs, callouts, testimonial embeds) → `<RelatedContent type="posts">` → `<RelatedContent type="services">` → share buttons

### Blog listing (`/insights`)

`<Hero variant="text-only">` → category filter chips → `<Pagination>` paginated `<PostGrid>`

### Industry page (`industries` — block-composed since IND-1)

`hero` → `content` (sector context) → `service-cards` set to manual → `case-study-grid` set to `by-industry` → `stats-bar` → `logo-bar` → `cta-section`

Every part of that is authored in the block. The recipe used to map three of
these to industry fields — `description`, `relevantServices`, `clientLogos` —
but those are still INERT-1: hidden, with no consumer on the render path
(`Industries.ts`). `industry` is the one field a block reads, and only
`case-study-grid` reads it.

### Market landing (`locations` — structured fields)

`<Hero>` → `<Prose>` (local context — unique per city) → `<ServiceCards>` (all pillars) → `<CaseStudyGrid source="manual">` (local projects) → office details block → `<CtaSection>`

### Workshop landing (`pages` — `layout` blocks)

`hero` → `content` (program overview) → `workshop-list` (the `WorkshopList` renderer) → `stats-bar` (workshop stats with citations) → `cta-section`

### Workshop detail (`workshops` — structured fields)

`<Hero>` → `<Prose>` (description) → agenda block → `<Deliverables>` → `<Prose>` (audience) → facilitator bio → `<TestimonialSingle>` → `<CtaSection>`

### Contact (`pages`)

`<Hero>` → `<HubspotForm>` → office details → `<CtaSection>` (book a call alternative)

### Contact > Book a Call

`<Hero>` → `<HubspotMeetings>`

---

## 7. Component file structure

Regenerated from the real tree. Block configs carry **no** `Block` suffix (`Hero.ts`, not `HeroBlock.ts`); each layout/inline config has a matching renderer of the same name, and the slug↔component pairing is test-enforced (`registryCoverage` / `inlineRegistryCoverage`).

```
src/
├── components/
│   ├── ui/                                  # UI primitives (§3)
│   │   ├── Button.tsx
│   │   ├── Container.tsx
│   │   ├── Prose.tsx
│   │   ├── ResponsiveImage.tsx
│   │   └── SmartLink.tsx
│   │
│   ├── layout/                              # Global chrome (§4)
│   │   ├── SiteHeader.tsx
│   │   ├── SiteFooter.tsx
│   │   ├── MobileNav.tsx
│   │   ├── PreviewBanner.tsx
│   │   ├── ConsentPreferences.tsx
│   │   └── SkipToContent.tsx
│   │
│   ├── sections/                            # Layout block renderers (§5)
│   │   ├── registry.ts                      # blockType (kebab slug) → component
│   │   ├── RenderBlocks.tsx                 # Walks layout[] and dispatches via registry
│   │   ├── Accordion.tsx
│   │   ├── BrandTeaser.tsx
│   │   ├── CaseStudyGrid.tsx
│   │   ├── CaseStudyHero.tsx
│   │   ├── ClientLogoGrid.tsx
│   │   ├── ComparisonTable.tsx
│   │   ├── ContactCta.tsx
│   │   ├── Content.tsx
│   │   ├── CtaSection.tsx
│   │   ├── Deliverables.tsx
│   │   ├── DownloadCard.tsx
│   │   ├── Embed.tsx
│   │   ├── FAQ.tsx
│   │   ├── FeaturedCaseStudy.tsx
│   │   ├── FeaturedTestimonials.tsx
│   │   ├── Gallery.tsx
│   │   ├── Hero.tsx
│   │   ├── HomepageHero.tsx
│   │   ├── HubspotForm.tsx
│   │   ├── HubspotMeetings.tsx
│   │   ├── Image.tsx
│   │   ├── IndustryGrid.tsx
│   │   ├── KeyTakeaways.tsx
│   │   ├── LocationsList.tsx
│   │   ├── LogoBar.tsx
│   │   ├── Map.tsx
│   │   ├── MetricDisplay.tsx
│   │   ├── MissionVisionValues.tsx
│   │   ├── NavCards.tsx
│   │   ├── NewsletterCta.tsx
│   │   ├── PostList.tsx
│   │   ├── ProcessSteps.tsx
│   │   ├── RelatedPosts.tsx
│   │   ├── ServiceCards.tsx
│   │   ├── ServicePillarCards.tsx
│   │   ├── ServicePillarHero.tsx
│   │   ├── StatsBar.tsx
│   │   ├── Tabs.tsx
│   │   ├── TeamGrid.tsx
│   │   ├── TechStack.tsx
│   │   ├── TestimonialBlock.tsx
│   │   ├── Timeline.tsx
│   │   ├── TwoColumn.tsx
│   │   ├── VideoEmbed.tsx
│   │   └── WorkshopList.tsx
│   │
│   ├── richText/                            # Lexical body + inline block renderers
│   │   ├── RichText.tsx                     # Lexical → React converter (wraps Prose)
│   │   └── inline/
│   │       ├── registry.ts                  # inline blockType → component
│   │       ├── Callout.tsx
│   │       ├── Disclosure.tsx
│   │       ├── Figure.tsx
│   │       ├── ImageWithCaption.tsx
│   │       ├── InlineCta.tsx
│   │       ├── QuotePullquote.tsx
│   │       └── TestimonialEmbed.tsx
│   │
│   ├── forms/                               # React form clients
│   │   ├── ContactForm.tsx
│   │   ├── HubspotLeadForm.tsx
│   │   └── WorkshopInquiryForm.tsx
│   │
│   ├── integrations/
│   │   ├── ConsentDefault.tsx
│   │   ├── GtmScript.tsx
│   │   └── HubSpotTracking.tsx
│   │
│   ├── analytics/
│   │   ├── BookingCompleteSeam.tsx
│   │   ├── TrackedCtaLink.tsx
│   │   └── TrackView.tsx
│   │
│   ├── seo/
│   │   └── JsonLd.tsx
│   │
│   ├── error/
│   │   ├── NotFoundTracker.tsx
│   │   └── requestId.ts
│   │
│   └── admin/                               # Payload admin-panel customizations
│       ├── BeforeLoginGoogle.tsx
│       └── LoginError.tsx
│
└── payload/
    ├── blocks/
    │   ├── conditional.ts                   # Shared conditional-field helpers
    │   ├── layout/                          # Layout block configs (45)
    │   │   ├── index.ts                     # Re-exports + the `layoutBlocks` array
    │   │   ├── Accordion.ts
    │   │   ├── BrandTeaser.ts
    │   │   ├── CaseStudyGrid.ts
    │   │   ├── CaseStudyHero.ts
    │   │   ├── ClientLogoGrid.ts
    │   │   ├── ComparisonTable.ts
    │   │   ├── ContactCta.ts
    │   │   ├── Content.ts
    │   │   ├── CtaSection.ts
    │   │   ├── Deliverables.ts
    │   │   ├── DownloadCard.ts
    │   │   ├── Embed.ts
    │   │   ├── FAQ.ts
    │   │   ├── FeaturedCaseStudy.ts
    │   │   ├── FeaturedTestimonials.ts
    │   │   ├── Gallery.ts
    │   │   ├── Hero.ts
    │   │   ├── HomepageHero.ts
    │   │   ├── HubspotForm.ts
    │   │   ├── HubspotMeetings.ts
    │   │   ├── Image.ts
    │   │   ├── IndustryGrid.ts
    │   │   ├── KeyTakeaways.ts
    │   │   ├── LocationsList.ts
    │   │   ├── LogoBar.ts
    │   │   ├── Map.ts
    │   │   ├── MetricDisplay.ts
    │   │   ├── MissionVisionValues.ts
    │   │   ├── NavCards.ts
    │   │   ├── NewsletterCta.ts
    │   │   ├── PostList.ts
    │   │   ├── ProcessSteps.ts
    │   │   ├── RelatedPosts.ts
    │   │   ├── ServiceCards.ts
    │   │   ├── ServicePillarCards.ts
    │   │   ├── ServicePillarHero.ts
    │   │   ├── StatsBar.ts
    │   │   ├── Tabs.ts
    │   │   ├── TeamGrid.ts
    │   │   ├── TechStack.ts
    │   │   ├── TestimonialBlock.ts
    │   │   ├── Timeline.ts
    │   │   ├── TwoColumn.ts
    │   │   ├── VideoEmbed.ts
    │   │   └── WorkshopList.ts
    │   └── inline/                          # Inline block configs (7)
    │       ├── index.ts
    │       ├── Callout.ts
    │       ├── Disclosure.ts
    │       ├── Figure.ts
    │       ├── ImageWithCaption.ts
    │       ├── InlineCta.ts
    │       ├── QuotePullquote.ts
    │       └── TestimonialEmbed.ts
    │
    ├── fields/
    │   └── url.ts                           # Shared URL/link group field
    │
    └── hooks/
        ├── enforceDraftWhenScheduled.ts
        ├── invalidateMediaOnChange.ts
        ├── revalidateOnChange.ts
        └── slugFromTitle.ts                 # Auto-slug from title
```

---

## 8. Render dispatcher

A single dispatcher renders a `layout` array regardless of which blocks appear:

```typescript
// The map lives in src/components/sections/registry.ts; RenderBlocks.tsx imports it.
import type { Page } from '@/payload-types'

const registry: Record<string, React.ComponentType<any>> = {
  hero: Hero,
  'case-study-hero': CaseStudyHero,
  content: Content,
  'two-column': TwoColumn,
  'process-steps': ProcessSteps,
  // ... one entry per block
}

export function RenderBlocks({ blocks }: { blocks: Page['layout'] }) {
  return (
    <>
      {blocks?.map((block, i) => {
        const Component = registry[block.blockType]
        if (!Component) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(`Unknown blockType: ${block.blockType}`)
          }
          return null
        }
        return <Component key={block.id ?? i} {...block} />
      })}
    </>
  )
}
```

For inline rich-text blocks, the same pattern applies inside the Lexical `RichText` converter (PAYLOAD_DEVELOPMENT.md §7).

---

## 9. Block library hygiene rules

1. **Add a block only when 2+ pages need it.** A one-off block is just a page component. Don't pollute the editor menu.
2. **Variants over duplication.** If a new "hero with reversed image" appears, add a variant to `hero`, not a new block.
3. **Required = required.** Don't write fallback renders for fields the schema marks required. Trust Payload validation.
4. **Inline blocks for _in-flow_ content; layout blocks for _full-width_ sections.** A `pull-quote` inside an article is inline; a `testimonial-single` between sections is a layout block.
5. **No business logic in blocks.** Blocks render. Data shaping (filtering case studies by industry, sorting posts) happens in the page component or a server-side helper.
6. **One file per block config.** Easier diffs, easier discovery, no 2,000-line `blocks.ts`.
7. **A block's name must stand alone in its picker.** Payload draws no description, so `labels.singular`
   is the whole of what tells two cards apart — and it is also the only thing the picker's search
   matches. No label may duplicate or be contained in another label offered by the same picker;
   qualify it instead (`Hero (standard page)`, not `Hero`). Enforced by `adminMetadata.int.spec.ts`.

---

## 10. Open questions for this doc

| ID      | Question                                                                                                                                                                                                                           | Owner                      |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| ~~B-1~~ | **Resolved (ADR 0009 / spec 010).** `layout` is no longer pages-only — every non-blog collection **and** the homepage global spread the same `layoutBlocks` array and render through the one `RenderBlocks` dispatcher (§1, §5.9). | Engineering                |
| B-2     | Decide whether `featured-case-study` and `featured-testimonials` should be globals (homepage) only, or also reusable on Pages                                                                                                      | Engineering                |
| B-3     | Should `mission-vision-values` source from `siteSettings` (single source of truth) or accept inline content per page?                                                                                                              | Engineering + Content      |
| B-4     | `comparison-table` flexibility — fully generic or hardcoded to the 3-model localshoring comparison?                                                                                                                                | Content                    |
| B-5     | Inline-blocks inside post body — confirm full list and editor UX (slash command vs button bar)                                                                                                                                     | Content lead + Engineering |
