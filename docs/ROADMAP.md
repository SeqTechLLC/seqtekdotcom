# SEQTEK Website — Roadmap

**Owner:** Kenn Williamson

What is still open, in priority order. Nothing else.

**Rules for this file.** When something ships it leaves — move it to [`PROJECT_HISTORY.md`](./PROJECT_HISTORY.md)
with a `P{N}-*` row in the same commit. Don't check items off in place, don't keep the reasoning for a decision
that's already made, don't restate what shipped, don't catalogue content. If it isn't listed here, it's done or
it isn't happening.

**Companion docs.** `CONTENT_NEEDS.md` (private content repo) is what we need _from people_; this file tracks the
_work_. [`PROJECT_HISTORY.md`](./PROJECT_HISTORY.md) is the audit trail. [`decisions/`](./decisions/) holds the
ADRs. Meeting notes live in [`meetings/`](./meetings/).

---

## Priority at a glance

| #      | Item                                                           | Owner                  |
| ------ | -------------------------------------------------------------- | ---------------------- |
| **P0** | NAV-1 Dropdown panels + the pages under them                   | Kenn, blocked on Brent |
|        | SVC-2 Seed the services content                                | Kenn                   |
|        | SVC-3 Collapse the duplicate Localshoring pages                | Kenn                   |
|        | IND-1 Eight industry pages                                     | Kenn + Brent           |
|        | BOOK-1 Book-a-call widget routing to Daniel                    | Kenn, blocked on Megan |
|        | PROOF-1 Case studies + quotes, on hard dates                   | Megan, Brent escalates |
|        | AB-1 The alternative "what we do" page, A/B against the menu   | Kenn                   |
|        | LM-1 Decide what "soft launch" means                           | Kenn                   |
| **P1** | Spec 011 — Payload admin UX (US5, US6 open)                    | Kenn                   |
|        | A-1 Megan signs in + editor training                           | Kenn                   |
|        | HYG-1 Content data hygiene                                     | Kenn                   |
|        | UI-3 Default skeletons are publishable placeholder copy        | Kenn                   |
|        | INERT-2 residual — icons, related-posts resolver, field sweep  | Kenn                   |
| **P2** | K8 Sweep — tool shipped; links/images clean, copy is not       | Kenn                   |
|        | CL-1 Load the drafted content                                  | Kenn                   |
|        | C-7 Taurex sign-off                                            | Kenn + Megan           |
|        | BR-5 Stats bar                                                 | Leadership             |
|        | COPY-1 Tagline ↔ hero reconciliation                           | Kenn + Megan           |
|        | HS-1 HubSpot cookie policy for this site's hostnames           | Megan                  |
|        | VID-1 `/our-story` video embeds render as black boxes          | Kenn                   |
| **P3** | Cutover checklist — CSP, QA, a11y sign-off, infra posture, DNS | Kenn + infra           |
| **P4** | SEC-1 / F-6 / regional pages and the campaign content          | Kenn + Megan           |

---

## P0 — Committed at the 2026-08-31 sales alignment

Go/no-go **2026-09-14**. Context and quotes: `docs/meetings/2026-08-31-hank-sales-website-alignment.md`.

