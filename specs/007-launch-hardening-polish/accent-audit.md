# Accent-Usage Classification Inventory (T003 / data-model §1)

**Produced**: 2026-06-05 · **Drives**: US1 swaps T006–T012, the `text-accent` doc note T014.

One row per accent-family utility usage under `src/` (grep: `(bg|text|border|ring|fill|…)-accent(-strong|-hover|-pressed)?(/N)?`). Applies the data-model invariants:

- `role = decorative` ⇒ `exempt` **and** hidden from AT where it would otherwise be announced.
- `role ∈ {foreground-text, solid-fill, border-divider}` on a `white/light` surface below its AA floor ⇒ `remediate`.
- `surface = navy/dark` already at/above its floor ⇒ `already-passes` (do **not** swap).
- AA floors: body text 4.5:1; large text (≥18pt / ≥14pt bold) 3:1; non-text UI (borders/state icons) 3:1.

**Measured token contrasts** (sRGB, computed): green-500 `#72b94d` → **white 2.4:1**, **green-50 `#f3f9ec` 2.2:1**, **navy `#1c1c31` 6.95:1**. green-700 `#46792f` → **white 5.2:1** (so white text on a green-700 fill passes), **green-50 4.7:1**, **navy 3.2:1**. So: any `*-accent` foreground/fill on a light surface fails; on navy green-500 passes and green-700 is _worse_ (3.2 large-only) → navy usages stay green-500.

## Verdicts

### REMEDIATE — foreground text/icon → `text-accent-strong`

| Location                                    | Role                           | Surface             | Current       | Target               |
| ------------------------------------------- | ------------------------------ | ------------------- | ------------- | -------------------- |
| `sections/Hero.tsx:66`                      | eyebrow                        | white               | `text-accent` | `text-accent-strong` |
| `sections/ContactCta.tsx:45`                | "Book a time" eyebrow          | surface-subtle      | `text-accent` | `text-accent-strong` |
| `sections/CaseStudyHero.tsx:32`             | eyebrow                        | white               | `text-accent` | `text-accent-strong` |
| `sections/CaseStudyHero.tsx:37`             | metric number (large)          | white               | `text-accent` | `text-accent-strong` |
| `sections/ProcessSteps.tsx:25`              | step number (large)            | white card          | `text-accent` | `text-accent-strong` |
| `sections/KeyTakeaways.tsx:19`              | list number (large)            | surface-subtle      | `text-accent` | `text-accent-strong` |
| `sections/ComparisonTable.tsx:67`           | "Best for" label               | surface-accent      | `text-accent` | `text-accent-strong` |
| `sections/MissionVisionValues.tsx:29,33,38` | Mission/Vision/Values eyebrows | surface-subtle      | `text-accent` | `text-accent-strong` |
| `sections/WorkshopList.tsx:31`              | list number (large)            | white card          | `text-accent` | `text-accent-strong` |
| `sections/Accordion.tsx:23`                 | ▾ toggle glyph                 | white               | `text-accent` | `text-accent-strong` |
| `sections/FAQ.tsx:27`                       | ▾ toggle glyph                 | white               | `text-accent` | `text-accent-strong` |
| `sections/HubspotMeetings.tsx:12`           | eyebrow                        | surface-subtle card | `text-accent` | `text-accent-strong` |
| `sections/FeaturedCaseStudy.tsx:27`         | eyebrow                        | white               | `text-accent` | `text-accent-strong` |
| `sections/ServicePillarHero.tsx:37`         | pillar eyebrow                 | white               | `text-accent` | `text-accent-strong` |
| `sections/ServiceCards.tsx:37`              | service icon glyph             | white card          | `text-accent` | `text-accent-strong` |
| `richText/inline/InlineCta.tsx:10`          | primary inline link            | white (prose)       | `text-accent` | `text-accent-strong` |
| `sections/BrandTeaser.tsx:28`               | outline-button label           | surface-accent      | `text-accent` | `text-accent-strong` |

### REMEDIATE — solid fill → `bg-accent-strong` (+ matching `hover:`)

| Location                            | Role                      | Note                                                       | Current           | Target                   |
| ----------------------------------- | ------------------------- | ---------------------------------------------------------- | ----------------- | ------------------------ |
| `sections/Hero.tsx:98`              | CTA fill                  | white text on fill                                         | `bg-accent`       | `bg-accent-strong`       |
| `sections/HomepageHero.tsx:50`      | CTA fill                  | on navy hero, but white-on-green-500 fill fails regardless | `bg-accent`       | `bg-accent-strong`       |
| `sections/ContactCta.tsx:30`        | CTA fill                  |                                                            | `bg-accent`       | `bg-accent-strong`       |
| `sections/NewsletterCta.tsx:29`     | Subscribe button          |                                                            | `bg-accent`       | `bg-accent-strong`       |
| `sections/FeaturedCaseStudy.tsx:47` | CTA fill                  |                                                            | `bg-accent`       | `bg-accent-strong`       |
| `sections/ServicePillarHero.tsx:45` | CTA fill                  |                                                            | `bg-accent`       | `bg-accent-strong`       |
| `sections/TwoColumn.tsx:42`         | CTA fill                  |                                                            | `bg-accent`       | `bg-accent-strong`       |
| `sections/Timeline.tsx:25`          | timeline node dot         | visible structural marker                                  | `bg-accent`       | `bg-accent-strong`       |
| `sections/Deliverables.tsx:24`      | bullet dot                | already `aria-hidden`; darken for consistency              | `bg-accent`       | `bg-accent-strong`       |
| `sections/BrandTeaser.tsx:28`       | outline-button hover fill | white text on hover fill                                   | `hover:bg-accent` | `hover:bg-accent-strong` |

