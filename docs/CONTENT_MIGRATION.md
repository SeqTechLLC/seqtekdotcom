# SEQTEK Website — Content Migration Specification

**Date:** 2026-05-14
**Status:** Design — Pre-Implementation

How content from the existing Wix site gets moved into Payload CMS. The script lives at `src/payload/seed/migrateFromAudit.ts` and runs via `npx tsx`. Idempotent — re-running updates existing records by slug rather than creating duplicates.

The source audit files live **outside this public repo** (SEQTEK marketing IP). By convention they sit at `~/projects/seqtek-internal/audit/` — a sibling of the repo. The seed script reads `process.env.AUDIT_DIR` (defaults to that path). The files were produced by Playwright crawls and are stored as text-extraction (not structured HTML) — every record value is a single newline-delimited string of visible page text with the Wix chrome (`Skip to Main Content`, nav links, footer block) embedded at the top and bottom. Boilerplate stripping is therefore a hard requirement before anything else.

## 1. Source data inventory

| File                                                  | Records                                          | Quality                                                                                                                                                                                                | Coverage                                                              |
| ----------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `audit/case-studies-content.json`                     | 8 keyed by full URL                              | Best source. Section labels (`The Problem` / `The Solution` / `The Impact`, or `Overview` / `Modernizing Systems` / `Solutions & Impact` / `Key Takeaways` on newer studies) are present and parseable | All 8 active case studies                                             |
| `audit/case-studies.json`                             | 8 keyed by full URL                              | Misnamed — actually contains marketing pages (`/our-services`, `/workshops`, `/about-us-1`, `/blog-old`, `/contact`, `/privacy-policy`, `/organizational-strategy-1-5`)                                | Use for `pages` collection seed, not case studies                     |
| `audit/case-studies-full.json`                        | 2 entries, 1 is an empty-string-key error record | Mostly junk                                                                                                                                                                                            | Skip                                                                  |
| `audit/page-content.json`                             | 8 keyed by path                                  | Same marketing pages plus homepage `/`. `/about-us-1` and `/organizational-strategy-1-5` are Playwright timeout error strings — use `retry-content.json` for these                                     | Homepage hero text + stats; service overview; workshops; blog listing |
| `audit/retry-content.json`                            | 3 entries                                        | Backfills `about-us-1` (full content) and confirms `privacy-policy` and the empty assessment page                                                                                                      | Use for About page                                                    |
| `audit/homepage.html`                                 | 1 file, ~1.3MB raw HTML                          | Not parsed — contains hero image references and Wix runtime cruft                                                                                                                                      | Hand-extract hero imagery only if not present in the seed pass        |
| `audit/screenshots/`                                  | Visual reference                                 | —                                                                                                                                                                                                      | Do not migrate                                                        |
| `audit/SITE-AUDIT.md`, `audit/WEBSITE-PAIN-REPORT.md` | Human analysis                                   | —                                                                                                                                                                                                      | Do not migrate                                                        |

Blog post bodies are **not** in the audit at all — `blog-old` lists post titles, dates, and ~50-word excerpts only. Full post bodies must be re-crawled or hand-copied separately; this script seeds only the post stubs (title, slug, publishedAt, excerpt, status: draft).

## 2. Target collections affected

| Payload collection                                       | Source file(s)                                                                                                                                         | Records expected                                                                                    |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `caseStudies`                                            | `case-studies-content.json`                                                                                                                            | 8                                                                                                   |
| `pages`                                                  | `case-studies.json` (services, workshops, contact, privacy), `page-content.json` (homepage source for `homepage` global), `retry-content.json` (about) | 5–6                                                                                                 |
| `posts`                                                  | `case-studies.json["…/blog-old"]` or `page-content.json["/blog-old"]`                                                                                  | 6 stubs (excerpt only — bodies pending)                                                             |
| `homepage` (global)                                      | `page-content.json["/"]`                                                                                                                               | 1 — hero, stats inline, brandTeaser body                                                            |
| `siteSettings` (global)                                  | Any record's footer block                                                                                                                              | Phone, email, address (`12 N Cheyenne Ave., Tulsa, OK 74103`, `918-493-7200`, `contact@seqtek.com`) |
| `servicePillars`, `services`                             | `case-studies.json["…/our-services"]`                                                                                                                  | Reference only — see §12                                                                            |
| `workshops`                                              | `case-studies.json["…/workshops"]`                                                                                                                     | Reference only — see §12                                                                            |
| `industries`, `locations`, `teamMembers`, `testimonials` | —                                                                                                                                                      | Not in audit. See §12.                                                                              |

