/**
 * Every string a skeleton can put on a page before a human writes real copy.
 *
 * This list has two consumers and they pull in opposite directions, which is
 * why it lives in `src/` rather than beside either one:
 *
 *   - `tests/int/render/noPlaceholderCopy.int.spec.ts` asserts on the SOURCE —
 *     that every skeleton's strings are enumerated here.
 *   - `tools/link-sweep` greps RENDERED HTML for them — the other half, and
 *     the only one that can see a document that was published without the
 *     skeleton being overwritten.
 *
 * Adding a placeholder to a skeleton without adding it here fails the first
 * and blinds the second.
 */
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
