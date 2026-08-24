# Phase 1 Data Model: Payload admin UX for content self-serve

**Feature**: `specs/011-payload-admin-ux` | **Date**: 2026-08-21

This feature is **schema-destructive**. Everything below is either a column/table drop, a visibility change, or presentation metadata that does not touch the database. Row counts are from the local mirror (`seqtek_dev`, 2026-08-21).

---

## 1. Schema deltas

### 1.1 Dropped — `Pages.hero`

| Column                           | Rows populated | Consumers |
| -------------------------------- | -------------- | --------- |
| `pages.hero_headline`            | 0 / 57         | none      |
| `pages.hero_subheadline`         | 0 / 57         | none      |
| `pages.hero_background_image_id` | 0 / 57         | none      |
| `pages.hero_cta_label`           | 0 / 57         | none      |
| `pages.hero_cta_url`             | 0 / 57         | none      |

Plus the mirrored `_pages_v_version_hero_*` columns on the versions table.

**Gate**: none required — verified empty and unconsumed (research R1).

### 1.2 Dropped — retained legacy body fields (completes ADR 0009 expand/contract)

Scalar / rich-text columns, with live row counts:

| Table          | Columns                                              | Rows populated |
| -------------- | ---------------------------------------------------- | -------------- |
| `case_studies` | `problem`, `solution`, `impact`                      | 7 each         |
| `services`     | `description`, `approach`                            | 9 each         |
| `workshops`    | `description`, `audience`                            | 3 each         |
| `workshops`    | `format`                                             | 1              |
| `team_members` | `bio`                                                | 3              |
| `team_members` | `quote`                                              | 1              |
| `homepage`     | `hero_*`, `brand_teaser_*`, `featured_case_study_id` | varies         |

Array tables dropped alongside them:

```
case_studies_metrics            case_studies_technologies
services_deliverables           services_faq
workshops_deliverables          workshops_photos
team_members_certifications     team_members_education
team_members_personal_facts
homepage_stats                  homepage_client_logos
homepage_featured_testimonials  (relationship join)
```

…and each one's `_<table>_v_version_*` versions counterpart.

**Not dropped**: `team_members_expertise`. See §1.3.

**Care required**: the block-owned tables `<table>_blocks_deliverables` and `<table>_blocks_faq` are **not** legacy — they belong to the `deliverables` and `faq` layout blocks and must survive. The naming is close enough to be dangerous; the migration targets the bare `<table>_deliverables` / `<table>_faq` forms only.

**Gate**: the equivalence check (§3) must pass before this migration runs.

### 1.3 Promoted, not dropped — `teamMembers.expertise`

| Aspect           | Before                                                           | After                                                       |
| ---------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| Admin visibility | `hidden: true, readOnly: true`                                   | visible, editable                                           |
| Consumer         | `src/lib/structured-data.ts:90` → `knowsAbout` in Person JSON-LD | unchanged                                                   |
| Grouping         | none                                                             | grouped with the per-member SEO/metadata inputs             |
| Label / help     | auto ("Expertise")                                               | labelled and explained in terms of the search-result effect |

This is a correction to the spec-010 cleanup list, not new scope: the field affects public structured-data output, so FR-001 requires it to be editable. Table `team_members_expertise` and its versions counterpart are retained.

### 1.4 Dropped — `services.layout`

The Services collection keeps its typed metadata (`title`, `slug`, `pillar`, `icon`, `order`, `relatedCaseStudies`, `seo`) because those still render inside `ServiceCards` / `ServicePillarCards` and resolve `caseStudies.services`. Its `layout` blocks array and every `services_blocks_*` table are dropped — there is no route that renders them (research R4).

`servicePillars` has no `layout` field; only its live-preview wiring and admin grouping change.

### 1.5 Dropped — the `navigation` and `siteSettings` globals

| Entity                | Change                          | Tables                             |
| --------------------- | ------------------------------- | ---------------------------------- |
| `navigation` global   | removed from the Payload config | `navigation` + versions dropped    |
| `siteSettings` global | removed from the Payload config | `site_settings` + versions dropped |

