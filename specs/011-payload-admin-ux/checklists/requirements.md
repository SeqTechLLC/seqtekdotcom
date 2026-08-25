# Specification Quality Checklist: Payload admin UX for content self-serve

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-21
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

**Validation pass 1 (2026-08-21)** — all items pass. Specific checks applied:

- **Implementation detail scan**: the audit that motivated this spec was conducted against
  concrete CMS configuration APIs. Those names were deliberately kept out of the spec and
  deferred to the plan. Requirements are phrased as observable admin behaviour ("publish
  state is visible as a default column", "every image record renders a visual preview")
  rather than as the configuration keys that produce it. Domain nouns that name the
  product surface itself (block picker, global, collection, record type) are retained
  because removing them would make the requirements unreadable, not more abstract.
- **Clarification markers**: zero. The two decisions that would otherwise have been
  `[NEEDS CLARIFICATION]` were resolved with the project owner before drafting — scope
  (Tier 1 + Tier 2 of the audit) and the site-chrome ownership question (chrome stays
  code-owned). Both are recorded in Assumptions with their rationale and a revisit
  condition.
- **Testability**: FR-001 states a property ("nothing editable is inert") that would be
  unfalsifiable on its own; FR-008 pairs it with a required automated audit, and SC-002
  binds that audit to CI. The same pairing exists for block metadata (FR-009 through
  FR-011 with FR-013 and SC-009).
- **Non-regression**: FR-028 through FR-031 and SC-006/SC-007 exist because this feature
  deletes schema and hides globals. The risks that removal poses to already-stored content
  and to the gitignored content-drafts seed files are captured as requirements, not left
  to the implementation to notice.

**Carried into planning** — not spec defects, but decisions the plan must make explicitly:

1. SC-003 (block-selection accuracy) is a usability outcome, not a unit-testable
   assertion. The plan must name its verification method under the constitution's
   external-verification carve-out (Principle II) or replace it with a proxy that CI can
   check.
2. FR-031 (content stored only in fields being removed) requires an inventory step against
   real data before any destructive migration is written. The plan must sequence that
   inventory ahead of the migration tasks.
3. FR-006 (parking record types with no public route) has more than one viable
   implementation. The plan should pick one and record why.