### REMEDIATE — border/divider/state → `border-accent-strong`

| Location                                                  | Role                            | Current                                 | Target                                                |
| --------------------------------------------------------- | ------------------------------- | --------------------------------------- | ----------------------------------------------------- |
| `sections/CaseStudyHero.tsx:35`                           | metric left-rule (`border-l-4`) | `border-accent`                         | `border-accent-strong`                                |
| `sections/BrandTeaser.tsx:28`                             | outline-button border           | `border-accent`                         | `border-accent-strong`                                |
| `sections/TechStack.tsx:25`                               | chip hover border + text        | `hover:border-accent hover:text-accent` | `hover:border-accent-strong hover:text-accent-strong` |
| `sections/Tabs.tsx:25`                                    | tab hover underline             | `hover:border-accent`                   | `hover:border-accent-strong`                          |
| `richText/inline/QuotePullquote.tsx:9`                    | blockquote left-rule            | `border-accent`                         | `border-accent-strong`                                |
| `richText/inline/TestimonialEmbed.tsx:20`                 | blockquote left-rule            | `border-accent`                         | `border-accent-strong`                                |
| `app/(frontend)/case-studies/[slug]/page.tsx:110`         | metric left-rule                | `border-accent`                         | `border-accent-strong`                                |
| `app/(frontend)/case-studies/[slug]/page.tsx:124`         | testimonial left-rule           | `border-accent`                         | `border-accent-strong`                                |
| `app/(frontend)/touchstone-workshops/[slug]/page.tsx:106` | testimonial left-rule           | `border-accent`                         | `border-accent-strong`                                |
| `app/(frontend)/not-found.tsx:32`                         | card hover border               | `hover:border-accent`                   | `hover:border-accent-strong`                          |

### REMEDIATE — mixed surface (conditional)

| Location                        | Role                | Surface                                   | Decision                                                                                                                                                                                           |
| ------------------------------- | ------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sections/MetricDisplay.tsx:21` | stat number (large) | green-50 default / navy `inverse` variant | green-700 on the light default (2.2:1 → 4.7:1); **keep green-500** on the navy variant (6.95:1, swapping would _lower_ it to 3.2:1). Implement as a conditional on the existing `background` prop. |

### ALREADY-PASSES — do NOT swap

| Location                                                                                             | Why                                                                                                  |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `sections/HomepageHero.tsx:42`                                                                       | eyebrow `text-accent` on navy = 6.95:1 (passes body AA).                                             |
| `sections/StatsBar.tsx:26`                                                                           | stat number `text-accent` on navy = 6.95:1; green-700 would be worse.                                |
| `layout/SiteHeader.tsx:40`                                                                           | `hover:text-text-accent` → green-700 (grep substring false-positive).                                |
| `layout/MobileNav.tsx:92`                                                                            | `hover:text-text-accent` → green-700 (grep substring false-positive).                                |
| `sections/CtaSection.tsx`                                                                            | already `bg-accent-strong`/`text-accent-strong`; the `:35` `bg-accent` hit is inside a code comment. |
| `app/(frontend)/not-found.tsx:46`, `case-studies/[slug]/page.tsx:111`, `error.tsx:44`                | already `*-accent-strong`.                                                                           |
| `ui/Button.tsx`, `sections/DownloadCard.tsx`, `sections/CtaSection.tsx`, `forms/HubspotLeadForm.tsx` | already `*-accent-strong`.                                                                           |

### EXEMPT — decorative

| Location                       | Why / AT handling                                                                                                                                                                                                                                        |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sections/Content.tsx:20`      | `bg-accent/5` 5%-opacity wash behind prose. Decorative seed (DESIGN*SYSTEM §2.1). A CSS section background is never announced by AT, so no `aria-hidden` needed (and the section \_contains* the announced prose — must not be hidden). Leave green-500. |
| `app/(frontend)/styles.css:21` | **Not a usage** — the grep matched the substring inside the `--color-text-accent` variable _definition_. No action.                                                                                                                                      |

## Notes

- axe's `color-contrast` rule only measures **text**, so the border/dot/icon swaps above are design-correctness (1.4.11 non-text 3:1), not strictly needed for the automated US1 gate — but they're in-scope per FR-001/research D1 and are applied here.
- The Accordion/FAQ ▾ glyphs are recolored here (US1); making them `aria-hidden` (state is already conveyed natively by `<details>/<summary>`) is handled under US2 T018 if axe/manual flags double-announcement.
- Every `remediate` row that shifts pixels ⇒ a re-captured showcase baseline (T013) — but per `.gitignore:74` baselines are **regenerated locally, not committed** (drift recorded in quickstart.md).
