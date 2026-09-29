# 0010. Site chrome is code-owned; the header menu is a validated collection

**Status:** Accepted
**Date:** 2026-08-21
**Revised:** 2026-09-16 (#167, the header nav moves to a `navigation` collection)

## Context

Two Payload globals, `siteSettings` and `navigation`, made the site chrome look editable, but neither was wired to the
rendered chrome: `SiteHeader` and `SiteFooter` read constants from `src/lib/site-content.ts`. An editor could change the
phone number, publish, and see nothing change.

## Options considered

- **Wire the globals up** — navigation URLs were unvalidated free text coupled to the route table and the 301 map, so a
  bad edit would ship a broken link on every page, for values that rarely change.
- **Hide the globals** — leaves schema an editor cannot see but the database still carries.
- **Keep a trimmed `siteSettings`** — the same edit-frequency argument, with navigation still unsolved.

## Decision

Both globals are withdrawn. The chrome lives in `src/lib/site-content.ts` and changes by deploy: company name, tagline,
email, phone, postal address, social links, footer text, the footer and legal navs, and the header CTA.

## Amendment 2026-09-16 — the header nav leaves; the rest stays

The header menu grew from six items to thirteen and was being reworded faster than deploys were wanted, which is this
ADR's revisit condition. The header nav (`mainNav`) moves to a `navigation` collection, validated rather than free text.
Each item is one of:

- `internal` — a relationship to a routed document; the URL is derived from its collection and slug, so it cannot point
  at a missing page and follows a slug rename;
- `external` — a URL checked by `safeUrlValidate` (`src/payload/fields/url.ts`) and watched by
  `tools/link-sweep --external`;
- `heading` — a group label with no link.

A navigation publish revalidates every page, since `SiteHeader` renders everywhere. While the collection is empty,
`getNavigation` serves the `site-content.ts` tree.

## Consequences

Seven chrome values are read on the render path and were relocated rather than dropped:

| Value                                      | Consumer                                      |
| ------------------------------------------ | --------------------------------------------- |
| `tagline`                                  | `metadata.ts` — description fallback          |
| `companyName`                              | `metadata.ts` — `og:siteName`                 |
| `companyName`, `tagline`, `email`, `phone` | `structured-data.ts` — `Organization` JSON-LD |
| `address`                                  | `structured-data.ts` — `PostalAddress`        |
| `socialLinks`                              | `structured-data.ts` — `sameAs`               |

`tests/int/render/organizationLd.int.spec.ts` pins the emitted `Organization` object, and
`tests/int/render/metadataOutput.int.spec.ts` pins the metadata surface and its call sites. The globals' version history
was discarded; none of it ever reached a visitor.

## Revisit when

The footer or legal navs change often enough to need the header menu's treatment.
