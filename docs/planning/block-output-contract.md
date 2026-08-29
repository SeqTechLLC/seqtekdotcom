# Block output contract — plan

**Written** 2026-08-27, after PR #123 (spec 011 US4).

> **Read everything below this banner in the past tense.** It is the plan as written on 2026-08-27, kept as
> the record of what was decided and why. Every lane has since shipped, so its present-tense descriptions of
> defects ("`LogoBar.tsx:27` maps it to an empty list", "`tabs` and `grid` are the same path", the Lane E
> "drop these" checklist) describe the code as it _was_. The code sample in **The gate** is likewise the
> proposal, not the shipped API. For current state read `docs/ROADMAP.md` INERT-2, which is the source of
> truth; for the contract itself read `src/payload/blocks/outputContract.ts`.

**Status: complete.** PR #124 (the live `contact-cta` fix) → #125 (Lane A, the gate, plus all of Lane B and
Lane D step 1 — the gate's first assertion bans placeholder copy with no allowlist, so it could not land green
until every block publishing placeholder text was fixed) → #126 (Lanes C and D) → #127 (Lane E, the
migration).

The gate found **24** defects on its first run, including two the hand audit missed:
`hero.variant: 'split'` renders identically to `with-image`, and the `video-embed` thumbnail branch takes
`provider`, `videoId` and `title` down with the player. Every remaining defect is now declared `inert` on
its own block and will fail the gate the moment someone fixes it without deleting the declaration.

Two design changes against what is written below, both made while implementing it:

- The gate tests by **difference** (change one control, the HTML must move) rather than by looking for a
  sentinel string. A sentinel cannot see `limit` — a cap that is never printed — or a value that only
  reaches an attribute; difference sees both.
- Exceptions come in **three** named kinds, not one. `resolvedUpstream` and `behavioural` are correct by
  design and `inert` is a defect; collapsing them into one allowlist would have meant calling
  `case-study-grid.source` broken, which it is not.

This is a hand-authored plan, not a speckit spec. Everything in it was verified
against the code at `d04f540`; every claim below cites the file and line it came
from, so a fresh agent can re-check rather than trust it.

---

## The problem

PR #123 wrote a plain-language description for every field in the Payload admin.
Writing "this field does X" means checking that the renderer actually does X —
and doing that turned up a class of defect nobody had catalogued: **controls the
renderer reads and ignores, options that render nothing, and blocks that publish
developer placeholder text on a real page.**

Three review rounds each found more of them by hand (5, then 3, then 3). They
kept being found by reading rather than by testing, because nothing in CI checks
what a block actually renders. That is what this work fixes: **make the defects
fail a test instead of waiting to be noticed.**

The full inventory is `docs/ROADMAP.md` → **INERT-2**. This plan turns that prose
list into an enforced one and fixes what it names.

---

## Do this first: one defect is live on the site

Everything else in INERT-2 is latent — the affected blocks are not used in any
real content. **One is not.**

`contact-cta` appears **nine times in `docs/content-drafts/services.json`**, none
of them with a `meetingUrl`. `src/components/sections/ContactCta.tsx:55-60`
renders the panel unconditionally, so the blank branch publishes:

> **Alternative** — Configure a HubSpot meetings URL to embed the scheduler.

on all nine services pages. That is developer copy on live marketing pages.

**Fix:** render nothing when `meetingUrl` is absent. One conditional. It belongs
at the front of Lane B and could ship on its own inside the hour.

Checked and NOT live (the defect exists, the content does not trigger it):

- `video-embed` — 6 instances across `pages.json` / `workshops.json`, none set
  `thumbnail`, so the player-killing branch never fires.
- `mission-vision-values` — 1 instance, `layout: 'grid'`, so the inert `tabs`
  option is not selected.
- `newsletter-cta`, `download-card`, `related-posts`, `hubspot-meetings`,
  `tabs`, `logo-bar`, `industry-grid`, `locations-list` — zero instances in
  `docs/content-drafts/*.json`. These are picker hygiene, not live bugs.

---

## What already works (do not rebuild it)

`hubspot-form` is **not** broken, and this matters for scoping. Its renderer
(`src/components/sections/HubspotForm.tsx:36-55`) mounts a real
`HubspotLeadForm` / `WorkshopInquiryForm`, backed by a real submit path in
`src/lib/hubspot/submit.ts` (`submitHubspotForm`, `isHubspotLive`,
`form_submission_*` dataLayer events).

So `newsletter-cta` and `download-card` are not "HubSpot integration that was
never built" — they are two blocks that never got pointed at the component that
already works. The fix is reuse, not new integration. `HubspotLeadForm` takes
`{ formId, fields, submitLabel, successHeading, successBody }`.

---

## The gate

One table-driven integration spec over `layoutBlocks`, rendering each block with
React Testing Library. The pattern already exists in
`tests/int/blocks/blockReuseAcrossTypes.int.spec.tsx`, and blocks are pure
synchronous presentational components by design (ADR 0009), so this is cheap.

