/**
 * Shared by `noPlaceholderCopy.int.spec.ts` and
 * `skeletonDefaultValue.int.spec.ts`. Lives here rather than being imported
 * from one spec by the other: importing a spec re-runs it, which had the second
 * file silently re-collecting all seven of the first's tests (18 reported where
 * 11 exist) and dragging a `@vitest-environment node` file into a jsdom one.
 */
/** Every string a skeleton can put on a page before a human writes real copy. */
export const SKELETON_PLACEHOLDER_COPY = [
  'A short professional bio.',
  'What the client was up against, in their terms.',
  'What we built and how we approached it.',
  'The measurable outcome the work delivered.',
  'Describe the workshop: the outcome it drives and how it runs.',
  'What this partner does and why SEQTEK works with them.',
  'What this sector needs from a technology partner, in one or two sentences.',
  'The problems this sector brings us, and what our work on them looks like.',
  // Found only once the collector stopped looking at lexical `text` alone.
  // Both were shipping, on published pages, invisible to the guard that exists
  // to list them.
  'Tell us about your team and we will follow up with dates.',
  'What this partnership gives clients, in one or two sentences.',
] as const
