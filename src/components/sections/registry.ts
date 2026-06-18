import type { ComponentType } from 'react'

import Accordion from './Accordion'
import BrandTeaser from './BrandTeaser'
import CaseStudyGrid from './CaseStudyGrid'
import CaseStudyHero from './CaseStudyHero'
import ClientLogoGrid from './ClientLogoGrid'
import ComparisonTable from './ComparisonTable'
import ContactCta from './ContactCta'
import Content from './Content'
import CtaSection from './CtaSection'
import Deliverables from './Deliverables'
import DownloadCard from './DownloadCard'
import Embed from './Embed'
import FAQ from './FAQ'
import FeaturedCaseStudy from './FeaturedCaseStudy'
import FeaturedTestimonials from './FeaturedTestimonials'
import Gallery from './Gallery'
import Hero from './Hero'
import HomepageHero from './HomepageHero'
import HubspotForm from './HubspotForm'
import HubspotMeetings from './HubspotMeetings'
import Image from './Image'
import IndustryGrid from './IndustryGrid'
import KeyTakeaways from './KeyTakeaways'
import LocationsList from './LocationsList'
import LogoBar from './LogoBar'
import Map from './Map'
import MetricDisplay from './MetricDisplay'
import MissionVisionValues from './MissionVisionValues'
import NavCards from './NavCards'
import NewsletterCta from './NewsletterCta'
import PostList from './PostList'
import ProcessSteps from './ProcessSteps'
import RelatedPosts from './RelatedPosts'
import ServiceCards from './ServiceCards'
import ServicePillarCards from './ServicePillarCards'
import ServicePillarHero from './ServicePillarHero'
import StatsBar from './StatsBar'
import Tabs from './Tabs'
import TeamGrid from './TeamGrid'
import TechStack from './TechStack'
import TestimonialBlock from './TestimonialBlock'
import Timeline from './Timeline'
import TwoColumn from './TwoColumn'
import VideoEmbed from './VideoEmbed'
import WorkshopList from './WorkshopList'

// blockType (kebab-case slug from src/payload/blocks/layout/*.ts) → React component.
// Every entry MUST appear in src/payload/blocks/layout/index.ts and vice versa
// (enforced by tests/int/render/registryCoverage.int.spec.ts).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const registry: Record<string, ComponentType<any>> = {
  hero: Hero,
  'case-study-hero': CaseStudyHero,
  'service-pillar-hero': ServicePillarHero,
  'homepage-hero': HomepageHero,
  content: Content,
  'two-column': TwoColumn,
  image: Image,
  gallery: Gallery,
  'process-steps': ProcessSteps,
  deliverables: Deliverables,
  'comparison-table': ComparisonTable,
  'mission-vision-values': MissionVisionValues,
  timeline: Timeline,
  'stats-bar': StatsBar,
  'metric-display': MetricDisplay,
  'logo-bar': LogoBar,
  'featured-testimonials': FeaturedTestimonials,
  'testimonial-block': TestimonialBlock,
  'client-logo-grid': ClientLogoGrid,
  'cta-section': CtaSection,
  'newsletter-cta': NewsletterCta,
  'contact-cta': ContactCta,
  'case-study-grid': CaseStudyGrid,
  'service-cards': ServiceCards,
  'service-pillar-cards': ServicePillarCards,
  'featured-case-study': FeaturedCaseStudy,
  'post-list': PostList,
  'related-posts': RelatedPosts,
  'industry-grid': IndustryGrid,
  'locations-list': LocationsList,
  'workshop-list': WorkshopList,
  'team-grid': TeamGrid,
  'video-embed': VideoEmbed,
  faq: FAQ,
  accordion: Accordion,
  tabs: Tabs,
  map: Map,
  embed: Embed,
  'download-card': DownloadCard,
  'hubspot-form': HubspotForm,
  'hubspot-meetings': HubspotMeetings,
  'brand-teaser': BrandTeaser,
  'nav-cards': NavCards,
  'key-takeaways': KeyTakeaways,
  'tech-stack': TechStack,
}
