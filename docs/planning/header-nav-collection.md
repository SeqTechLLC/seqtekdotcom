# Header nav → a validated `navigation` collection

**Decision:** the amendment to [`ADR 0010`](../decisions/0010-site-chrome-code-owned.md)
(2026-09-16). Read that first — it carries the rationale and the rejected alternative.

## Scope

**Moves to the CMS:** the header nav (`mainNav`) only.

**Stays code-owned in `src/lib/site-content.ts`:** the seven values `structured-data.ts`
and `metadata.ts` consume (company name, tagline, email, phone, postal address, social
links), footer text, `footerNav`, `legalNav`, and the header `ctaButton`. Those seven are
pinned by `organizationLd.int.spec.ts` and `metadataOutput.int.spec.ts`.

## Item shape

One collection, ordered items, each with a discriminated `type`:

| type       | field                                                                                                         | URL                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `internal` | polymorphic relationship → `pages \| services \| workshops \| industries \| posts \| caseStudies \| partners` | derived from target collection + slug                |
| `external` | text, validated by `safeUrlValidate` (`src/payload/fields/url.ts`)                                            | as entered                                           |
| `heading`  | label only                                                                                                    | none — the "How We Work" panel needs headless groups |

Label defaults from the target document's title, with an override field. Relabelling is
most of the churn, and an override means it never touches the target.

## Steps, in order

1. **Whole-site revalidation first.** _This is the risk, and it does not exist yet._
   `buildRevalidatePlan` (`src/payload/hooks/revalidateOnChange.ts`) is a per-collection
   switch emitting specific paths; nothing busts the whole site. The header renders on
   every page, so a nav publish must invalidate everything, plus the CloudFront paths.
   Ship this in the same change or editing the menu means waiting out `revalidate: 3600`.
2. **The collection.** Needs `admin.group` + `admin.description` or the C3 contract test
   in `adminMetadata.int.spec.ts` fails. `ADMIN_GROUPS.site` is currently unclaimed and is
   where this belongs. **No `relationTo: [...]` exists anywhere in this codebase** — the
   polymorphic pattern is new ground; add a test proving URL derivation per target
   collection.
3. **`SiteHeader` becomes async.** It is `export function SiteHeader()` today
   (`src/components/layout/SiteHeader.tsx:9`) and renders on every page. `SiteFooter` is
   untouched.
4. **Fix the e2e contract.** `tests/e2e/layout.e2e.spec.ts:28-41` asserts all seven
   top-level items are visible **links**. If an axis item becomes a panel-opening button
   that assertion changes shape, and `a11y.e2e.spec.ts` must stay at zero violations.
5. **Migration** via `migrate:create`; the container runs `payload migrate` on start.
6. **Nav becomes content.** Needs a `navigation.json` in the private content repo and a
   slot in `LOAD-ORDER.md`, seeded per lane — the menu will differ between preview and
   ww3 until both are seeded.

## Open, and not a mechanism problem

**CADENCE and Trust Driven Development have no pages.** Verified on preview 2026-09-16:
zero matches across all 24 services, 7 pages and 3 workshops, and no route. Touchstone
does exist, as a published `workshops` doc at `/workshops/touchstone`, with eight Wix 301s
aimed at it.

Decide whether CADENCE and TDD are `workshops` beside Touchstone or `services` leaves
under the How We Work axis. That sets their URLs, and the 301 map commits to those. The
typed design enforces the ordering — you cannot point a menu item at a document that does
not exist.
