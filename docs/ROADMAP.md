# SEQTEK Website — Roadmap

**Last updated:** 2026-08-31 · **Owner:** Kenn Williamson

What is still open, in priority order. Nothing else.

**Rules for this file.** When something ships it leaves — move it to [`PROJECT_HISTORY.md`](./PROJECT_HISTORY.md)
with a `P{N}-*` row in the same commit. Don't check items off in place, don't keep the reasoning for a decision
that's already made, don't restate what shipped. If it isn't listed here, it's done or it isn't happening.

**Companion docs.** [`CONTENT_NEEDS.md`](./CONTENT_NEEDS.md) is the authoritative list of what we need _from
people_ — this file tracks the _work_. [`PROJECT_HISTORY.md`](./PROJECT_HISTORY.md) is the audit trail.
[`decisions/`](./decisions/) holds the ADRs.

---

## Where things stand

**Environments** (nothing is publicly launched):

| Trigger                        | Lands on                                         | Notes                                      |
| ------------------------------ | ------------------------------------------------ | ------------------------------------------ |
| merge to `main`                | `preview.seqtek.com` — UAT, primary Fargate lane | Cognito-gated. The ONLY deployment branch. |
| merge the **release PR**       | nothing                                          | Version bump only; `deploy.yml` skips it   |
| **publish** the GitHub Release | `ww3.seqtek.com` — production, secondary lane    | Promotes the already-built image; no build |
| —                              | `seqtek.com`                                     | still the **old Wix site**                 |

