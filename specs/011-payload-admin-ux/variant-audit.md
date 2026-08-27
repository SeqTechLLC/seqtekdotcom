# T050 — the per-block variant-conditionality audit

**Date**: 2026-08-27 | **Task**: T050 (US4) | **Contract**: [C4 clause (3)](./contracts/admin-metadata.md#c4--every-field-is-legible-without-schema-knowledge)

T050 asks for an audit of all 45 layout blocks for fields that apply only to a
subset of a block's variants, "recorded" per block. This is that record. The
25 blocks with no select at all are listed too, because "checked, nothing to
do" is the half of an audit that stops it being redone.

## What the audit was looking for

The contract as drafted said "a subset of a block's `variant` values", but only
two blocks name that field `variant`. The same relationship is carried by
`source`, `layout`, `background`, `width` and `filter`. So the question asked of
every block was: **does any select's value make another field stop affecting the
rendered output?** Where the answer was yes, the renderer in
`src/components/sections/` was read to confirm it, not assumed from the field
name.

## Findings

| Block                   | Selects                                                                   | Conditional fields after this task                  |
| ----------------------- | ------------------------------------------------------------------------- | --------------------------------------------------- |
| `hero`                  | variant(text-only\|with-image\|with-video\|split) alignment(left\|center) | `media`, `videoUrl`                                 |
| `case-study-hero`       | (none)                                                                    | n/a                                                 |
| `service-pillar-hero`   | (none)                                                                    | n/a                                                 |
| `homepage-hero`         | (none)                                                                    | n/a                                                 |
| `content`               | width(narrow\|standard\|wide) background(none\|subtle\|accent)            | n/a                                                 |
| `two-column`            | mediaPosition(left\|right)                                                | n/a                                                 |
| `image`                 | width(narrow\|standard\|wide\|full) alignment(center\|left\|right)        | **`alignment` — added**                             |
| `gallery`               | layout(grid\|carousel) columns(2\|3\|4)                                   | `columns`                                           |
| `process-steps`         | (none)                                                                    | n/a                                                 |
| `deliverables`          | (none)                                                                    | n/a                                                 |
| `comparison-table`      | (none)                                                                    | n/a                                                 |
| `timeline`              | (none)                                                                    | n/a                                                 |
| `faq`                   | (none)                                                                    | n/a                                                 |
| `stats-bar`             | (none)                                                                    | n/a                                                 |
| `metric-display`        | background(accent\|inverse)                                               | n/a                                                 |
| `logo-bar`              | source(inline\|from-homepage) treatment(grayscale-on-color-hover\|color)  | **`logos` — was declared but never applied; fixed** |
| `featured-testimonials` | (none)                                                                    | n/a                                                 |
| `testimonial-block`     | layout(centered\|with-photo-left\|with-photo-right)                       | n/a — see note 2                                    |
| `client-logo-grid`      | columns(3\|4\|6)                                                          | n/a                                                 |
| `cta-section`           | variant(centered\|split\|inverse) background(default\|accent\|image)      | `backgroundImage`                                   |
| `newsletter-cta`        | (none)                                                                    | n/a                                                 |
| `contact-cta`           | (none)                                                                    | n/a                                                 |
| `case-study-grid`       | source(manual\|latest\|by-industry\|by-service)                           | `manualItems`, `industry`, `service`                |
| `service-cards`         | source(by-pillar\|manual)                                                 | `pillar`, `manualItems`                             |
| `service-pillar-cards`  | (none)                                                                    | n/a                                                 |
| `featured-case-study`   | (none)                                                                    | n/a                                                 |
| `post-list`             | source(latest\|by-category\|manual)                                       | `category`, `manualItems`                           |
| `related-posts`         | (none)                                                                    | n/a — see note 4                                    |
| `industry-grid`         | (none)                                                                    | n/a                                                 |
| `locations-list`        | (none)                                                                    | n/a                                                 |
| `workshop-list`         | (none)                                                                    | n/a                                                 |
| `team-grid`             | filter(leadership-only\|all) layout(cards\|compact)                       | n/a — see note 3                                    |
| `video-embed`           | provider(youtube\|vimeo)                                                  | n/a                                                 |
| `mission-vision-values` | layout(tabs\|grid\|stacked)                                               | n/a                                                 |
| `accordion`             | (none)                                                                    | n/a                                                 |
| `tabs`                  | (none)                                                                    | n/a                                                 |
| `map`                   | (none)                                                                    | n/a                                                 |
| `embed`                 | (none)                                                                    | n/a                                                 |
| `download-card`         | (none)                                                                    | n/a                                                 |
| `hubspot-form`          | (none)                                                                    | n/a                                                 |
| `hubspot-meetings`      | (none)                                                                    | n/a                                                 |
| `brand-teaser`          | (none)                                                                    | n/a                                                 |
| `nav-cards`             | (none)                                                                    | n/a                                                 |
| `key-takeaways`         | (none)                                                                    | n/a                                                 |
| `tech-stack`            | (none)                                                                    | n/a                                                 |

**The audit changed two blocks. The other 43 were already right or had nothing
to hide** — which is the answer T050 wanted recorded, since "many blocks have no
variants and will be no-ops" was the task's own expectation.

## Notes

**1. `logo-bar.logos` was the real find.** It had carried
`...requiredWhen(d => d?.source === 'inline')` since spec 003, but the object
literal put `admin: { components: { RowLabel } }` **after** the spread, so the
later key replaced the whole `admin` object the helper returns — condition
included. The field validated conditionally and displayed unconditionally: an
editor who chose "Reuse the homepage set" still saw an empty logo array asking
to be filled in, and filling it in did nothing (`LogoBar.tsx:27` returns `[]`
for that source). `requiredWhen` now takes any extra `admin` properties as its
second argument so the footgun cannot recur, and
`tests/e2e/admin/variantFields.e2e.spec.ts` would now catch it in the DOM.

**1a. `logo-bar.source` has a dead OPTION, which is the same defect one level
down.** `from-homepage` is stored in eight Postgres enums and read by nothing:
`LogoBar.tsx:27` maps it to an empty list, so choosing it renders no logos.
This is exactly what US1 removed from `stats-bar` — and it survived because
that audit was over fields, not over option values. Withdrawing it means
dropping a value from eight enum types, so US4 names it rather than smuggling a
migration into an admin-only change: the option now reads "Reuse the homepage
set (not built yet)" and the field's help text says which choice works. Tracked
in ROADMAP.

**2. `testimonial-block`'s photo layouts have nothing to hide.** The two
"with photo" layouts read the photo off the linked `testimonials` record, not
off a block field, so there is no control to condition. What was missing was the
sentence saying the layout silently falls back to centred when that person has
no photo on file — added as help text instead.

**3. `team-grid.filter` is deliberately NOT conditional.** `manualItems` wins
over `filter` (`resolveLayout.ts:88`), so `filter` is genuinely ignored once
people are picked by hand — but it is `required: true` with no `defaultValue`,
and hiding a required field with no value makes the form unsavable with an
invisible error. Both fields stay visible and the help text says which wins.
Revisit if `filter` ever gains a default.

**4. `related-posts` has no select, and a defect behind it.** It is the one
collection-backed block PR #117 did not give a resolver, so an empty
`manualItems` renders the developer sentence "No manual items — falls back to
category-derived list at render time" as public body copy
(`RelatedPosts.tsx:26`). Out of scope for an admin-only change; its help text no
longer repeats the claim, and the defect is tracked in ROADMAP as UI-2's
leftover.

**5. `image.alignment` is hidden at full width, not disabled.** `width: 'full'`
gives the figure `max-w-container-lg`, which is exactly its parent's width, so
`mx-auto` / `mr-auto` / `ml-auto` have nothing to distribute
(`components/sections/Image.tsx:21-36`). The control looked effective and was
not.