## 3. Field mapping by collection

### 3.1 caseStudies

Each value in `case-studies-content.json` is one giant newline-delimited string. The transform: split on `\n`, drop nav/footer boilerplate (lines from `Skip to Main Content` through `Assessment`, and from `Headquarters` to end), then segment by section labels.

| Source (per record)                                                                                                                                                                             | Target field                                                                              | Transformation                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| URL key (`https://www.seqtek.com/<slug>`)                                                                                                                                                       | `slug`                                                                                    | Strip host. For 5 URLs with Wix garbage slugs (`case-study-3..5`, `organizational-strategy-1-1-1-3*`), use the destination slug from INTEGRATIONS.md §9 redirect map — do **not** regenerate                                                                                       |
| First standalone title line above first `The Problem` / `Overview` heading (e.g., `Transforming Data Challenges into Strategic Insights`, `Airline Automation`, `Scaling the Banking Industry`) | `title`                                                                                   | Trim; this is sometimes preceded by a subtitle/tagline line — disambiguate per record                                                                                                                                                                                              |
| Tagline line above the title (e.g., `Discover how our tailored data strategies helped…`, `Empowering on-site teams with real-time tools…`)                                                      | `subtitle`                                                                                | Trim                                                                                                                                                                                                                                                                               |
| Text between `The Problem` / `Modernizing Systems` / `Legacy System Limitations` heading and the next section heading                                                                           | `problem`                                                                                 | HTML → Lexical (see §4). Wrap each paragraph as `paragraph`                                                                                                                                                                                                                        |
| Text between `The Solution` / `Solutions & Impact` and the next heading                                                                                                                         | `solution`                                                                                | Same                                                                                                                                                                                                                                                                               |
| Text between `The Impact` / `Solution Delivered` / explicit `Impact` heading and `Key Takeaways` / closing CTA                                                                                  | `impact`                                                                                  | Same                                                                                                                                                                                                                                                                               |
| `Key Takeaways` section (newer banking + oil/gas studies)                                                                                                                                       | Append to `impact` as a `<KeyTakeaways>` block OR populate a derived `keyTakeaways` array | Schema has no first-class field — emit as a heading + list at the end of `impact` rich text; the renderer's `<KeyTakeaways>` block reads from a dedicated structured field, which is not present on `caseStudies`. Flag for editor: convert by hand if a dedicated block is wanted |
| `Systems Integrated:` / `Technical Foundation:` lines (banking study)                                                                                                                           | `technologies` (array of text)                                                            | Split on `•` or newline, trim. Also harvest tech names from prose (`.NET`, `React`, `Typescript`, `Material-UI`, `MobX`, `RabbitMQ`, `IBM MQ`, `OKTA`, `Azure DevOps`, `Power BI`, `Claude.AI`)                                                                                    |
| Industry — infer from content                                                                                                                                                                   | `industry` (relationship)                                                                 | Manual mapping: healthcare studies → `healthcare`; oil/gas → `energy`; airline → `transportation`; banking → `financial-services`; retail (case-study-4) → `retail`. Industries collection must exist first                                                                        |
| Services — infer                                                                                                                                                                                | `services` (relationship, hasMany)                                                        | Map by tech/topic keywords (data warehouse → `data-strategy-analytics`; integration → `systems-integrations-process`; UX rebuild → `software-implementations`). Editor review required                                                                                             |
| —                                                                                                                                                                                               | `client`                                                                                  | All studies are anonymized; set `client.name` to a working label (e.g., "Fortune 100 Retailer"), `client.isAnonymized = true`, `client.logo` empty                                                                                                                                 |
| —                                                                                                                                                                                               | `heroImage`                                                                               | Not in JSON. Pull from Wix CDN by re-crawling each case study page, or leave null and flag for editor upload                                                                                                                                                                       |
| —                                                                                                                                                                                               | `metrics`                                                                                 | Hand-extract from prose (`90% reduction`, `Time to full deployment was cut in half`, etc.). Script emits empty array; editor populates                                                                                                                                             |
| —                                                                                                                                                                                               | `testimonial`                                                                             | All 8 missing — see §11                                                                                                                                                                                                                                                            |
| —                                                                                                                                                                                               | `publishedAt`                                                                             | Set to script run date                                                                                                                                                                                                                                                             |
| —                                                                                                                                                                                               | `status`                                                                                  | Always `draft`                                                                                                                                                                                                                                                                     |

