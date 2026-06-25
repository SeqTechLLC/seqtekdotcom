import { test } from '@playwright/test'

// T079 (US2 / SC-007) — staging-tagged: publish a content change and assert
// the public route reflects it within 60 seconds.
//
// **Status:** skeleton — deferred until spec 004 (Phase 3 page templates)
// lands. The public routes this test would observe (`/insights/<slug>`,
// `/case-studies/<slug>`, `/services/<offering>`, `/<slug>`) don't
// exist yet, so a publish-then-observe loop can't be wired end-to-end.
//
// The revalidation surface itself is already exercised:
//   - `buildRevalidatePlan` shape is covered by the spec 002 cache tests.
//   - `revalidateOnChange` afterChange wiring is exercised on every save
//     via the existing Pages/Posts/CaseStudies/Services/ServicePillars
//     collection tests (no errors thrown).
//   - CloudFront invalidate calls are mocked out in the test env, so the
//     "tags + paths" plan is the verifiable contract today.
//
// When public templates land, this skeleton becomes:
//   1. Sign in as editor (`seedEditorSession` + attach cookie).
//   2. Update a published `posts` doc via the Payload Local API or REST
//      with a content change.
//   3. Poll the public `/insights/<slug>` route until the new content
//      appears or 60s elapses. Fail if the deadline is hit.
//   4. Re-flip back to original to keep the staging fixture clean.
test.skip('publish flows through to the public route within 60s', async () => {
  // Implementation deferred. See header comment.
})