- **NAV-1 — the menu is built and wired; what it points at is empty.** The panel shipped (#129) and
  `site-content.ts` now carries both axes, all three groups and all nine leaves, every one resolving against a
  published `services` row. The mechanism is done. **The open item is the copy those 13 pages don't have —
  see SVC-2 below.**
  - **Open decision: should the axis panels derive from the `services` collection?** Today a new service is a
    content edit plus a code change to `site-content.ts`, which is the friction ADR 0010 accepted when the nav
    was six decade-scale items. It is 13 entries now. The hierarchy already exists as typed relations
    (`tier`, and `items` constrained to `tier: 'leaf'`), so a derived panel builds URLs from `slug` and has no
    free-text URL field to get wrong — which is the specific risk ADR 0010 rejected. Scope it to the two axis
    panels; top-level items, footer, legal nav and the JSON-LD values stay code-owned. Costs: `SiteHeader`
    becomes async (`listServices()` and its `services_list` tag already exist), and it renders on every page,
    so the revalidation gap below becomes load-bearing rather than cosmetic. Wants an ADR revising 0010.
  - `tests/e2e/layout.e2e.spec.ts` (~:28-38) asserts all seven top-level items are visible **links**. If an axis
    item becomes a button that opens a panel, that assertion changes shape.
  - **A group's URL is optional, and that is what de-risks the second panel.** A group with no URL renders as
    a heading and nothing more, so "how we work" can ship with headless groups and earn pages later. Brent
    asked for all three "what we do" groups to be clickable, so on that panel every group takes a URL. The
    panel already renders a group either way (#129) — what changes is how much copy has to exist first.
  - **Decide whether the leaf namespace stays named `/services/`.** It was worth asking once the axis labels
    settled, and they have. All leaves share ONE flat namespace whichever axis they hang off — that is not
    optional, because a leaf reachable from both panels must resolve to one URL. Only the name is open.
  - The a11y gate is the cost, not the CSS: click/tap to open (hover-only fails WCAG 2.2 §1.4.13), no focus
    trap. `tests/e2e/a11y.e2e.spec.ts` sweeps at zero axe violations.

- **SVC-2 residual — the content.** The code shipped (P5-31 / #131, and P5-41 / #136 for the `/services` fold). A deploy never runs the seeder, so:
  - ~~Seed the services content~~ **Done on preview (verified 2026-09-04):** 24 `services` docs, tiers
    matching the drafts file, both axes and all three groups published, the nine legacy capability-set docs
    retired to `draft`. `ww3` is a separate run after the next release.
  - **Flip the five Localshoring links — gated on copy, not on the route (re-checked 2026-09-09).** The
    `localshoring` leaf is seeded and published, so `/services/localshoring` resolves. The `site-content.ts`
    comments that claimed the leaf "lives only in an unseeded `services.json`" were stale and are corrected,
    but the links themselves stay on `/localshoring` for a reason the earlier note missed: **everything the
    leaf renders is placeholder.** `services.json` seeds it as a hero whose subheadline is
    "PLACEHOLDER COPY — NOT FOR PUBLICATION" plus one content block that opens with the same string and
    then explains, in-band, why the real copy does not exist yet. Resolving is not the bar. Flipping now
    would put the header nav and the four footer market links onto a published page that tells the reader it
    is not for publication. The five links (in `site-content.ts`: the `How We Work` panel's Localshoring item, and the four market links in the footer's Connect column) flip in
    the same change that moves real copy onto the leaf and retires the Page — that is SVC-3 below. No
    internal 301 — nothing is live, so the URL simply changes.
  - **Re-pick every block the SVC-2 migration emptied.** `*_rels.service_pillars_id` was dropped across
    thirteen tables, discarding the `pillars` selection on any `service-pillar-cards` block and NULLing
    `service-cards.pillar` wherever the source was "By pillar". `pillars` is `required, minRows: 1`, so those
    documents are invalid until re-picked. A re-seed repairs whatever the seed files cover; the exposure is
    what was authored directly in the admin. Check a lane.
  - **Write the copy. This is the P0 item now, and it is worse than "thin" — re-measured on the lane
    2026-09-09 through the Cognito gate, rendered text not seed files.** All **15** service routes return 200
    and **every single one prints the literal string `PLACEHOLDER COPY — NOT FOR PUBLICATION` in visible body
    text.** That includes both axis pages, which are the header nav triggers' own destinations.
    Main-content character counts of what actually renders:

    | Route                   | Chars   | Notes                                                      |
    | ----------------------- | ------- | ---------------------------------------------------------- |
    | `/services/what-we-do`  | **165** | Placeholder subhead + a bare list of the three group names |
    | `/services/how-we-work` | 360     |                                                            |
    | 3 group pages           | 473-530 |                                                            |
    | 10 leaves               | 501-603 |                                                            |

    The old Wix service pages averaged 348 words (~2,000 chars), so these are roughly a quarter of what they
    replaced. The menu is fully wired and delivers a visitor to a page that tells them it is not for
    publication — the exact failure Hank and Brent both described, a capability list without substance, made
    literal.

    **The placeholder text also leaks the repo's own planning notes into rendered output.** The bodies name
    `CONTENT_NEEDS.md §12` and `§1.B`, say "Brent's nine services", and one of them explains that "this page
    is a structural placeholder so /services/agentic-ai resolves and the navigation can be reviewed end to
    end". Gated, so not indexed and not public — but it is what anyone given a preview link reads. Same class
    of defect as **UI-3**, different mechanism: UI-3 is a `defaultValue` skeleton applied on read, this is
    seeded body copy. **Only the first half is guarded today.**
    `tests/int/render/noPlaceholderCopy.int.spec.ts` fails when a skeleton grows placeholder copy that is not
    enumerated in `SKELETON_PLACEHOLDER_COPY` — but that is an inventory-completeness check on the source, not
    a publish gate, and it never inspects seeded content. Seeded copy is content, and content is not in git,
    so nothing in this repo could see the fifteen routes above. Closing that half needs a check that reads
    **rendered output**, which is K8's job.

    **Meanwhile the copy that was supposed to be retired is still the best copy on the lane, and still
    served.** The flat `service-*` Pages are excluded from the sitemap but `/[slug]` still renders them:
    `/service-ai-integration` **2,985 chars**, `/service-digital-transformation` **2,465**,
    `/service-localshoring` **1,786**, `/localshoring` **1,545** — all real prose, no placeholder markers
    except `service-localshoring`'s one `[PLACEHOLDER - Hank-gated copy...]` line. Only `/service-overview`
    404s. So the seed did not replace this content, it **shadowed** it: the good version sits at an
    unadvertised flat URL and the placeholder sits at the URL the nav points to. Mining these four before
    writing anything new is the cheapest first move.

    Ten leaves, three groups, two axes (`CONTENT_NEEDS.md` §12). **A group page needs a reason to exist:** if
    it is only a list of its own children it is a worse version of the menu that got you there — which is
    exactly what `/services/what-we-do` is today. That is the bar. Flag it early if a grouping produces a
    heading nothing can be written about.

  - **`services.json` lists each of the three group slugs twice** — once with a real 3-block layout, once with
    an empty one. Whichever seeds last wins, so a re-seed can silently blank a group page. Fix in the content
    repo before the next run.
  - **Refine the 21 Wix service 301s once the leaves are seeded.** They all land on the axis today, which is
    the honest interim target. `/technology-and-data` should reach the data page rather than the axis.
    Cheaper before the DNS cutover: nothing is live, so these are retargeted at source rather than layered.

  **Carry forward:** absorbing tiers into one collection means every relationship pointing at that collection
  has to constrain to a tier, or the pickers offer nonsense. Six fields pointed at `services`; without
  `filterOptions` each would have offered an axis as a taggable service. Any future collection merge inherits
  this.

- **SVC-3 — collapse the three Localshoring artifacts.** Not two, three, and the copy audit (2026-09-09)
  settles most of the "which one wins" question that used to sit here:
  - **Page `localshoring`** (`/localshoring`) — ~1,520 chars, finished, no placeholders. Offshore/nearshore
    argument, the four markets, the Sequoyah tie-in, and a **named** testimonial (Jeremy Larson, Cross
    Precision Measurement). This is what all five chrome links point at today, and it is the only one of the
    three that is publishable as it stands.
  - **Page `service-localshoring`** — 1,786 chars rendered. **Unlinked but not unreachable:**
    `/services/[offering]` was deleted in SVC-2 and the slug is excluded from the sitemap, but `pages` are
    flat at `/[slug]`, so `/service-localshoring` still returns 200 and renders. Its prose carries a live
    `[PLACEHOLDER - Hank-gated copy...]` marker and its hero eyebrow still reads "Technology partnership".
    It also holds the one asset the other two lack: a **complete, real `comparison-table` block**
    (Localshoring / Nearshore / Offshore across overlap hours, cultural fit, seniority, ramp, plus a best-for
    row), confirmed rendering on the lane. That block is structure and numbers, not Hank-gated voice, so it
    can move as-is.
  - **Service leaf `localshoring`** (`/services/localshoring`) — published on preview, 522 rendered chars,
    entirely placeholder, and it prints `CONTENT_NEEDS.md §12` / `§1.B` and "Brent's nine services" on the
    page. It owns the URL the IA wants and none of the content.

  **The URL question is not open** — the flat leaf wins, because cross-listing means one page and two links,
  never two pages, and the flat leaf URL is that rule expressed in routing. **The content call that is left
  is narrow:** the leaf's body should be the `localshoring` Page's blocks, and whether the
  `service-localshoring` comparison table comes with them (recommended — it is the strongest asset in the
  set and it is currently rendered nowhere). Both Pages then retire and the five chrome links flip, in that
  order, in one change. §1.B's Hank-gated definition is **not** a blocker for the collapse: it would improve
  the leaf, but the Page's existing copy is already approved and stands on its own.
  - Re-check the four folded capability pages against Brent's grouping (AI-Assisted Modernization, Fractional
    Product Ownership, Strategy & Roadmap Alignment, Discovery & Team Workshops); some map onto items he named
    and may need to come back out.

- **IND-1 — industry pages. Wiring done; the copy is not.** Eight industries: Oil and Gas, Energy,
  Manufacturing, Healthcare, FinTech, Aerospace, Retail (added by Brent 2026-09-10), and Leadership and
  Training. Non-profit is explicitly out.
  - **The mechanism shipped.** `industries` carries a `layout` blocks field, `/industries/[slug]` renders it
    through `RenderBlocks` off the collection, `industry-grid` cards are re-linked, and the sitemap derives
    the URLs. Publishing a new industry needs no deploy. Of the four INERT-1 groups only `seo` is un-hidden —
    the route renders `layout` blocks and nothing else, so `description`, `relevantServices` and
    `clientLogos` still have no reader. Un-hide each one in the change that ships its consumer.
  - **One taxonomy, settled.** The five previous slugs were invented one per engagement, not marketing
    industries. All seven case studies were re-tagged onto the canonical set and the old five unpublished —
    `unpublished` keeps the row as a working tag while its URL 404s. **Hogan resolved to Leadership and
    Training** rather than being forced into one of Brent's six.
  - **Nav placement was a measurement, and the header changed to fit it.** Industries is a **seventh
    top-level item** with `/industries` (a `pages` doc on the `/[slug]` catch-all) as its destination.
    Making it fit took two changes, both measured on the rendered header: the row container went `lg` →
    **`xl`** (1024 → 1280px), because it caps the row regardless of window width and every multi-word label
    wrapped at 1440 without it; and the desktop nav moved to the **`xl` breakpoint**, because at a 1024px
    viewport the container is viewport-bound (1024 − 64px padding = 960px) and no max-width helps — so
    1024–1279 renders the drawer. **Re-measure before adding anything else to the header**, against the
    1280px cap, not the old 1024.
  - **What is left is the copy.** All eight bodies are placeholders and say so on the page.
  - **Six of the eight have no proof** — Healthcare, FinTech, Manufacturing, Aerospace, Leadership and
    Training, and Retail carry no case study. Their `case-study-grid` now renders **nothing at all** — heading included — rather than an empty
    section: a bare "Selected work" over empty space was itself a claim with nothing behind it. So the gap is
    no longer self-advertising on the page, which makes the publish decision a human one: either PROOF-1 lands
    a study each, or those five stay drafts until it does. `CONTENT_NEEDS.md` §11.

- **BOOK-1 — book-a-call widget, routing to Daniel.** The blocks shipped (#124). What is missing:
  - **Daniel's real HubSpot meetings URL** (Megan, portal config). The only URL in the repo is a fixture. The
    button cannot go live without it.
  - The footer's "Book a Call" still points at `/contact` (`site-content.ts`). Repoint it, and place the block
    where a visitor actually lands.
  - `booking_complete` starts emitting for real once a live URL is in place — fold it into the P3 GTM matrix.
  - The inline calendar embed stays unshipped: it needs HubSpot's `MeetingsEmbedCode.js` and a CSP widening
    (`INTEGRATIONS.md` §8). A button satisfies the ask.

- **PROOF-1 — case studies and attributable quotes, on hard dates.** Every capability claim links to proof, and
  there are fewer proofs than the menu will have items.
  **Protocol, targets and current state:** private content repo, `WAITING_ON_PEOPLE.md`.
  **Decide at the go/no-go:** whether a named, signed case study gates the cutover.

- **AB-1 — the alternative "what we do" page.** Build a page that meets Brent's goal — a visitor understands
  everything we do very quickly — without the full list, and A/B it against the menu. Not launch-gating; do it
  after the menu ships and there is traffic. Settle how "understood quickly" gets measured before building it.

- **LM-1 — decide what "soft launch" means.** Answer at the 2026-09-14 go/no-go. Either (a) ungate
  `ww3.seqtek.com` for a named audience, or (b) cut DNS early and treat the hard launch as a content refresh.
  (b) pulls most of P3 forward, and is what the meeting described in everything but name. Kenn decides.

---

## P1 — Unblock content throughput

Every content change is still a developer task. This tier fixes that before we load more content by hand.

- **Spec 011 — Payload admin UX.** US1–US4 shipped. **Open: US5** slug-from-title with collision handling,
  **US6** collection grouping. Tasks T052–T065. → `specs/011-payload-admin-ux/spec.md`
- **A-1 residual — Megan signs in, then editor training.** The auth code shipped (#77). What is left is a
  deploy, her first sign-in (auto-provisions an `editor`), and a short CMS quickstart. Train **after** 011
  lands so she learns the fixed panel.
- **HYG-1 — content data hygiene.** No human input needed; see `CONTENT_NEEDS.md` §10. Check a live lane, then:
  seed `industries` or drop the relationship (published case studies reference industry IDs, and
  `case-study-grid`'s `by-industry` source returns zero rows against an empty collection); seed `locations` if
  the regional pages get built; delete the `ztest-delete-me` category; give case studies an `ogImage`.
- **UI-3 — a skeleton `defaultValue` is publishable placeholder copy, on READ as well as create.**
  `TeamMembers.layout` defaults to `teamMemberSkeleton`, whose body reads as finished prose — seven members
  were published without overwriting it. The same pattern exists for `caseStudy`, `workshop`, `partner` and
  now `industries` — five collections, pinned by `skeletonDefaultValue.int.spec.ts`.
  **Scope corrected:** this is not only about NEW records. Payload applies a `defaultValue` when a field reads
  back `undefined`, and the Drizzle adapter leaves a blocks field unassigned when the row has no block rows —
  so adding `layout` to a collection that ALREADY has published rows gives every one of them a skeleton body
  on the next read. That is what put five `<h1>Industry name</h1>` pages on the preview lane after IND-1
  deployed; they were retired by unpublishing. The copy half is done; the code half is not, because the flaw
  is the skeleton design. **The third option shipped** — `tools/link-sweep` greps rendered HTML for
  `SKELETON_PLACEHOLDER_COPY`, which moved to `src/payload/seed/skeletons/placeholderCopy.ts` so the source
  guard and the sweep could share one list. That closes the detection half: a skeleton published unedited is
  now visible on the next sweep instead of only when someone reads the page. **Still to decide, and it is the
  design half:** ship skeletons as empty blocks, or mark skeleton text so a publish check can refuse it at
  the source. Detection after the fact is a weaker guarantee than a `defaultValue` that cannot be published
  as-is.
- **INERT-2 residual — controls whose renderer does nothing with them.** The gate
  (`tests/int/blocks/blockOutputContract.int.spec.tsx`) holds every block in `layoutBlocks` to three promises:
  no developer phrase reaches body text, every control changes the output, every select option draws something
  different. Exceptions are declared on the block via `custom: outputContract({...})`. Still open:
  - `services.icon` and `process-steps.steps.icon` are read, but there is no icon set behind them —
    `ServiceCards.tsx:36` and `ProcessSteps.tsx:29` print the raw string. Not gate-visible: it does reach the
    output, just as a string.
  - `related-posts` has no resolver. It needs the containing document's categories, which `resolveLayout`'s
    block-only signature does not carry.
  - **The gate covers block controls, not collection fields.** Nothing has audited the collections' own fields
    the same way. Sequencing: `docs/planning/block-output-contract.md`.
- **Publishing a group does not bust the axis page that renders it.** `services` is the only routed
  collection whose revalidate plan names no listing path — correct in itself, since `/services` is a
  redirect now. But the axis page took over the overview role, and its `service-pillar-cards` block renders
  the `tier: 'group'` rows through a depth-2 populate, so publishing or renaming a group refreshes neither
  that page's data cache nor its CloudFront copy. Bounded by `revalidate: 3600` on a gated, unlaunched
  site. The fix wants the axis slugs, which are content — so it needs a query in `revalidateOnChange`,
  not a hardcoded slug.
- **Three top-level nav destinations are not editable without a deploy — deliberately parked 2026-09-04.**
  `/case-studies`, `/insights` and `/contact` are bespoke route files: their `<h1>`, intro copy and SEO strings
  are literals. The other four nav destinations (`/our-story`, and both `/services` axes) are documents.
  ADR 0009 says there should be no bespoke page templates, so these are the remaining exceptions.

  **Converting them is not the small job it looks like.** Each blocks on something real:
  - `case-study-grid` caps at `limit: max 9` and `post-list` at `max: 12`; the routes bypass that by passing
    `limit={items.length}`. A block-composed listing would silently drop the 10th case study — content that
    exists and is in the sitemap but is unreachable from its own listing. P4 plans 4-6 more studies and 3-5
    more posts, so it is not hypothetical.
  - Removing the cap means unbounded listings, which means **pagination** — page state in a URL the block does
    not own. That is a feature, not a schema tweak.
  - `/contact` is worse: `ContactForm` is a curated six-field schema with HubSpot internal names verified by a
    live test submit (2026-06-22), including the `inquiry_type` select that routes the lead. The
    `hubspot-form` block renders generic `DEFAULT_FIELDS` with a hardcoded special case for the Workshop GUID
    and nothing for contact, and `NEXT_PUBLIC_HUBSPOT_CONTACT_FORM_ID` is unset. Converting would swap the
    real form for the generic one.

  **Cost of leaving it:** one deploy to reword about six lines of copy, rarely. Revisit when pagination is
  wanted for its own sake, or when the contact form's field set is being reworked anyway (which would also
  remove the Workshop hardcode in `HubspotForm.tsx`).

- **Re-link `locations-list` cards** when the locations route ships. (`industry-grid` was re-linked with
  IND-1.) **The hook and the block disagree on the name** — `revalidateOnChange` says `/consulting/<slug>`,
  the block said `/locations/<slug>`. Settle that before the route is built.

---

## P2 — Soft launch

- **K8 — broken-link + broken-image sweep. The tool shipped; run it after every content load.**
  `npm run sweep` (`tools/link-sweep`) crawls every internal link from `/`, seeded additionally from the
  sitemap so orphans are reached, at desktop and mobile. Reports dead routes with the pages linking them,
  images that never paint, placeholder or repo-internal copy in rendered text, missing `alt`, and links that
  land somewhere else. `--fail-on` turns any category into a CI gate; the default run is a report.

  **First full run — preview lane, 2026-09-09, 60 routes:**

  | Check                       | Result                                             |
  | --------------------------- | -------------------------------------------------- |
  | Routes returning 200        | **60 / 60**                                        |
  | Dead or unreachable         | **none**                                           |
  | Images that do not paint    | **none**                                           |
  | Images with no `alt`        | **none**                                           |
  | Links landing elsewhere     | **none**                                           |
  | Broken external links       | **none of 4 checked** (1 more unverifiable, below) |
  | Placeholder / internal copy | **77 findings across 23 routes**                   |

  So the mechanical half of the soft-launch bar is **met** — everything goes somewhere, and every image
  paints. The only sweep failures are copy, and they are wholly the two known content items: all **15**
  `/services/*` routes (SVC-2) and all **8** `/industries*` routes, index included (IND-1). Thirteen of the
  service routes additionally print `CONTENT_NEEDS.md`, a section sign and a roadmap id to the visitor.

  **One outbound link cannot be verified by a robot and never will be.** `facebook.com/seqtek/` answers 400
  to one user-agent and 200 to another; `linkedin.com/company/seqtek` answers 999 to a bare client and 200 to
  a browser. Both profiles are live — checked by hand 2026-09-09. The sweep sends a browser user-agent and
  files "the server refused this client" statuses under their own heading, outside the failable count.
  Neither is a defect to fix.

  **Do not gate on `placeholders` until that copy is written** — it would be red on purpose every run, and a
  gate nobody can make green gets ignored. `--fail-on=links,images,alt,redirects` is green today and worth
  wiring now.

  Recurring class to watch: Leonardo mid-post figures live only in the DB, so any post re-seed strips them
  (`tools/leonardo-images`). The sweep catches that on the next run rather than at review time.

- **CL-1 — load the drafted content.** A seeder run, not authoring: the values block onto `/our-story`, the
  testimonial re-seed, the curated photo picks (C-8, `tools/ingest-photos`), the six blog bodies, and the
  three staged Taurex studies. The `teamMembers` slice is done on preview and **not yet on production** — the seeder
  runs against `ww3` separately. Run against a gated lane with `IMPORT_TOKEN` + `IMPORT_COOKIE` (#102).
- **C-7 — Taurex sign-off.** The highest-leverage content conversation: four written studies
  become publishable, all three outstanding `pendingQuote` slots are Taurex people, and it clears the
  soft-launch "one named, signed case study" gate in one call. NovaMud stays the editorial flagship (the only
  study with metrics) but needs its own write-up and naming permission.
- **BR-5 — stats bar.** 25+ years (founded 1999) is the only sourced number. **The projects count is
  unsourceable — do not publish it**; the old Wix site ran two contradictory sets at once. "Lives touched"
  stays dropped. The current bar states the founding year twice — replace the third slot or drop to two.
  Reinstate a projects figure only if the PSA/invoicing history can produce one from a system of record.
- **COPY-1 — reconcile the tagline and the homepage hero.** They currently make different claims, and neither
  is what leadership wants carried. Write against Hank's definition instead: boutique scale as the advantage,
  Localshoring as the name for it, trust → speed → bottom line, since 1999. Settles the open hero-size
  question (DS-2) at the same time.
- **HS-1 — publish a HubSpot cookie policy for this site's hostnames** _(launch blocker, portal config only)_.
  Portal `8504846`'s three banners are attached to other hostnames and none define cookie categories, so the
  banner never renders and the footer's "Cookie preferences" / "Withdraw consent" controls are silent no-ops.
  The code side is complete (ADR 0006). Steps: `INTEGRATIONS.md` §4.1.
- **VID-1 — `/our-story` video embeds render as black boxes.** Verify they show a poster frame before anyone
  reviews the page.
- **Soft-launch sign-off.** Kenn's work-first pass → Megan's polish pass → Megan + Hank + Brent. Minimum: real
  faces and at least one named, signed case study (anonymous studies are dropped, not softened). No
  `[PLACEHOLDER]`, no lorem.

---

## P3 — Hard launch and cutover

Gated on the September All Hands shoot plus the P2 content. Leadership engages here, not during dev.

**Content and copy gate**

- Mission, vision and hero copy read in context across the homepage, `/our-story`, service and case-study heroes.
- Sequoyah acknowledgement (BR-1) — leadership reads the rendered pages, then signs off or iterates (ADR 0003).
- Faith framing — leadership decides whether and how the brand-kit faith elements surface on `/our-story`.
- Testimonial attribution (C-1) — every quoted testimonial confirmed with a named attribution.
- Leadership bios and headshots (C-3, BR-7) — each person approves their own copy and photo.
- Case-study copy (C-7) — each study has a hero image, a named testimonial and a metrics array. **Only 2 of 7
  carry a quantified outcome**; a hard number in every study was the highest-impact fix in the teardown.
- Cookie banner reviewed.
- **Sign-off captured in writing** so decisions don't get re-litigated post-launch.

**Quality gates**

- **CSP promoted from report-only to enforcing** (`src/lib/csp.ts` still defaults to `report-only`). Calendar a
  hard date — the easiest thing here to forget.
- Cross-browser / device QA — Chrome, Safari, Firefox; iOS, Android.
- **Blocking screen-reader sign-off** across the AT/browser matrix. Spec 007 shipped the automated sweep and a
  best-effort SR pass; the formal blocking pass is the residual.
- Re-take Lighthouse against CloudFront with the consent-gated third parties live, then flip the performance /
  LCP / TBT / CLS budgets from `warn` → `error`. **These numbers are sales-facing** — SEO 100 against Wix's 85,
  and mobile load 1s against 10s, were quoted to leadership, so they have to stay true through cutover. Best
  Practices is held down by the HubSpot and LinkedIn integrations: fix it here or stop quoting it.
- Live returning-visitor consent fire-matrix on the real GTM container, cross-browser.
- **Schema-drift CI guard** — fail CI if `payload migrate:create --dry-run` would produce a diff against what is
  on disk. No CI gate runs migrations at all today (P5-30). Add the "schema change → `migrate:create` before
  merge" note to `PAYLOAD_DEVELOPMENT.md`.
- **CI e2e stability** — the Playwright job races the dev-server schema push (`relation … does not exist` →
  cascade). Push once before the webServer and test process, or have the test process reuse the schema.
- **Spec 003 US7** — verify `enforceDraftWhenScheduled` is wired on every draftable collection with
  `publishedAt` and ship the integration test. The cron trigger stays deliberately deferred.

**GTM external config** (GTM-UI work, not code)

- **US1/US2 tail** — build the LinkedIn Insight Tag + Google Ads conversion tag in container `GTM-54KBJ2Z3`
  (require `ad_storage`, fire on Page View + `hubspotConsentUpdate`), deploy, run the Accept/Deny/Customize
  fire-matrix, then export → commit `infra/gtm/container.json` and confirm zero drift.
- **Deferred until their content ships** — the 8 Meta browser pixels are staged without triggers; bind each to
  its per-market path trigger when those routes exist (INTEGRATIONS §2.3).
- **Deferred** — CAPI consent enforcement at source, and `booking_complete` live emission (BOOK-1).

**Infrastructure** _(the Fargate migration is owned by the infra engineer — reconcile docs after, don't port)_

- **RDS multi-AZ flip** before public launch. Small CDK change, required for the 99.9% SLA to be achievable
  (AWS SLAs single-AZ RDS at 99.5%).
- **Production network posture** — tasks on private subnets with NAT or VPC endpoints, and production-shape
  sizing. Bundle with the multi-AZ flip into one change window. Re-derive against the current stack.
- **Force a new service deployment AFTER the Edge stack deploys.** On a fresh environment Compute comes up
  before Edge, so first-boot tasks never see the Edge-owned `cloudfront_distribution_id` SSM param and every
  invalidation silently skips. Verify after: a media delete produces an entry in
  `aws cloudfront list-invalidations`.
- **Snapshot the lane before merging** — merging is what deploys, and the container's `CMD` runs
  `payload migrate` on start. `INFRASTRUCTURE_RUNBOOK.md` §2.9.
- DNS cutover in a low-traffic window (Dom).
- Post-cutover: submit the sitemap to Search Console and verify redirects, validate CloudFront cache behavior,
  test-restore an RDS snapshot, run a full redirect crawl, watch CloudWatch and Search Console for regressions.

---

## P4 — After the cutover

Real work, none of it blocking a launch. Ordered by expected return.

- **SEC-1 — security / compliance page.** The one addition with a measured commercial gate behind it. G2
  (n=1,002): 83% of companies require a security or privacy assessment to purchase (88% enterprise), and 39%
  overall / 50% of enterprise name IT security review as their biggest source of evaluation delay. We have no
  such page.
- **INERT-1 residual — un-hide the rest of the `industries` and `locations` metadata.** `industries.seo` was
  un-hidden by IND-1, which shipped the route that reads it. Still hidden and still without a consumer:
  `industries.description`, `relevantServices` and `clientLogos` (the route renders `layout` blocks only), and
  every `locations` group. Un-hide each in the change that ships its consumer. `admin.hidden` does not touch
  REST, so the seeder still writes them.
- **Regional landing pages (4) + a careers stub.** `/tulsa-consulting`, `/okc-consulting`,
  `/northwest-arkansas-consulting`, `/kansas-city-consulting` are parked on `/localshoring`. Each wants
  market-specific copy, proof and contact (`CONTENT_NEEDS.md` §9). Careers: one "if you want to join us" page
  at most — the old Wix job listings are not coming across.
- **F-6 — AICO baseline.** `llms.txt` + `llms-full.txt` routes, `.md` alternatives for content pages,
  differentiated `robots.txt` per AI crawler, CloudFront cache rules for crawler traffic, byline and
  last-updated metadata. Spec: `ARCHITECTURE.md` §14 + `CONTENT-REQUIREMENTS.md` §8. Partly content-gated.
- **Campaign content expansion.** 3–5 supporting blog posts for the AI workshop push; a lead magnet; 4–6 more
  case studies in batches, each with real outcomes and a testimonial. The workshop and case-study pages should
  also read as self-contained campaign landing pages — a cold visitor from an ad needs full context and a clear
  CTA without the rest of the site. New posts get solicited from technical staff and written by the people who
  did the work, not generated.
- **Deeper SEO** — per-page OG images and structured data beyond the spec-004 baseline (`BreadcrumbList`
  JSON-LD; a `primaryGroup` on services if a breadcrumb ever needs one parent).
- **Portfolio-readiness polish.** A live link + screenshots in `README.md`; a note framing the engineering depth
  as deliberate; replace the `(record.layout ?? []) as never` casts in the block-rendered detail routes with a
  typed `BlockLike[]` adapter.
- **CI Actions cost.** The remaining per-run cost is the ~11-minute Playwright + axe + Lighthouse job — gate it
  behind ready-for-review PRs so draft pushes skip it. (The org Actions spending limit was hit 2026-06-16; taking the repo public resolved it, since Actions are free there.)
- **Small stuff.** Correct the `_overridesNotes` entries that have drifted from the overrides they describe —
  `undici` says `^7.28.0` where the override is `^7.29.0`, and the `ws` note still says it is "pending" on a
  PR that has landed (issue #75). The keep-or-remove question that issue also raised **is answered**: all
  five report `STALE`, but removing them takes the production tree from 1 moderate to 6, so they stay — see
  `tools/check-stale-overrides/README.md`. Also decide autoplay vs manual-only if a testimonial carousel is
  ever built.

---

## Waiting on people

Tracked in the private content repo: `CONTENT_NEEDS.md` and `WAITING_ON_PEOPLE.md`.
