# Phase 1 Data Model: Launch Hardening & A11y/Perf Polish

**No persistent data entities.** This feature changes presentation, robustness, and test coverage — it adds **no** Payload collection, field, global, or migration, and reads only. The "entities" below are the conceptual artifacts the work produces and reasons about; they are documented here because the tasks and contracts reference them, not because they hit the database.

---

## 1. Accent-usage classification (US1)

The audit produces a classification for every accent-family utility usage under `src/`. Each row drives exactly one of three actions.

| Field              | Values                                                                                    | Notes                               |
| ------------------ | ----------------------------------------------------------------------------------------- | ----------------------------------- |
| `location`         | `file:line` + className snippet                                                           | the usage site                      |
| `role`             | `foreground-text` \| `solid-fill` \| `border-divider` \| `decorative`                     | what the accent does visually       |
| `surface`          | `white/light` \| `navy/dark` \| `mixed`                                                   | every background it renders against |
| `currentToken`     | `accent` (green-500) \| `accent-strong` (green-700) \| `text-accent`(util→green-500) \| … | as written today                    |
| `measuredContrast` | ratio vs each surface                                                                     | from axe / manual measure           |
| `verdict`          | `remediate` \| `exempt` \| `already-passes`                                               | the decision                        |
| `targetToken`      | `accent-strong` / `text-accent-strong` / `border-accent-strong` / _none_                  | for `remediate` rows                |

**Invariants**:

- `role = decorative` ⇒ `verdict = exempt` **and** the element is hidden from AT (`aria-hidden` / empty alt) where it would otherwise be announced.
- `role ∈ {foreground-text, solid-fill, border-divider}` on a `white/light` surface with `measuredContrast < AA-floor-for-role` ⇒ `verdict = remediate`.
- `surface = navy/dark` with `measuredContrast ≥` its role floor ⇒ `verdict = already-passes` (do **not** swap).
- AA floors by role: body text 4.5:1; large text (≥ 18pt or 14pt bold) 3:1; non-text UI (borders/icons that convey state/boundary) 3:1.
- Every `remediate` row that changes pixels ⇒ a re-captured showcase baseline in the same change (FR-004).

_Seed inventory (from Phase 0 exploration; confirm each at implementation):_ solid fills in `ContactCta`, `Hero`, `HomepageHero`, `NewsletterCta`, `FeaturedCaseStudy`, `ServicePillarHero`, `TwoColumn`; foreground text in `MetricDisplay`, `StatsBar`, `CaseStudyHero`, `Hero`, `HomepageHero`, `ProcessSteps`, `KeyTakeaways`, `ComparisonTable`, `FeaturedCaseStudy`, `MissionVisionValues`, `ServicePillarHero`, `WorkshopList`, `Accordion`, `FAQ`, `ContactCta`, `HubspotMeetings`, `InlineCta`; borders/dots in `Timeline`, `Deliverables`, `BrandTeaser`, `TechStack`, `Tabs`, `QuotePullquote`, `TestimonialEmbed`, `not-found`, and the `case-studies/[slug]` + `touchstone-workshops/[slug]` blockquotes; decorative wash in `Content` (`bg-accent/5`). Already-correct (`accent-strong`): `Button`, `CtaSection`, `DownloadCard`, `HubspotLeadForm`, `error.tsx`.

---

## 2. Read-timeout telemetry record (US3)

The structured warn-log emitted when a content read exceeds the 5s budget. Stdout JSON line → CloudWatch. **Full schema in `contracts/read-timeout-telemetry.md`.**

| Field       | Type                               | Source                                               |
| ----------- | ---------------------------------- | ---------------------------------------------------- |
| `type`      | `"payload_read_timeout"` (literal) | constant                                             |
| `ts`        | ISO-8601 string                    | `new Date().toISOString()` at emit                   |
| `requestId` | string \| `"unknown"`              | `headers().get('x-request-id')` (outermost layer)    |
| `reader`    | string                             | the wrapped reader label (e.g. `getCaseStudyBySlug`) |
| `args`      | string \| undefined                | e.g. the slug, for triage                            |

Not persisted; consumed by log aggregation only. Mirrors the existing `health_check_failed` / `csp_violation` log shapes.

---

## 3. In-scope route inventory (US2/US4)

The set of routes under axe + Lighthouse coverage, and whether each needs seeded content. **Full table in `contracts/a11y-perf-acceptance.md`.**

| Route                                           | Source file                          | CI-empty-DB                  | Seeded        |
| ----------------------------------------------- | ------------------------------------ | ---------------------------- | ------------- |
| `/`                                             | `(frontend)/page.tsx`                | renders                      | ✓             |
| `/team`                                         | `team/page.tsx`                      | empty grid                   | ✓             |
| `/case-studies` (+ `/[slug]`)                   | listing + `[slug]/page.tsx`          | listing renders; detail 404s | ✓ seed detail |
| `/insights` (+ `/[slug]`)                       | listing + `[slug]/page.tsx`          | listing renders; detail 404s | ✓ seed detail |
| `/services` (+ `/[pillar]`, `/[pillar]/[slug]`) | listing + dynamic                    | listing renders; detail 404s | ✓ seed detail |
| `/touchstone-workshops` (+ `/[slug]`)           | listing + `[slug]/page.tsx`          | listing renders; detail 404s | ✓ seed detail |
| `/privacy-policy`                               | `privacy-policy/page.tsx`            | renders (static)             | ✓             |
| `/about`, `/localshoring`                       | generic `(frontend)/[slug]/page.tsx` | 404 (no doc)                 | ✓ seed page   |

**State note**: there are no state transitions in this feature. The only "transition" of interest is operational — a read either **resolves < 5s** (happy path, unchanged) or **exceeds 5s** (abort → throw → `error.tsx` + warn log). That is captured as the timeout contract, not a data state machine.
