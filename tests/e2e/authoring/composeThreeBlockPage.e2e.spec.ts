import { test } from '@playwright/test'

// T042 (US1 SC-001 / SC-012): admin authors a 3-block page (hero + content
// with inline callout + cta-section), saves a draft, signs out, signs in,
// resumes editing — verify the saved draft renders via the public preview
// path with every block resolving to its component.
//
// **Status:** skeleton — not yet implemented. The visual showcase harness
// (`npm run seed:showcase` + `npm run visual:capture`) already exercises
// the render side of every layout + inline block via the Payload Local API,
// which is a structurally stronger guarantee than the admin UX flow would
// provide. What this test still needs to add is the admin UX path itself:
//
// 1. Sign in via Google SSO mock (use tests/helpers/seedUser.ts + the
//    issueSessionCookie pattern).
// 2. Navigate to `/admin/collections/pages/create`.
// 3. Set title "Test page", verify slug auto-generates.
// 4. Add a hero block via the layout field menu; fill required fields.
// 5. Add a content block; insert an inline `callout` block in the richText
//    body via the floating toolbar.
// 6. Add a cta-section block; fill required fields.
// 7. Save as draft (no publish).
// 8. Sign out, sign back in, navigate to the same page.
// 9. Verify every field round-trips and that `/showcase/<slug>` (or the
//    Phase 3 public route, whichever ships first) resolves all 3 blocks.
test.skip('compose 3-block page through the admin and resume after sign-out', async () => {
  // Implementation deferred. See header comment.
})
