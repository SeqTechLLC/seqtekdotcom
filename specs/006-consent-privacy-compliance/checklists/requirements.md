# Specification Quality Checklist: Consent & Privacy Compliance

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-06-03
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Items marked incomplete require spec updates before `/speckit-clarify` or `/speckit-plan`.
- **Tension noted, not a blocker**: the spec names concrete consent signals (`analytics_storage`, `ad_storage`, …), specific tags (8 Meta Pixels, LinkedIn Insight Tag, Google Ads `AW-810041431`), the `/privacy-policy` route, and the `docs/CSP_VIOLATIONS_KNOWN.md` / `infra/gtm/container.json` artifacts. These read as "implementation detail" against the strictest reading of the Content Quality items, but they are **domain vocabulary and named external integration points** carried over verbatim from `docs/INTEGRATIONS.md` (the source of truth), not a prescription of how to build. They are retained because removing them would make the requirements untestable (you cannot verify "advertising is blocked" without naming the advertising signals/tags). Consistent with how specs 004/005 referenced concrete routes, blocks, and GUIDs.
- **External-config soft blocks** (GTM Container ID, HubSpot portal Privacy & Consent settings, Wix pixel IDs) are documented as Dependencies, mirroring spec 005's form-GUID seam. Live verification (SC-001/002/003) is gated on them; the code-owned work (privacy route, footer control, CSP enforce machinery, known-violations doc, E2E harness) is not.
