import { test } from '@playwright/test'

// T043 (US1 FR-008): insert each of the 7 inline blocks inside a richText
// field and assert the saved node round-trips.
//
// **Status:** skeleton — not yet implemented. The round-trip render path
// for each inline block is covered by:
//   - `tests/int/render/richTextInline.int.spec.tsx` (single inline-cta
//     round-trips through the converter)
//   - `tests/int/render/inlineRegistryCoverage.int.spec.ts` (every inline
//     export has a registry entry)
//   - The showcase seed creates a per-block fixture for each inline type
//     and the visual harness verifies they all render.
//
// What this Playwright test still adds is the admin-UX path: inserting
// each inline block via the Lexical floating toolbar and confirming the
// saved Lexical JSON shape matches the converter's expectations.
//
// Implementation steps:
// 1. Sign in via Google SSO mock.
// 2. Navigate to `/admin/collections/pages/create`.
// 3. Add a content block.
// 4. For each of: inline-cta, testimonial-embed, callout, image-with-
//    caption, figure, quote-pullquote, disclosure — insert via the
//    inline-block toolbar and fill required fields.
// 5. Save the page.
// 6. Reload; verify each inline block round-trips.
test.skip('insert each of the 7 inline blocks and round-trip the saved Lexical JSON', async () => {
  // Implementation deferred. See header comment.
})