**Merging to `main` does not touch production** (#110/#111, 2026-08-25). Publishing a release is the
deliberate human gate, which matters because the container runs `payload migrate` on start — under the
previous model a merge was an unattended schema change on `seqtek_prod`. `Preview` is no longer a
deployment branch. The separate staging account (`seqtek-preview.com`) was retired 2026-08-14; no
trigger deploys there. Authoritative version: `ARCHITECTURE.md` §"Promotion model".

**The build is essentially done.** Two content primitives (a block-composed `Page`, a rich-text `Post`) plus
typed metadata collections — `partners` (#99) is the reference implementation of ADR 0009 Option C. 45 blocks,
drafts + versioning, live preview, CloudFront media, a generic REST seeder that can write through the Cognito
gate (#102). Remaining engineering is IA, hardening and cutover — not features.

**The bottleneck is content throughput, not code.** Every content change is still a developer task. That is
what P1 exists to fix.

**Launch is two steps.** _Soft launch_ — go live with the content already in hand and gather real feedback.
_Hard launch_ — the polished public push, gated on the **September** All Hands photo/video shoot.
Sign-off chain for both: Kenn does a work-first pass → **Megan** does a polish pass → **Megan + Hank + Brent**
sign off → **Dom** does the domain swap (he controls the domain; the swap itself is low-effort).

**There is a date now.** Sales, leadership and engineering aligned on direction 2026-08-31 — Hank, Brent, Megan,
Kenn; quotes and timestamps in `docs/meetings/2026-08-31-hank-sales-website-alignment.md` — and set a
**go/no-go for 2026-09-14**, where the hard cutover date gets picked. What that meeting committed us to is
**P0** below, which is why this file now opens on a tier that did not exist last week: two of its items were
sitting in P4 on the assumption they were post-cutover work. The direction itself: the site's job is
**validation → warm sales support → lead capture**, in that order, for the four-to-five people who decide a
SEQTEK deal and mostly never met us. **Localshoring is the message.** Every capability claim links to proof —
case study good, attributable quote better, video best.

> **LM-1 — open question, now with a deadline: answer it at the 2026-09-14 go/no-go.** "Soft launch" has never
> been pinned to a mechanism. The DNS cutover sits on the hard-launch checklist, so a soft launch means either
> (a) ungating `ww3.seqtek.com` for a named audience, or (b) cutting DNS early and treating the hard launch as a
> content refresh. (b) pulls most of P3 forward. Kenn decides. Note the meeting only ever described **one**
> cutover followed by continuous content additions, which is (b) in everything but name.

---

## Priority at a glance

| #      | Item                                                           | Owner                  |
| ------ | -------------------------------------------------------------- | ---------------------- |
| **P0** | NAV-1 Dropdown panels + the pages under them                   | Kenn, blocked on Brent |
|        | SVC-2 Services back on a collection — blocks NAV-1             | Kenn                   |
|        | IND-1 Six industry pages                                       | Kenn + Brent           |
|        | BOOK-1 Book-a-call widget routing to Daniel                    | Kenn                   |
|        | PROOF-1 Case studies + quotes, on hard dates                   | Megan, Brent escalates |
|        | AB-1 The alternative "what we do" page, A/B against the menu   | Kenn                   |
| **P1** | Spec 011 — Payload admin UX (US1 shipped, US2–US6 open)        | Kenn                   |
|        | A-1 Megan signs in + editor training                           | Kenn                   |
|        | HYG-1 Content data hygiene                                     | Kenn                   |
|        | UI-3 Default skeletons are publishable placeholder copy        | Kenn                   |
| **P2** | K8 Broken-link + broken-image sweep                            | Kenn                   |
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

Go/no-go **2026-09-14**. Source, quotes and timestamps:
`docs/meetings/2026-08-31-hank-sales-website-alignment.md`.
Kenn named three things as gating the launch — the service pages, the industry pages and the book-a-call widget.
The rest of this tier is what has to be true around them.

- **NAV-1 — build the dropdown panels, then the pages under them.** _(Reverses the flat-nav decision recorded
  under SVC-3.)_ Brent wants the Argano-shaped "What we do" dropdown: every offering visible at a glance, no
  scrolling, no reading. His reason is not theoretical — he has heard "I didn't know you guys did that" from
  existing MSA-signed clients roughly twenty times since returning to sales. Kenn's research says a long list
  is a list rather than a story, and that a small firm asserting breadth without proof reads as a knock-off
  of the firm it is imitating; he said so, noted it is arguably a sales-messaging problem rather than a website
  one, and conceded anyway, because Brent sells better off a site he believes in. Hank's compromise is the
  actual plan: **menu now, A/B later** (AB-1).

  **No content is committed here.** Brent is supplying the groups, the items and the industry list; what was
  said in the room is recorded in the meeting note and is not a plan. Nothing in this repo should enumerate a
  service menu until his diagram arrives — build the mechanism against the routes that exist today and let the
  content land as data. Chase the diagram; it was promised 2026-08-31. **It arrived the same day** — Brent's
  email "Services", 2026-08-31 14:32, transcribed in full in `CONTENT_NEEDS.md` §12. The mechanism shipped
  against today's real routes (#129), so what is left is the data edit, and the data now exists.

  **It is nine services in three groups, not the "roughly fifteen" the meeting produced.** The email
  supersedes the transcript. With the axis page and the three group pages that is **13 pages**, and the menu
  cannot carry the leaves until the routes exist — nine header links to unbuilt routes is the #126 defect
  (cards pointing at routes nobody had built) reintroduced at the top of every page. **Sequence is SVC-2
  first, then the nav data.** Brent's grouping, verbatim:

  | Group                                | Services                                                                    |
  | ------------------------------------ | --------------------------------------------------------------------------- |
  | **Strategy and Business Consulting** | Strategy and Alignment · Business Process Consulting · Change Management    |
  | **Technology and Data**              | Enterprise Architecture · Data Engineering and Warehousing · BI & Analytics |
  | **AI & Automation**                  | Generative AI · Machine Learning · Agentic AI                               |

  **The industry list did NOT come with it.** IND-1 continues on the meeting's five plus Aerospace until
  Brent confirms; that row stays open in "Waiting on people".

  **Both top-level items get a panel.** Leadership likes dropdowns, so "What we do" and "How we work" each
  open one rather than one being a panel and the other a plain link. The panel component is generic and takes
  its content as data, so a second panel costs a data entry, not a second component.

  **Build the panel against a shape, not a layout.** Groups are the unit, and the column count falls out of how
  many groups there are rather than being a knob that can be set wrong:

  ```ts
  type NavGroup = { label: string; url?: string; items: NavItem[] }
  type NavPanel = { groups: NavGroup[] }
  ```

  Three groups of five draws three columns; one group of X draws one. Desktop is a grid of `groups.length`
  columns; mobile is one disclosure per group. **One shape, two renderers** — a fourth column later is a data
  edit, and the same data feeds both viewports so they cannot drift.

  **Three tiers of content, and only two of them are required.**
  - **Nav button — required.** One page per axis. Hank's narrative lives here. `/services` is today's, and the
    "how we work" counterpart does not exist yet. **Slugs are unsettled** and are not for us to invent: the
    labels came out of the meeting, the URLs did not.
  - **Group title — optional.** Without a URL the title is a plain heading in the panel and nothing more.
  - **Leaf — required.** The service itself, with its proof.

  **All leaves share one flat namespace, whichever axis they hang off.** A leaf reachable from both panels must
  resolve to one URL, so the namespace cannot be per-axis — the moment "how we work" gets leaves of its own
  under a second prefix, the two-URL problem is back. Whether that one namespace stays named `/services/` is a
  naming question worth asking once the axis labels are settled; what is not optional is that there is only one.

  **`NavGroup.url` being optional is the lever that de-risks this.** A group with no URL renders as a heading
  and nothing more, so the menu's structure ships without waiting on a page for every heading, and group pages
  get added later as content allows. Given PROOF-1 — we cannot fill the leaves yet, let alone a tier above them
  — expect most groups to start headless and earn a page.

  **Brent's answer overrides that for the "what we do" panel:** he asked for all three groups to be
  "a clickable page with high level content covering the area", so every group on that panel takes a URL. The
  optional-URL design still stands and still matters — it is what lets the **second** panel ("how we work")
  ship with headless groups — and no code changes, because the panel already renders a group with or without
  a URL (#129). What changes is the expectation: on this panel, three group pages are content that has to be
  written, and none of them has a draft.

  Two things that follow from the tiers:
  - **"How we work" is a new top-level page.** `/services` exists; its counterpart does not. Localshoring
    already has a route and becomes a leaf under it. Scope the new axis page with SVC-2.
  - **A group page needs a reason to exist.** If it is only a list of its own children it is a worse version of
    the menu that got you there. That is the test for whether a group takes a URL at all, and it is content, so
    it waits for Brent — but flag it early if his grouping produces headings nothing can be written about.

  **A leaf can belong to more than one group.** "What we do" is capability and outcome; "How we work" is
  delivery model and method, and the strategy, alignment and leadership work is genuinely both — a thing a
  client buys _and_ the way we open an engagement. Cross-list it rather than picking a side. Two consequences:
  - **Leaf URLs stay flat, at `/services/<leaf>`.** Nesting them under a group gives one page two URLs the
    moment anything is cross-listed — duplicate content, a split signal, and a sitemap that has to pick. Groups
    organise the menu and may own a page; they never own the leaf's URL.
  - **The relation belongs on the group, not the leaf.** A `group` field on a service assumes one parent and
    cannot express the overlap. Have the **group hold an ordered list of its items**, which also makes a group
    page an editorial object that chooses what it shows rather than a query result. If `BreadcrumbList`
    JSON-LD ever lands (P4, Deeper SEO), add a `primaryGroup` then — a breadcrumb needs one parent and nothing
    needs it today.

  **The optional URL costs a second mobile row pattern.** A `<details>`/`<summary>` disclosure was going to
  give carets, keyboard and screen-reader semantics for nothing, but a link nested inside a `<summary>` is
  ambiguous — activating it toggles the panel as well as navigating, and AT handling varies. So there are two
  rows to build: a headless group is a caret button whose label is the group name (the simple case, close to
  free), and a linked group is the group **link** plus a **separate caret button**, each with its own
  accessible name. On desktop, label each column with `aria-labelledby` pointing at its heading either way, so
  the list is announced with the group it belongs to. Hours, not days, but hand-rolled.

  **State of the code.** `SiteHeader.tsx` renders `mainNav.map(...)` and ignores `children` entirely, so
  desktop has no dropdown at all. `MobileNav.tsx` already renders one level of children as an indented tree —
  always expanded, no carets — so the mobile job is collapsing it, not building it. The `NavItem` type in
  `site-content.ts` is already recursive; what it lacks is the panel shape above. There is **no headless UI
  library in the repo** (no Radix, no Headless UI — the deps are Payload, Next, React, Tailwind, sharp), so the
  disclosure is hand-rolled: trigger with `aria-expanded` + `aria-controls`, Escape closes and returns focus to
  the trigger, click-outside closes.

  **The a11y gate is the real cost, not the CSS.** `tests/e2e/a11y.e2e.spec.ts` sweeps every in-scope route at
  **zero axe violations** and adds landmark, heading-order and "Tab advances without trapping" checks. A
  mega-menu is the most common place that suite starts failing. Two rules keep it green:
  - **Click/tap to open, never hover-only.** Argano opens on hover; hover-only fails WCAG 2.2 §1.4.13 and is
    broken on touch and hybrid laptops. Hover is fine layered on top of click.
  - **No focus trap.** It is a disclosure, not a modal.

  Also note `tests/e2e/layout.e2e.spec.ts:24` asserts all six top-level items are visible **links**. If
  "Services" becomes a button that opens a panel, that assertion changes shape.

  **Sequencing — this is not all blocked on Brent.** The component needs neither his diagram nor SVC-2. Build
  it against today's real routes, get it through the a11y gate, merge it. Then the groups and items are a data
  edit once the pages exist. Only the **pages** are blocked; splitting it that way means the risky part (a11y,
  keyboard, mobile) is done and reviewed before the content shows up.

  Hank's constraint on the shape: who-we-are and how-we-work read top-left, services sit to the right, and the
  service pages hang off "how we do it" rather than leading. Each page carries its use cases and, where they
  exist, video — a capability list without proof is exactly what loses at our size.

- **SVC-2 residual — the content, not the code.** _(The code shipped; see PROJECT_HISTORY P5-31.)_ Services and
  their groups are **one** collection now: `services` carries `tier: 'axis' | 'group' | 'leaf'`, every tier
  lives at a flat `/services/<slug>`, the four hardcoded lists are gone, and the sitemap derives all of it from
  published slugs. The group holds an ordered many-to-many `items` list, so a leaf can be cross-listed under
  two groups — or under both axes — and still resolve to one URL. `servicePillars` was absorbed and dropped.

  **The finding worth carrying forward:** absorbing tiers into one collection means **every relationship that
  points at that collection has to constrain to a tier**, or the pickers start offering nonsense. Six fields
  pointed at `services`, and without `filterOptions` each would have offered "What We Do" and "Technology &
  Data" as taggable services — the spec-011 defect class, in six places at once. One collection is only better
  than two once that is done; before it, it is worse. Any future collection merge inherits this.

  What is left is **data and copy**, which a deploy never ships:
  - **Seed Brent's nine services and three groups** (`CONTENT_NEEDS.md` §12) into the collections via
    `tools/payload-seed`. The gitignored `docs/content-drafts/services.json` still holds the OLD nine
    (the capability set) and `service-pillars.json` the old three pillars, and neither carries the `items`
    list the group tier needs. **Until that runs, `/services/<leaf>` 404s on a lane** — the code ships ahead
    of the content, as it always does here.
  - **Retarget the 20 Wix redirects** that point at `/services/ai-integration` and
    `/services/digital-transformation`. Those were Page-backed offering URLs; under Brent's structure neither
    survives as a service name, so both destinations become 404s the moment the new content lands. _(The nav
    and footer entries for the same two URLs are already gone — removed alongside the `[offering]` route that
    served them, so no code-owned chrome points at them in the meantime.)_
    **Nothing is live, so retarget at source — do not layer a second hop** (Kenn, 2026-08-31); `redirects.ts`
    line 187 already chains `/services/ai-automation` → `/services/ai-integration` and collapses to one hop
    in the same pass.
  - **Re-pick every block the migration emptied.** The SVC-2 migration is destructive in two ways a deploy
    cannot repair, both documented in its header. `service_pillars` was dropped with no backfill, so the pillar
    documents (title, slug, description, hero image, SEO, version history) are **gone** — the three groups come
    back only from the seed above. And `*_rels.service_pillars_id` was dropped across thirteen tables, which
    discards the `pillars` selection on **every `service-pillar-cards` block anywhere** — Pages, case studies,
    workshops, partners and the homepage, not only the service pages. `pillars` is `required: true,
minRows: 1`, so each of those documents is **invalid until re-picked** and will refuse to save as it
    stands. Separately, every `service-cards` block set to "By pillar" had its `pillar` NULLed on purpose (the
    old value was a `service_pillars` id, meaningless against `services`), so each needs its group chosen
    again. **After seeding the groups, sweep both block types across all six collections.**
  - **Write the missing copy** — six of nine leaves and all three group pages (`CONTENT_NEEDS.md` §12).
  - **Localshoring is settled:** one page at `/services/localshoring`, a "how we work" leaf rather than a
    top-level item. The standalone `/localshoring` is gone from the nav and the footer, and the four market
    links repoint to it. The standalone Page record retires on the next seed. No internal 301 — nothing is
    live, so the URL simply changes.

- **SVC-3 — the services IA, with the nav question now settled the other way.** Direction decided, not built;
  blocked on SVC-2. The **flat 6-item nav with no mega-menu is withdrawn** — that was Kenn's call and the
  2026-08-31 meeting reversed it. What survives is the axis analysis and the drafted copy, both of which the
  menu still needs.
  <details><summary>The measured case and what it means under a mega-menu</summary>

  The four peer offerings sit on **four different axes** — Localshoring (delivery model), Workshops (format),
  Digital Transformation (outcome), AI Integration (technology) — which is why **Data has no home** and got
  absorbed into Digital Transformation. Measured: the 4 offering pages average **327 words** against **348** for
  the nine archived service pages, so the consolidation happened **without deepening**; `/services` itself is
  **169 words**. A grouped menu fixes the axis problem by accident, provided the headings are genuinely
  parallel — a point in its favour that nobody made in the meeting, and a thing to check against Brent's
  grouping when it lands.

  **The two axes overlap on purpose, and that is the point.** "What we do" is capability and outcome; "How we
  work" is delivery model and method. Localshoring is only ever the second. Strategy, alignment and the
  leadership work are genuinely both, and Hank's own spine — people, process, delivery, wrapped in
  Localshoring — says so. **Cross-list them rather than picking a side**; the machinery for it is in NAV-1 and
  SVC-2.

  **Cross-listing means one page and two links to it. Never two pages.** ADKAR is one page whether it is
  reached from "what we do" or "how we work". Writing it twice, in two voices, to fit two headings would give
  us two URLs competing for the same term, two things to keep in sync, and a visitor who reads both and learns
  nothing the second time. That is why leaf URLs are flat (NAV-1) — the flat URL _is_ the no-duplication rule,
  expressed in routing. If a leaf seems to need two write-ups, that is a signal the **grouping** is wrong, not
  that the page should be split.

  The most that may legitimately differ between the two contexts is the **one-line blurb next to the link** in
  a panel or a group page listing. Even that should default to a single description reused everywhere; allow a
  per-group override only if someone hits a case that actually needs one, and not before.

  **We already ship the thing this rule forbids.** `docs/content-drafts/pages.json` carries two Page records
  for one subject — `localshoring` at `/localshoring` and `service-localshoring` at `/services/localshoring`,
  both titled "Localshoring", both published, near-identical in structure (hero → content → cta, the services
  one adding a comparison table). Both are in the nav: `site-content.ts` links the first under Our Story and
  the second under Services, in the header and the footer. So the second URL is not a stray, it is wired.
  **Collapse them to one page and two links as part of SVC-2**, with a 301 from whichever slug loses; it is the
  reference case for the rule and it is cheaper to fix before the cutover freezes the URL. Which one wins is a
  content call — the standalone reads as brand narrative, the services one as an offering — but there is only
  one Localshoring.

  The grouped split that was going to be explained **on** the `/services` page now has to survive **in** the
  dropdown: "What we build" (Software · Data · AI) / "How we work with you" (Localshoring · Workshops) /
  "Full capabilities". Reconcile that against Brent's headings rather than shipping both.
  **Digital Transformation stays demoted from a service door to the brand narrative** — Brent's own tagline
  change already puts transformation at the brand level.

  **The nine capability pages are already written** — `docs/content-drafts/_archive/content-batch.json`,
  ~4,000–4,800 chars each, in current voice, including Cloud & Data Engineering — so a chunk of the menu is a
  seeding job, not a writing job. Five are distinct enough for their own page (Custom Software, Application
  Modernization, Cloud & Data Engineering, ML Solutions, Process Automation); four were folded in
  (AI-Assisted Modernization → App Modernization; Fractional Product Ownership → a delivery model;
  Strategy & Roadmap Alignment → the engagement-process block; Discovery & Team Workshops → a `/workshops`
  section). **Under a grouped menu, re-check those four folds** — some map onto items Brent named, so they may
  need to come back out. Wait for his list before deciding which.

  ⚠️ **Cheaper before the DNS cutover.** Nothing has launched, so PR #79's nine internal 301s are _replaced,
  not layered_, and the Wix→new 301s get **retargeted and become more accurate** (`/technology-and-data` → the
  data page rather than digital-transformation). Seed it while it still costs one seed run.

  </details>

- **IND-1 — six industry pages.** _(Was P4, "Energy first".)_ Named in the meeting: **Healthcare, FinTech,
  Oil & Gas, Energy, Manufacturing**, plus **Aerospace**, added by Kenn 2026-08-31. **Non-profit is explicitly
  out** — Brent does not want non-profit inbound — so YouVersion stays a wanted case study and does not anchor
  an industry page.
  - **One taxonomy, decided 2026-08-31.** `docs/content-drafts/industries.json` holds five slugs built for
    tagging case studies, none of which are marketing industries — they were invented one per client, so
    "Energy / Oilfield Manufacturing" exists because Taurex does. The industry pages and `case-study-grid`'s
    `by-industry` source read the **same** collection; a second taxonomy would let them disagree in public.
    The six marketing industries become the canonical slugs and the case-study refs remap:

    | Case study     | Current slug                      | Remaps to            |
    | -------------- | --------------------------------- | -------------------- |
    | Endurance Lift | `energy-oil-and-gas-automation`   | Oil & Gas            |
    | NovaMud        | `energy-oilfield-services`        | Oil & Gas            |
    | Taurex ×3      | `energy-oilfield-manufacturing`   | Oil & Gas            |
    | WellChecked    | `energy-asset-monitoring`         | Energy               |
    | Hogan          | `talent-assessment-io-psychology` | **open** — see below |

  - **Where Hogan fits is an open question.** Its vertical is psychometrics; the nearest honest bucket is
    something like leadership development or talent, which is not one of the six and may not deserve a page.
    **Left tagged as-is** rather than forced into a marketing industry. Whatever the answer, it surfaces a
    constraint the build has to carry: **an industry that exists for tagging but should not get a page needs a
    way not to route.** Publish state is the obvious lever — `/industries/[slug]` builds from published records
    only — so a tag-only industry stays a draft. Settle Hogan before the collection is seeded to a lane.
  - **Four of the six have no proof today.** Oil & Gas and Energy carry every case study we have; Healthcare,
    FinTech, Manufacturing and Aerospace carry none. That is Risk 5 arriving early — an industry page asserting
    expertise with nothing to point at is the failure mode Hank described. Either PROOF-1 lands a study per
    industry, or the pages ship in the order the proof does. Recorded as an ask in `CONTENT_NEEDS.md` §11.
  - **Re-link the cards.** `industry-grid` cards were unlinked in #126 because `/industries/<slug>` does not
    exist; building the route is where they come back. `revalidateOnChange.ts:135-141` already builds
    invalidation paths for it, and the `seo.*` group on `industries` (INERT-1) un-hides here.
  - The measured case, unchanged: we publish **zero**; the Momentum3 competitor publishes four in its nav; Hinge
    _Inside the Buyer's Brain_ 4th ed. (n=1,914) ranks **industry / subject-matter expertise the #1 evaluation
    criterion at 36.4%**, ahead of relevant experience (32.3%) and talented staff (32.2%). Energy still has the
    most case-study proof behind it, so build it first **within** the six.

- **BOOK-1 — book-a-call widget, routing to Daniel.** Megan's evidence: of the vendors she evaluated herself,
  she met the ones that let her book instantly and never met the ones that took her details and called back.
  **Most of this already exists** — #124 turned `hubspot-meetings` and `contact-cta` into real booking buttons
  and `BookingCompleteSeam` is wired. What is missing:
  - a **real meetings URL**. The only one in the repo is the fixture `https://meetings.hubspot.com/seqtek/intro`
    (`src/payload/seed/showcase/fixtures.ts`); Daniel's live link has to come out of the HubSpot portal.
    **Still outstanding as of 2026-08-31**, so the code half of BOOK-1 is limited to repointing the footer CTA
    and placing the block; the button cannot go live until Megan supplies the link.
  - the footer's **"Book a Call" still points at `/contact`** (`site-content.ts`), an interim from before the
    block existed. Repoint it, and put the block where a visitor actually lands.
  - the inline calendar embed stays deliberately unshipped — it needs HubSpot's `MeetingsEmbedCode.js` and a CSP
    widening (`INTEGRATIONS.md` §8). **A button satisfies the ask.** Build the embed only if someone asks for
    the calendar to render in-page.
  - `booking_complete` starts emitting for real once a live URL is in place; fold it into the P3 GTM matrix
    rather than leaving it deferred.

- **PROOF-1 — case studies and attributable quotes, on hard dates.** The blocker the whole meeting circled, and
  the reason NAV-1's page count is risky: every capability claim is supposed to link to proof, and we have far
  fewer proofs than the menu will have items. Open asks have gone unanswered for months; the three Taurex studies exist because Kenn
  followed up every other day until they did. That is the pattern the protocol is built to survive.
  The agreed protocol: approach with a **specific** study and a hard date rather than "write some success
  stories"; run it as a 30-minute recorded call Megan drafts from (the method she already used with Sam on YCS);
  **CC Brent** on every ask, marked `IMPORTANT`; on the third no-reply Brent calls them. Megan owns the chase
  and Brent has explicitly backed the escalation.
  In flight: **YCS** (Sam interviewed, Megan drafting), **YouVersion** (Trevor emailed, no reply), **NovaMud**
  (needs a redo), **Hogan**. Hank's full target list adds **BOK**, **QuickTrip** and **ONEOK** — which
  reopens what `CONTENT_NEEDS.md` had closed as logo-only. Leadership thinks it can get them; if it does, they
  are the strongest proof on the list. Treat them as targets Megan chases like any other, and update
  `CONTENT_NEEDS.md` §Logos when one lands or is refused. C-7 (Taurex, via Andrew) in P2 is the same work and
  still the single highest-leverage conversation.
  **Decide at the go/no-go:** whether a named, signed case study gates the cutover. Kenn wants them and expects
  them to drag; the P2 soft-launch minimum currently says at least one.

- **AB-1 — the alternative "what we do" page.** Hank's compromise, and the reason NAV-1 does not end the
  argument: build a page that meets Brent's actual goal — a visitor understands everything we do very quickly —
  without the full list, and A/B it against the menu. **Not launch-gating.** Do it after the menu ships
  and there is traffic to test with, and settle how "understood quickly" gets measured before building it,
  because otherwise the A/B resolves to whoever argues hardest.

---

## P1 — Unblock content throughput

Content is the project bottleneck and every content change is still a developer task. This tier fixes that
before we spend more effort loading content by hand.

- **Spec 011 — Payload admin UX** _(US1 shipped, US2–US6 open)_. Make the admin panel usable by a marketing
  lead without a developer next to them.
  **US1 landed in PR #107** (PROJECT_HISTORY P5-26): every inert control withdrawn, the spec-010
  expand/contract finished by dropping the retained legacy body columns, and the dead `Navigation` /
  `SiteSettings` globals settled — site chrome is code-owned now (ADR 0010). FR-008 is recorded **NOT MET**;
  its one real finding is **INERT-1** below.
  **US2 landed in PR #118** (block picker), **US3 in PR #120** (media thumbnails, `_status` columns),
  **US4 in PR #123**: every field an editor can see now carries a written label and, where its effect is not
  visible, help text; variant-only fields hide; collapsed block rows name themselves by their content.
  INERT-1 is closed by it (see below).
  **Still open:** US5 slug-from-title with collision handling, US6 collection grouping. Tasks T052–T065.
  → `specs/011-payload-admin-ux/spec.md`
- **A-1 residual — Megan signs in, then editor training.** The multi-domain admin auth code shipped (#77,
  P5-11); what's left is a deploy, Megan's first sign-in (auto-provisions an `editor`), and a short CMS
  quickstart. Do the training **after** 011 lands so she learns the fixed panel, not the current one.
- **HYG-1 — content data hygiene.** No human input needed; see `CONTENT_NEEDS.md` §10.
  `industries` is empty while published case studies reference industry IDs (dangling refs) — seed it or drop
  the relationship; `locations` is empty (needed only if the regional pages get built); delete the
  `ztest-delete-me` category; case-study `ogImage` is null sitewide. **The empty `industries` now costs more than dangling refs:** `case-study-grid` resolves `source: by-industry` through `caseStudies.industry` (UI-2), so such a block returns zero rows and renders an empty section rather than a visible placeholder. (The missing `teamMembers.title` values were supplied 2026-08-25 and are in `docs/content-drafts/team.json`; they still need seeding to the deployed lanes.)
- **UI-3 — a new record's default skeleton is publishable placeholder copy.** `TeamMembers.layout`
  defaults to `teamMemberSkeleton`, whose body is literally `About` / _"A short professional bio."_ — and
  seven team members were created and published without anyone overwriting it, so six public
  `/team/[slug]` pages served that string. **The copy half is done** (2026-08-25): all nine published
  members now carry a real bio, and `expertise` — which `personLd` emits as `knowsAbout` — is populated
  for all nine rather than the three leadership members only. What is left is the code half, because the
  underlying flaw is the skeleton design, not the data: the same pattern exists for `caseStudy`,
  `workshop` and `partner` (_"What the client was up against, in their terms."_, etc.) and only escaped
  notice because those records had real copy written over them. A default that reads as finished prose can
  be published by accident. Decide: ship the skeletons as empty blocks, mark skeleton text so a publish
  check can catch it, or add a "still has placeholder copy" guard to the K8 sweep. Same class as UI-2 —
  developer text reaching public copy.
- **UI-2 leftover — `related-posts` printed developer text. Resolved 2026-08-27 (PR #125).** An empty
  `manualItems` used to render _"No manual items — falls back to category-derived list at render time."_ as
  public body copy, promising a fallback that was never built. The block now renders nothing when nothing is
  picked, the same as every other collection-backed block. Giving it a real resolver is still open and is
  tracked under INERT-2 below: it needs the containing document's categories, which `resolveLayout`'s
  block-only signature does not carry.
- **INERT-2 — controls whose renderer does nothing with them. Now enforced, and half fixed.** Opened by the
  spec 011 US4 variant audit (2026-08-27) and widened by the PR #123 review, which read every new description
  against its renderer. US1 audited whether a _field_ had a consumer; none of these failed that test, because
  the consumer exists and ignores the value. Three review rounds each found more of them by hand (5, then 3,
  then 3) — always by reading, never by testing, because nothing in CI checked what a block actually rendered.

  **The gate (PR #125).** `tests/int/blocks/blockOutputContract.int.spec.tsx` renders every block in
  `layoutBlocks` from its own field config and holds it to three promises: none of the developer phrases this
  repo has actually published reaches body text (a denylist no block may opt out of, not a proof that no such
  sentence exists); every control changes the rendered output; every option of a select draws something, and
  something different from its siblings. Blocks are pure synchronous components by design
  (ADR 0009), so this costs a unit test. Exceptions are declared **on the block** via
  `custom: outputContract({...})` (`src/payload/blocks/outputContract.ts`) in three named kinds —
  `resolvedUpstream` (read by `lib/resolveLayout.ts` before render), `behavioural` (read at submit time, not
  paint time), and `inert` (read by nothing: a defect, with the reason it still exists). A declaration that
  stops being true fails the gate, so the list cannot rot the way this prose one did. It found 24 defects on
  its first run, including two nobody had catalogued.

  **Fixed (PR #124, #125):**
  - `contact-cta` — the only one that was live. Nine blocks in `services.json` leave `meetingUrl` blank, and
    the panel rendered either way, publishing _"Configure a HubSpot meetings URL to embed the scheduler"_ on
    nine services pages. The panel is now optional, and when it is filled in it books the meeting through a
    button instead of printing the raw address.
  - `newsletter-cta` — was a disabled input, a disabled button and a caption naming
    `NEXT_PUBLIC_HUBSPOT_NEWSLETTER_FORM_ID`, an env var nothing in `src/` reads. Now mounts the working
    `HubspotLeadForm` with an email field; with no form GUID the section is left off the page entirely.
  - `download-card` — was the same disabled mock **plus `Asset: <fileUrl>` printed in the clear**, so the gated
    download was neither gated nor a download. Now a real form; the file arrives in the success panel.
  - `hubspot-meetings` — was a bordered box printing the raw URL and _"loads in production"_. Now a real
    booking button. The inline embed would mean shipping HubSpot's `MeetingsEmbedCode.js` and widening the CSP
    (INTEGRATIONS.md §8) for a block with no live instances; `BookingCompleteSeam` stays wired for it.
  - `related-posts` — see the UI-2 leftover above.

  **Also fixed (PR #126):**
  - `tabs` (the block) — was jump links over a stack in which no panel was ever hidden, so the name promised
    something the page did not do. It now shows one panel at a time, with the ARIA tabs keyboard pattern.
  - `video-embed.thumbnail` — was **worse than inert**: it swapped the `<iframe>` for a still and a
    non-interactive "▶ Play" span, so filling it in made the video unplayable and took `provider`, `videoId`
    and `title` down with it. The still is now a real click-to-play facade, which also keeps the third-party
    frame from loading until someone asks for it.
  - `hero.variant: 'split'` — drew the identical stacked hero as `with-image`, so the picker offered one
    layout twice under two names. It now sets the copy beside the image. **Found by the gate, not the audit.**
  - `hero.primaryCta.variant` — was declared on the `Cta` type and never destructured. All three options now
    draw distinct buttons.
  - The three phantom reads — `LocationsList` now reads `address.state` (where the field actually lives), and
    the dead `servicePillars.tagline` / `workshops.subtitle` branches are gone. The showcase locations carry a
    real state so the fixed line has somewhere to show up.
  - `industry-grid` and `locations-list` cards are **unlinked**. See IND-1 / SVC-2 in P0.

  **Withdrawn from the schema (PR #127, migration `20260827_232537_inert2_drop_dead_controls`):** the controls
  that could not be made to work are no longer offered at all.
  - `logo-bar.source` — the "reuse the homepage set" option mapped to an empty list, and there was nothing to
    reuse: the `homepage` global carries only `layout`, no logo set. With that gone one option remained, so the
    whole select went and the picked logos are the only source.
  - `mission-vision-values.layout: 'tabs'` — branched nowhere; it rendered exactly like "grid". A tabbed
    treatment of seven values was not worth building.
  - `featured-testimonials.autoplay` (no carousel), `hubspot-form.submitRedirect` (the form shows an inline
    success panel and never navigates), `posts.relatedPosts` (a "Read next" picker no route read; every
    instance in the drafts was `[]`), `media.caption` (blocks draw their own).

  **`servicePillars.order` was on that list and was deliberately left in place.** It is already `admin.hidden`,
  so no editor is being promised anything, and `docs/content-drafts/service-pillars.json` carries real values in
  it. Dropping it would also mean rewriting `listServicePillars`, whose `sort: 'order'` is its only reader — and
  that function has no callers, so the honest cleanup there is to delete the function, not the field.

  **Still open:**
  - `services.icon` and `process-steps.steps.icon` — read, but there is no icon set behind them:
    `ServiceCards.tsx:36` and `ProcessSteps.tsx:29` print the raw string on the page. Not gate-visible: the
    string does reach the output, it just reaches it as a string.
  - `related-posts` still has no resolver. Dropping `posts.relatedPosts` removed the simplest possible source
    for one, so a resolver now has to derive the list from the containing document's categories — which needs
    the `resolveLayout` signature change that was out of scope here.

  **Not gate-visible, worth knowing:** the gate covers block controls, not collection fields, so it could not
  have failed on the three phantom reads. It does build its related documents from the real collection configs,
  so it will never paper over one either. `service-pillar-cards` is now title-only, which is thin — the
  collection's one-liner is richText `description`; giving the card a real subtitle would be a schema addition,
  not a removal.

  Sequencing and the remaining fixes are in `docs/planning/block-output-contract.md`.

  **Worth a sweep**: this list came from auditing the ~120 descriptions one PR happened to touch, and the gate
  only covers `layoutBlocks`. Nothing has checked the collections' own fields the same way.

- **IND-1 / SVC-2 leftover — two blocks linked to routes that do not exist. Cards unlinked 2026-08-27
  (PR #126).** `industry-grid` linked each card to `/industries/<slug>` and `locations-list` to
  `/locations/<slug>`; neither route is built, so every card was a 404 wherever those blocks were published.
  Both now render as plain cards. **Re-link them when IND-1 / SVC-2 ship the detail routes.** The cards are
  one call site; `src/payload/hooks/revalidateOnChange.ts:135-141` is the other, and it already builds
  invalidation paths for those unbuilt routes. Note the two disagree on the name — the hook says
  `/consulting/<slug>` where the block said `/locations/<slug>` — so settle that before either route is built. (The two phantom field reads found alongside this
  are fixed; see INERT-2 above.)
- **UI-1 / UI-2 — both resolved 2026-08-25 (P5-27, P5-28).** Team cards render `title`, not the
  descriptive `role`. The four collection-backed blocks (`team-grid`, `post-list`, `case-study-grid`,
  `service-cards`) now resolve their `source`/`filter` in `src/lib/resolveLayout.ts` instead of printing
  `(resolves at template time)` as public body copy; the unbacked `featured` option was withdrawn.
  Nine of nine published team members now carry a job title. Chad Coleman is retired via the seeder's new
  `status: "unpublished"` (P5-29) — re-seed `team.json` against a lane and he drops off `/team` there too.
  The five listing pages no longer double-container their grid, so the page `h1` and the card grid share
  one left edge and one column width (was 32px out at desktop, 16px at mobile).

---

## P2 — Soft launch

- **K8 — broken-link + broken-image sweep.** Kenn's stated **number-one** soft-launch requirement ("everything
  has to go somewhere"). Crawl every route at both viewports for dead links and non-painting images, then
  re-run after each content load. Individual fixes have shipped (#84 site chrome, #90 the assessment redirect,
  #105 nine 301s that landed on 404s) but the sweep itself has never been run end-to-end. Note the recurring
  class: Leonardo mid-post figures live only in the DB, so any post re-seed strips them — see `tools/leonardo-images`.
- **CL-1 — load the drafted content.** All of this is written and waiting; it is a seeder run, not authoring:
  the values block onto `/our-story` (BR-4 — Hank signed off 2026-06-19), testimonial re-seed with the
  attribution we already hold (C-1), the curated photo picks via `tools/ingest-photos` (C-8), the six blog
  bodies (C-6), and the three staged Taurex studies.
  **The `teamMembers` slice is DONE on preview (2026-08-26):** all nine published members carry a job title, a
  real bio and `expertise` (which `personLd` emits as `knowsAbout`), and Chad Coleman is retired via the new
  `status: "unpublished"`. Verified on the lane — `/team` renders nine titled cards, `/team/chad-coleman` 404s,
  no placeholder copy anywhere, `h1` and grid share one x. **Not yet on production** — that moves on the next
  published release, and the seeder must be re-run against `ww3` separately. Run `npm run payload:seed` against the gated environment
  with `IMPORT_TOKEN` + `IMPORT_COOKIE` (#102). Load order and known defects: `docs/content-drafts/README.md`.
- **C-7 — Taurex sign-off (via Andrew).** The single highest-leverage content conversation: four written
  studies become publishable, all three outstanding `pendingQuote` slots are Taurex people, and it clears the
  soft-launch "one named, signed case study" gate in one call. **NovaMud** stays the editorial flagship (the
  only study with metrics) but needs its own write-up + naming permission. **The ONEOK / QuickTrip exclusion in
  `CONTENT_NEEDS.md` is superseded 2026-08-31** — Hank named both as case-study targets, so they are back on
  Megan's list. Details and the rest of the target set: `CONTENT_NEEDS.md`.
- **BR-5 — stats bar.** **25+ years (founded 1999) is the only sourced number.** The projects count is
  **unsourceable — do not publish it**: the old Wix site ran two contradictory sets at once (homepage
  20+/411+/8,221+; About 25+/500+/10,000+), so the earlier "500+" resolution picked the rounder pair rather
  than counting anything. "Lives touched" stays dropped. The current bar (25+ years / 4 markets / 1999) states
  the founding year twice — replace the third slot or drop to two stats. Reinstate a projects figure **only**
  if the PSA/invoicing history can produce one from a system of record.
- **COPY-1 — reconcile the tagline and the homepage hero.** Brent's tagline change ("Delivering Successful
  Software since 1999" → "Delivering Transformative Technologies since 1999") and the homepage hero
  ("Technology that fits how you work") currently make different claims. Settles the long-open hero-size
  question (DS-2) at the same time. **Direction from 2026-08-31:** neither line is what leadership wants
  carried. Hank's message is boutique scale as the advantage, Localshoring as the name for it, and
  trust → speed → bottom line, since 1999. His definition is the copy: a single person building a quality
  relationship and continually delivering to prove it — trust builds speed, speed adds to your bottom line,
  since 1999. Write against that rather than picking between the two lines we have.
- **HS-1 — publish a HubSpot cookie policy for this site's hostnames** _(launch blocker, portal config only)_.
  Audited 2026-07-29: portal `8504846` has three enabled banners attached to `blog.seqtek.com`,
  `info.seqtek.com` and the **old Wix** `www.seqtek.com`, and **none** define cookie categories. Nothing
  matches this site's hostnames, so HubSpot's banner never renders and the footer "Cookie preferences" /
  "Withdraw consent" controls are silent no-ops. The code side is complete (ADR 0006). Steps + the audited
  table: `INTEGRATIONS.md` §4.1.
- **VID-1 — `/our-story` video embeds.** The founder/brand cuts render as large empty dark blocks in a fresh
  page capture. Verify they show a poster frame, not a black box, before anyone reviews the page.
- **Soft-launch sign-off.** Kenn's work-first pass → Megan's polish pass → Megan + Hank + Brent.
  Relational-branding minimum: real faces + at least one named, signed case study (anonymous studies are
  dropped, not softened). No `[PLACEHOLDER]`, no lorem. **The case-study half of that minimum is the one
  open question at the 2026-09-14 go/no-go** — see PROOF-1.

---

## P3 — Hard launch and cutover

Gated on the **September** All Hands shoot plus the P2 content. Leadership engages here, not during dev.

**Content and copy gate**

- Mission, vision and hero copy read in context across the homepage, `/our-story`, service and case-study heroes.
- Sequoyah acknowledgement (BR-1) — leadership reads the rendered homepage trust block, the `/our-story`
  narrative and the cultural-acknowledgement line, then signs off or iterates (copy in ADR 0003).
- Faith framing — leadership decides whether and how the brand-kit faith elements ("biblical principles",
  "grace and trust") surface on `/our-story` (flagged in `VALUES_REWRITE.md`).
- Testimonial attribution (C-1) — every quoted testimonial confirmed with a named attribution.
- Leadership bios and headshots (C-3, BR-7) — each person approves their own copy and photo.
- Case-study copy (C-7) — each of the 7 studies has a hero image, a named client testimonial and a metrics
  array. **Only 2 of 7 carry a quantified outcome today**; the competitor teardown ranked "a hard number in
  every study" the single highest-impact fix.
- Cookie banner reviewed (the canonical Cheyenne address and Terms of Service shipped in #105).
- **Sign-off captured in writing** — Google Doc, signed email or equivalent, so decisions don't get
  re-litigated post-launch.

**Quality gates**

- **CSP promoted from report-only to enforcing** (`src/lib/csp.ts` still defaults to `report-only`).
  Calendar a hard date — this is the easiest thing on the list to forget.
- Cross-browser / device QA — Chrome, Safari, Firefox; iOS, Android.
- **Blocking screen-reader sign-off** across the AT/browser matrix (spec 007 shipped the automated WCAG 2.2 A/AA
  sweep and a best-effort SR pass; the formal blocking pass is the residual).
- Re-take Lighthouse against CloudFront with the consent-gated third parties live, then flip the
  `performance` / LCP / TBT / CLS budgets from `warn` → `error`. **These numbers are now sales-facing** —
  SEO 100 against the Wix site's 85, and mobile load 1s against 10s, were both quoted to leadership on
  2026-08-31, so they have to stay true through cutover. **Best Practices is the one held down by the HubSpot
  and LinkedIn integrations**; Kenn has said it is fixable and it has never been picked up. Fix it here or
  stop quoting it.
- Live returning-visitor consent fire-matrix on the real GTM container, cross-browser (the E2E half shipped in
  spec 006).
- **Schema-drift CI guard** _(now also: no CI gate runs migrations at all — P5-30)_ — fail CI if `payload migrate:create --dry-run` would produce a diff against what's
  on disk. Systemic fix for the desync that forced the P2-6 migration collapse; add the one-line
  "schema change → `migrate:create` before merge" note to `PAYLOAD_DEVELOPMENT.md`.
- **CI e2e stability under the spec-010 schema** — the Playwright job still races the dev-server schema push
  (`relation … does not exist` → cascade). Push once before the webServer + test process, or have the test
  process reuse the dev server's schema.
- **Spec 003 US7** — verify `enforceDraftWhenScheduled` is wired on every draftable collection with
  `publishedAt` and ship the integration test. The cron trigger (`/api/cron/publish-scheduled`) stays
  deliberately deferred; only the Payload-side invariant is needed.

**GTM external config** (GTM-UI work, not code — the in-repo track shipped as P5-2)

- **US1/US2 tail** — build the LinkedIn Insight Tag + Google Ads conversion tag in container `GTM-54KBJ2Z3`
  (require `ad_storage`, fire on Page View + `hubspotConsentUpdate`), deploy, run the Accept/Deny/Customize
  fire-matrix (SC-001/002/003/007), then export → commit `infra/gtm/container.json` and confirm zero drift.
- **Deferred, unblock when their content ships** — the 8 Meta browser pixels are staged without triggers; bind
  each to its per-market `/…casestudyworkshop` path trigger when those routes exist (INTEGRATIONS §2.3).
- **Deferred** — CAPI consent enforcement at source (Megan/Domanick confirm whether server-side CAPI continues
  after cutover; off-site, not an in-repo path), and `booking_complete` live emission (the `BookingCompleteSeam`
  listener lights up when the real HubSpot Meetings embed replaces the placeholder).

**Infrastructure** _(the Fargate migration is owned by the infra engineer — reconcile docs after, don't port)_

- **RDS multi-AZ flip** before public launch. Small CDK property change, required for the SC-010 99.9% SLA to be
  mathematically achievable (AWS SLAs single-AZ RDS at 99.5% only). Deferred from spec 002 to keep pre-launch
  cost down.
- **Production network posture** — tasks on private subnets with NAT or VPC endpoints, and restore
  production-shape sizing. Bundle with the multi-AZ flip into one change window. _(The spec-002 wording for this
  item predates the EC2→Fargate move; re-derive it against the current stack.)_
- **Force a new service deployment AFTER the Edge stack deploys.** On a fresh environment Compute comes up
  before Edge exists, so first-boot tasks never see the Edge-owned `cloudfront_distribution_id` SSM param and
  every CloudFront invalidation silently skips — the exact dormancy found on staging (spec 009 / PR #44).
  Verify after: a media delete produces an entry in `aws cloudfront list-invalidations`.
- ~~**Spec-010 composer run after `payload migrate`**~~ — **removed: spec 011 dropped the legacy body
  columns**, so there is nothing left to compose from and the composers' CLI entry points are gone. What
  replaces it is the pre-migration gate in `INFRASTRUCTURE_RUNBOOK.md` §2.9: snapshot the lane, then run
  take an RDS snapshot of that lane **before merging** — merging is what deploys, and the container's `CMD` runs
  `payload migrate` on start.
- DNS cutover in a low-traffic window (Dom).
- Post-cutover: submit the sitemap to Search Console and verify redirects, validate CloudFront cache behavior,
  test-restore an RDS snapshot, run a full redirect crawl (Screaming Frog or similar), watch CloudWatch +
  Search Console for errors and regressions.

---

## P4 — After the cutover

Real work, none of it blocking a launch. Ordered by expected return.

- **SEC-1 — security / compliance page.** The one addition with a _measured_ commercial gate behind it. G2
  (n=1,002): **83% of companies require a security or privacy assessment** to purchase (75% SMB, 82% mid-market,
  **88% enterprise**), and **39% overall / 50% of enterprise** buyers name IT security review as their single
  biggest source of evaluation delay. We have no such page.
- **INERT-1 — admin fields on unrouted collections have no consumer.** _(Partly closed by SVC-2: `services`
  is routed now and its `seo` group un-hidden, and `servicePillars` no longer exists — its fields went with the
  collection. What remains is `industries` and `locations`.)_ Originally 24 fields on four collections: Found by audit during spec 011. `industries`, `locations`, `servicePillars` and `services` have no detail route, so nothing calls
  `buildMetadata` with their `seo` group and nothing renders their longer prose. An editor can fill any of
  these in and publish to no effect:
  - `industries` — `description`, `relevantServices`, `clientLogos`, `seo.*` (would be consumed by **IND-1**)
  - `locations` — `description`, `hasOffice`, `address.*`, `seo.*` (by the four market pages, `CONTENT_NEEDS` §9)
  - `servicePillars` — `description`, `heroImage`, `seo.*` (by **SVC-2**)
  - `services` — `seo.*` (by **SVC-2**)

  They were left in place rather than deleted: they are metadata sitting _ahead of_ routes the roadmap intends
  to build, so deleting them today means re-adding them later. **Closed 2026-08-27 by spec 011 US4 (PR #123)**:
  all 24 are `admin.hidden`, so the columns survive for SVC-2 and IND-1 to consume while the controls are gone
  from the panel. `admin.hidden` does not touch REST, so `tools/payload-seed` and `docs/content-drafts/*.json`
  still write them. Un-hide each group in the same change that ships the route reading it.

- **Regional landing pages (4) + a careers stub.** `/tulsa-consulting`, `/okc-consulting`,
  `/northwest-arkansas-consulting`, `/kansas-city-consulting` are all currently parked on `/localshoring`, and
  `/careers` was removed from the nav. The four regional pages were a deliberate local-SEO play and
  multi-market positioning is core to the brand. Each wants market-specific copy, proof and contact.
  See `CONTENT_NEEDS.md` §9. **Careers, decided 2026-08-31:** one "if you want to join us" page at most. The
  old Wix job listings were unnavigable SEO filler — on the sitemap, reachable from nothing — and are not
  coming across.
- **F-6 — AICO baseline.** `llms.txt` + `llms-full.txt` routes, `.md` alternatives for content pages,
  differentiated `robots.txt` per AI crawler, CloudFront cache rules tuned for crawler traffic, byline +
  last-updated metadata on Insights and Case Studies. Spec in `ARCHITECTURE.md` §14 + `CONTENT-REQUIREMENTS.md`
  §8. Partly content-gated — the `llms-full` body needs published page content.
- **Campaign content expansion.** 3–5 supporting blog posts for the AI workshop push; a lead magnet
  (one-pager, assessment or framework brief); 4–6 more case studies in batches, each with real outcomes and a
  testimonial. **Megan's ask (2026-06-24):** the workshop and case-study pages should also read as
  self-contained **LinkedIn / email / direct campaign landing pages** — a cold visitor arriving from an ad
  needs full context and a clear CTA without the rest of the site. The Touchstone page is already close.
  **Sourcing, decided 2026-08-31:** the ~300 old Wix posts are not carried over — they are generic and
  repetitive. New posts get solicited from technical staff and written by the people who did the work.
  Explicitly not a non-technical writer generating technical content with AI.
- **Deeper SEO** — per-page OG images and structured data beyond the spec-004 baseline
  (`Organization` / `Article` / `BreadcrumbList` JSON-LD, dynamic sitemap, metadata helper with OG defaults).
- **Portfolio-readiness polish.** A live link + screenshots in `README.md`; a one-line note framing the
  engineering depth (invariant tests, full AWS infra, the block engine) as deliberate rather than gold-plating;
  replace the `(record.layout ?? []) as never` casts in the block-rendered detail routes with a typed
  `BlockLike[]` adapter (#66 review follow-up).
- **CI Actions cost.** The `push`+`pull_request` double-run is fixed (#69); the remaining per-run cost is the
  ~11-minute Playwright + axe + Lighthouse job — gate it behind ready-for-review PRs so draft pushes skip it.
  The org Actions spending limit was hit 2026-06-16: someone needs to raise it, or take the repo public
  (Actions are free there).
- **Small stuff.** Backfill the `ws` / `happy-dom` `_overridesNotes` entries now that those overrides are on
  main (issue #75 tracks the stale ones); decide autoplay vs manual-only _if_ a testimonial carousel is ever
  built (`FeaturedTestimonials` ships a static stack-grid today).
  - ~~**T-1** — hash-based media reuse in `tools/import-case-study`~~ **closed as moot (spec 011).** The tool
    was superseded by the generic `payload-seed` CLI (P5-15) and had no npm script and no callers; case studies
    load from `docs/content-drafts/case-studies.json` like every other type. Spec 011's field removals left it
    writing only dropped columns, so it was deleted rather than repaired.

---

## Waiting on people

`CONTENT_NEEDS.md` is the authoritative list — hand _that_ to Hank, Justin and Megan, not this file. Summary of
what's outstanding and who owns it:

| Item                            | Owner        | State                                                                                                                                                                                                                                                                        |
| ------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-3 Hank + Brent interview copy | Kenn         | **Filmed and in edit** — extraction from the transcript, not a scheduling gate. Covers the 1999→now timeline, the localshoring definition, "Why Touchstone", Brent's bio and his copy for the two non-Touchstone workshops. Draft off the raw audio; don't wait for the cut. |
| BR-7 / C-2 Photo shoot          | Kenn         | Studio headshots exist and are catalogued. Still to shoot at the **September** All Hands: group leadership, full team, Kenn's headshot.                                                                                                                                      |
| C-9 Video delivery + placement  | Kenn + Megan | The localshoring explainer and the Hank + Brent partner videos are filmed and in edit. Take delivery, upload to the SEQTEK channel, place as `video-embed` blocks. Megan's bio video is her call — script one for her or omit it.                                            |
| C-5 Client logo permissions     | Megan + Kenn | Keep: Hogan, BOK, QuickTrip. Drop or refresh: GE, AVB, Change Health. Verify we ever worked with ONEOK / ONE Gas. Well Checked is a logo/permission item, not a case study.                                                                                                  |
| C-7 Case-study sign-offs        | Kenn + Megan | Taurex (Andrew) first — see P2. Then Hogan (Ryan) and NovaMud (Sam).                                                                                                                                                                                                         |
| BR-5 A sourced projects count   | Leadership   | Or we ship years + markets only — see P2.                                                                                                                                                                                                                                    |
| BR-6 Cherokee Nation outreach   | —            | **Decided 2026-06-19: no outreach.** Listed only because it keeps getting re-asked. Revisit only if the Nation asks.                                                                                                                                                         |
| Services menu                   | Brent        | **DELIVERED 2026-08-31 14:32** — nine services in three groups, not ~15. Transcribed in `CONTENT_NEEDS.md` §12. No longer blocking; SVC-2 is.                                                                                                                                |
| Industry list                   | Brent        | **Still outstanding.** It did not come with the services email. IND-1 runs on the meeting's five plus Aerospace until he confirms.                                                                                                                                           |
| PROOF-1 case-study chase        | Megan        | Brent escalates. YCS drafting, YouVersion unanswered, NovaMud needs a redo, Hogan open. Protocol and named targets in P0.                                                                                                                                                    |
| 2026-09-14 go/no-go invite      | Megan        | Add Dana and Trevor.                                                                                                                                                                                                                                                         |
| Daniel's HubSpot meetings link  | Megan        | For BOOK-1. Portal config, not code.                                                                                                                                                                                                                                         |
| HS-1 HubSpot portal config      | Megan        | See P2.                                                                                                                                                                                                                                                                      |
| Written leadership sign-off     | Leadership   | See P3.                                                                                                                                                                                                                                                                      |

---

## Risks

1. **Content production lag.** Engineering can build against placeholders; launch cannot. This has been the
   bottleneck for the whole project. The mitigation is P1 — make content changes stop requiring a developer.
2. **CSP report-only drifts past launch.** Easy to leave running and never enforce. Set a hard date.
3. **Schema drift between code and migrations.** Caused the staging 500s on #13/#14/#15 and forced the P2-6
   migration collapse. Until the CI guard in P3 ships, "added a collection or field → ran `migrate:create`" is
   a merge-to-main checklist line.
4. **Bleeding-edge stack.** Next 16 + React 19 + Payload 3.84+ on Postgres 18.3. Validated end-to-end. If a
   future minor bump breaks the combo, **downgrade Next first** — not Payload; that's the constraint.
   Tailwind v4 was evaluated and rejected (ADR 0001).
5. **More capability claims than proofs — now countable.** Brent's list is **nine services**; PROOF-1 holds
   three Taurex studies and one in draft, all in oil and gas. So the menu asserts nine capabilities against
   four proofs concentrated in one industry, and six of the nine leaves have no usable copy either
   (`CONTENT_NEEDS.md` §12). Hank's own argument for the menu was that a services list without use cases
   loses at our size — so the menu shipping ahead of the case studies is the failure mode both he and Kenn
   described, arrived at by agreeing with each other. Either the proof lands first, or the menu ships with the
   pages that have proof and grows. **This is the single largest gap between what is decided and what can
   actually be published**, and it is a people problem, not an engineering one.
6. **One AWS account runs both lanes.** `preview.seqtek.com` and `ww3.seqtek.com` are two services in the same
   stack in the same account, and the separate staging account is gone. There is no isolated environment left
   to rehearse a destructive change in.
