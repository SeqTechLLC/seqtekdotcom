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

The wrong choice creates either rigidity (structured-only) or chaos (blocks-only). Rule of thumb:

| Collection / Global | Approach                                   | Why                                                                                                                                          |
| ------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `pages`             | **Blocks** (`layout` field)                | Generic content pages (about sub-pages, resources, etc.) need flexible composition                                                           |
| `homepage` (global) | **Structured fields**                      | Content is fixed and intentional; editors should not be able to remove the stats bar                                                         |
| `posts`             | **Structured + inline blocks in richText** | Title/excerpt/author are fixed; body is rich text with embedded CTA/testimonial/callout blocks                                               |
| `caseStudies`       | **Structured**                             | Per CONTENT-REQUIREMENTS, every case study has the same Challenge → Approach → Results → Testimonial structure. Variance kills scannability. |
| `services`          | **Structured**                             | Same — buyers compare service pages side-by-side; consistent shape helps                                                                     |
| `servicePillars`    | **Structured**                             | Three pillars, three identical pages, predictable shape                                                                                      |
| `workshops`         | **Structured**                             | Workshop pages are product pages with consistent fields                                                                                      |
| `industries`        | **Structured**                             | Industry pages share a fixed template per CONTENT-REQUIREMENTS                                                                               |
| `locations`         | **Structured**                             | Market landing pages — same shape, different city content                                                                                    |

Net: only `pages` uses the full block library as `layout`. Other collections embed specific blocks at known field positions (e.g., a `richText` body field with `BlocksFeature` for inline blocks).

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

| Component     | Props                                                                           | Variants                                                             | Notes                                                          |
| ------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------- |
| `Button`      | `as`, `href`, `variant`, `size`, `iconLeft`, `iconRight`, `disabled`, `loading` | `primary` / `secondary` / `ghost` / `link`; sizes `sm` / `md` / `lg` | Renders as `<a>` or `<button>` based on `href`                 |
| `Card`        | `as`, `padding`, `elevation`, `interactive`                                     | flat / elevated / outlined                                           | Wrapper primitive                                              |
| `Badge`       | `tone`, `size`                                                                  | `neutral` / `accent` / `success` / `warning`                         | For tags, status, categories                                   |
| `Tag`         | `href`, `label`                                                                 | —                                                                    | Linkable category/technology tag                               |
| `Avatar`      | `src`, `alt`, `size`, `fallback`                                                | `xs` / `sm` / `md` / `lg`                                            | Headshots, author bylines                                      |
| `Icon`        | `name`, `size`, `className`                                                     | —                                                                    | Wraps Lucide React; whitelist allowed names in TS union        |
| `SmartLink`   | `href`, `external` (auto-detected)                                              | —                                                                    | Adds external arrow + `rel="noopener noreferrer"` for off-site |
| `Container`   | `size`, `padded`                                                                | `sm` / `md` / `lg` / `xl` / `full`                                   | Max-width wrapper with horizontal padding                      |
| `Section`     | `as`, `tone`, `padding`                                                         | `default` / `subtle` / `inverse` / `accent`                          | Vertical-padded `<section>`                                    |
| `Prose`       | `size`, `tone`                                                                  | `default` / `large` / `compact`                                      | Wraps Lexical output with `@tailwindcss/typography`            |
| `Breadcrumbs` | `items`                                                                         | —                                                                    | Renders `BreadcrumbList` JSON-LD too                           |
| `Pagination`  | `currentPage`, `totalPages`, `basePath`                                         | —                                                                    | For blog/case-study listing pages                              |
| `ScrollToTop` | —                                                                               | —                                                                    | Floating button, appears after scroll threshold                |

### Form primitives (`src/components/ui/form/`)

| Component      | Notes                                                                          |
| -------------- | ------------------------------------------------------------------------------ |
| `Input`        | text/email/tel/url types; `error` prop renders inline error                    |
| `Textarea`     | autosize variant                                                               |
| `Select`       | Native select for SSR; consider Radix UI Select if a richer dropdown is needed |
| `Checkbox`     | Custom styled, accessible                                                      |
| `Radio`        | Custom styled, accessible                                                      |
| `FormField`    | Wrapper: label + control + help text + error message                           |
| `SubmitButton` | `Button` with `loading` state during async submission                          |
| `FormError`    | Banner for top-level submission errors                                         |
| `FormSuccess`  | Confirmation state                                                             |

---

## 4. Layout components (`src/components/layout/`)

Not blocks — these are global chrome.

