# Content We Still Need — Authoritative List

**Owner:** Kenn Williamson · **Last updated:** 2026-06-30 (reconciled against a live crawl of every staging route + the Payload REST inventory; added §9 "Missing pages — linked but 404" from the link audit; marked the Contact form GUID and Brent's live bio draft as resolved)
**Purpose:** the single source of truth for content the website is still waiting on. Hand this to Hank, Justin, and Megan. If a request isn't on this list, we don't need it — see "Already decided / do not re-ask" below. This supersedes the scattered gap notes in `docs/content-drafts/CONTENT_GAPS.md` (dated 2026-06-11, now stale — its snapshot shows services/case-studies/insights empty, all of which are live) and the long-lead `C-*` rows in `ROADMAP.md`.

**State of the site (2026-06-30):** the technology is essentially done. A full crawl of staging returns **36 live pages** (homepage, 5 case studies, 5 insights, 11 team bios, 4 service pages, 3 workshops, localshoring, about, contact, privacy) — every one with real, substantial, professionally-rendered copy (no lorem, no "coming soon", no missing alt text). The block migration is complete and most copy/photos are loaded. What remains is (1) a small set of **human inputs** (Hank interview, named client quotes, the photo/video shoot), and (2) a handful of **stub pages that are linked in the nav/footer but 404** (new §9 below). Everything else is _loading_ work the dev side does without you.

**Launch model (decided 2026-06-24):** the launch is **phased**. **Soft launch** goes out with the content already in hand (everything in §8 below, placed) to gather feedback. **Hard launch** follows the **August All Hands** photo/video shoot (§3) plus the named case-study sign-offs (§1.F). So the §3 shoot and the §1.F permissions are **hard-launch** gates; the rest of this list should land for the soft launch.

---

## 1. Hank interview — the critical path (with Justin + Megan)

This single session unblocks more than anything else. Source guide: `docs/content-drafts/hank-interview-followup.md`. The items below **cannot be written without Hank** — no fabrication.

**A. The name: Sequoyah — ✅ DONE, no longer a gap.** Kenn supplied the story and it is **written and live on `/about`** (the "The name: Sequoyah" section — Sequoyah the Cherokee silversmith, the syllabary, "fit the symbols to the language, not the language to the symbols," the literacy story, the metaphor to SEQTEK's work, the quill-logo nod, and the explicit non-tribal acknowledgement) plus a companion podcast video. It shipped ahead of the interview; leadership only needs to read the rendered copy at 5.5. (The Jun-9 `about-our-story.md` draft still shows a `[PLACEHOLDER]` for this — that draft is stale; `seed-about-api.mts` is the source of truth and carries the real prose.)

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

- **Well Checked** (via **Mike**) — the **most-certain** sign-off; the one Kenn is "reasonably certain" of. Case study.
- **Hogan** (via **Ryan**) — a current client; this is **both** a case study **and** a logo on the Industry Leaders strip.
- **Torax** (via **Andrew**) — **case study only.**
- **NovaMud** (via **Sam**) — the **flagship** (the existing study, the only one with metrics); need it made specifically about them + permission to name them.

Kenn has sign-off from **nobody** yet — Megan is tracking the project histories + sign-offs for website use. This is a hard-launch gate (relational branding: named, signed studies only — anonymous studies are dropped). **Logo note:** **BOK** is a **logo only** (current client, not a case-study target); **ONEOK + QuickTrip are a NO for case studies** (their logos may still be fine). See "Logos" below.

**Logos — Industry Leaders strip (audit + curation, Megan owns).** The current strip was copied as-is from the live seqtek.com site, and the 2026-06-24 meeting **re-opened whether we actually have permission to show these** (the earlier "the logos run publicly, so we're covered" assumption was softer than the conversation). Working assumption: if no client has objected to marks already running publicly, they're probably fine — but **Megan owns curating the showcase list and chasing logo permission** with Hank/Brent before launch. Full meeting audit:

- **Keep / current:** **Hogan**, **BOK**, **QuickTrip** (all current clients).
- **Stale — drop or refresh:** **GE** (the Lovekin project, ~10 yr ago), **AVB** (last work ~5 yr ago), **Change Health** (~6 yr ago).
- **Verify first:** **ONEOK / ONE Gas** — confirm SEQTEK ever did work with them at all (Kenn doesn't recall any).
- **Case-study exclusions:** **ONEOK + QuickTrip are a NO for case studies** (logos only, if at all).

---

## 2. Brent Fields — bio call

**Update 2026-06-30:** a Brent bio draft is **already live on staging** (`/team/brent-fields`, ~1,700 chars — shorter than Hank's and Dana's). So this is no longer "missing," it's an **enrichment** pass: the live draft leans on credentials and still wants Brent's human layer. We have his credentials (Addison Group, Rowland Group, MBA, Change Management Practitioner). What the live draft still needs, via the standard guide (`leadership-bio-interview.md`):

- His leadership philosophy (2–3 sentences, his words)
- A pull-quote
- A couple of real personal facts

---

## 3. Photo + video shoot (one session)

Most studio headshots already exist and are catalogued (`../photo-catalog/`, mapped in `image-plan.md` / `team-page-picks.md`). **Photo and video shot together.** **Timing: the August All Hands** (everyone is already required to be there — get group + headshots in one go instead of tracking people down). This shoot is the **hard-launch** gate.

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

## 4. HubSpot (Chad Coleman, portal admin)

- **Contact form GUID — ✅ DONE (PR #76, 2026-06-29).** The live Contact-form GUID is wired; the `/contact` form renders and posts to HubSpot. Workshop Inquiry form GUID was wired earlier (PR #74). _Remaining verify (not a content gap):_ confirm a test submission lands in the HubSpot portal and the inquiry-type dropdown values match.
- **Book-a-call — interim decision implemented.** Every "Book a Call" CTA (header, footer, in-page service/workshop CTAs) now points at the `/contact` form — the link audit found they previously pointed at `/contact/book-a-call`, which **404s** (no such route). _Still open:_ if we want a true calendar-booking experience, set up a HubSpot Meetings link and repoint the CTAs (the `HubspotMeetings` block already exists). The old site has no booking link to reuse.

---

## 5. ScoreApp assessment (Daniel — he runs it)

**Correction 2026-06-30:** the "Organizational Maturity Assessment" landing page is **not actually built** — `/resources/organizational-maturity-assessment` returns a **404** (there is no `/resources/*` route, only a redirect target). The footer "Assessment" link has been removed until the page ships. So two things are needed: (a) the live ScoreApp assessment URL + a one-line description and time estimate (below), and (b) a published landing/stub page to host or link it (see §9). Draft email to Daniel:

> **Subject: ScoreApp assessment link for the new site's assessment page**
>
> Hey Daniel — the new SEQTEK site has a landing page ready for the organizational-maturity assessment, and since you're running ScoreApp I need a few things from you to wire it up:
>
> 1. The public assessment URL (the link respondents start at).
> 2. A one-sentence description of what it measures and a rough time-to-complete (e.g. "5 minutes, 12 questions").
> 3. What a respondent gets at the end (report? score? follow-up?).
> 4. Whether we should embed it inline or just link out to ScoreApp.
>
> That's all I need to publish the page. Thanks!

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
| **Faith framing**    | Approved and calibrated; lives on `/about/our-story` + Hank's bio, with a video cut. Hank holds final sign-off on _altitude_ only.                                                                   |
| **Blog post bodies** | Written (6 posts). Done.                                                                                                                                                                             |

---

## 8. Already drafted & ready (so you can see how close we are)

Waiting only on placement/loading, not on you:

- **5 case studies** with full narratives (NovaMud is flagship-ready bar a hero image + named quote).
- **6 blog posts**, full bodies.
- **Four peer service offerings** (Localshoring, AI Integration, Digital Transformation, Workshops) rendered as block Pages by slug, full copy + FAQs. (The old 3-pillar service IA — 9 services across 3 pillars — was retired in the #79–#83 restructure; the `services`/`servicePillars` collections still exist but are no longer publicly routed.)
- **Touchstone landing**, full copy + CrossCo proof video/photos (cleared).
- **Hank & Dana bios**, publish-ready.
- **Sequoyah name story** — written and **live on `/about`** + companion video (the old-feather Sequoyah Technologies logo is the swap-in for its current quill-panel placeholder).
- **Values** (7 pairs), **Mission/Vision**, **About** founding narrative (name story + "gap nobody would fix" + "through the bust" — through ~2004). Still pending: the 1999→now 25-year timeline (Hank interview).
- **8 release-cleared workshop testimonials** (4 with full name + title).
- **Lead magnet** (the AI Dev Guide PDF) available for the workshop download card.
- **Founder/brand videos** (Sequoyah origin, value, culture) with captions.

---

### The flagship case study, specifically (what "done" means for NovaMud)

A publishable case study record needs: hero image (real, non-stock) · client + industry metadata · Challenge / Approach / Results narrative · a metrics array · key takeaways · a named client testimonial. **NovaMud already has** the narrative, metadata, and metrics (30% less labor, 25%+ billing time returned). **It needs:** (1) a non-stock hero image, (2) one named client quote, (3) permission to name NovaMud and cite the numbers. That's the entire gap for the flagship.

**The other four case studies** (Endurance Lift, Hogan, WellChecked, Taurex) are live with full narratives but have **empty metrics arrays and `testimonial: null`** — and all five currently use a generated dark-panel banner rather than a real photo. Named quotes + metrics for these are the §1.F sign-off work; real hero images are part of the §3 shoot.

---

## 9. Missing pages — linked but 404 (surfaced by the 2026-06-30 link audit)

A crawl of every internal link on staging found **10 routes that are linked in the nav/footer/CTAs but return 404.** The nav/footer is code-driven (`src/lib/site-content.ts`), so as an immediate fix the dead links were either repointed to a live equivalent or removed (the live 404 page is professional, but a launched site should not dead-end). The rows below that need a **real page** are genuine content gaps:

| Linked route (was 404)                                       | Interim fix shipped in code   | Real fix needed                                                                                                         | Owner / source | Severity                      |
| ------------------------------------------------------------ | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------- |
| `/contact/book-a-call` (primary "Book a Call" CTA, sitewide) | Repointed → `/contact` form   | Optional: HubSpot Meetings booking page (§4)                                                                            | Chad           | was a **blocker** (now fixed) |
| `/about/our-story`                                           | Repointed → `/about`          | none — content lives at `/about`                                                                                        | —              | resolved                      |
| `/about/team`                                                | Repointed → `/team`           | none — content lives at `/team`                                                                                         | —              | resolved                      |
| `/tulsa-consulting`                                          | Repointed → `/localshoring`   | **Per-market SEO landing page** (Tulsa) — local copy, proof, contact                                                    | Hank/Megan     | Important (local SEO)         |
| `/okc-consulting`                                            | Repointed → `/localshoring`   | **Per-market SEO landing page** (Oklahoma City)                                                                         | Hank/Megan     | Important (local SEO)         |
| `/northwest-arkansas-consulting`                             | Repointed → `/localshoring`   | **Per-market SEO landing page** (NW Arkansas)                                                                           | Hank/Megan     | Important (local SEO)         |
| `/kansas-city-consulting`                                    | Repointed → `/localshoring`   | **Per-market SEO landing page** (Kansas City)                                                                           | Hank/Megan     | Important (local SEO)         |
| `/about/careers`                                             | Removed from nav              | **Careers stub page** — even a short "we hire senior practitioners; reach out" page with the localshoring/culture angle | Hank/Megan     | Important                     |
| `/terms-of-service`                                          | Removed from footer legal nav | **Terms of Service page** — needs reviewed legal copy (privacy-policy already exists as the model)                      | Legal/Brent    | Important (launch)            |
| `/resources/organizational-maturity-assessment`              | Removed from footer           | **ScoreApp assessment page** — also needs the live ScoreApp URL (§5)                                                    | Daniel         | Important                     |

**The 4 regional pages are the biggest single content opportunity here.** They were a deliberate local-SEO play (one page per market: Tulsa, OKC, NW Arkansas, Kansas City) and the multi-market positioning is core to the brand. They are all currently parked on `/localshoring`. Each wants: a market-specific headline, why-local-here copy, ideally a local proof point or client, and a contact CTA. The block library can compose these today — the gap is **copy + per-market specifics**, not engineering. (If we'd rather not build four, decide whether to keep them in the footer at all.)

---

## 10. Data hygiene & loading defects (dev-side cleanup, no human input needed)

Found in the live Payload inventory on 2026-06-30. None require leadership input — listed so they don't get lost:

- **`industries` collection is empty** but published case studies reference industry IDs — the references are dangling. Either seed the industries or drop the relationship.
- **`locations` collection is empty** — relevant once the regional pages (§9) are built.
- **Junk category `ztest-delete-me`** in the `categories` collection — delete.
- **`navigation` CMS global is empty `{}`** — the live nav/footer is still driven by the hardcoded `src/lib/site-content.ts`, not the CMS. The planned "swap to `payload.findGlobal()`" never happened. Fine for launch, but the CMS global is dead weight until then.
- **`/about` video embeds** — the founder/brand videos render as large empty dark blocks in a fresh page capture; verify they show a poster frame (not a black box) before launch.
- **Case-study `ogImage` is null** — social-share images missing (SEO nice-to-have).