### 3.2 pages

| Source path                                                                                  | Target page                                                                                                                                          | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `case-studies.json["…/about-us-1"]` or `retry-content.json["https://seqtek.com/about-us-1"]` | `pages` doc with `slug: about`                                                                                                                       | Body has clear sections: `Who We Are`, `How We Are Different`, `Benefits of SEQTEK Partnership` (1–10). The `layout` blocks field gets: `hero` (headline `Localshoring since 1999`), `content` (Who We Are prose), `stats-bar` with inline items (25+/500+/10,000+ — but see §11), `comparison-table` (Localshoring vs offshore/nearshore — needs hand assembly from the bulleted list), `content` (10 numbered benefits), `cta-section`                                                                                                                                                          |
| `case-studies.json["…/workshops"]`                                                           | `pages` doc with `slug: touchstone-workshops`                                                                                                        | Layout: `hero`, `stats-bar` (70% / $2.3T / #1), `content` (The SEQTEK Approach), `workshop-progression` (placeholder — workshops collection seeded separately), `content` (Build Health From the Inside Out), `cta-section`                                                                                                                                                                                                                                                                                                                                                                       |
| `case-studies.json["…/contact"]`                                                             | `pages` doc with `slug: contact`                                                                                                                     | Layout: `hero`, `hubspot-form` (formId TBD post-HubSpot setup), office details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `case-studies.json["…/privacy-policy"]`                                                      | `pages` doc with `slug: privacy-policy`                                                                                                              | Single `content` block — verbatim copy with `Effective Date: June 2024` preserved. Note address discrepancy: body says `201 E Hobson Ave, Sapulpa` but footer says `12 N Cheyenne Ave, Tulsa` — flag for legal review                                                                                                                                                                                                                                                                                                                                                                             |
| `case-studies.json["…/our-services"]`                                                        | **Not** a `pages` doc — populates `servicePillars` + `services` references only. See §12 — content is too duplicated/copy-pasted to migrate verbatim |
| `page-content.json["/"]`                                                                     | Drives the `homepage` global, not a `pages` doc                                                                                                      | Hero headline: `Your Local Partner for Business Consulting Services`. Hero subheadline: `Helping organizations innovate, implement, and deliver a better tomorrow with expert Tulsa business consulting.` Stats: `20+` / `411+` / `8221+` (conflicts with about page — see §11). Brand teaser body: `Our purpose is to help people and organizations innovate…` paragraph. Testimonials block: 3 quotes (Mike K., Cindy B, Kevin R.) — these are first-name-plus-initial and **must not** be imported as `testimonials` records per CONTENT-REQUIREMENTS §6. Store as a note for editor follow-up |

### 3.3 posts

`page-content.json["/blog-old"]` contains 6 post listings. Per post extract:

| Source                                                                   | Target field                            | Transformation                                                                                                                   |
| ------------------------------------------------------------------------ | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Title line                                                               | `title`                                 | Trim                                                                                                                             |
| —                                                                        | `slug`                                  | Generate from title via `slugify`, then override using INTEGRATIONS.md §9 redirect map where present                             |
| Truncated excerpt (the `…teams can actually do their jobs better…` text) | `excerpt`                               | Trim, append ellipsis if cut                                                                                                     |
| Date line (`Jan 20`, `Dec 2, 2025`, etc.)                                | `publishedAt`                           | Parse with `date-fns` — `MMM d, yyyy` and bare `MMM d` (assume current year for the latter). Set time to `09:00 America/Chicago` |
| —                                                                        | `content`                               | Empty Lexical doc (single empty paragraph). Editor pastes body from Wix manually or via a follow-up re-crawl                     |
| —                                                                        | `featuredImage`, `author`, `categories` | Null — required-field validation must be relaxed during seed OR set placeholder values flagged for editor fix                    |
| —                                                                        | `status`                                | Always `draft`                                                                                                                   |

## 4. Rich text conversion (HTML → Lexical AST)

The audit JSON is **plain text, not HTML** — there are no tags to parse. The only structure available is line breaks and section-label heuristics. For case-study prose this means: split paragraphs on blank-line gaps, detect bulleted items by leading bullet glyphs (`•`) or short sequential lines, and emit Lexical nodes directly.

For pages that will eventually need a richer source (e.g., re-importing blog post bodies from `homepage.html` or a fresh crawl), use the canonical Payload v3 utility: `@payloadcms/richtext-lexical/utilities/jsx` is the **JSX-side** conversion path and not appropriate here. Use `convertHTMLToLexical` exported from `@payloadcms/richtext-lexical` (server-only). It takes a string of HTML and the editor config and returns a `SerializedEditorState`. Feed it the `editorConfig` exported alongside the `lexicalEditor` in `src/payload/payload.config.ts` so feature support (blocks, links, lists) is consistent with the admin UI.

When the source is plain text (the case for the audit), bypass HTML parsing — build the Lexical JSON tree directly:

| Detected structure                                                 | Lexical node                                  | Notes                                                                                  |
| ------------------------------------------------------------------ | --------------------------------------------- | -------------------------------------------------------------------------------------- |
| Paragraph (block of non-empty lines)                               | `paragraph` with `text` children              | Trim, collapse internal whitespace                                                     |
| Section heading (`The Problem`, `Overview`, `Key Takeaways`, etc.) | `heading` (tag: `h2`)                         | Demote to `h3` if inside a content block in a page that already has its own h1/h2 hero |
| Bulleted line (`• …` or `– …` or short sentence series)            | `list` (unordered) → `listitem` → `paragraph` | Group consecutive bullets into one list                                                |
| Numbered subsection (`1. Outside Expertise & Experience`)          | `heading` (tag: `h3`)                         | Strip the number prefix                                                                |
| Curly quotes around full lines                                     | `quote`                                       | Apply only when a line is wrapped in `"…"` or rendered as a callout in the source page |
| Inline `<a>`, `<strong>`, etc.                                     | Not applicable — source is text-only          | If a richer crawl is performed later, run through `convertHTMLToLexical`               |

Strip aggressively: `Skip to Main Content`, the nav line (`Home / Our Services / Workshops / About Us / Blog / Contact / Contact Us / Assessment`), `Talk With Us` / `Request Info` (these are CTA buttons — captured as `cta-section` blocks separately, not as body text), and the entire footer (`Headquarters` through `YouTube`).

## 5. Image migration

No image URLs are present in the audit JSON. Two paths:

1. **Per-record re-crawl** — small Playwright script that visits each migrated record's Wix URL and harvests `<img>` `src` values. Recommended for case studies (8 records, manageable).
2. **Skip and flag** — set image fields null, surface in `migration-errors.log` as `MISSING_IMAGE`, editor uploads manually.

For URLs harvested via path 1:

1. Download from Wix CDN (`static.wixstatic.com/media/…`)
2. Upload to Payload's `media` collection via the Local API (`payload.create({ collection: 'media', file: { data, name, mimetype, size } })`) — the S3 storage adapter handles routing
3. Capture the returned media doc ID
4. Set the field reference on the parent record

Caveats:

- Rate limit: 1 concurrent, 200ms delay — Wix CDN may throttle
- Detect duplicates by SHA-256 of the file bytes; reuse the existing media doc on hash match
- Default `alt` from filename if no source alt — flag for editor review (the schema requires `alt`)
- Failed downloads logged to `migration-errors.log` and skipped (script continues)
- In local dev without S3, Payload falls back to local FS storage — see LOCAL_DEVELOPMENT.md

## 6. Slug handling

Preserve old slugs where they're publishable; rewrite where they're Wix garbage. The destination slug always wins. Source of truth for the rewrite is INTEGRATIONS.md §9 redirect map.

| Source slug                           | Destination slug                                       |
| ------------------------------------- | ------------------------------------------------------ |
| `case-study-3`                        | `mobile-apps-remote-operations`                        |
| `case-study-4`                        | `retail-pos-update-experience`                         |
| `case-study-5`                        | `data-warehouse-strategy`                              |
| `driving-innovation-case-study`       | `healthcare-ux-redesign` (renamed per §11 content fix) |
| `modernizing-healthcare-case-study`   | `healthcare-data-modernization`                        |
| `organizational-strategy-1-1-1-3`     | `airline-automation`                                   |
| `organizational-strategy-1-1-1-3-1`   | `oil-gas-modernization`                                |
| `organizational-strategy-1-1-1-3-1-1` | `banking-integration-platform`                         |
| `about-us-1`                          | `about`                                                |
| `our-services`                        | `services`                                             |
| `blog-old`                            | `insights`                                             |
| `organizational-strategy-1-5`         | `resources/organizational-maturity-assessment`         |

These are the canonical destinations; the script reads them from a constant map at the top of `migrateFromAudit.ts` that matches the INTEGRATIONS.md table. When that doc updates, this map updates with it (manual sync — they live in different files for a reason).

## 7. Status handling

Everything imports as `status: 'draft'`. Nothing publishes automatically. Editors review each record in `/admin` and publish manually. This forces a human pass over migrated content — necessary because the audit data has known errors (see §11) and because every record is missing at least one required field (hero image, author, testimonial, etc.).

## 8. Idempotency

Re-running the script:

- Looks up existing records by slug (per collection)
- Updates if found, creates if not
- Never creates duplicates
- Media reuse via hash check (see §5)
- A `--dry-run` flag prints the planned upserts without writing
- A `--collection=caseStudies` filter narrows to one collection for iterative debugging

The lookup uses Payload's Local API `find({ where: { slug: { equals } }, limit: 1 })` — not raw SQL — so access control and hooks fire correctly. The `media` dedup is the only place a hash table is needed (in-memory for the duration of the run; not persisted).

## 9. Script structure

```ts
// src/payload/seed/migrateFromAudit.ts
import { getPayload } from 'payload'
import config from '@payload-config'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const AUDIT = resolve(process.cwd(), 'audit')

async function main() {
  const payload = await getPayload({ config })

  const caseStudies = JSON.parse(readFileSync(`${AUDIT}/case-studies-content.json`, 'utf8'))
  for (const [url, raw] of Object.entries(caseStudies)) {
    const parsed = parseCaseStudy(url, raw as string) // §3.1 transform
    await upsertBySlug(payload, 'caseStudies', parsed)
  }

  const pages = JSON.parse(readFileSync(`${AUDIT}/case-studies.json`, 'utf8'))
  const retry = JSON.parse(readFileSync(`${AUDIT}/retry-content.json`, 'utf8'))
  for (const page of mapPages({ ...pages, ...retry })) {
    // §3.2
    await upsertBySlug(payload, 'pages', page)
  }

  const home = JSON.parse(readFileSync(`${AUDIT}/page-content.json`, 'utf8'))['/']
  await payload.updateGlobal({ slug: 'homepage', data: parseHomepage(home) }) // §3.2

  for (const post of parsePostStubs(home /* the /blog-old entry */)) {
    // §3.3
    await upsertBySlug(payload, 'posts', post)
  }

  await payload.updateGlobal({ slug: 'siteSettings', data: parseSiteSettings() })

  console.log('Done. Errors logged to migration-errors.log')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

Runnable: `npx tsx src/payload/seed/migrateFromAudit.ts` (add `--dry-run` or `--collection=<name>` as needed).

Environment: requires `DATABASE_URL` and `PAYLOAD_SECRET` set in `.env.local`. S3 not required (falls back to local FS — see LOCAL_DEVELOPMENT.md). Run after `payload migrate` so the schema exists.

## 10. Post-migration QA

Manual checks:

- Random sample 3 case studies + 3 pages
- Verify rich text renders correctly in the admin Lexical viewer
- Verify all referenced images are present and load (or are flagged null where missing)
- Verify slugs match the redirect map in INTEGRATIONS.md §9
- Verify draft status across all imported records
- Spot-check internal links — broken Wix internal links won't auto-fix, flag and edit
- Verify the `homepage` global hero copy matches expectations and the stats decision (see §11) is honored
- Confirm `case-studies.json["…/our-services"]` was **not** imported as a `pages` doc (it's reference-only)

## 11. Known content issues requiring human fix post-migration

Per CONTENT-REQUIREMENTS.md and audit notes:

- **`driving-innovation-case-study`** — title and image describe a drill bit project but the body content is about a healthcare data platform's UX redesign. Must be corrected by hand or split into two records. Script renames slug to `healthcare-ux-redesign` per the redirect map and prepends `[CONTENT MISMATCH — see CONTENT_MIGRATION §11]` to the title so it's obvious in admin.
- **All 8 case studies are missing client testimonials** — `testimonial` relationship left null; editors collect with full attribution per CONTENT-REQUIREMENTS §6.
- **Stat numbers conflict** between homepage (`20+` / `411+` / `8221+`) and about page (`25+` / `500+` / `10,000+`). Resolution pending leadership (see ROADMAP.md BR-5). Script imports both verbatim into their respective targets and flags the conflict in `migration-errors.log`. **Do not pre-resolve.**
- **Technology tags need cleanup** and linking to service pages — populated as plain strings; editor converts to the `tech-stack` block's `linkUrl` per-item where appropriate.
- **Privacy policy address discrepancy** — body says Sapulpa, footer says Tulsa. Imported verbatim; flagged for legal review.

## 12. What is NOT migrated automatically

- **Testimonials** — re-collect with full attribution per CONTENT-REQUIREMENTS §6. Homepage's three first-name-plus-initial quotes (Mike K., Cindy B, Kevin R.) are noted but **not** seeded as `testimonials` records — they fail the attribution standard.
- **Team bios** (`teamMembers`) — names exist in source (`Hank Haines`, `Dana Dudley`, `Brent Fields`) but no bios, photos, expertise, or quotes. Interviews pending (ROADMAP.md C-3).
- **Photography** — photo shoot pending (ROADMAP.md C-2). All `heroImage`, `photo`, `featuredImage` fields land null.
- **Workshop branding** — Touchstone branding work pending (CONTENT-REQUIREMENTS.md Tier 2). The three workshops (`Five Dysfunctions`, `Re-Alignment`, `Case Study`) seed as stubs with deliverables arrays only.
- **Service descriptions** — current Wix content is heavily duplicated/thin per CONTENT-REQUIREMENTS.md (multiple service blocks share copy-pasted body text). Better to write from scratch using the audit content as reference, not as authoritative source. Script creates `servicePillars` and `services` records with title + slug only, leaving rich text empty.
- **Industries**, **locations** — no source data. Created empty for the relational targets above (`industry` on case studies) to point at; descriptions written from scratch.
- **Full blog post bodies** — only excerpts exist. Post stubs seeded; bodies require re-crawl or hand entry.

These are tracked in ROADMAP.md and CONTENT-REQUIREMENTS.md §7 content production tiers.
