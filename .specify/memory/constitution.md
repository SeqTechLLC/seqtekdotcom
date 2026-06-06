<!--
SYNC IMPACT REPORT — v1.2.0 (amended 2026-06-06)

Version change: 1.1.0 → 1.2.0
Bump rationale: MINOR — adds an explicit carve-out to Principle II for config-,
decision-, and documentation-only user stories whose load-bearing path is external to
this codebase. Such a story MAY substitute a verification deliverable (captured staging
evidence, a re-export/diff, or a doc-review acceptance) for the mandated automated test,
provided the in-repo substrate it depends on is already CI-covered and the substitution
is declared in the plan's Constitution Check. No principle removed or redefined; the
"test what matters / do not pad" intent of Principle II is unchanged.

Driver: spec 006 (gated consent tail) + spec 008 (GTM pixel activation). Both contain
user stories that are pure external GTM/ad-platform configuration, a versioned container
export, or a recorded compliance (CAPI) decision — none with an in-repo code path that
could be tested without padding. The consent gating those stories rely on is already
covered by spec 006's `tests/e2e/consent-flows.e2e.spec.ts`.

Modified principles:
  II. Tests Gate Merge → adds the external-verification carve-out (new paragraph before
     the Rationale). The mandate for automated tests on code paths is unchanged.

Modified sections: none.
Added sections: none.
Removed sections: none.

Templates requiring updates:
  ✅ .specify/templates/tasks-template.md — Tests note updated to reference the carve-out.
  ✅ .specify/templates/plan-template.md — no structural change; the Constitution Check
     section picks up the carve-out at plan time (the plan declares any substitution).
  ✅ .specify/templates/spec-template.md — no structural change.

Follow-up TODOs: none.

------------------------------------------------------------------------------
PRIOR ENTRIES

SYNC IMPACT REPORT — v1.1.0 (amended 2026-05-24)

Version change: 1.0.0 → 1.1.0
Bump rationale: MINOR — adds new material guidance under Principle IV (dependency-trust
review for load-bearing security-path deps + CI audit gate) and under Principle I
(read-the-source requirement for plans implementing against framework internals). No
existing principle removed or redefined.

Driver: spec 001 / D-14 lessons.
  1. `payload-auth-plugin@0.7.13` was adopted in ADR 0002 + the spec 001 plan without a
     trust-surface review. Mid-implementation the plugin's exact-pinned `js-cookie 3.0.5`
     (HIGH CVE) and `uuid 11.1.0` (MODERATE) surfaced via npm audit, and a route-naming
     docs error + a 305-star / single-maintainer bus factor triggered a mid-spec pivot to
     a custom integration. ADR 0002 listed that fallback. A trust review at planning time
     would have picked the custom path on day one and saved the pivot churn.
  2. The custom integration then bounced through three additional "read the Payload source
     to find what's actually required" rounds (sessions table conditional on
     `disableLocalStrategy.enableFields`, JWT strategy auto-registration skipped when
     local strategy is disabled, Sec-Fetch-Site CSRF check in extractJWT). ADR 0002's
     "~50 LOC custom strategy" estimate was wrong by 5x — would have been correct if the
     plan had read `node_modules/payload/dist/auth/{getAuthFields,sessions,strategies/jwt,
     extractJWT}.js` before estimating.

