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
        // 2026-06-30 link audit: /about/our-story and /about/team were never
        // built — the content lives at /about and /team. Repointed so the nav
        // no longer 404s.
        { label: 'Our Story', url: '/about' },
        { label: 'Team', url: '/team' },
        { label: 'Localshoring', url: '/localshoring' },
        // TODO(stub): no Careers page exists yet. Re-add when the stub ships
        // (docs/CONTENT_NEEDS.md §"Missing pages — linked but 404").
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
        // 2026-06-30 link audit: repointed off the unbuilt /about/* routes.
        { label: 'Our Story', url: '/about' },
        { label: 'Team', url: '/team' },
        { label: 'Localshoring', url: '/localshoring' },
        // TODO(stub): Careers page not built — re-add when it ships.
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
        // TODO(stub): /resources/organizational-maturity-assessment (ScoreApp)
        // is not built — re-add when the assessment page ships (CONTENT_NEEDS §5).
      ],
    },
    {
      label: 'Connect',
      url: '/contact',
      children: [
        { label: 'Contact', url: '/contact' },
        // Book-a-call repoints to the contact form until a HubSpot Meetings
        // route ships (CONTENT_NEEDS §4; matches the not-found.tsx CTA).
        { label: 'Book a Call', url: '/contact' },
        // Interim: the four market landing pages aren't built yet, so the city
        // links point at the localshoring story (our local-delivery model)
        // rather than 404ing. TODO(stub): build /tulsa-consulting etc. as
        // per-market SEO pages (CONTENT_NEEDS §"Missing pages — linked but 404").
        { label: 'Tulsa', url: '/localshoring' },
        { label: 'Oklahoma City', url: '/localshoring' },
        { label: 'Northwest Arkansas', url: '/localshoring' },
        { label: 'Kansas City', url: '/localshoring' },
      ],
    },
  ],
  legalNav: [
    { label: 'Privacy Policy', url: '/privacy-policy' },
    // TODO(stub): /terms-of-service not drafted yet — re-add once legal copy
    // is reviewed (CONTENT_NEEDS §"Missing pages — linked but 404").
  ],
  // Repoints to the contact form until a HubSpot Meetings route ships
  // (CONTENT_NEEDS §4; matches the not-found.tsx "Book a strategy call" CTA).
  ctaButton: { label: 'Book a Call', url: '/contact' },
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
