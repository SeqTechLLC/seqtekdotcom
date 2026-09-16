# 0010. Site chrome stays code-owned; the `siteSettings` and `navigation` globals are withdrawn

**Status:** Accepted
**Date:** 2026-08-21

## Context

Two Payload globals shipped in spec 003 to make site chrome editable: `siteSettings`
(company name, tagline, phone, email, postal address, social links, footer text, a
stats array) and `navigation` (main nav, footer nav, CTA button).

Neither was ever wired to the rendered chrome. `SiteHeader` and `SiteFooter` import
hard-coded constants from `src/lib/site-content.ts`, and have since they were written.
`getNavigation()` had **zero callers**. The globals were fully editable in the admin
and, for navigation, changed nothing a visitor could see.

`getSiteSettings()` did have callers, which is where the decision got interesting —
see Consequences.

Spec 011's first user story is "every editable control affects the site" (FR-001).
These two globals are the largest violation of it in the panel: an editor can change
the site's phone number in Site Settings, publish, and watch the footer not change.

## Decision

**Withdraw both globals entirely — delete them from the Payload config and drop
their tables. Site chrome is code-owned.**

> **Narrowed 2026-09-16 — see the amendment below.** The header navigation moves to a
> validated `navigation` collection. Everything else in this decision stands.

Navigation structure, company name, tagline, phone, email, postal address, social
links and footer text live in `src/lib/site-content.ts` and change by deploy, not by
publish.

Rejected alternatives:

- **Wire the globals up properly** (make the chrome read from the CMS). Navigation
  URLs are unvalidated free text coupled to the route table and the 301 redirect map,
  so a bad nav edit ships a broken link into the primary navigation of every page —
  with no preview, no validation, and no build to catch it. The blast radius is the
  whole site; the benefit is editing values that change roughly once a decade.
- **Hide them (`admin.hidden`) rather than delete.** Retains the tables and their
  version history, and is reversible. Rejected because FR-007 forbids hidden
  read-only schema remnants outright — a field an editor cannot see but the schema
  still carries is the same trap one layer down, and it is exactly what spec 010's
  expand/contract left behind for spec 011 to clean up.
- **Keep `siteSettings` trimmed to its consumed fields, with the footer reading from
  it.** A coherent shape that resolves the code/CMS duplication in the other
  direction. Rejected on the same edit-frequency argument, and because it leaves the
  navigation problem unsolved.

## Consequences

**Seven values were load-bearing and had to be relocated, not dropped.** The spec
originally recorded two. The audit found seven:

| Value                                        | Consumer                                      |
| -------------------------------------------- | --------------------------------------------- |
| `tagline`                                    | `metadata.ts` — description fallback          |
| `companyName`                                | `metadata.ts` — `og:siteName`                 |
| `companyName`, `tagline`, `email`, `phone`   | `structured-data.ts` — `Organization` JSON-LD |
| `address` (street/city/state/zip)            | `structured-data.ts` — `PostalAddress`        |
| `socialLinks.{linkedin,twitter,facebook}Url` | `structured-data.ts` — `sameAs`               |

Withdrawing on the two-value belief would have silently stripped the postal address,
telephone, email and social profiles from the homepage's `Organization` schema —
invisible to a visual diff, invisible to a typecheck — and would have contradicted the
cutover step added in PR #105, which existed precisely to make that address emit.

All seven already existed verbatim on the hard-coded constant, so the relocation
authored no new data. `tests/int/render/organizationLd.int.spec.ts` now pins the
complete emitted object, and `tests/int/render/metadataOutput.int.spec.ts` pins the
metadata surface and enumerates its call sites so a new route cannot slip past.

**The runbook loses a step.** The `seed the siteSettings NAP` cutover instruction
(PR #105) is retired: the address ships with the code and can no longer go dormant by
being left unseeded (FR-005a).

**Version history is discarded.** Both globals held 50 versions each. Accepted
deliberately: only the seven values above were ever read, and all seven live in code,
so the versions record content that never reached a visitor.

**Editors lose nothing they had.** Nothing they could change in these screens ever
reached a page.

## When to revisit

If the edit frequency of site chrome changes materially — a rebrand cycle, a move,
frequent nav restructuring, or a marketing team that needs to reorder navigation
without a deploy. At that point the right shape is not restoring these globals as
they were, but a **validated** navigation model: URLs checked against the route table
and the redirect map at save time, so a bad link cannot publish. That validation is
the work this ADR is deferring, not the CMS wiring.

## Amendment 2026-09-16 — the header nav leaves; the rest stays

**The revisit condition this ADR named has been met, on its own terms.** It said to
revisit on "frequent nav restructuring", and specified that the right shape would not be
restoring the globals but "a **validated** navigation model … so a bad link cannot
publish."

What changed: the nav was six decade-scale items when this was written. It is now 13
entries across two axis panels and an industries panel, heading to 16 — Retail was added
2026-09-10, three more items (Touchstone, CADENCE, Trust Driven Development) are queued,
and labels are being reworded faster than deploys are wanted for them.

**Narrowed decision.** Code-owned, unchanged:

- the seven chrome values `structured-data.ts` and `metadata.ts` consume — company name,
  tagline, email, phone, postal address, social links — pinned by
  `organizationLd.int.spec.ts` and `metadataOutput.int.spec.ts`;
- footer text, the **footer nav** and the **legal nav** — three consumers between them,
  and they do not move;
- the header CTA button.

Moving to a `navigation` collection: **the header nav only** (`mainNav`).

**The validation this ADR deferred is the thing that makes it safe**, and it is not a URL
checker bolted onto a free-text field. A menu item carries a discriminated type:

- `internal` — a polymorphic relationship to the routed collections. The URL is _derived_
  from the target's collection and slug, so an item cannot point at a page that does not
  exist, and a slug rename follows it. The label defaults from the document's title with
  an optional override, which is most of the churn.
- `external` — a free-text URL validated by the existing `safeUrlValidate`
  (`src/payload/fields/url.ts`), which already rejects `javascript:`, `data:` and
  `vbscript:` at save time. This is the one type that can rot; `tools/link-sweep --external`
  is what watches it.
- `heading` — a group label with no link, which the "How We Work" panel already needs.

**The cost this buys is revalidation, not schema.** `SiteHeader` renders on every page, so
a nav publish has to bust every page rather than one path. `revalidateOnChange` already
imports `revalidateTag` and already pushes `/`, so this extends the existing hook — but it
ships in the same change, or editing the menu means waiting an hour to see it.

**Rejected again, for the same reason as 2026-08-21:** a single free-text URL field per
item, WordPress's "Custom Link" shape applied to every entry. That is precisely the
unvalidated-URL coupling to the route table and the 301 map this ADR rejected, and nothing
about the churn argument makes it safer.