Modified principles:
  I. Spec Before Code → adds "read the source" requirement for plans implementing
     against framework internals (new third paragraph).
  IV. Security Baseline → adds dependency-trust review for load-bearing runtime deps,
     ratifies the CI npm-audit gate at `--audit-level=high` against the prod tree (new
     paragraphs at end of the principle's body).

Modified sections:
  Development Workflow → adds a bullet ratifying the CI dep-audit gate.

Added sections: none.
Removed sections: none.

Templates requiring updates:
  ✅ .specify/templates/tasks-template.md — no structural change; gates are derived
     per-feature.
  ✅ .specify/templates/plan-template.md — no structural change; the existing Constitution
     Check section picks up the new guidance via plan-time evaluation. Plans that touch
     framework internals are expected to list the source files read in their Technical
     Context, but that's a content addition the planner makes, not a template field.
  ✅ .specify/templates/spec-template.md — no structural change.

Follow-up TODOs: none. The CI dep-audit gate ratified here was already implemented in
spec 001 PR #1 (commit 7af0ce8); the constitution now reflects the as-built state.


v1.0.0 (initial ratification, 2026-05-21) — first ratification; defined the five core
principles, Additional Constraints, Development Workflow, and Governance. All templates
synced at that point.
-->

# SEQTEK Company Website — Project Constitution

## Core Principles

### I. Spec Before Code (for non-trivial work)

Every non-trivial feature begins with a written spec under `specs/` produced via spec-kit
(`/speckit-specify` → optional `/speckit-clarify` → `/speckit-plan` → `/speckit-tasks` →
`/speckit-implement`). "Non-trivial" means: touches multiple files, introduces a new
integration, or changes public-facing behavior. Pure bug fixes and one-file refactors do
not require a spec.

Specs MUST cite existing canonical docs (ARCHITECTURE.md, INTEGRATIONS.md,
DESIGN_SYSTEM.md, BLOCK_LIBRARY.md, CONTENT-REQUIREMENTS.md) by section number rather than
re-deriving what is already documented. When a spec discovers a gap in those docs, it
fixes the doc in the same change.

**Rationale**: The project has a deep doc layer. Specs that compose against those docs
stay short, reviewable, and consistent. Specs that re-derive from scratch drift.

**Plans against framework internals MUST enumerate the source files read.** When a
plan estimates LOC or design against undocumented or partially-documented framework
behavior (Payload, Next.js, Drizzle, etc.), the Technical Context section MUST list the
`node_modules/...` files the planner read before settling on the approach. The custom
auth integration in spec 001 was originally estimated at "~50 LOC against
`google-auth-library`" in ADR 0002; the real cost was ~250 LOC across two routes plus
two helper files, and the gap was entirely undocumented Payload internals
(`getAuthFields.js`'s conditional sessions field, `index.js`'s conditional JWT strategy
registration, `extractJWT.js`'s Sec-Fetch-Site CSRF check). Reading those files at plan
time would have closed the estimate gap and avoided four mid-implementation pivots.

**Rationale**: "I'll figure out the framework's contract during implementation" is how
LOC estimates triple. The cost of reading three or four files at plan time is hours; the
cost of discovering each gotcha mid-implementation is days plus a series of forced
mid-spec design changes.

### II. Tests Gate Merge; Coverage Does Not

CI MUST be green before merge: typecheck + lint + format:check + Vitest (integration) +
Playwright (E2E) + axe-core (a11y) + Lighthouse (a11y / best-practices / SEO ≥ 0.95) +
gitleaks. Every user story in every spec ships with at least one Vitest integration or
Playwright E2E test that exercises the load-bearing path. UI work is verified via
Playwright with screenshots, not manual clicking.

There is no coverage-percentage gate. Test what matters (access control functions,
Payload hooks, integrations, public render, revalidation, security-relevant code paths);
do not pad coverage on view components.

Performance budgets (Performance / LCP / TBT / CLS) are staged as warnings during Phase 1
and flip to errors in Phase 5 "Polish" per ARCHITECTURE.md §7. Accessibility,
best-practices, and SEO budgets gate from day one.

**External-verification carve-out (config / decision / documentation stories).** A user
story whose load-bearing path lives outside this codebase — external GTM/ad-platform
configuration, a versioned third-party export, or a recorded compliance decision — MAY
substitute its mandated test with an explicit **verification deliverable**: a staging run
with captured evidence (e.g. a GTM fire-matrix + Network HAR), a re-export-and-diff, or a
doc-review acceptance. Two conditions hold: (a) the in-repo substrate the story depends on
is already covered by CI, and (b) the substitution is named in the plan's Constitution
Check. This is NOT a license to skip tests on code — a story that adds or changes a code
path on the load-bearing surface still ships an automated test (write-first where
practical). Precedent: spec 006's gated consent tail and spec 008's GTM activation, whose
consent gating is CI-covered while the GTM-UI wiring and CAPI decision are verified on
staging and in docs because there is no in-repo path to exercise without padding.

**Rationale**: A marketing site does not need 90% line coverage on view components — it
needs absolute confidence in load-bearing paths under every deploy. ARCHITECTURE.md §12.

### III. Docs Are Code; Reconcile in the Same Commit

When code and a spec doc disagree, fix one or the other in the same commit. Touching a
shared spec doc (ARCHITECTURE.md, INTEGRATIONS.md, DESIGN_SYSTEM.md, BLOCK_LIBRARY.md,
ERROR_PAGES.md, LOCAL_DEVELOPMENT.md, CONTENT-REQUIREMENTS.md) requires reconciling all
references that depend on the changed section.

ROADMAP open items MUST be **moved** to PROJECT_HISTORY § Phase 1 implementation (P1)
when shipped — never just checkbox-flipped. The convention is documented at the top of
PROJECT_HISTORY.md; the roadmap is the open punch list, history is the audit trail.

Non-obvious technical decisions are captured as numbered ADRs under `docs/decisions/` and
referenced by number, not re-litigated inline.

**Rationale**: The project cross-references heavily. Drift kills trust in the docs, and
docs without trust are not load-bearing.

### IV. Security Baseline Is Non-Negotiable

This is a public repository. Secrets MUST NOT enter git history under any circumstance.
Pre-commit gitleaks + CI re-scan enforce this; `--no-verify` on a commit is forbidden.

CSP is nonce-based, generated per-request in `src/proxy.ts` with `'strict-dynamic'` so
trust propagates to third-party scripts the proxy explicitly nonced. The proxy MUST stay
in report-only mode until the staging soak passes the promote-to-enforce checklist
documented in INTEGRATIONS.md §8 "Rollout mechanism".

Runtime secrets: in production and staging, AWS Parameter Store + IAM instance profile
(IMDSv2). Locally, `.env.local` only — never `.env`, never committed. Static AWS
credential variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) are not used anywhere
in this codebase.

Third-party scripts (HubSpot, GTM, and any future additions) MUST consume the
per-request nonce and respect the consent default in `src/components/integrations/`. The
two non-third-party env-driven loaders (`NEXT_PUBLIC_GTM_ID`,
`NEXT_PUBLIC_HUBSPOT_PORTAL_ID`) MUST stay env-gated so unset local-dev / CI does not hit
real third-party endpoints.

**Dependency trust on the load-bearing security path.** New runtime dependencies on the
auth / session / secret-handling / public-render path require a brief trust review in the
ADR or implementation PR that introduces them. The review notes:

- **Maintainer surface**: stars (rough trust proxy), maintainer count (bus factor),
  last-push recency, repo archived/disabled state.
- **Pinning style**: caret ranges on transitive deps OK; exact-pinned vulnerable versions
  (especially of common targets like `js-cookie`, `uuid`, `node-fetch`, `axios`) are a
  smell — they block npm's normal patch flow.
- **`npm audit --omit=dev` at install**: must be clean of **high or critical** findings.
  Moderate findings inside the framework's own tree (`payload`, `next`) are accepted
  with a note when no upgrade path exists.

A dependency below roughly 1k stars **or** with a single named maintainer on the
load-bearing path SHOULD prefer a custom integration against well-known primitives
(`jose`, `oauth4webapi`, Node `crypto`, `@aws-sdk/*`) over adopting the dep. Spec 001 /
ADR 0002 walked this path in reverse: it adopted `payload-auth-plugin@0.7.13` (305 stars,
one maintainer, exact-pinned `js-cookie 3.0.5` HIGH CVE + `uuid 11.1.0` MODERATE) then
pivoted to a custom integration mid-implementation. A trust review at plan time would
have picked custom on day one.

**CI dep-audit gate (ratified 2026-05-24)**: `npm audit --omit=dev --audit-level=high`
MUST be a step in CI's `quality` job (currently `.github/workflows/ci.yml`). Fails CI
on any new high or critical vulnerability against the production dep tree. Devs override
only with an inline ADR-style note explaining why the finding is acceptable AND a
follow-up issue tracking the upstream fix.

**Rationale**: ARCHITECTURE.md §6. One accidental commit equals a permanent leak. Every
hardening layer here exists because the next layer cannot recover the loss. The dep
review is the same idea: an unreviewed dep on the auth path is a single supply-chain
event away from a permanent compromise, with no second line of defence.

### V. Bleeding-Edge Stack, Pinned and Defensive

Next.js 16 + React 19 + Payload 3.84+ + Tailwind v3 + Lexical is the validated stack
(spike D-13). Versions in `package.json` are load-bearing — they are not aspirational.

If a future minor bump breaks the combo, downgrade **Next** first, never Payload —
Payload is the constraint. Tailwind v4 was evaluated and rejected (ADR 0001); re-evaluate
only when Payload v4 supports it.

Deprecation warnings MUST be addressed as they surface, not accumulated. Recent precedent:
Next 16's `middleware.ts` → `proxy.ts` rename was migrated the same day it appeared; the
`@next/next/no-before-interactive-script-outside-document` Pages-Router-era lint rule was
disabled the same day. Migrate or document the deferral; do not leave warnings in the
build output.

**Rationale**: ROADMAP Risk #2. Bleeding edge is a feature, not a liability, only if the
team treats every deprecation as a signal to act.

## Additional Constraints

- **Conventional Commits**: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`,
  `style:`, `perf:`, `ci:`, `build:`. Scope optional (`feat(layout):`). Subject line
  under ~70 characters; details go in the body. Co-author trailers preserved.
- **Branch naming**: `spike/*` for spikes, `feat/*` for features, `fix/*` for fixes.
  `main` is always deployable.
- **No force-push to `main`**. No `--no-verify` on commits. No amending commits already
  pushed to a shared branch.
- **TypeScript strict mode**; no `any` (use `unknown` and narrow). ESLint + Prettier
  enforced in CI; lint-staged on pre-commit.
- **Tooling and scripts** live in subdirectories, not the repo root. The root stays
  clean: config dotfiles + canonical app structure (`src/`, `tests/`, `public/`,
  `docs/`, `.github/`, `.specify/`, `infra/` when added).
- **Private SEQTEK assets** (brand kit PDF, Logos zip, Wix content audit) live outside
  this repo at `~/projects/seqtek-internal/brandkit/` and
  `~/projects/seqtek-internal/audit/`. Never committed.
- **Design tokens** live in DESIGN_SYSTEM.md §14. They translate into
  `tailwind.config.mjs` (ramps + state colors hard-coded; semantic colors via
  `var(--color-…)`) plus `:root` CSS custom properties in
  `src/app/(frontend)/styles.css`. The doc wins on values; the config is the published
  API.
- **Phase boundaries**: Phase N items do not ship before Phase N-1 prerequisites; see
  ROADMAP.md §4. Cross-phase dependencies are explicit (e.g., Payload globals in Phase 2
  unblock the placeholder shape in `src/lib/site-content.ts`).
- **D-1 / D-13 / P1-\* IDs are stable references**. When closing an item, preserve the ID
  in the PROJECT_HISTORY entry so old commits and tickets resolve.
- **CI dep-audit gate** (ratified in v1.1.0 per Principle IV): the `quality` job runs
  `npm audit --omit=dev --audit-level=high` against the prod tree. Fails CI on any new
  high or critical vulnerability. Suppress only with an inline justification + tracking
  issue.

## Development Workflow

- **Spec-kit for non-trivial features**: `/speckit-specify <description>` →
  `/speckit-clarify` (optional, recommended for ambiguous features) → `/speckit-plan` →
  `/speckit-tasks` → `/speckit-implement`. Branch numbering is sequential per
  `.specify/integration.json` (`001-foo`, `002-bar`, …).
- **Each P1-\* ROADMAP item** ships as a single commit (or a tight series) with a
  conventional-commit message, tests, and any doc reconciliation in the same change.
- **PR review** (when a PR exists): all CI jobs green; reviewer confirms doc/code parity
  on any touched shared spec.
- **Lighthouse budgets**: a11y / best-practices / SEO must hit ≥ 0.95 from day one.
  Performance / LCP / TBT / CLS are staged as warnings; ROADMAP Phase 5 "Polish" flips
  them to errors once the real archetype pages are tuned.
- **CSP rollout**: dev = report-only (`CSP_MODE` default). Staging soak follows the
  promote-to-enforce checklist in INTEGRATIONS.md §8. Production flips to enforcing in
  Phase 5; the checklist sign-off is recorded in the cutover ticket.
- **Maintenance mode**: when shipped, the proxy MUST allow `/api/health` through so the
  ALB does not begin replacing instances during a planned outage (ERROR_PAGES.md §4).
- **Memory and skills**: project-scoped Claude session memory lives outside this repo
  (`~/.claude/projects/-home-kenn-…/memory/`); CLAUDE.md is the in-repo standing
  guidance. The constitution is the standing rules; CLAUDE.md is the current-state
  pointer.

## Governance

This constitution supersedes ad-hoc conventions. When in doubt, defer first to its
principles, then to ARCHITECTURE.md (for technical decisions) or ROADMAP.md (for
sequencing and status).

**Amendments**: any PR may propose a constitution change. The amendment PR MUST (a)
update this file, (b) propagate to `.specify/templates/*` if the change affects
spec/plan/tasks structure, (c) note the version bump and rationale below, and (d) update
the Sync Impact Report at the top of this file.

**Versioning**: semantic.

- **MAJOR** — backward-incompatible principle removal or redefinition.
- **MINOR** — new principle or materially expanded guidance.
- **PATCH** — clarifications, wording, typo fixes, non-semantic refinements.

**Compliance review**: spec-kit's `/speckit-plan` runs a Constitution Check gate against
this file before Phase 0 research. `/speckit-analyze` performs the cross-artifact
consistency check after `/speckit-tasks`. Both are advisory but recommended for any
multi-day feature.

**Runtime guidance**: `CLAUDE.md` carries the current-state pointer (active phase,
recent decisions, in-flight conventions). This constitution carries the standing rules.
When the two disagree about a rule, this constitution wins; CLAUDE.md is updated in the
same commit.

**Version**: 1.2.0 | **Ratified**: 2026-05-21 | **Last Amended**: 2026-06-06