Three assertions per block:

1. **No placeholder text reaches output.** Banned substrings in the rendered
   HTML: `loads in production`, `No manual items`, `Configure a HubSpot`,
   `resolves at template time`, `placeholder`, `TODO`. **No allowlist** — this
   one is absolute.
2. **Every scalar field reaches output.** Set each `text` / `number` / `select`
   field to a sentinel and assert it appears somewhere in the render.
3. **Every select option changes output.** Render the block once per option and
   assert the HTML differs between them.

(2) and (3) fail today for known-inert controls, so each block declares its own
exceptions. Put the declaration **on the block**, not in a shared file:

```ts
// src/payload/blocks/layout/FeaturedTestimonials.ts
// NOTE: this was the proposal. What shipped is `custom: outputContract({ ... })`
// (see `src/payload/blocks/outputContract.ts`), with three named exception
// kinds rather than one — `inert`, `behavioural` and `resolvedUpstream`. Both
// fields named below have since been withdrawn from the schema entirely.
custom: {
  inert: {
    fields: ['autoplay'],           // read by nothing
    options: { layout: ['tabs'] },  // renders identically to another option
    why: 'carousel not shipped — ROADMAP INERT-2',
  },
},
```

`custom` is Payload's server-only extension point (`Block['custom']`), so it
never reaches the client bundle or the schema. Two reasons for per-block over a
central list: a lane deletes only its own block's declaration, so **the parallel
lanes never touch the same file**; and the failure message points at the block.

The gate must also fail on a **stale** declaration — a field declared inert that
now reaches the output. Otherwise the allowlist rots the way the ROADMAP list
did.

Seed values come from `src/payload/seed/showcase/fixtures.ts`, which already
builds 1–2 of every block.

---

## Lanes

**Lane A must merge before B–E start.** It creates the `custom.inert`
declarations on ~12 blocks, and every other lane deletes from them. A is small —
one spec plus declarations, no renderer changes — so this is a short
serialization, not a bottleneck.

After A merges, **B, C and D run in parallel**. They own disjoint files.

**Lane E runs alone, last.** It is the only schema-bearing lane, and
`payload migrate:create` generates from the whole schema diff in one pass — two
lanes generating migrations concurrently produce garbage. (This is why spec
011's "five migrations" plan was retracted; see `specs/011-payload-admin-ux/tasks.md`.)

### Lane A — the gate

- New: `tests/int/blocks/blockOutputContract.int.spec.tsx`
- Edits: `custom.inert` on the affected block configs
- Lands **red-to-green by declaration**: the first commit declares reality, so it
  merges green while documenting exactly how much is broken.

### Lane B — the placeholder blocks (highest value)

Owns `src/components/sections/{ContactCta,NewsletterCta,DownloadCard,HubspotMeetings}.tsx`
and those four block configs.

1. **`ContactCta.tsx:55-60`** — the live defect above. Render nothing when
   `meetingUrl` is blank.
2. **`NewsletterCta.tsx:11,35-41`** — disabled input, disabled button, and a
   caption naming `NEXT_PUBLIC_HUBSPOT_NEWSLETTER_FORM_ID` (an env var nothing
   in `src/` reads). Replace with `HubspotLeadForm` and one email field.
3. **`DownloadCard.tsx:40-58`** — same disabled mock, **plus it prints
   `Asset: <fileUrl>` in the clear**, so the gated download is neither gated nor
   a download. Wire to `HubspotLeadForm`; deliver the file on success; never
   render `fileUrl`.
4. **`HubspotMeetings.tsx:16-27`** — a bordered box printing the raw URL and
   "loads in production". Either embed the real Meetings script or drop the
   block. `BookingCompleteSeam` is already wired for the former.

### Lane C — interaction blocks

Owns `src/components/sections/{Tabs,MissionVisionValues,VideoEmbed,Hero}.tsx`
and those configs.

1. **`Tabs.tsx:31-38`** — the block is called tabs and renders jump links over a
   stack where every panel is visible. Build the tabs or rename the block.
2. **`MissionVisionValues.tsx:25`** — branches only on `stacked`; `tabs` and
   `grid` are the same path.
3. **`VideoEmbed.tsx:34-47`** — a thumbnail **replaces** the `<iframe>` with a
   still and a non-interactive `<span>▶ Play</span>`. Make it a real click-to-play
   poster, or drop the field.
4. **`Hero.tsx:5,99-106`** — `primaryCta.variant` is declared on the `Cta` type,
   never destructured; the button is hardcoded `bg-accent-strong text-white`.
   Honour the three variants or remove the control (removal is Lane E).

### Lane D — collection-backed blocks and dead links

Owns `src/components/sections/{RelatedPosts,LogoBar,IndustryGrid,LocationsList,ServicePillarCards,WorkshopList}.tsx`
and `src/lib/resolveLayout.ts`.

1. **`RelatedPosts.tsx:20-31`** — the one collection-backed block PR #117 did not
   give a resolver, so an empty pick prints "No manual items — falls back to
   category-derived list at render time." Either add a resolver (it needs the
   containing document's categories, which `resolveLayout`'s block-only
   signature does not carry — that signature change is the real work) or drop
   the placeholder branch.
