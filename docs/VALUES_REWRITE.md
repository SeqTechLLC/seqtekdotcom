# SEQTEK Core Values: Behavioral Rewrite (Draft)

**Date:** 2026-05-20
**Status:** Accepted — Hank signed off the seven values 2026-06-19 (faith framing approved); values live on `/about`.
**Resolves:** ROADMAP `BR-4` (resolved 2026-06-19)
**Depends on:** `CONTENT-REQUIREMENTS.md` §1.4 (current values audit), `BRAND_STRATEGY_RESEARCH.md` §1
**Source:** Current values text is verbatim from `~/projects/seqtek-internal/brandkit/brandkit.pdf` (2024 SEQTEK Internal Brand Kit), p. 4.
**References:** Lencioni, _The Advantage_ (2012); Patagonia core values; Bain "True North"; Asana company values.

---

## Why this rewrite

The seven value **names** are fixed in the brand kit and are not changed here: Respect, Diligence, Improvement, Excellence, Trust, Value, Humility. The **descriptions** in the kit are aspirational virtues ("Be excellent in everything we do") rather than observable behaviors. Per `CONTENT-REQUIREMENTS.md` §1.4, this is the textbook pattern Patrick Lencioni warns against in _The Advantage_: values that can't be measured, disproved, or used for a hiring or firing decision are decoration, not direction.

This rewrite targets two bars at once:

1. **Behavioral (internal).** Each value names an observable action the firm can hold itself to. A new hire reading the value should be able to tell whether they're doing it. A senior leader should be able to point to a specific behavior that violated it.
2. **Marketing-friendly (external).** Each value is a short promise a prospective client can recognize as concrete. "We're excellent" is generic; "We hold quality above speed, and we tell you when the two conflict" is a claim someone could verify in a real engagement.

These bars are not mutually exclusive. Patagonia's _"Build the best product, cause no unnecessary harm"_ satisfies both. Bain's _"True North: uncompromised integrity, results not reports, one global team"_ satisfies both. The proposed rewrites below try to land at the same intersection.

**Pattern / anti-pattern format.** Each value carries two short sentences: what we do (the pattern) and what we don't do (the anti-pattern). This is Lencioni's stronger form. The pair sharpens contrast: a value statement without an antonym is harder to falsify, easier to ignore. With both, a buyer can recognize the promise and a teammate can recognize the violation.

## Constraints

- The seven value **names** are fixed by the brand kit.
- Each value carries **two sentences**: one pattern ("We do X") and one anti-pattern ("We don't do Y").
- Each starts with **"We"** (promise grammar, not aspirational grammar).
- Each describes a **specific behavior** that can be observed, recognized when violated, and used in feedback or review.
- "Core intent" is preserved. The rewrites interpret each value's spirit; they do not redefine it.
- **No em dashes.** This text becomes public-facing copy in the values section of `/about`. Common punctuation only (commas, periods, colons, semicolons, parentheses).
- **Order is by marketing arc**, not brand-kit alphabetical. See "Why this order" below.

## Why this order (not brand-kit order)

The seven values are reordered to move through a buyer journey rather than alphabetical brand-kit sequence:

1. **Trust opens.** The Lencioni Five Dysfunctions stack starts at trust; Touchstone Workshops are built on the same foundation; ADR 0003 ties the brand depth to systems that scale capability, which only work if trust is in place. Trust first is the spine.
2. **Value follows.** The differentiating promise (outcomes over hours) is what a buyer is most likely to remember and quote back to a colleague.
3. **Excellence and Diligence** describe _how_ we deliver. Quality over speed (Excellence) and right thing every time (Diligence) work as a pair: the quality bar and the consistency bar.
4. **Humility and Improvement** describe _how we engage_. Humility (learn your business first) is the opening posture; Improvement (feedback both ways) is the closing posture. Together they bracket the engagement.
5. **Respect closes.** Universal dignity (everyone we work with) runs underneath everything. Placing it at the end frames it as the ground rather than the headline. Quieter, warmer, durable.