**Precondition — all seven render-path reads relocate first.** Clarified 2026-08-21: the CMS
`siteSettings` global feeds seven values into rendered output, not the two this document
originally assumed.

| Value                                        | Consumer                                          | Moves to                   |
| -------------------------------------------- | ------------------------------------------------- | -------------------------- |
| `tagline`                                    | `metadata.ts:67` description fallback             | `site-content.ts` constant |
| `companyName`                                | `metadata.ts:79` `og:siteName`                    | `site-content.ts` constant |
| `companyName`, `tagline`, `email`, `phone`   | `structured-data.ts:20-48` `Organization` JSON-LD | `site-content.ts` constant |
| `address.{street,city,state,zip}`            | `structured-data.ts:27-38` `PostalAddress`        | `site-content.ts` constant |
| `socialLinks.{linkedin,twitter,facebook}Url` | `structured-data.ts:21-25` `sameAs`               | `site-content.ts` constant |

Every one of these already exists verbatim on the hard-coded constant at
`src/lib/site-content.ts:141-152`, so the relocation authors no new data — it is a read-site
swap across 14 route files plus `organizationLd`.

**Hidden was considered and rejected.** `admin.hidden: true` leaves the tables and a schema
remnant, which FR-007 forbids outright. The version history is a deliberate, accepted loss:
only these seven values were ever read and all seven live in code, so the versions record
content that never reached a visitor. ADR 0010 carries the reversal path.