2. **`LogoBar.tsx:27`** — `source: 'from-homepage'` maps to an empty list, so the
   block publishes an empty band. Implement it or remove the option (removal is
   Lane E: the value is in eight Postgres enums).
3. **`IndustryGrid.tsx:30` / `LocationsList.tsx:37`** — cards link to
   `/industries/<slug>` and `/locations/<slug>`; neither route exists, so every
   card is a 404. Unlink until the routes ship (ROADMAP IND-1 / SVC-2).
4. **Three phantom reads** — `LocationsList.tsx:16` reads `state` (it lives at
   `address.state`), `ServicePillarCards.tsx:24` reads `tagline`, and
   `WorkshopList.tsx:21` reads `subtitle`. None of those fields exist on their
   collection. Dead branches; delete or back them with a real field.

### Lane E — schema removals (alone, last)

Drop the controls the other lanes decided not to implement. Schema-bearing, so
one migration for the whole set:

- `hubspotForm.submitRedirect`, `featuredTestimonials.autoplay`,
  `posts.relatedPosts`, `media.caption`, `servicePillars.order`
- `logoBar.source` (once `from-homepage` goes, one value remains — drop the
  field), and its value in eight enum types
- ~~`hero.primaryCta.variant`~~ — **resolved in PR #126: Lane C implemented the three styles rather than
  removing the control, so it must NOT be dropped here.**

Reconcile `docs/content-drafts/*.json` in the same change (CLAUDE.md, FR-029)
and take an RDS snapshot first (`docs/INFRASTRUCTURE_RUNBOOK.md` §2.9).

---

## Decisions already made

So no lane has to stop and ask:

- **Reuse `HubspotLeadForm`; do not build new HubSpot integration.** It works and
  is already wired to GTM.
- **`hubspot-meetings`: drop the block** unless the real embed is quick. It has
  zero live instances and `contact-cta` already covers booking.
- **Unlink the industry/location cards rather than build the routes.** Those
  routes are IND-1 / SVC-2 and are their own body of work.
- **A block that cannot be made to work gets removed, not documented.** The
  picker is Megan's menu; a block that publishes nothing useful should not be on
  it. `docs/BLOCK_LIBRARY.md` and the committed preview both need updating when
  one goes.
- **Renderer changes are expected to change public output.** That is the point;
  PR #123 promised not to, this work is where it happens.

---

## What every lane must do

- **Work in a git worktree** — the repo uses them and Kenn runs parallel sessions
  (`../company-website` is main).
- **Run your own dev server on a free port, and set `NEXT_PUBLIC_SITE_URL` to
  match it:**
  ```bash
  NEXT_PUBLIC_SITE_URL=http://localhost:3113 npx next dev --port 3113
  ```
  Payload pushes `config.serverURL` onto `config.csrf` and drops the session
  cookie when a request's `Origin` is not on that list. Page loads still
  authenticate, so the admin _looks_ signed in while every server action returns
  `UnauthorizedError` and nothing saves. This cost an hour on PR #123; it is now
  in `docs/LOCAL_DEVELOPMENT.md`. Do not touch the server on :3100.
- **Use an isolated database.** `createdb seqtek_e2e_<lane>` and point
  `DATABASE_URL` at it. Never mutate the shared `seqtek_dev` mirror.
- **Look at the screenshots.** Every lane changes rendered output, so
  `npm run visual:capture` and actually open the PNGs for the affected routes at
  both viewports (CLAUDE.md, "Visual verification"). A green `tsc` is not
  verification.
- **Regenerate the block preview** for any block whose design changes:
  `npm run seed:showcase && npm run visual:capture && npm run block:thumbnails`,
  then commit `public/block-previews/<slug>.webp`. The 400 KB total budget is
  asserted in `tests/int/adminMetadata.int.spec.ts`.
- **Update the field's help text in the same commit as the renderer fix.** PR
  #123's descriptions say things like "not wired up (ROADMAP INERT-2)" — those
  become wrong the moment a lane wires it up, and stale help text is the exact
  defect this whole effort is about.
- **Delete the block's `custom.inert` entry** as you fix it, and update
  `docs/ROADMAP.md` INERT-2.
- Full gates before pushing: `npm run typecheck && npm run lint &&
npm run format:check && npm run test:int`, plus the E2E for route-touching
  changes.

---

## Sequencing summary

```
Lane B step 1 (contact-cta live fix)  ── ship immediately, alone, today
Lane A (the gate)                     ── merge before B–E
   ├── Lane B (placeholder blocks)    ─┐
   ├── Lane C (interaction blocks)     ├─ parallel, disjoint files
   └── Lane D (collection-backed)     ─┘
Lane E (schema removals)              ── alone, after B/C/D merge
```