## Side-by-side (proposed)

| #   | Value           | Current (brand kit p. 4, verbatim)                          | Pattern ("We do…")                                                                       | Anti-pattern ("We don't…")                                            |
| --- | --------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1   | **Trust**       | _Intentionally developing, maintaining, and building trust_ | We do what we said we'd do, and we tell you hard truths before someone else does.        | We don't go dark when projects get hard.                              |
| 2   | **Value**       | _Create value in every hour worked_                         | We measure ourselves by the outcomes you keep, not the hours we billed.                  | We don't bill for work that didn't move your business forward.        |
| 3   | **Excellence**  | _Be excellent in everything we do_                          | We hold quality above speed, and we tell you when the two are in conflict.               | We don't ship work we wouldn't sign our name to.                      |
| 4   | **Diligence**   | _Doing the right thing every time_                          | We do the right thing every time, even when it costs us and even when nobody's watching. | We don't cut corners when a deadline gets tight.                      |
| 5   | **Humility**    | _Put others before yourself_                                | We learn your business before we tell you ours, every engagement, every time.            | We don't lead with templates from the last client.                    |
| 6   | **Improvement** | _Continuously improving ourselves and our processes_        | We leave every engagement with feedback for you, and feedback for ourselves.             | We don't recycle last engagement's recommendations as if they're new. |
| 7   | **Respect**     | _Respect everyone we interact with_                         | We treat your team, your vendors, and our team with the same dignity.                    | We don't blame your team when something goes wrong.                   |

**Source verification:** The "Current" column is pulled verbatim from the 2024 SEQTEK Internal Brand Kit, page 4. The Pattern column preserves brand-kit intent and adds falsifiable behavior. The Anti-pattern column names the most common industry violation each value pushes against.

## Rationale per value

**Trust (lead).** Doing what we said we'd do is the floor; telling hard truths before someone else does is the ceiling. The construction maps directly to Lencioni's Five Dysfunctions stack (absence of trust leads to fear of conflict); this is the same trust the Touchstone Workshops are built around. The anti-pattern "going dark when projects get hard" is the single most common consulting failure mode that destroys trust. Naming it explicitly closes the loophole that polite-sounding values leave open.

**Value (second).** Outcome over output is the consulting differentiator clients actively ask for and almost never get. "Outcomes you keep, not the hours we billed" inverts the standard agency billing model and is verifiable: a quarterly review can name specific outcomes the client retained six months past handoff. The anti-pattern "billing for work that didn't move your business forward" calls out the consulting practice clients complain about most often in post-mortems.

**Excellence (third).** "Be excellent" cannot be falsified. Reframing it as a trade-off ("quality above speed") names the actual decision excellence requires, and "we tell you when the two are in conflict" makes it visible. The anti-pattern "don't ship work we wouldn't sign our name to" is the personal-accountability test: a consultant either would or wouldn't put their name on the deliverable.

**Diligence (fourth).** Brand-kit intent is "right thing every time": broader than follow-through, closer to consistent ethical action. The Pattern keeps the brand-kit phrase verbatim as the spine and adds two falsifiable extensions. "Even when it costs us" is the cost test; "even when nobody's watching" is the unobserved test. The anti-pattern "don't cut corners when a deadline gets tight" names the exact moment diligence usually breaks.

**Humility (fifth).** "Don't pretend to know the client's business" is the consulting failure mode most often cited by clients in post-mortems (Demand Gen Report 2024 cites "content too generic" as the top complaint). The "every engagement, every time" closure makes it a recurring discipline, not a one-time onboarding ritual. The anti-pattern "don't lead with templates from the last client" is the operational form of arrogance most likely to show up in a kickoff meeting.

