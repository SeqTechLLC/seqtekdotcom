// Add new layout block files here as they land, in BLOCK_LIBRARY.md §5
// category order. Run `npm run generate:types` and
// `npm run generate:importmap` after any change (FR-038, FR-039).
// The retired `accordion` config (./Accordion) shares this slug; the new block
// replaces it here, and the old file goes with the rest of the consolidation.
import { Accordion } from './AccordionBlock'
import { BrandTeaser } from './BrandTeaser'
import { CaseStudyGrid } from './CaseStudyGrid'
import { CaseStudyHero } from './CaseStudyHero'
import { ClientLogoGrid } from './ClientLogoGrid'
import { ComparisonTable } from './ComparisonTable'
import { ContactCta } from './ContactCta'
import { Content } from './Content'
import { Cta } from './Cta'
import { CtaSection } from './CtaSection'
import { Deliverables } from './Deliverables'
import { DownloadCard } from './DownloadCard'
import { Embed } from './Embed'
import { FAQ } from './FAQ'
import { FeaturedCaseStudy } from './FeaturedCaseStudy'
import { FeaturedTestimonials } from './FeaturedTestimonials'
import { Gallery } from './Gallery'
import { Hero } from './Hero'
import { HomepageHero } from './HomepageHero'
import { HubspotForm } from './HubspotForm'
import { HubspotMeetings } from './HubspotMeetings'
import { Image } from './Image'
import { IndustryGrid } from './IndustryGrid'
import { KeyTakeaways } from './KeyTakeaways'
import { LocationsList } from './LocationsList'
import { LogoBar } from './LogoBar'
import { Map } from './Map'
import { MetricDisplay } from './MetricDisplay'
import { MissionVisionValues } from './MissionVisionValues'
import { NavCards } from './NavCards'
import { NewsletterCta } from './NewsletterCta'
import { PostList } from './PostList'
import { ProcessSteps } from './ProcessSteps'
import { Quote } from './Quote'
import { RelatedPosts } from './RelatedPosts'
import { ServiceCards } from './ServiceCards'
import { ServicePillarCards } from './ServicePillarCards'
import { ServicePillarHero } from './ServicePillarHero'
import { StatsBar } from './StatsBar'
import { Table } from './Table'
import { Tabs } from './Tabs'
import { TeamGrid } from './TeamGrid'
import { TechStack } from './TechStack'
import { TestimonialBlock } from './TestimonialBlock'
import { Timeline } from './Timeline'
import { TwoColumn } from './TwoColumn'
import { VideoEmbed } from './VideoEmbed'
import { WorkshopList } from './WorkshopList'

export {
  Accordion,
  BrandTeaser,
  CaseStudyGrid,
  CaseStudyHero,
  ClientLogoGrid,
  ComparisonTable,
  ContactCta,
  Content,
  Cta,
  CtaSection,
  Deliverables,
  DownloadCard,
  Embed,
  FAQ,
  FeaturedCaseStudy,
  FeaturedTestimonials,
  Gallery,
  Hero,
  HomepageHero,
  HubspotForm,
  HubspotMeetings,
  Image,
  IndustryGrid,
  KeyTakeaways,
  LocationsList,
  LogoBar,
  Map,
  MetricDisplay,
  MissionVisionValues,
  NavCards,
  NewsletterCta,
  PostList,
  ProcessSteps,
  Quote,
  RelatedPosts,
  ServiceCards,
  ServicePillarCards,
  ServicePillarHero,
  StatsBar,
  Table,
  Tabs,
  TeamGrid,
  TechStack,
  TestimonialBlock,
  Timeline,
  TwoColumn,
  VideoEmbed,
  WorkshopList,
}

/**
 * Registration order, and therefore the order the admin block picker draws its
 * category headings (Payload's BlockSelector groups by first encounter). Keep
 * this array sorted by BLOCK_CATEGORIES — `adminMetadata.int.spec.ts` fails if
 * a block lands outside its category's run.
 */
export const layoutBlocks = [
  Hero,
  CaseStudyHero,
  ServicePillarHero,
  HomepageHero,
  Content,
  TwoColumn,
  Image,
  Gallery,
  ProcessSteps,
  Deliverables,
  ComparisonTable,
  Table,
  Timeline,
  FAQ,
  Accordion,
  StatsBar,
  MetricDisplay,
  LogoBar,
  FeaturedTestimonials,
  TestimonialBlock,
  Quote,
  ClientLogoGrid,
  CtaSection,
  NewsletterCta,
  ContactCta,
  Cta,
  CaseStudyGrid,
  ServiceCards,
  ServicePillarCards,
  FeaturedCaseStudy,
  PostList,
  RelatedPosts,
  IndustryGrid,
  LocationsList,
  WorkshopList,
  TeamGrid,
  VideoEmbed,
  MissionVisionValues,
  Tabs,
  Map,
  Embed,
  DownloadCard,
  HubspotForm,
  HubspotMeetings,
  BrandTeaser,
  NavCards,
  KeyTakeaways,
  TechStack,
] as const
