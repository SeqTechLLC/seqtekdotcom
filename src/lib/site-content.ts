/**
 * Placeholder site chrome data shaped like the future Payload globals
 * (ARCHITECTURE.md §2 — `siteSettings`, `navigation`). Layout components read
 * from this module in Phase 1; swap to `payload.findGlobal()` in Phase 2.
 *
 * Schema drift to reconcile when the globals are built:
 *  - `socialLinks` adds `youtubeUrl` here (brand kit lists YouTube; spec omits it).
 *  - `navigation` adds `legalNav` as a top-level flat list (privacy / terms).
 *    Architecture currently folds these under `siteSettings.footerText`.
 */

export type NavItem = {
  label: string
  url: string
  children?: NavItem[]
}

export type Navigation = {
  mainNav: NavItem[]
  footerNav: NavItem[]
  legalNav: NavItem[]
  ctaButton: { label: string; url: string }
}

export type SiteSettings = {
  companyName: string
  tagline: string
  phone: string
  email: string
  address: { street: string; city: string; state: string; zip: string }
  socialLinks: {
    linkedinUrl: string
    twitterUrl: string
    facebookUrl: string
    youtubeUrl: string
  }
  footerText: string
}

export const navigation: Navigation = {
  mainNav: [
    {
      label: 'About',
      url: '/about',
      children: [
        { label: 'Our Story', url: '/about/our-story' },
        { label: 'Team', url: '/about/team' },
        { label: 'Localshoring', url: '/localshoring' },
        { label: 'Careers', url: '/about/careers' },
      ],
    },
    {
      label: 'Services',
      url: '/services',
      children: [
        // feat/services-restructure — four peer offerings (ADR 0009). Workshops
        // is the primary funnel and stays a top-level nav item (see below), so
        // it is intentionally NOT duplicated here; the /services page itself
        // still surfaces all four offering cards.
        { label: 'Localshoring', url: '/services/localshoring' },
        { label: 'AI Integration', url: '/services/ai-integration' },
        { label: 'Digital Transformation', url: '/services/digital-transformation' },
      ],
    },
    { label: 'Workshops', url: '/workshops' },
    { label: 'Case Studies', url: '/case-studies' },
    { label: 'Insights', url: '/insights' },
    { label: 'Contact', url: '/contact' },
  ],
  footerNav: [
    {
      label: 'Company',
      url: '/about',
      children: [
        { label: 'About', url: '/about' },
        { label: 'Our Story', url: '/about/our-story' },
        { label: 'Team', url: '/about/team' },
        { label: 'Localshoring', url: '/localshoring' },
        { label: 'Careers', url: '/about/careers' },
      ],
    },
    {
      label: 'Services',
      url: '/services',
      children: [
        // feat/services-restructure — four peer offerings (ADR 0009). Workshops
        // lives in the Resources column below, so it is not duplicated here.
        { label: 'Localshoring', url: '/services/localshoring' },
        { label: 'AI Integration', url: '/services/ai-integration' },
        { label: 'Digital Transformation', url: '/services/digital-transformation' },
      ],
    },
    {
      label: 'Resources',
      url: '/insights',
      children: [
        { label: 'Case Studies', url: '/case-studies' },
        { label: 'Insights', url: '/insights' },
        { label: 'Workshops', url: '/workshops' },
        { label: 'Assessment', url: '/resources/organizational-maturity-assessment' },
      ],
    },
    {
      label: 'Connect',
      url: '/contact',
      children: [
        { label: 'Contact', url: '/contact' },
        { label: 'Book a Call', url: '/contact/book-a-call' },
        { label: 'Tulsa', url: '/tulsa-consulting' },
        { label: 'Oklahoma City', url: '/okc-consulting' },
        { label: 'Northwest Arkansas', url: '/northwest-arkansas-consulting' },
        { label: 'Kansas City', url: '/kansas-city-consulting' },
      ],
    },
  ],
  legalNav: [
    { label: 'Privacy Policy', url: '/privacy-policy' },
    { label: 'Terms of Service', url: '/terms-of-service' },
  ],
  ctaButton: { label: 'Book a Call', url: '/contact/book-a-call' },
}

// Address left empty pending BR-7 resolution of the canonical office location
// (project_internal_dynamics notes Sapulpa vs. Cheyenne contention).
export const siteSettings: SiteSettings = {
  companyName: 'SEQTEK',
  tagline: 'Delivering Transformative Technologies Since 1999',
  phone: '(918) 493-7200',
  email: '',
  address: { street: '', city: '', state: '', zip: '' },
  socialLinks: {
    linkedinUrl: 'https://www.linkedin.com/company/seqtek',
    twitterUrl: '',
    facebookUrl: 'https://www.facebook.com/seqtek/',
    youtubeUrl: 'https://www.youtube.com/@seqtek',
  },
  footerText: `© ${new Date().getFullYear()} SEQTEK. All rights reserved.`,
}