**Improvement (sixth).** Continuous improvement is meaningless unless it's _both sides_. The "for you, and feedback for ourselves" framing names a specific artifact (post-engagement feedback) that can be checked: did we leave a recommendation? Did we capture what we'd do differently? The anti-pattern "don't recycle last engagement's recommendations as if they're new" is the lazy-consulting failure mode that the Pattern explicitly forbids.

**Respect (close).** Brand-kit intent is universal: "everyone we interact with." Most consultants are deferential to clients and dismissive of vendors and internal staff. The promise here is _symmetric_ dignity across the whole chain. The test: would a SEQTEK consultant treat a client's third-party vendor the same way they treat the client's CFO? The anti-pattern "don't blame your team when something goes wrong" names the most common dignity violation in a difficult engagement.

## Status: accepted — leadership signed off

The launch-readiness assumption held: leadership engaged when a launch-ready site was in front of them. Hank reviewed the rendered values on `/about` and **signed off on 2026-06-19**, including the faith framing flagged below. The seven Pattern / anti-pattern pairs are no longer placeholder copy — they are the live, approved values, and they render in the values section of `/about`.

What still needs to happen:

1. **Voice consistency pass** (optional, any time). A 30-minute read of the fourteen sentences against `BRAND_STRATEGY_RESEARCH.md` §5+§8 (specific-over-generic trust-signal principle). Content-lead nicety, not a gate — the copy is already approved.
2. ~~**Page integration spec for the values section.**~~ Done — the Pattern / anti-pattern pairs render as the values section of `/about`. Open follow-ups (whether leadership bios reference individual values; whether the lead value, Trust, surfaces in the homepage trust block) live in `CONTENT-REQUIREMENTS.md`.
3. ~~**Launch-readiness leadership review.**~~ Done — Hank signed off 2026-06-19, reading the values in context on `/about`. This was the moment the values became real.
4. **Doc closure.** With sign-off complete, `BR-4` is resolved; this doc can move to `PROJECT_HISTORY.md`, and the approved values are the live `/about` values-section copy (mirror into `CONTENT-REQUIREMENTS.md` §1.4 if not already done).

## Resolved during draft

- ~~**Display order.**~~ Resolved 2026-05-20: marketing-arc order (Trust, Value, Excellence, Diligence, Humility, Improvement, Respect). See "Why this order" above.
- ~~**Anti-values pairing.**~~ Resolved 2026-05-20: pattern / anti-pattern pair is the v1 format, not a v2 enhancement.
- ~~**Leadership approval as a dev-phase blocker.**~~ Reframed 2026-05-20: leadership engagement happens at launch readiness, not during dev. Kenn-approved placeholder ships into Phase 3 page work; leadership signs off in Phase 5.5.

## Adjacent findings from the brand kit (informational, not blockers for this doc)

- **Mission statement carries a built-in Diligence echo:** _"saying what we do, doing what we say and supporting what we have done."_ Useful framing for the `/about` story-section copy: the Diligence value description and the mission statement reinforce each other.
- **Founding date is August 29, 1999** (not just "1999"). Worth surfacing in the `/about` story section and feeding into the BR-5 stats line ("25+ years").
- **Brand story includes explicit faith framing** ("biblical principles," "grace and trust"). Internal-brand-kit content; **approved for the public site by Hank on 2026-06-19** alongside the values sign-off. Surfaces in the `/about` story section.

## Next steps

1. Content lead voice pass against `BRAND_STRATEGY_RESEARCH.md` §5+§8 (optional; copy already approved).
2. ~~Engineering builds the values section using this text as placeholder content.~~ Done — the values render in the values section of `/about`.
3. ~~Launch-readiness review: leadership reads the rendered page line-by-line.~~ Done — Hank signed off 2026-06-19 (faith framing approved).
4. Close this doc and move it to `PROJECT_HISTORY.md` as `BR-4` resolved; ensure the approved values are mirrored into `CONTENT-REQUIREMENTS.md` §1.4.
