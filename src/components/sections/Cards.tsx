import type { ReactNode } from 'react'

import { caseStudyKind } from '../cards/CaseStudyCards'
import { FeaturedCard } from '../cards/FeaturedCard'
import { industryKind } from '../cards/IndustryCards'
import { locationKind } from '../cards/LocationCards'
import { partnerKind } from '../cards/PartnerCards'
import { postKind } from '../cards/PostCards'
import { serviceKind } from '../cards/ServiceCards'
import { teamMemberKind } from '../cards/TeamCards'
import type { CardHeadingLevel, CardKind } from '../cards/types'
import { workshopKind } from '../cards/WorkshopCards'
import { Section, type SectionBackground } from '../ui/Section'
import { type CardCollection, isCardCollection, unwrapPicks } from '@/lib/cardCollections'

export interface CardsProps {
  heading?: string | null
  intro?: string | null
  background?: SectionBackground | null
  /** Chooses the card. Also read upstream, to choose the query. */
  collection?: CardCollection | null
  display?: 'grid' | 'featured' | null
  /**
   * The finished list: `resolveLayout` fills it whichever way the block chose
   * its items (ROADMAP UI-2), so this component draws exactly what it is
   * handed. Raw polymorphic picks are unwrapped too, for a caller that did
   * not resolve.
   */
  manualItems?: unknown[] | null
  /** Card title level. Left unset it follows `heading`, so order never skips. */
  headingLevel?: CardHeadingLevel
}

type BodyProps = Omit<CardsProps, 'collection'> & { collection: CardCollection }

function CardsSection<T>({
  kind,
  heading,
  intro,
  background,
  collection,
  display,
  manualItems,
  headingLevel,
}: BodyProps & { kind: CardKind<T> }) {
  const docs = unwrapPicks(manualItems, collection).filter(kind.isDoc)

  // No items, no section, heading included. A list that fills itself at render
  // (`all`, `filtered`) can come back empty long after the editor saw it full,
  // and a heading promising proof with nothing beneath it is worse than no
  // section (`gridEmptyState.int.spec.tsx`).
  if (docs.length === 0) return null

  const level = headingLevel ?? (heading ? 'h3' : 'h2')
  const inverse = background === 'inverse'
  const { Grid } = kind
  const [first, ...rest] = docs

  return (
    <Section padding="spacious" background={background ?? 'none'}>
      {heading ? <h2 className="text-h2 font-bold">{heading}</h2> : null}
      {intro ? (
        <p
          className={`mt-4 max-w-prose text-body-lg ${inverse ? 'text-text-inverse/80' : 'text-text-secondary'}`}
        >
          {intro}
        </p>
      ) : null}
      {display === 'featured' ? (
        <>
          <FeaturedCard item={kind.featured(first)} headingLevel={level} inverse={inverse} />
          {rest.length > 0 ? <Grid docs={rest} headingLevel={level} offset={1} /> : null}
        </>
      ) : (
        <Grid docs={docs} headingLevel={level} />
      )}
    </Section>
  )
}

/** One entry per collection, so each keeps its own document type end to end. */
const BY_COLLECTION: Record<CardCollection, (props: BodyProps) => ReactNode> = {
  caseStudies: (p) => <CardsSection kind={caseStudyKind} {...p} />,
  posts: (p) => <CardsSection kind={postKind} {...p} />,
  services: (p) => <CardsSection kind={serviceKind} {...p} />,
  industries: (p) => <CardsSection kind={industryKind} {...p} />,
  workshops: (p) => <CardsSection kind={workshopKind} {...p} />,
  teamMembers: (p) => <CardsSection kind={teamMemberKind} {...p} />,
  locations: (p) => <CardsSection kind={locationKind} {...p} />,
  partners: (p) => <CardsSection kind={partnerKind} {...p} />,
}

/**
 * The `cards` block: any list of documents, drawn as that collection's card
 * (docs/planning/block-consolidation.md). Also what the listing routes render,
 * so `/team` and a team block on a page cannot drift apart.
 */
export function Cards({ collection, ...props }: CardsProps) {
  if (!isCardCollection(collection)) return null
  return BY_COLLECTION[collection]({ ...props, collection })
}

export default Cards
