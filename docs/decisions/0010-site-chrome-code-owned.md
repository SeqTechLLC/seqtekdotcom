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
