# Content We Still Need — Authoritative List

**Owner:** Kenn Williamson · **Last updated:** 2026-08-31 (**§12 added** — Brent's emailed services structure, the authoritative nine-in-three that supersedes the transcript's "roughly fifteen". The 2026-08-31 sales alignment reopened **BOK / QuickTrip / ONEOK** as case-study targets, and added **§11** — the industry pages and the proof each one still lacks (settled at **seven** on 2026-09-04, Leadership and Training added for Hogan). Prior pass 2026-07-27: the **Hank and Brent interviews are filmed**, along with the localshoring content — all in edit, so §1 and §2 are now transcript-extraction work rather than asks; the case-study target set corrected to **three** clients with **Taurex** promoted to first chase and **Well Checked** demoted to a logo item; the **All Hands moved to September**, shifting §3. Prior pass 2026-06-30: reconciled against a live crawl of every staging route + the Payload REST inventory; added §9 "Missing pages — linked but 404" from the link audit; marked the Contact form GUID and Brent's live bio draft as resolved)
**Purpose:** the single source of truth for content the website is still waiting on. Hand this to Hank, Justin, and Megan. If a request isn't on this list, we don't need it — see "Already decided / do not re-ask" below. This supersedes the scattered gap notes in `docs/content-drafts/CONTENT_GAPS.md` (dated 2026-06-11, now stale — its snapshot shows services/case-studies/insights empty, all of which are live) and the long-lead `C-*` rows in `ROADMAP.md`.

**State of the site (2026-06-30):** the technology is essentially done. A full crawl of staging returns **36 live pages** (homepage, 5 case studies, 5 insights, 11 team bios, 4 service pages, 3 workshops, localshoring, about, contact, privacy) — every one with real, substantial, professionally-rendered copy (no lorem, no "coming soon", no missing alt text). The block migration is complete and most copy/photos are loaded. What remains is (1) a small set of **human inputs** (Hank interview, named client quotes, the photo/video shoot), and (2) a handful of **stub pages that are linked in the nav/footer but 404** (new §9 below). Everything else is _loading_ work the dev side does without you.

**Launch model (decided 2026-06-24, dates updated 2026-07-27):** the launch is **phased**. **Soft launch** goes out with the content already in hand (everything in §8 below, placed) to gather feedback. **Hard launch** follows the All Hands photo/video shoot (§3) — **now September, moved from August** — plus the named case-study sign-offs (§1.F). So the §3 shoot and the §1.F permissions are **hard-launch** gates; the rest of this list should land for the soft launch.

**What changed on 2026-07-27:** the **Hank and Brent interviews are filmed** (with the localshoring content) and are in edit. Everything in §1 and §2 below that read as "we need to get Hank in a room" is now **extraction from a transcript** — we can draft it without the finished cut and without another meeting. What is genuinely still outstanding from people: the **client sign-offs** (§1.F), the **September shoot** (§3), and the **small confirmations** (§6). **§5 is closed** — the maturity assessment was retired outright on 2026-08-08, so it is neither an ask nor a build decision.

---

## 1. Hank interview — the critical path (with Justin + Megan)

**✅ FILMED 2026-07-27 — in edit.** This session happened, along with Brent's (§2) and the localshoring content. Source guide: `docs/content-drafts/hank-interview-followup.md`. The items below still **cannot be fabricated**, but they are no longer waiting on Hank's calendar — they are waiting on a transcript, which we can pull off the raw audio ourselves rather than waiting for the editor. Items B–F below are the extraction checklist: confirm each one is actually answered on tape, and flag anything that isn't as a short follow-up rather than a re-shoot.

**A. The name: Sequoyah — ✅ DONE, no longer a gap.** Kenn supplied the story and it is **written and live on `/our-story`** (the "The name: Sequoyah" section — Sequoyah the Cherokee silversmith, the syllabary, "fit the symbols to the language, not the language to the symbols," the literacy story, the metaphor to SEQTEK's work, the quill-logo nod, and the explicit non-tribal acknowledgement) plus a companion podcast video. It shipped ahead of the interview; leadership only needs to read the rendered copy at 5.5. (The Jun-9 `about-our-story.md` draft still shows a `[PLACEHOLDER]` for this — that draft is stale; `seed-about-api.mts` is the source of truth and carries the real prose.)

**B. Localshoring** _(the coined differentiator; trademarked term)_

**Elevated by the 2026-06-24 review:** Localshoring must become **its own listed service** — a peer offering on `/services`, not a sub-bullet (see SVC-1 / the four-offering direction). It also gets a **Localshoring explainer video** on the team/localshoring pages (C-9). Right now there is **no concise definition of localshoring anywhere** — Kenn mined the podcasts for the about-page material but never found a tight, reusable definition, and we need one. The real, authoritative copy is still **Hank-gated** (no fabrication):

- When and why did you coin "localshoring"? What were you seeing?
- One- or two-sentence definition. How is it different from onshore / nearshore / offshore?
- A real example where being local changed the outcome (numbers if you have them).
- How you frame the value (it's not the cheapest).

**C. The 25-year arc (1999 → now)** _(currently a `[PLACEHOLDER]`; story today stops at ~2004)_

- How SEQTEK rebuilt after the dot-com bust; what changed in the model.
- Rough headcount milestones (10 / 25 / 50 people).
- Major clients and roughly when — **and which we may name publicly.**
- Sapulpa → Tulsa move: when, and confirm current HQ address.
- When the three pillars formalized; when the AI/automation practice began.
- When OKC / NW Arkansas / Kansas City came online.

**D. Touchstone naming** — what a Touchstone workshop is in your words, where the name came from, how it connects to the Sequoyah idea (unblocks the gated section of the otherwise-finished `/workshops` landing).

**E. Hank's own bio** — pick one of the three drafted pull-quote options (or give a fresh line); confirm the personal facts (rifle-for-a-computer, forest-ranger, college ball) are fair game and how personal the faith framing goes on the page. _(Faith framing itself is already approved — see §6.)_

**F. Client-name + testimonial permissions** — 2–3 clients who'd give a short named quote (ideally one about localshoring); confirmation we can name the flagship client (NovaMud) and cite its metrics. **Named case-study target set (from the 2026-06-24 review), ordered by how likely we are to land the sign-off, with the internal person chasing each:**

- **Taurex** (via **Andrew**) — **chase this one first.** Four Taurex studies are already written (`taurex` live on staging, plus partnership / eticketing / repair drafted with banner art done), and all three outstanding quote slots are Taurex people (Dustin, a field rep or district manager, Chad). One conversation clears the soft-launch "one named, signed study" gate, publishes four studies, and lands three quotes.
- **Hogan** (via **Ryan**) — a current client; this is **both** a case study **and** a logo on the Industry Leaders strip.
- **NovaMud** (via **Sam**) — the **flagship** (the existing study, the only one with metrics); need it made specifically about them + permission to name them.
- **Well Checked** (via **Mike**) — the sign-off is believed easy, but we are lukewarm on the content (2026-07-27). Treat it as a **logo / permission** item, not a case-study chase.

Kenn has sign-off from **nobody** yet — Megan is tracking the project histories + sign-offs for website use. This is a hard-launch gate (relational branding: named, signed studies only — anonymous studies are dropped). **Logo note, revised 2026-08-31:** BOK, QuickTrip and ONEOK were logo-only here, and the 2026-08-31 sales alignment named all three as case-study targets. They are back on the chase list — leadership believes it can get them, and they would be the strongest proof we have. The earlier exclusion stands only as the reason to expect a no. See "Logos" below.

**Logos — Industry Leaders strip (audit + curation, Megan owns).** The current strip was copied as-is from the live seqtek.com site, and the 2026-06-24 meeting **re-opened whether we actually have permission to show these** (the earlier "the logos run publicly, so we're covered" assumption was softer than the conversation). Working assumption: if no client has objected to marks already running publicly, they're probably fine — but **Megan owns curating the showcase list and chasing logo permission** with Hank/Brent before launch. Full meeting audit:

- **Keep / current:** **Hogan**, **BOK**, **QuickTrip** (all current clients).
- **Stale — drop or refresh:** **GE** (the Lovekin project, ~10 yr ago), **AVB** (last work ~5 yr ago), **Change Health** (~6 yr ago).
- **Verify first:** **ONEOK / ONE Gas** — confirm SEQTEK ever did work with them at all (Kenn doesn't recall any). This is the one to settle before asking ONEOK for anything.
- **Case studies:** **ONEOK + QuickTrip were excluded; reopened 2026-08-31** at the sales alignment. Chase them like any other target and record the answer here.

---

## 2. Brent Fields — bio call

**✅ FILMED 2026-07-27 — in edit.** Brent's interview is captured, so this is now transcript extraction, not a call to schedule. Pull his leadership philosophy, a pull-quote, and the personal facts off the tape, then confirm the written version with him. **His copy for the two non-Touchstone workshops rides on the same transcript** — draft it there too.

**Update 2026-06-30:** a Brent bio draft is **already live on staging** (`/team/brent-fields`, ~1,700 chars — shorter than Hank's and Dana's). So this is no longer "missing," it's an **enrichment** pass: the live draft leans on credentials and still wants Brent's human layer. We have his credentials (Addison Group, Rowland Group, MBA, Change Management Practitioner). What the live draft still needs, via the standard guide (`leadership-bio-interview.md`):

- His leadership philosophy (2–3 sentences, his words)
- A pull-quote
- A couple of real personal facts

---

## 3. Photo + video shoot (one session)

Most studio headshots already exist and are catalogued (`../photo-catalog/`, mapped in `image-plan.md` / `team-page-picks.md`). **Timing: the All Hands — now September** (moved from August, confirmed 2026-07-27). Everyone is already required to be there, so get group + headshots in one go instead of tracking people down. This shoot is the **hard-launch** gate, and the extra month is runway for the soft launch, not a reason to hold it. **Note:** the leadership _video_ no longer waits for this — the Hank/Brent/localshoring shoot already happened (§1, §2). What is left here is **stills**, plus any additional team video we want.

- **Megan organizes the shoot** — gives the team advance notice, schedules group photo + headshots, and coordinates the action/candid session.
- **Shooter: Justin is first choice** — he's the one who has shot SEQTEK's videos. **Confirm he also shoots stills** (Megan to check; if not, find someone who does). The goal is a professional camera, not phone photos.

Still to capture:

- **Group photo** of everyone + a **professional headshot for every team member** (the team page wants a name + face for everyone, not just leadership).
- Group leadership photo (Hank / Dana / Brent).
- Kenn's studio headshot (current one is off-style).
- **Action / candid shots at the Gradient office** (the SEQTEK office) — pull in local Tulsa people (Brent, Daniel, Chad, Hank, Megan, Andrew, etc.); not everyone is required to come in given remote work. Ideas: walking the office stairs, the glass-elevator shot — real people in a great space. Megan to decide how to approach this separately from the All Hands group/headshot session.
- Confirm active-roster status for Sam Haines / Matt Lemke / Jeff Jordan.
- Any office / candid b-roll for hero + culture strips (we also have 2022–23 candidates).

---

## 4. HubSpot (Megan, portal admin)

> **Portal ownership changed 2026-07-29:** Megan is now the HubSpot portal admin for `8504846`. Chad Coleman has left the company — his name stays on the dated provisioning notes in `INTEGRATIONS.md §1.2` as a record of who supplied those values, but all new portal requests go to Megan.

- **Contact form GUID — ✅ DONE (PR #76, 2026-06-29).** The live Contact-form GUID is wired; the `/contact` form renders and posts to HubSpot. Workshop Inquiry form GUID was wired earlier (PR #74). _Remaining verify (not a content gap):_ confirm a test submission lands in the HubSpot portal and the inquiry-type dropdown values match.
- **Book-a-call — interim decision implemented.** Every "Book a Call" CTA (header, footer, in-page service/workshop CTAs) now points at the `/contact` form — the link audit found they previously pointed at `/contact/book-a-call`, which **404s** (no such route). _Still open:_ if we want a true calendar-booking experience, set up a HubSpot Meetings link and repoint the CTAs (the `HubspotMeetings` block already exists). The old site has no booking link to reuse.

---

## 5. Organizational Maturity Assessment — RETIRED 2026-08-08

**Killed, not deferred.** The assessment is not being rebuilt, so this is neither
a content gap nor a build decision. Nothing is owed by anyone here.

**What it was:** the live Wix page `/organizational-strategy-1-5` ("Assessment |
SEQTEK") hosted a hand-built HTML/JS form in a Wix HtmlComponent iframe posting to
a **Make.com webhook** — never ScoreApp, despite years of docs saying so (both
scoreapp.com vanity subdomains are unclaimed). The Wix audit's Playwright pass
timed out on that exact URL (`networkidle` never settles), which is why every
earlier doc read the assessment as missing content.

**Preserved, in case this ever comes back:** the full instrument — 40 statements
in 4 sections of 10 (Organizational Strategy & Design · Leadership & Culture ·
Technology & Data · AI & Automation), 1–5 Likert, required lead fields, intro copy
and the exact scoring payload — is captured in the gitignored
`docs/content-drafts/organizational-maturity-assessment.md`. Retirement is a
routing/docs decision, not a data loss.

**Shipped with the retirement:** `/organizational-strategy-1-5` now 301s to
`/workshops` (it previously redirected into the never-built `/resources/*` route,
i.e. a 404). See INTEGRATIONS §3 for the full removal list.

---

## 6. Small confirmations (quick, not blocking the shoot/interview)

- **CPM testimonial roles** — confirm titles for Jeremy Larson, Jim Hewston, Robb Hogg (Cross Precision Measurement). Their quotes are release-cleared; we just want role lines.
- **Dana bio naming** — OK to publicly name Paul Dudley (husband) / Clientele Solutions and the Lufkin Automation engagement?
- **Workshop stats** — the "70% of change efforts fail / $2.3T" figures in the workshop decks are uncited. Either give us the source to cite, or we drop/replace them.

---

## 7. Already decided — do **not** re-ask (locked 2026-06-19)

These kept resurfacing; they're closed:

| Topic                | Decision                                                                                                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Company stats**    | 25+ years, **500+ projects**. "Lives touched" is **dropped** (off-brand).                                                                                                                            |
| **Client logos**     | **Re-opened 2026-06-24** (was "running publicly = sufficient permission"). Megan now owns curating the strip + chasing permission; full audit + the case-study exclusions are in §1.F under "Logos." |
| **Cherokee Nation**  | **No outreach.** Respectful allusion to a public historical figure needs no permission.                                                                                                              |
| **Core values**      | 7 pattern/anti-pattern values written; **Hank signed off**.                                                                                                                                          |
| **Faith framing**    | Approved and calibrated; lives on `/our-story` + Hank's bio, with a video cut. Hank holds final sign-off on _altitude_ only.                                                                         |
| **Blog post bodies** | Written (6 posts). Done.                                                                                                                                                                             |

---

## 8. Already drafted & ready (so you can see how close we are)

Waiting only on placement/loading, not on you:

- **8 case studies** with full narratives — the 5 published on staging, plus **3 more Taurex studies** (partnership, eticketing, repair) drafted 2026-07-16 with banner art done, held only for their quotes. NovaMud is flagship-ready bar a hero image + named quote.
- **6 blog posts**, full bodies.
- **Thirteen service pages** — the axis page, three groups and nine leaves of §12, plus Localshoring as a tenth leaf — full copy + FAQs. (Superseded twice: the 3-pillar / 9-service IA was retired in #79–#83 for four peer offerings as block Pages, and SVC-2 replaced those with one routed `services` collection carrying a `tier`. `servicePillars` no longer exists; a group is a `services` row.)
- **Touchstone landing**, full copy + CrossCo proof video/photos (cleared).
- **Hank & Dana bios**, publish-ready.
- **Sequoyah name story** — written and **live on `/our-story`** + companion video (the old-feather Sequoyah Technologies logo is the swap-in for its current quill-panel placeholder).
- **Values** (7 pairs), **Mission/Vision**, **Our Story** founding narrative (name story + "gap nobody would fix" + "through the bust" — through ~2004). Still pending: the 1999→now 25-year timeline — **on tape as of 2026-07-27**, awaiting transcript extraction (§1.C).
- **8 release-cleared workshop testimonials** (4 with full name + title).
- **Lead magnet** (the AI Dev Guide PDF) available for the workshop download card.
- **Founder/brand videos** (Sequoyah origin, value, culture) with captions.

---

### The flagship case study, specifically (what "done" means for NovaMud)

A publishable case study record needs: hero image (real, non-stock) · client + industry metadata · Challenge / Approach / Results narrative · a metrics array · key takeaways · a named client testimonial. **NovaMud already has** the narrative, metadata, and metrics (30% less labor, 25%+ billing time returned). **It needs:** (1) a non-stock hero image, (2) one named client quote, (3) permission to name NovaMud and cite the numbers. That's the entire gap for the flagship.

**The other four case studies** (Endurance Lift, Hogan, WellChecked, Taurex) are live with full narratives but have **empty metrics arrays and `testimonial: null`** — and all five currently use a generated dark-panel banner rather than a real photo. Named quotes + metrics for these are the §1.F sign-off work; real hero images are part of the §3 shoot.

---

## 9. Missing pages — linked but 404 (surfaced by the 2026-06-30 link audit)

A crawl of every internal link on staging found **10 routes that are linked in the nav/footer/CTAs but return 404** (plus **fourteen** service routes added later by NAV-1 — see the note under the table, which are a seeder run rather than a content build). The nav/footer is code-driven (`src/lib/site-content.ts`), so as an immediate fix the dead links were either repointed to a live equivalent or removed (the live 404 page is professional, but a launched site should not dead-end). The rows below that need a **real page** are genuine content gaps:

| Linked route (was 404)                                       | Interim fix shipped in code   | Real fix needed                                                                                                             | Owner / source | Severity                      |
| ------------------------------------------------------------ | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------- |
| `/contact/book-a-call` (primary "Book a Call" CTA, sitewide) | Repointed → `/contact` form   | Optional: HubSpot Meetings booking page (§4)                                                                                | Megan          | was a **blocker** (now fixed) |
| `/about/our-story`                                           | Page renamed → `/our-story`   | none — the page IS `/our-story` now ("About" retired as a label; `/about` 301s)                                             | —              | resolved                      |
| `/about/team`                                                | Repointed → `/team`           | none — content lives at `/team`                                                                                             | —              | resolved                      |
| `/tulsa-consulting`                                          | Repointed → `/localshoring`   | **Per-market SEO landing page** (Tulsa) — local copy, proof, contact                                                        | Hank/Megan     | Important (local SEO)         |
| `/okc-consulting`                                            | Repointed → `/localshoring`   | **Per-market SEO landing page** (Oklahoma City)                                                                             | Hank/Megan     | Important (local SEO)         |
| `/northwest-arkansas-consulting`                             | Repointed → `/localshoring`   | **Per-market SEO landing page** (NW Arkansas)                                                                               | Hank/Megan     | Important (local SEO)         |
| `/kansas-city-consulting`                                    | Repointed → `/localshoring`   | **Per-market SEO landing page** (Kansas City)                                                                               | Hank/Megan     | Important (local SEO)         |
| `/careers`                                                   | Removed from nav              | **Careers stub page** — even a short "we hire senior practitioners; reach out" page with the localshoring/culture angle     | Hank/Megan     | Important                     |
| `/terms-of-service`                                          | Removed from footer legal nav | **Terms of Service page** — needs reviewed legal copy (privacy-policy already exists as the model)                          | Legal/Brent    | Important (launch)            |
| ~~`/resources/organizational-maturity-assessment`~~          | Removed from footer           | **Nothing — retired 2026-08-08 (§5).** The page is not being built; `/organizational-strategy-1-5` now 301s to `/workshops` | —              | closed                        |

**NAV-1 / SVC-2 added fourteen more, and they are a SEED not a build.** The two-axis header menu enumerates
Brent's structure from §12, so `/services/what-we-do`, `/services/how-we-work`, the three group slugs and the
nine leaf slugs are all linked from code-owned chrome — two axes, three groups and nine leaves, fourteen in
all. (`/services/localshoring` is a fifteenth planned route but is deliberately NOT linked yet: the nav and
footer both still point at the `localshoring` Page, which resolves today.) Unlike every row above, **none of them needs a page
built** — `services.json` already carries all fifteen documents as
clearly-marked placeholders, verified to seed with `errors=0`. They 404 only until someone runs
`npm run payload:seed -- docs/content-drafts/services.json` against the lane. (That path is the usual one —
`docs/content-drafts` is a symlink to the private `website-content` repo, so the file is versioned there and
reached from here, which is why both names refer to one file.) **Sequence that immediately
behind the merge**, because a merge to `main` deploys preview at once and both panels are dead in the gap.
What is genuinely outstanding is the _copy_, tracked in §12: three of nine leaves have a usable draft, three
have adjacent material about a different subject, three have nothing, and none of the three group pages or
either axis page has a draft at all.

**The 4 regional pages are the biggest single content opportunity here.** They were a deliberate local-SEO play (one page per market: Tulsa, OKC, NW Arkansas, Kansas City) and the multi-market positioning is core to the brand. They are all currently parked on `/localshoring`. Each wants: a market-specific headline, why-local-here copy, ideally a local proof point or client, and a contact CTA. The block library can compose these today — the gap is **copy + per-market specifics**, not engineering. (If we'd rather not build four, decide whether to keep them in the footer at all.)

---

## 10. Data hygiene & loading defects (dev-side cleanup, no human input needed)

Found in the live Payload inventory on 2026-06-30. None require leadership input — listed so they don't get lost:

- **`industries` collection is empty** but published case studies reference industry IDs — the references are dangling. Either seed the industries or drop the relationship.
- **`locations` collection is empty** — relevant once the regional pages (§9) are built.
- **Junk category `ztest-delete-me`** in the `categories` collection — delete.
- ~~**`navigation` CMS global is empty**~~ — **closed (spec 011).** The global was withdrawn entirely and its table dropped; site chrome is code-owned in `src/lib/site-content.ts` by decision, not by omission. See ADR 0010.
- **`/our-story` video embeds** — the founder/brand videos render as large empty dark blocks in a fresh page capture; verify they show a poster frame (not a black box) before launch.
- **Case-study `ogImage` is null** — social-share images missing (SEO nice-to-have).

---

## 11. Industry pages — the seven, and the proof each one needs

Decided at the 2026-08-31 sales alignment (Healthcare, FinTech, Oil & Gas, Energy, Manufacturing) plus
**Aerospace**, added the same day. **Non-profit is explicitly excluded** — Brent does not want non-profit
inbound, so YouVersion stays a wanted case study and does not anchor a page.

Every one of these is an assertion of expertise, and the meeting's own rule is that a claim we cannot point
at loses at our size. Here is what each has behind it **today**:

| Industry          | Case-study proof we hold                          | What we need                                                     |
| ----------------- | ------------------------------------------------- | ---------------------------------------------------------------- |
| **Oil & Gas**     | Endurance Lift, NovaMud, Taurex ×3                | Named sign-off (the §1.F chase). Proof is not the problem here.  |
| **Energy**        | WellChecked                                       | One more, ideally with a metric.                                 |
| **Healthcare**    | **none**                                          | A client, a story, or the page waits.                            |
| **FinTech**       | **none** — BOK is the obvious candidate           | BOK as a case study (reopened 2026-08-31), or a logo at minimum. |
| **Manufacturing** | **none** — Taurex is arguably here as well as O&G | Confirm whether Taurex reads as manufacturing, or find another.  |
| **Aerospace**     | **none**                                          | Have we done aerospace work at all? Hank/Brent to confirm.       |

**The ask, in one line:** four of the seven industries have nothing to point at. Either PROOF-1 lands a study
per industry, or the pages ship in the order the proof does.

**Open, not a request:** **Hogan Assessments** does not fit any of Brent's six — its vertical is psychometrics,
and the nearest honest bucket is something like leadership development or talent. Left as-is for now rather
than forced into a marketing industry.

---

## 12. The "What We Do" menu — the 13 pages Brent specified

**Source: Brent's email "Services", 2026-08-31 14:32** (to Kenn, cc Megan and Hank), sent hours after the
sales alignment. This is the authoritative structure and it **supersedes anything inferred from the meeting
transcript**, including the "roughly fifteen items" figure. It is **nine services, not fifteen**.

His words on the shape: _"What We Do as the link at the top of the homepage. Those 3 core functions going
across horizontal as the drop down. Those 3 are a clickable page with high level content covering the area.
The 3 services below them vertical each as a page."_

That is **13 pages**: one axis page, three group pages, nine leaf pages. Note the group pages are **required
here** — the optional-group-URL design in `ROADMAP.md` NAV-1 still applies to the second ("how we work")
panel, but not to this one.

| Group                                | Service                                                           | Nearest existing draft                                                                   |
| ------------------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Strategy and Business Consulting** | Strategy and Alignment                                            | `strategy-alignment` (4.5k) — direct                                                     |
|                                      | Business Process Consulting _(project management tailored in)_    | `process-automation` (3.9k) — adjacent, different subject                                |
|                                      | Change Management                                                 | **nothing**                                                                              |
| **Technology and Data**              | Enterprise Architecture _(app development and cloud tailored in)_ | `custom-software-development` (4.8k) + `application-modernization` (4.7k) — raw material |
|                                      | Data Engineering and Warehousing                                  | `cloud-data-engineering` (4.6k) — direct                                                 |
|                                      | Business Intelligence and Analytics                               | **nothing**                                                                              |
| **AI & Automation**                  | Generative AI _(AI readiness tailored in)_                        | `ai-assisted-modernization` (4.0k) — adjacent, different subject                         |
|                                      | Machine Learning                                                  | `machine-learning-solutions` (3.9k) — direct                                             |
|                                      | Agentic AI _(AI governance tailored in)_                          | **nothing**                                                                              |

Drafts are in `docs/content-drafts/_archive/content-batch.json`. **The mapping above is by title only** — each
one needs reading before it is assumed reusable.

**Three of nine have a usable draft, three have adjacent material about a different subject, three have
nothing.** The three group pages and the axis page have no drafts at all.

**The three group names already exist in the archive** as `servicePillars` — "Organizational Strategy",
"Technology & Data", "AI & Automation" (~1.4k each: a description and metadata, no body). Someone landed on
the same three buckets independently, which is a point in favour of the grouping. They are seeds for the
group pages, not the "high level content covering the area" Brent is asking for.

**Two archived drafts are not on Brent's list, and that is correct** — `fractional-product-ownership` and
`team-workshops` are "how we work", not "what we do", and so is Localshoring. That is the two-axis split
doing its job, not a gap.

**What we need from people**

| Item                                      | Owner                       | State                                                                                                                                                                                 |
| ----------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Copy for the **3 group pages**            | Kenn drafts, Brent confirms | Brent asked for "high level content covering the area". No draft exists.                                                                                                              |
| Copy for the **6 leaf pages** without one | Kenn drafts                 | Change Management, BI & Analytics, Agentic AI outright; plus Business Process Consulting, Enterprise Architecture and Generative AI, where the nearest draft is about something else. |
| **A proof link per service**              | Megan (ROADMAP PROOF-1)     | The meeting's own rule is that a claim we cannot point at loses at our size. **Nine services, four studies.** This is the real gate, not the copy.                                    |
| **The industry list**                     | Brent                       | He sent the services; **industries did not come with them.** §11 runs on the meeting's five plus Aerospace until he confirms.                                                         |

**Raw material we already hold.** Brent's earlier email ("Website Notes for Call Monday", 2026-08-28) carries
the positioning line — a business transformation and management consulting company that uses technology, data
and AI, explicitly _not_ a software house, IT staffing or a technology implementer — and a ten-item list of
the buyer problems he hears: competing priorities, disconnected teams, failed transformations, technology not
delivering value, AI pressure without a strategy, poor data, process inefficiency, change fatigue, difficulty
executing strategy, no alignment across leadership. That is the source for the "What We Do" page and for the
homepage problem/solution section the meeting agreed to. Use it rather than inventing one.