| Component             | Data source                                | Notes                                                          |
| --------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| `SiteHeader`          | `navigation` global, `siteSettings` global | Logo, primary nav, mobile menu trigger, primary CTA button     |
| `SiteFooter`          | `navigation` global, `siteSettings` global | Multi-column nav, contact info, social, copyright, legal links |
| `MobileNav`           | `navigation` global                        | Slide-over drawer, focus-trapped                               |
| `MegaMenu`            | `navigation` global children               | Optional — services pillar may benefit from a dropdown         |
| `CookieConsentBanner` | HubSpot-rendered                           | We do not own this UI; just ensure styling integrates          |
| `SkipToContent`       | —                                          | Accessibility — first focusable element                        |

---

## 5. Payload block catalog

The complete list of `Block` configs. Each gets:

- A Payload `Block` definition (in `src/payload/blocks/`)
- A React component (in `src/components/sections/`)
- Registration in `Pages.layout` (and selectively in inline rich-text where relevant)

Field-type shorthand below maps to PAYLOAD_DEVELOPMENT.md §5.

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

Uses standard `hero` block with `variant: with-image` + structured eyebrow.

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

| Field       | Type            | Required    | Notes                                                         |
| ----------- | --------------- | ----------- | ------------------------------------------------------------- |
| `heading`   | text            | no          | Default "Trusted by industry leaders"                         |
| `source`    | select          | yes         | `inline` / `from-homepage` — homepage owns canonical logo set |
| `logos`     | array of upload | conditional | When `source: inline`                                         |
| `treatment` | select          | no          | `grayscale-on-color-hover` / `color`                          |

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
| `autoplay`     | checkbox                              | no       | Default off  |

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

| Field     | Type                                    | Required | Notes           |
| --------- | --------------------------------------- | -------- | --------------- |
| `heading` | text                                    | no       |                 |
| `pillars` | relationship → servicePillars (hasMany) | yes      | Typically all 3 |

#### `service-cards` — sub-service grid

| Field         | Type                              | Required    | Notes                  |
| ------------- | --------------------------------- | ----------- | ---------------------- |
| `heading`     | text                              | no          |                        |
| `source`      | select                            | yes         | `by-pillar` / `manual` |
| `pillar`      | relationship → servicePillars     | conditional |                        |
| `manualItems` | relationship → services (hasMany) | conditional |                        |

#### `team-grid` — team members display

| Field     | Type   | Required | Notes                                  |
| --------- | ------ | -------- | -------------------------------------- |
| `heading` | text   | no       |                                        |
| `filter`  | select | yes      | `leadership-only` / `featured` / `all` |
| `layout`  | select | no       | `cards` / `compact`                    |

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

| Field     | Type     | Required           | Notes                       |
| --------- | -------- | ------------------ | --------------------------- |
| `mission` | textarea | yes                |                             |
| `vision`  | textarea | yes                |                             |
| `values`  | array    | yes (min 3, max 8) | `name`, `description`       |
| `layout`  | select   | no                 | `tabs` / `grid` / `stacked` |

#### `markets-map` — 4-market visual

| Field     | Type                               | Required | Notes |
| --------- | ---------------------------------- | -------- | ----- |
| `heading` | text                               | no       |       |
| `markets` | relationship → locations (hasMany) | yes      |       |

#### `workshop-progression` — 3-workshop sequence visual

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

#### `newsletter-signup` — inline email capture

| Field     | Type     | Required | Notes                                                        |
| --------- | -------- | -------- | ------------------------------------------------------------ |
| `heading` | text     | no       | Default "Subscribe to SEQTEK Insights"                       |
| `body`    | textarea | no       |                                                              |
| `formId`  | text     | no       | Defaults to env var `NEXT_PUBLIC_HUBSPOT_NEWSLETTER_FORM_ID` |

#### `hubspot-form` — full HubSpot form embed

| Field            | Type     | Required | Notes                        |
| ---------------- | -------- | -------- | ---------------------------- |
| `heading`        | text     | no       |                              |
| `description`    | textarea | no       |                              |
| `formId`         | text     | yes      | HubSpot form GUID            |
| `submitRedirect` | text     | no       | Optional thank-you page path |

#### `hubspot-meetings` — booking embed

| Field        | Type | Required | Notes                     |
| ------------ | ---- | -------- | ------------------------- |
| `meetingUrl` | text | yes      | Full HubSpot meetings URL |
| `heading`    | text | no       |                           |

#### `brand-teaser` — Sequoyah story teaser (homepage)

