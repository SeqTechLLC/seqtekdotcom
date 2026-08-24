# Pre-change inventory — spec 011 (T003)

**Captured**: 2026-08-24 against the local mirror (`seqtek_dev` on :5433).

The reference point for T010's equivalence remediation and for the FR-031
"content stored only in fields being removed" obligation. Every number here is
queried, not estimated.

## 1. Legacy scalar / rich-text columns (dropped by migration 3)

| Table          | Column        | Rows populated | Total rows |
| -------------- | ------------- | -------------- | ---------- |
| `case_studies` | `problem`     | 7              | 10         |
| `case_studies` | `solution`    | 7              | 10         |
| `case_studies` | `impact`      | 7              | 10         |
| `services`     | `description` | 9              | 12         |
| `services`     | `approach`    | 9              | 12         |
| `workshops`    | `description` | 3              | 6          |
| `workshops`    | `audience`    | 3              | 6          |
| `workshops`    | `format`      | 1              | 6          |
| `team_members` | `bio`         | 3              | 12         |
| `team_members` | `quote`       | 1              | 12         |

Matches data-model.md §1.2 exactly. No drift since the spec was written.

## 2. Legacy array tables (dropped by migration 3)

| Table                         | Rows |
| ----------------------------- | ---- |
| `case_studies_metrics`        | 4    |
| `case_studies_technologies`   | 19   |
| `services_deliverables`       | 36   |
| `services_faq`                | 23   |
| `workshops_deliverables`      | 12   |
| `workshops_photos`            | 4    |
| `team_members_certifications` | 2    |
| `team_members_education`      | 4    |
| `team_members_personal_facts` | 3    |
| `homepage_stats`              | 3    |
| `homepage_client_logos`       | 8    |

**Retained**: `team_members_expertise` — 13 rows, promoted to visible by T011
(data-model §1.3). It feeds `knowsAbout` in the Person JSON-LD.

## 3. `pages.hero` (dropped by migration 2)

Columns present: `hero_background_image_id`, `hero_cta_label`, `hero_cta_url`,
`hero_headline`, `hero_subheadline`.

**All five are NULL across all 57 rows.** Research R1's "verified empty" claim
confirmed empirically. This migration destroys nothing.

## 4. ⚠️ `services.layout` (dropped by migration 4) — the one real content loss

63 `services_blocks_*` tables exist; **6 hold rows**:

| Table                                | Rows |
| ------------------------------------ | ---- |
| `services_blocks_content`            | 24   |
| `services_blocks_contact_cta`        | 12   |
| `services_blocks_deliverables`       | 9    |
| `services_blocks_deliverables_items` | 36   |
| `services_blocks_faq`                | 9    |
| `services_blocks_faq_items`          | 23   |

This is **composed block content for the nine capability services**
(`custom-software-development`, `application-modernization`,
`cloud-data-engineering`, `machine-learning-solutions`, `process-automation`,
`ai-assisted-modernization`, `fractional-product-ownership`,
`strategy-alignment`, `team-workshops`), plus three `showcase-*` test fixtures.

It renders nowhere — `/services/[offering]` resolves four block `Page` slugs and
the Services collection has been unrouted since PR #79 (research R4). So
data-model §1.4's rationale holds: no visitor loses anything.

**But it is not worthless.** ROADMAP **SVC-3** plans to publish these nine
capability pages, noting the prose "is already written" in
`docs/content-drafts/_archive/content-batch.json`. What is _not_ in that archive
is the **composition** — the block arrangement someone built on top of the prose.
Dropping the tables discards that work, and SVC-3 would redo it.

**Action taken (FR-031 "or preserved" branch)**: export the composed layouts to
a gitignored `docs/content-drafts/services-layouts-backup.json` before migration
4 runs. Cheap insurance; see T010a.

## 5. Block-owned tables that must NOT be dropped

data-model §1.2 warns that `<table>_blocks_deliverables` / `_blocks_faq` belong
to the layout blocks, not to the legacy fields. Current rows:

| Table                              | Rows | Fate                                    |
| ---------------------------------- | ---- | --------------------------------------- |
| `case_studies_blocks_deliverables` | 0    | **survives**                            |
| `case_studies_blocks_faq`          | 0    | **survives**                            |
| `workshops_blocks_deliverables`    | 6    | **survives**                            |
| `workshops_blocks_faq`             | 0    | **survives**                            |
| `services_blocks_deliverables`     | 9    | dropped — see §4, the whole layout goes |
| `services_blocks_faq`              | 9    | dropped — see §4, the whole layout goes |

**The `services_*` pair is the exception to §1.2's warning**, because §1.4 drops
the entire `services.layout`. The migration must distinguish them: bare
`<table>_deliverables` everywhere, plus _all_ `services_blocks_*`, but never
`case_studies_blocks_*` or `workshops_blocks_*`.

## 6. Equivalence gate outcome (T010)

**PASS — 2026-08-24, but see the caveat below.** `tools/legacy-equivalence/check.ts` against the local mirror:

```
Records holding legacy prose : 22
Field values checked         : 50
Gaps found                   : 0
```

Every legacy prose value is present in its composed `layout`. Migration 3 is
cleared to run.

**Why this is not a vacuous pass.** The gate compares text, not row counts, and
it demonstrably fails when text is absent: an earlier run with a broken Lexical
extractor reported "1 of 19 chunks missing" for `teamMembers/hank-haines.bio`,
i.e. 18 of 19 real prose chunks _were_ located inside the stored layout and only
the malformed chunk was not. Containment matching works against real records.
The extractor was then fixed to walk Lexical `text` nodes only — a naive
`Object.values()` recursion had been folding node types, versions and format
integers into the compared text ("root 0 1 paragraph 0 1 …"), poisoning the
first chunk of every field.

> **The gate was deleted during PR #107 review.** This run was real, but it
> happened at an intermediate state — the gate was built and run before the
> fields were removed from the collection configs, and that state exists in no
> commit. Once the fields left the config, `payload.find()` stopped returning
> them, so the gate could never find anything again. The control that replaced
> it is a pre-merge RDS snapshot (`INFRASTRUCTURE_RUNBOOK.md` §2.9), backed by
> `docs/content-drafts` being the reproducible source of every published doc.
