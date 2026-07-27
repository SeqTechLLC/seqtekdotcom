# Content We Still Need — Authoritative List

**Owner:** Kenn Williamson · **Last updated:** 2026-07-27 (the **Hank and Brent interviews are filmed**, along with the localshoring content — all in edit, so §1 and §2 are now transcript-extraction work rather than asks; the case-study target set corrected to **three** clients with **Taurex** promoted to first chase and **Well Checked** demoted to a logo item; the **All Hands moved to September**, shifting §3. Prior pass 2026-06-30: reconciled against a live crawl of every staging route + the Payload REST inventory; added §9 "Missing pages — linked but 404" from the link audit; marked the Contact form GUID and Brent's live bio draft as resolved)
**Purpose:** the single source of truth for content the website is still waiting on. Hand this to Hank, Justin, and Megan. If a request isn't on this list, we don't need it — see "Already decided / do not re-ask" below. This supersedes the scattered gap notes in `docs/content-drafts/CONTENT_GAPS.md` (dated 2026-06-11, now stale — its snapshot shows services/case-studies/insights empty, all of which are live) and the long-lead `C-*` rows in `ROADMAP.md`.

**State of the site (2026-06-30):** the technology is essentially done. A full crawl of staging returns **36 live pages** (homepage, 5 case studies, 5 insights, 11 team bios, 4 service pages, 3 workshops, localshoring, about, contact, privacy) — every one with real, substantial, professionally-rendered copy (no lorem, no "coming soon", no missing alt text). The block migration is complete and most copy/photos are loaded. What remains is (1) a small set of **human inputs** (Hank interview, named client quotes, the photo/video shoot), and (2) a handful of **stub pages that are linked in the nav/footer but 404** (new §9 below). Everything else is _loading_ work the dev side does without you.

**Launch model (decided 2026-06-24, dates updated 2026-07-27):** the launch is **phased**. **Soft launch** goes out with the content already in hand (everything in §8 below, placed) to gather feedback. **Hard launch** follows the All Hands photo/video shoot (§3) — **now September, moved from August** — plus the named case-study sign-offs (§1.F). So the §3 shoot and the §1.F permissions are **hard-launch** gates; the rest of this list should land for the soft launch.

**What changed on 2026-07-27:** the **Hank and Brent interviews are filmed** (with the localshoring content) and are in edit. Everything in §1 and §2 below that read as "we need to get Hank in a room" is now **extraction from a transcript** — we can draft it without the finished cut and without another meeting. What is genuinely still outstanding from people: the **client sign-offs** (§1.F), the **September shoot** (§3), and the **small confirmations** (§6). **§5 is resolved** — the assessment turned out to be fully recoverable from the live site (it was never ScoreApp), so it is a build decision now, not an ask.

---

## 1. Hank interview — the critical path (with Justin + Megan)

**✅ FILMED 2026-07-27 — in edit.** This session happened, along with Brent's (§2) and the localshoring content. Source guide: `docs/content-drafts/hank-interview-followup.md`. The items below still **cannot be fabricated**, but they are no longer waiting on Hank's calendar — they are waiting on a transcript, which we can pull off the raw audio ourselves rather than waiting for the editor. Items B–F below are the extraction checklist: confirm each one is actually answered on tape, and flag anything that isn't as a short follow-up rather than a re-shoot.

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

- **Taurex** (via **Andrew**) — **chase this one first.** Four Taurex studies are already written (`taurex` live on staging, plus partnership / eticketing / repair drafted with banner art done), and all three outstanding quote slots are Taurex people (Dustin, a field rep or district manager, Chad). One conversation clears the soft-launch "one named, signed study" gate, publishes four studies, and lands three quotes.
- **Hogan** (via **Ryan**) — a current client; this is **both** a case study **and** a logo on the Industry Leaders strip.
- **NovaMud** (via **Sam**) — the **flagship** (the existing study, the only one with metrics); need it made specifically about them + permission to name them.
- **Well Checked** (via **Mike**) — the sign-off is believed easy, but we are lukewarm on the content (2026-07-27). Treat it as a **logo / permission** item, not a case-study chase.

Kenn has sign-off from **nobody** yet — Megan is tracking the project histories + sign-offs for website use. This is a hard-launch gate (relational branding: named, signed studies only — anonymous studies are dropped). **Logo note:** **BOK** is a **logo only** (current client, not a case-study target); **ONEOK + QuickTrip are a NO for case studies** (their logos may still be fine). See "Logos" below.

**Logos — Industry Leaders strip (audit + curation, Megan owns).** The current strip was copied as-is from the live seqtek.com site, and the 2026-06-24 meeting **re-opened whether we actually have permission to show these** (the earlier "the logos run publicly, so we're covered" assumption was softer than the conversation). Working assumption: if no client has objected to marks already running publicly, they're probably fine — but **Megan owns curating the showcase list and chasing logo permission** with Hank/Brent before launch. Full meeting audit:

- **Keep / current:** **Hogan**, **BOK**, **QuickTrip** (all current clients).
- **Stale — drop or refresh:** **GE** (the Lovekin project, ~10 yr ago), **AVB** (last work ~5 yr ago), **Change Health** (~6 yr ago).
- **Verify first:** **ONEOK / ONE Gas** — confirm SEQTEK ever did work with them at all (Kenn doesn't recall any).
- **Case-study exclusions:** **ONEOK + QuickTrip are a NO for case studies** (logos only, if at all).

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

## 4. HubSpot (Chad Coleman, portal admin)

- **Contact form GUID — ✅ DONE (PR #76, 2026-06-29).** The live Contact-form GUID is wired; the `/contact` form renders and posts to HubSpot. Workshop Inquiry form GUID was wired earlier (PR #74). _Remaining verify (not a content gap):_ confirm a test submission lands in the HubSpot portal and the inquiry-type dropdown values match.
- **Book-a-call — interim decision implemented.** Every "Book a Call" CTA (header, footer, in-page service/workshop CTAs) now points at the `/contact` form — the link audit found they previously pointed at `/contact/book-a-call`, which **404s** (no such route). _Still open:_ if we want a true calendar-booking experience, set up a HubSpot Meetings link and repoint the CTAs (the `HubspotMeetings` block already exists). The old site has no booking link to reuse.

---

## 5. Organizational Maturity Assessment (was "ScoreApp — Daniel runs it")

## ✅ RESOLVED 2026-07-27 — this is no longer a content gate

**The live assessment is not ScoreApp, and we have recovered all of it.** The live page `/organizational-strategy-1-5` (title "Assessment | SEQTEK") hosts a **hand-built HTML/JS form** injected via a Wix HtmlComponent iframe, posting to a **Make.com webhook**. There is no ScoreApp, Typeform, Jotform or SurveyMonkey anywhere on the live site (swept all 77 pages in its sitemap), and the vanity subdomains `seqtek.scoreapp.com` / `seqtechllc.scoreapp.com` are unclaimed.

**Why every earlier doc thought this was missing:** the Wix content audit's Playwright pass **timed out on this exact URL** (`networkidle` never settles — HubSpot and visitor-analytics keep polling), so `page-content.json` stored an error string instead of the page. It fell out of the pipeline silently.

**The full instrument is captured in `docs/content-drafts/organizational-maturity-assessment.md`:** 40 statements, 4 sections of 10 (Organizational Strategy & Design · Leadership & Culture · Technology & Data · AI & Automation), 1–5 Likert, required lead fields Name / Organization / Title / Email / Phone, plus the intro copy and the exact scoring payload.

**What is actually left is a decision, not an ask:** rebuild the form natively against HubSpot (consistent with the Workshop and Contact forms, leads land in the CRM) or keep the Make webhook and re-embed. Worth asking whoever owns the Make scenario what it does downstream before choosing. Note also that the shipped form **shows the respondent no score** — the section averages and heatmap are written but commented out; switching them on is the cheapest upgrade to the lead magnet.

**Working plan: rebuild natively against HubSpot** (like the Workshop and Contact forms) so leads land in the CRM, keeping the instrument and dropping the Make plumbing. Before committing to that, ask Daniel the full set below. The answers could reveal downstream automation worth preserving, or that the assessment is dormant and should be cut rather than rebuilt.

**Draft email to Daniel:**

> **Subject: Maturity assessment: ScoreApp, Make, and whether we're keeping it**
>
> Hey Daniel,
>
> I'm rebuilding the assessment for the new site and there are a few things I can't work out from the outside. Quick brain dump.
>
> **ScoreApp**
>
> 1. Do we have a ScoreApp account, and is there a SEQTEK assessment in it? My notes say you run one, but I can't find any trace of ScoreApp on the current site.
> 2. If it exists: what's the link, what does it measure, and is it live or parked? Are we paying for it?
>
> **The assessment running today**
>
> The page at seqtek.com/organizational-strategy-1-5 runs a custom HTML form that posts to a Make.com webhook. It isn't ScoreApp.
>
> 3. Do you know who built it, and who owns the Make scenario?
> 4. What does that scenario do after someone submits? Where do the responses land, and does it create a HubSpot contact or does it sit outside the CRM entirely?
> 5. Is anyone actually watching it? Roughly how many submissions have come through, and has anyone followed up on them?
>
> **The promise we're making**
>
> The form tells people: "we'll review your responses, build a concise results summary with recommendations, and follow up with you."
>
> 6. Who writes that summary today, and is there a template? If any have gone out, send me one. I want the new page to describe the deliverable accurately instead of guessing at it.
>
> **The bigger question**
>
> 7. Do we still want an assessment on the new site at all? If yes, I'd rebuild it natively so leads land in HubSpot with everything else, and I'd probably show people their scores at the end (the current one calculates them but never displays them). If it's been dormant and nobody wants to own the follow-up, I'd rather cut it than launch a form that quietly collects leads nobody works.
>
> No rush on 1 through 6, and "no idea" is a fine answer to any of them. Number 7 is the one I'd like settled before launch.
>
> Thanks,
> Kenn

---

**Superseded — the 2026-06-30 ScoreApp-URL framing, kept for context:**

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

- **8 case studies** with full narratives — the 5 published on staging, plus **3 more Taurex studies** (partnership, eticketing, repair) drafted 2026-07-16 with banner art done, held only for their quotes. NovaMud is flagship-ready bar a hero image + named quote.
- **6 blog posts**, full bodies.
- **Four peer service offerings** (Localshoring, AI Integration, Digital Transformation, Workshops) rendered as block Pages by slug, full copy + FAQs. (The old 3-pillar service IA — 9 services across 3 pillars — was retired in the #79–#83 restructure; the `services`/`servicePillars` collections still exist but are no longer publicly routed.)
- **Touchstone landing**, full copy + CrossCo proof video/photos (cleared).
- **Hank & Dana bios**, publish-ready.
- **Sequoyah name story** — written and **live on `/about`** + companion video (the old-feather Sequoyah Technologies logo is the swap-in for its current quill-panel placeholder).
- **Values** (7 pairs), **Mission/Vision**, **About** founding narrative (name story + "gap nobody would fix" + "through the bust" — through ~2004). Still pending: the 1999→now 25-year timeline — **on tape as of 2026-07-27**, awaiting transcript extraction (§1.C).
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
| `/resources/organizational-maturity-assessment`              | Removed from footer           | **Assessment page** — content unblocked 2026-07-27 (full 40-question instrument recovered, §5); needs a build decision  | Kenn           | Important                     |

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
