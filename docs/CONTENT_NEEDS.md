# Content We Still Need — Authoritative List

**Owner:** Kenn Williamson · **Last updated:** 2026-06-19
**Purpose:** the single source of truth for content the website is still waiting on. Hand this to Hank, Justin, and Megan. If a request isn't on this list, we don't need it — see "Already decided / do not re-ask" below. This supersedes the scattered gap notes in `docs/content-drafts/CONTENT_GAPS.md` (dated 2026-06-11) and the long-lead `C-*` rows in `ROADMAP.md`.

**State of the site (2026-06-19):** every page template is built and live on staging; the block migration is complete; most copy is already drafted in `docs/content-drafts/` and most photos are catalogued. What remains is a small, specific set of human inputs. Nearly everything else is _loading_ work the dev side does without you.

---

## 1. Hank interview — the critical path (with Justin + Megan)

This single session unblocks more than anything else. Source guide: `docs/content-drafts/hank-interview-followup.md`. The items below **cannot be written without Hank** — no fabrication.

**A. The name: Sequoyah — ✅ DONE, no longer a gap.** Kenn supplied the story and it is **written and live on `/about`** (the "The name: Sequoyah" section — Sequoyah the Cherokee silversmith, the syllabary, "fit the symbols to the language, not the language to the symbols," the literacy story, the metaphor to SEQTEK's work, the quill-logo nod, and the explicit non-tribal acknowledgement) plus a companion podcast video. It shipped ahead of the interview; leadership only needs to read the rendered copy at 5.5. (The Jun-9 `about-our-story.md` draft still shows a `[PLACEHOLDER]` for this — that draft is stale; `seed-about-api.mts` is the source of truth and carries the real prose.)

**B. Localshoring** _(the coined differentiator; trademarked term)_

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

**F. Client-name + testimonial permissions** — 2–3 clients who'd give a short named quote (ideally one about localshoring); confirmation we can name the flagship client (NovaMud) and cite its metrics.

---

## 2. Brent Fields — bio call

Brent's bio is the **only** leadership bio still incomplete (Hank's and Dana's are done). We have his credentials (Addison Group, Rowland Group, MBA, Change Management Practitioner). We need the human layer, via the standard guide (`leadership-bio-interview.md`):

- His leadership philosophy (2–3 sentences, his words)
- A pull-quote
- A couple of real personal facts

---

## 3. Photo + video shoot (one session)

Most studio headshots already exist and are catalogued (`../photo-catalog/`, mapped in `image-plan.md` / `team-page-picks.md`). **Photo and video shot together.** Still to capture:

- Group leadership photo (Hank / Dana / Brent)
- Full team photo
- Kenn's studio headshot (current one is off-style)
- Confirm active-roster status for Sam Haines / Matt Lemke / Jeff Jordan
- Any office / candid b-roll for hero + culture strips (optional; we have 2022–23 candidates)

---

## 4. HubSpot (Chad Coleman, portal admin)

- **Contact form GUID** — create the Contact form in HubSpot and return: form GUID, field internal names, inquiry-type dropdown internal values, CAPTCHA off, consent decision (`INTEGRATIONS.md` §1.2). The form renders today but silently discards submissions until this exists. _(It can't be scraped off the old site — that site uses Wix forms, not HubSpot embeds.)_ The Workshop form GUID is already done.
- **Book-a-call** — decision: set up a HubSpot Meetings link, or for launch point "Book a Strategy Call" at the contact form (recommended) and add Meetings later. The old site has no booking link to reuse.

---

## 5. ScoreApp assessment (Daniel — he runs it)

The "Organizational Maturity Assessment" landing page is built but has nothing to point at. We need the live ScoreApp assessment URL + a one-line description and time estimate. Draft email to Daniel:

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

| Topic                | Decision                                                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Company stats**    | 25+ years, **500+ projects**. "Lives touched" is **dropped** (off-brand).                                                          |
| **Client logos**     | The logos already on the live site for years are sufficient permission. New logos only — Kenn handles those.                       |
| **Cherokee Nation**  | **No outreach.** Respectful allusion to a public historical figure needs no permission.                                            |
| **Core values**      | 7 pattern/anti-pattern values written; **Hank signed off**.                                                                        |
| **Faith framing**    | Approved and calibrated; lives on `/about/our-story` + Hank's bio, with a video cut. Hank holds final sign-off on _altitude_ only. |
| **Blog post bodies** | Written (6 posts). Done.                                                                                                           |

---

## 8. Already drafted & ready (so you can see how close we are)

Waiting only on placement/loading, not on you:

- **5 case studies** with full narratives (NovaMud is flagship-ready bar a hero image + named quote).
- **6 blog posts**, full bodies.
- **3 service pillars + 10 services**, full copy + FAQs.
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
