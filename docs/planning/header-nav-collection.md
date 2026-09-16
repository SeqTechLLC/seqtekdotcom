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

Steps 1-5 shipped together; step 6 is content and is still open.

1. **Whole-site revalidation. Done —** and it is **two calls, not one**.
   `revalidatePath('/', 'layout')` invalidates every page's rendered output, but the nav's
   own `unstable_cache` entry only dies on its explicit `navigation_list` tag. Dropping the
   tag means the re-render reads the stale menu back out of the data cache; dropping the
   path means fresh data nothing re-renders with. `RevalidatePlan` carries an `everything`
   flag for the one collection whose blast radius is the whole site.
2. **The collection. Done.** `ADMIN_GROUPS.site`, previously unclaimed. One document per
   top-level button, each holding its own `groups` → `items` panel, which is the shape
   `PrimaryNav`/`MobileNav` already consume. Not derived from the `services` tree: the menu
   cross-lists, omits and reorders independently of the catalogue, and Industries and
   Insights are in the menu without being services at all.
3. **`SiteHeader` becomes async. Done.** `SiteFooter` untouched.
4. **The e2e contract did not need changing**, and that is a design outcome rather than
   luck. `getNavigation` falls back to `site-content.ts` when the collection is empty, so
   `layout.e2e.spec.ts` and `navPanels.int.spec.ts` — both of which assert against the real
   shipped nav — stay green on a fresh CI database. The same fallback is what stops a
   deploy-before-seed from serving a headerless site. The collection is an **override** of
   the code-owned tree, not a replacement for it.
5. **Migration. Done** — `20260916_173016_nav_collection`; the container runs
   `payload migrate` on start.
6. **Nav becomes content. Open.** Needs a `navigation.json` in the private content repo and
   a slot in `LOAD-ORDER.md`, seeded per lane — the menu will differ between preview and
   ww3 until both are seeded. Until then every lane serves the code-owned tree, unchanged.

## Open, and not a mechanism problem

**CADENCE and Trust Driven Development have no pages.** Verified on preview 2026-09-16:
zero matches across all 24 services, 7 pages and 3 workshops, and no route. Touchstone
does exist, as a published `workshops` doc at `/workshops/touchstone`, with eight Wix 301s
aimed at it.

Decide whether CADENCE and TDD are `workshops` beside Touchstone or `services` leaves
under the How We Work axis. That sets their URLs, and the 301 map commits to those. The
typed design enforces the ordering — you cannot point a menu item at a document that does
not exist.