| Field       | Type     | Required | Notes                      |
| ----------- | -------- | -------- | -------------------------- |
| `headline`  | text     | yes      |                            |
| `body`      | textarea | yes      | 2-3 sentences              |
| `linkLabel` | text     | yes      |                            |
| `linkUrl`   | text     | yes      | Default `/about/our-story` |
| `image`     | upload   | no       |                            |

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
| `testimonial-carousel` | `featured-testimonials` | Static grid in Phase 2; carousel autoplay deferred                                               |
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

**Final Phase 2 layout block count: 43** — every block enumerated in §5.1–§5.6 is implemented, plus the 7 additions beyond the catalog from the table above. HubSpot-driven blocks (`hubspot-form`, `hubspot-meetings`, `download-card`, `newsletter-cta`) ship with static placeholder affordances in the Phase 2 renderer; the live HubSpot script integration lands in Phase 3 per `docs/INTEGRATIONS.md` §1–§3.

---

## 6. Page composition matrix

Block order per page type. This is the canonical reference — content layouts should follow these unless there's a documented reason to vary.

### Homepage (`homepage` global — structured fields, not blocks)

The homepage global has fixed fields that map 1:1 to the renderer:

1. `hero` → `<Hero variant="with-image" />` (above the fold; primary + secondary CTA)
2. `stats` → `<StatsBar source="from-site-settings" />`
3. `servicePillarCards` → `<ServicePillarCards>` (3-up)
4. `featuredCaseStudy` → `<FeaturedCaseStudy>`
5. `brandTeaser` → `<BrandTeaser>` (Sequoyah hook)
6. `clientLogos` → `<LogoBar treatment="grayscale-on-color-hover" />`
7. `featuredTestimonials` → `<TestimonialCarousel>` (max 3)
8. `touchstoneTeaser` → `<CtaSection variant="split">`
9. `latestInsights` → `<LatestInsights limit={3} />`
10. `finalCta` → `<CtaSection variant="centered">` (dual CTA: book call + assessment)

### About landing (`pages` collection — `layout` blocks)

`hero` → `stats-bar` → `content` (who we are) → `mission-vision-values` → `two-column` (localshoring preview) → `logo-bar` → `nav-cards` (sub-page routing)

### Our Story (`pages` — `layout` blocks)

`hero` → `content` (Sequoyah brand story) → `timeline` (company milestones) → `content` (founding philosophy) → `content` (localshoring origin) → `cta-section` (dual)

### Team (`pages` — `layout` blocks)

`hero` → `team-grid` (filter: leadership-only) → `content` (collective expertise narrative) → `team-grid` (filter: featured) → `content` (culture) → `cta-section`

### Localshoring (`pages` — `layout` blocks)

`hero` → `content` (definition + callout) → `comparison-table` → `content` (business case with stats) → `markets-map` → `testimonial-single` → `cta-section`

### Services overview (`pages` — `layout` blocks)

`hero` → `content` (overview) → `service-pillar-cards` → `featured-case-study` → `cta-section`

### Service pillar landing (`servicePillars` — structured fields rendered through fixed sequence)

`<ServicePillarHero>` → `<Prose>` (description) → `<ServiceCards source="by-pillar">` → `<TestimonialSingle>` → `<CaseStudyGrid source="by-service">` → `<IndustryGrid>` → `<CtaSection>`

### Service detail (`services` — structured fields rendered through fixed sequence)

`<Hero>` → `<Prose>` (problem statement from `description`) → `<ProcessSteps>` (from `approach`) → `<Deliverables>` → `<FeaturedCaseStudy>` (related) → `<RelatedContent type="services">` → `<Faq>` → `<CtaSection>`

### Case study (`caseStudies` — structured fields rendered through fixed sequence)

`<CaseStudyHero>` + sidebar (industry, services, technologies) → `<Prose>` (Challenge) → `<Prose>` (Approach) → `<MetricsGrid>` (Results — from `metrics` array) → `<KeyTakeaways>` → `<TechStack>` → `<TestimonialSingle>` → `<RelatedContent type="caseStudies">` → `<CtaSection>`

### Blog post (`posts` — structured fields with inline-block rich text body)

`<BlogPostHeader>` (title, eyebrow, author byline, date, hero image) → `<Prose>` (body with inline CTAs, callouts, testimonial embeds) → `<RelatedContent type="posts">` → `<RelatedContent type="services">` → `<NewsletterSignup>` → share buttons

### Blog listing (`/insights`)

`<Hero variant="text-only">` → category filter chips → `<Pagination>` paginated `<PostGrid>` → `<NewsletterSignup>`

