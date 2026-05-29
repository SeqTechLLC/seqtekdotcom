// MVP block set (Spec 003 US1 minimum, hero + content + cta-section). The
// remaining BLOCK_LIBRARY.md §5 blocks are tracked as follow-up tasks; add
// new files here as they land. Run `npm run generate:types` and
// `npm run generate:importmap` after any change (FR-038, FR-039).
import { Content } from './Content'
import { CtaSection } from './CtaSection'
import { Hero } from './Hero'

export { Content, CtaSection, Hero }

export const layoutBlocks = [Hero, Content, CtaSection] as const