**Downstream:** the `INFRASTRUCTURE_RUNBOOK.md` cutover step that seeds the site-settings NAP
(added in PR #105 so the `Organization` JSON-LD would emit an address) retires with the global
— FR-005a. Any `docs/content-drafts/global-navigation*.json` or `global-site-settings*.json`
request file is deleted rather than reconciled.

---

## 2. Presentation metadata (no schema impact)

None of the following touches Postgres. They are config-only and therefore safe to iterate on without migrations.

| Surface               | Added                                                                                                                         | Count                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Layout blocks         | `admin.group`, `admin.images.thumbnail` → `public/block-previews/`, description, `disableBlockName`, `admin.components.Label` | 45                                                |
| Inline blocks         | `admin.images.icon` (20×20, for the Lexical menu)                                                                             | 7                                                 |
| Collections           | `admin.group`, `admin.description`                                                                                            | 14                                                |
| Globals               | `admin.group`, `admin.description`                                                                                            | 1 remaining after §1.5 (`homepage`)               |
| Draftable collections | `_status` prepended to `defaultColumns`                                                                                       | 6 in scope                                        |
| Media                 | `adminThumbnail` (function form only — **no new image size**, no backfill)                                                    | 1                                                 |
| Fields                | `label` overrides                                                                                                             | 49 camelCase names                                |
| Fields                | `admin.description` help text                                                                                                 | subset of 212 currently undocumented block fields |
| Blocks                | `requiredWhen` variant conditions                                                                                             | audit across 37 blocks not yet using it           |
| Pages                 | `defaultValue` starter skeleton                                                                                               | 1                                                 |

### 2.1 Extracted shared field factories

Two field shapes repeat enough that labelling them in place would mean the same edit 10 and 12 times respectively. Both are extracted to `src/payload/fields/`, mirroring the existing `url.ts`:

| Factory      | Shape                                     | Call sites                                                                                             |
| ------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `seoField()` | `metaTitle`, `metaDescription`, `ogImage` | 10                                                                                                     |
| `ctaField()` | `label`, `url`, optional `variant`        | 12 (`cta` ×3, `primaryCta` ×5, `secondaryCta` ×4, `ctaButton` ×1 — the last withdrawn with Navigation) |

Extraction is behaviour-preserving: the generated column names must be identical to the current inline definitions, or these become schema changes. This is the single highest-risk "presentation-only" change and gets an explicit before/after schema diff.

### 2.2 Block categories

Categories follow `docs/BLOCK_LIBRARY.md` §5 so the picker and the docs agree. The doc's category structure becomes load-bearing metadata rather than prose organisation, which is a `docs`-are-code reconciliation (Constitution III).

---

## 3. The equivalence gate

A one-off script (a task deliverable, not shipped code) that must pass before §1.2 runs.

**Input**: every record in `caseStudies`, `services`, `workshops`, `teamMembers`, and the `homepage` global holding a non-null legacy prose column.

**Assertion**: for each such record, the plain-text content of the legacy column appears in the record's composed `layout`.

**Output**: a per-record pass/fail report. Any failure blocks the migration and is resolved by re-running the spec-010 composer for that record, or by hand, before the drop.

**Why not row counts**: all 7 case studies with legacy prose also have 3 content blocks, which looks like proof and is not — block presence says nothing about block _content_. This distinction is the whole reason the gate exists.

---

## 4. Migration sequence

Local dev is push-managed; these are authored with `payload migrate:create` and run in staging/prod only (`docs/PAYLOAD_DEVELOPMENT.md`).

| #   | Migration                                                                                            | Depends on                        |
| --- | ---------------------------------------------------------------------------------------------------- | --------------------------------- |
| 1   | `promote_team_member_expertise` — no-op on schema; exists as a marker that the field is now editable | —                                 |
| 2   | `drop_pages_hero`                                                                                    | —                                 |
| 3   | `drop_legacy_body_columns` — §1.2 scalar columns + array tables + versions counterparts              | §3 gate passing                   |
| 4   | `drop_services_layout` — `services.layout` + `services_blocks_*`                                     | §3 gate passing                   |
| 5   | `drop_chrome_globals` — `navigation`, `site_settings` + their versions tables                        | §1.5 relocation shipped and green |

Ordering rationale: 1 lands before 3 so `expertise` is never simultaneously invisible in the admin and load-bearing for JSON-LD. 2 is independent and can ship first as the smallest possible proof the migration path works. **5 runs last and only after the `organizationLd` golden test is green against the relocated constants** — until that test passes, the global is still the source of the homepage's postal address.

**Snapshot before the destructive migrations.** The separate staging account was retired 2026-08-14, so there is no isolated environment to rehearse migrations 3, 4 and 5 in — `preview.seqtek.com` and `ww3.seqtek.com` are two services in one stack in one account, both holding real content. Take a DB snapshot of the target lane as an explicit, named step in the deploy sequence; the §3 equivalence gate covers content correctness but not operator error.

---

## 5. Compatibility surfaces

| Surface                                   | Obligation                                                                                                                                      |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/content-drafts/*.json` (gitignored) | Replay every file after each migration; any file setting a removed field must be reconciled. Outside CI — a manual merge gate (FR-029).         |
| `tools/payload-seed`                      | Generic and field-agnostic; no change expected, but the replay proves it.                                                                       |
| `src/payload/seed/showcase`               | Committed test fixtures. Must keep building every block — and now additionally serves as the thumbnail source.                                  |
| `tests/e2e/helpers/seedInScopeRoutes.ts`  | Minimal generic fixtures; update if they set a removed field.                                                                                   |
| `src/payload-types.ts`                    | Regenerated (`npm run generate:types`) after every field change.                                                                                |
| `src/app/(payload)/admin/importMap.js`    | Regenerated (`npm run generate:importmap`) — required because `admin.components.Label` and the block row label introduce new client components. |
| Existing drafts                           | Must open, edit, and save after the change (FR-030) — covered by an admin E2E spec against a pre-existing record.                               |
| `src/lib/structured-data.ts`              | `organizationLd` stops taking the global and reads the constant. Golden-object test asserts all seven relocated values still emit (FR-004).     |
| `slug` validators                         | Gain a collision branch that queries for the conflicting record (FR-024a). The DB `unique` constraint stays as the backstop, not the UX.        |