### Industry page (`industries` — structured fields)

`<Hero>` → `<Prose>` (context) → `<ServiceCards source="manual">` (relevantServices) → `<CaseStudyGrid source="by-industry">` → `<StatsBar>` (industry stats) → `<LogoBar>` (industry logos) → `<CtaSection>`

### Market landing (`locations` — structured fields)

`<Hero>` → `<Prose>` (local context — unique per city) → `<ServiceCards>` (all pillars) → `<CaseStudyGrid source="manual">` (local projects) → office details block → `<CtaSection>`

### Workshop landing (`pages`)

`<Hero>` → `<Content>` (Touchstone naming explanation) → `<WorkshopProgression>` → `<StatsBar>` (workshop stats with citations) → `<CtaSection>`

### Workshop detail (`workshops` — structured fields)

`<Hero>` → `<Prose>` (description) → agenda block → `<Deliverables>` → `<Prose>` (audience) → facilitator bio → `<TestimonialSingle>` → `<CtaSection>`

### Assessment landing (`/resources/organizational-maturity-assessment`)

`<Hero>` → `<Prose>` (what it measures with dimension visual) → `<ProcessSteps>` (what you get back) → `<StatsBar>` (social proof) → privacy note → `<CtaSection>` (external link to ScoreApp)

### Contact (`pages`)

`<Hero>` → `<HubspotForm>` → office details → `<CtaSection>` (book a call alternative)

### Contact > Book a Call

`<Hero>` → `<HubspotMeetings>`

---

## 7. Component file structure

