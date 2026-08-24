/**
 * Site chrome — the canonical source, not a placeholder.
 *
 * This module was written in Phase 1 as stand-in data "to swap to
 * `payload.findGlobal()` in Phase 2". Spec 011 inverted that: the `siteSettings`
 * and `navigation` globals were withdrawn and their tables dropped, because
 * nothing rendered from them and navigation URLs are unvalidated free text
 * coupled to the route table and the 301 map. See ADR 0010.
 *
 * So this file IS the site chrome. Company name, tagline, phone, email, postal
 * address, social links, footer text and both nav trees live here and change by
 * deploy, not by publish.
 *
 * Seven of these values are also read at render time beyond the chrome:
 * `tagline` and `companyName` by `lib/metadata.ts`, and `companyName`,
 * `tagline`, `email`, `phone`, `address` and `socialLinks` by the
 * `Organization` JSON-LD in `lib/structured-data.ts`. Both are pinned by tests
 * (`organizationLd.int.spec.ts`, `metadataOutput.int.spec.ts`) — edit the
 * values here freely, but a shape change will fail those.
 *
 * Note `socialLinks.youtubeUrl` is carried here and deliberately NOT emitted in
 * `sameAs`: the withdrawn global had no column for it, and adding it would be a
 * change in rendered output rather than a relocation.
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
      // "About" and "Our Story" were the same page under two labels (the parent
      // and its own first child both pointed at /about). Collapsed to one name,
      // "Our Story", and the page moved to /our-story (301 from /about).
      label: 'Our Story',
      url: '/our-story',
      children: [
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
      url: '/our-story',
      children: [
        // Was "About" + "Our Story" — the same URL listed twice. One entry now.
        { label: 'Our Story', url: '/our-story' },
        { label: 'Team', url: '/team' },
        { label: 'Localshoring', url: '/localshoring' },
        { label: 'Partners', url: '/partners' },
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
    { label: 'Terms of Service', url: '/terms-of-service' },
  ],
  // Repoints to the contact form until a HubSpot Meetings route ships
  // (CONTENT_NEEDS §4; matches the not-found.tsx "Book a strategy call" CTA).
  ctaButton: { label: 'Book a Call', url: '/contact' },
}

// BR-7 resolved 2026-08-17: the canonical office is the Gradient space on
// Cheyenne, not Sapulpa. Street/city/zip are formatted exactly as the old Wix
// footer published them — local search treats name, address and phone as one
// identity, so reformatting a live NAP costs more than it gains.
export const siteSettings: SiteSettings = {
  companyName: 'SEQTEK',
  tagline: 'Delivering Transformative Technologies Since 1999',
  phone: '(918) 493-7200',
  email: 'contact@seqtek.com',
  address: { street: '12 N Cheyenne Ave.', city: 'Tulsa', state: 'OK', zip: '74103' },
  socialLinks: {
    linkedinUrl: 'https://www.linkedin.com/company/seqtek',
    twitterUrl: '',
    facebookUrl: 'https://www.facebook.com/seqtek/',
    youtubeUrl: 'https://www.youtube.com/@seqtek',
  },
  footerText: `© ${new Date().getFullYear()} SEQTEK. All rights reserved.`,
}