```
src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Tag.tsx
│   │   ├── Avatar.tsx
│   │   ├── Icon.tsx
│   │   ├── SmartLink.tsx
│   │   ├── Container.tsx
│   │   ├── Section.tsx
│   │   ├── Prose.tsx
│   │   ├── Breadcrumbs.tsx
│   │   ├── Pagination.tsx
│   │   ├── ScrollToTop.tsx
│   │   └── form/
│   │       ├── Input.tsx
│   │       ├── Textarea.tsx
│   │       ├── Select.tsx
│   │       ├── Checkbox.tsx
│   │       ├── Radio.tsx
│   │       ├── FormField.tsx
│   │       ├── SubmitButton.tsx
│   │       ├── FormError.tsx
│   │       └── FormSuccess.tsx
│   │
│   ├── layout/
│   │   ├── SiteHeader.tsx
│   │   ├── SiteFooter.tsx
│   │   ├── MobileNav.tsx
│   │   ├── MegaMenu.tsx
│   │   └── SkipToContent.tsx
│   │
│   ├── sections/                         # Payload block renderers
│   │   ├── RenderBlocks.tsx              # Dispatcher
│   │   ├── Hero.tsx
│   │   ├── CaseStudyHero.tsx
│   │   ├── ContentBlock.tsx
│   │   ├── TwoColumn.tsx
│   │   ├── ProcessSteps.tsx
│   │   ├── Deliverables.tsx
│   │   ├── ComparisonTable.tsx
│   │   ├── Timeline.tsx
│   │   ├── Faq.tsx
│   │   ├── StatsBar.tsx
│   │   ├── MetricDisplay.tsx
│   │   ├── LogoBar.tsx
│   │   ├── TestimonialSingle.tsx
│   │   ├── TestimonialCarousel.tsx
│   │   ├── CtaSection.tsx
│   │   ├── FeaturedCaseStudy.tsx
│   │   ├── CaseStudyGrid.tsx
│   │   ├── ServicePillarCards.tsx
│   │   ├── ServiceCards.tsx
│   │   ├── TeamGrid.tsx
│   │   ├── LatestInsights.tsx
│   │   ├── IndustryGrid.tsx
│   │   ├── MissionVisionValues.tsx
│   │   ├── MarketsMap.tsx
│   │   ├── WorkshopProgression.tsx
│   │   ├── VideoEmbed.tsx
│   │   ├── DownloadCard.tsx
│   │   ├── NewsletterSignup.tsx
│   │   ├── HubspotForm.tsx
│   │   ├── HubspotMeetings.tsx
│   │   ├── BrandTeaser.tsx
│   │   ├── NavCards.tsx
│   │   ├── KeyTakeaways.tsx
│   │   ├── TechStack.tsx
│   │   ├── RelatedContent.tsx
│   │   └── inline/                      # Inline blocks for richText body
│   │       ├── InlineCta.tsx
│   │       ├── TestimonialEmbed.tsx
│   │       ├── Callout.tsx
│   │       ├── ImageWithCaption.tsx
│   │       ├── Figure.tsx
│   │       ├── PullQuote.tsx
│   │       └── Disclosure.tsx
│   │
│   ├── case-studies/
│   │   ├── CaseStudyCard.tsx
│   │   ├── MetricsGrid.tsx
│   │   └── CaseStudySidebar.tsx
│   │
│   ├── blog/
│   │   ├── PostCard.tsx
│   │   ├── PostGrid.tsx
│   │   ├── CategoryChips.tsx
│   │   ├── AuthorByline.tsx
│   │   ├── ShareButtons.tsx
│   │   └── BlogPostHeader.tsx
│   │
│   ├── team/
│   │   ├── TeamMemberCard.tsx
│   │   └── FacilitatorBio.tsx
│   │
│   └── integrations/
│       ├── GtmScript.tsx
│       ├── HubspotTracking.tsx
│       └── LivePreviewWrapper.tsx
│
└── payload/
    ├── blocks/                          # Block configs (one per block)
    │   ├── HeroBlock.ts
    │   ├── CaseStudyHeroBlock.ts
    │   ├── ContentBlock.ts
    │   ├── TwoColumnBlock.ts
    │   ├── ProcessStepsBlock.ts
    │   ├── DeliverablesBlock.ts
    │   ├── ComparisonTableBlock.ts
    │   ├── TimelineBlock.ts
    │   ├── FaqBlock.ts
    │   ├── StatsBarBlock.ts
    │   ├── MetricDisplayBlock.ts
    │   ├── LogoBarBlock.ts
    │   ├── TestimonialSingleBlock.ts
    │   ├── TestimonialCarouselBlock.ts
    │   ├── CtaSectionBlock.ts
    │   ├── FeaturedCaseStudyBlock.ts
    │   ├── CaseStudyGridBlock.ts
    │   ├── ServicePillarCardsBlock.ts
    │   ├── ServiceCardsBlock.ts
    │   ├── TeamGridBlock.ts
    │   ├── LatestInsightsBlock.ts
    │   ├── IndustryGridBlock.ts
    │   ├── MissionVisionValuesBlock.ts
    │   ├── MarketsMapBlock.ts
    │   ├── WorkshopProgressionBlock.ts
    │   ├── VideoEmbedBlock.ts
    │   ├── DownloadCardBlock.ts
    │   ├── NewsletterSignupBlock.ts
    │   ├── HubspotFormBlock.ts
    │   ├── HubspotMeetingsBlock.ts
    │   ├── BrandTeaserBlock.ts
    │   ├── NavCardsBlock.ts
    │   ├── KeyTakeawaysBlock.ts
    │   ├── TechStackBlock.ts
    │   ├── RelatedContentBlock.ts
    │   └── inline/                      # Inline blocks for richText fields
    │       ├── InlineCtaBlock.ts
    │       ├── TestimonialEmbedBlock.ts
    │       ├── CalloutBlock.ts
    │       ├── ImageWithCaptionBlock.ts
    │       ├── FigureBlock.ts
    │       ├── PullQuoteBlock.ts
    │       └── DisclosureBlock.ts
    │
    └── shared/
        ├── ctaField.ts                  # Shared `cta` group field used in many blocks
        ├── seoField.ts                  # Shared SEO group (also provided by plugin)
        └── slugField.ts                 # Shared slug field with hook
```

---

## 8. Render dispatcher

A single dispatcher renders a `layout` array regardless of which blocks appear:

```typescript
// src/components/sections/RenderBlocks.tsx
import type { Page } from '@/payload-types'

const registry: Record<string, React.ComponentType<any>> = {
  hero: Hero,
  'case-study-hero': CaseStudyHero,
  content: ContentBlock,
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

---

## 10. Open questions for this doc

| ID  | Question                                                                                                                          | Owner                      |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| B-1 | Confirm `pages.layout` is the only blocks field, or also add to `services.description`? Current proposal: structured for services | Engineering                |
| B-2 | Decide whether `featured-case-study` and `featured-testimonials` should be globals (homepage) only, or also reusable on Pages     | Engineering                |
| B-3 | Should `mission-vision-values` source from `siteSettings` (single source of truth) or accept inline content per page?             | Engineering + Content      |
| B-4 | `comparison-table` flexibility — fully generic or hardcoded to the 3-model localshoring comparison?                               | Content                    |
| B-5 | Inline-blocks inside post body — confirm full list and editor UX (slash command vs button bar)                                    | Content lead + Engineering |
