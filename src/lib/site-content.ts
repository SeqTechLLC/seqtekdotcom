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
  /** Footer columns. The header reads `panel`, not this. */
  children?: NavItem[]
  /** Header dropdown. Absent means the item is a plain link. */
  panel?: NavPanel
}

/**
 * ROADMAP NAV-1. A dropdown panel is a list of groups, and the group is the
 * unit: the desktop column count falls out of `groups.length` rather than
 * being a knob that can be set wrong, and the same data draws both viewports
 * so they cannot drift.
 *
 * `url` is optional on purpose, and it is the lever that de-risks the whole
 * menu: a group with no URL is a heading and nothing more, so the structure
 * ships without waiting on a page for every heading. Groups organise the menu
 * and may own a page; they never own a leaf's URL, which stays flat so that a
 * leaf cross-listed under two groups still resolves to one address.
 *
 * A single-group panel renders no group title — with one column the trigger
 * IS the heading, and repeating it would announce the same word twice. The
 * `<ul>` is labelled by the trigger instead. See `PrimaryNav` / `MobileNav`.
 */
export type NavGroup = {
  label: string
  url?: string
  items: NavItem[]
}

export type NavPanel = {
  groups: NavGroup[]
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
      // NAV-1: one group, so no group title renders. The groups and items are
      // deliberately today's real routes — Brent's grouped service list had
      // not arrived when the mechanism was built, and nothing in this repo
      // should enumerate a service menu ahead of it. Adding a second group
      // here is a data edit, not a component change.
      panel: {
        groups: [
          {
            label: 'Our Story',
            items: [
              { label: 'Team', url: '/team' },
              // SVC-2: Localshoring is one subject with one URL, and today
              // that URL is the `localshoring` Page (ROADMAP SVC-3's
              // no-duplication rule). It moves to /services/localshoring with
              // the seed that creates the leaf — see the footer note below.
              // TODO(stub): no Careers page exists yet. Re-add when the stub
              // ships (docs/CONTENT_NEEDS.md §"Missing pages — linked but 404").
            ],
          },
        ],
      },
    },
    {
      label: 'Services',
      url: '/services',
      panel: {
        groups: [
          {
            label: 'Services',
            items: [
              // Workshops is the primary funnel and stays a top-level nav item
              // (see below), so it is intentionally NOT duplicated here.
              //
              // SVC-2 removed `AI Integration` and `Digital Transformation`.
              // Those were `/services/[offering]` Page slugs, and that route is
              // gone; Brent's structure (CONTENT_NEEDS §12) retires both as
              // service NAMES, so neither URL ever comes back — leaving them
              // here would ship two permanently dead links in code-owned chrome
              // (ADR 0010). Localshoring survives as a real leaf.
              //
              // The nine services in three groups replace them here once they
              // are seeded — a data edit in this file, tracked under the
              // ROADMAP SVC-2 residual. Nothing enumerates them before the
              // pages exist.
              //
              // Localshoring points at the Page that EXISTS rather than the
              // leaf that is planned. `/services/localshoring` needs a
              // `services` row with that slug, and there is none — it is not in
              // Brent's nine (CONTENT_NEEDS §12 puts Localshoring on the "how
              // we work" axis, deliberately outside them), so the SVC-2 seed
              // does not create it either. Chrome is code (ADR 0010): pointing
              // it at an unseeded slug is a dead link fixable only by deploy.
              // Flip this and the five below to /services/localshoring in the
              // same commit that seeds the leaf and retires the Page.
              { label: 'Localshoring', url: '/localshoring' },
            ],
          },
        ],
      },
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
        { label: 'Partners', url: '/partners' },
        // TODO(stub): Careers page not built — re-add when it ships.
      ],
    },
    {
      label: 'Services',
      url: '/services',
      children: [
        // Workshops lives in the Resources column below, so it is not
        // duplicated here. `AI Integration` and `Digital Transformation` are
        // gone for the same reason as in the header panel above: SVC-2 deleted
        // the route that served them and retires both as service names.
        // Localshoring stays on the Page URL that resolves today — see the
        // header panel note.
        { label: 'Localshoring', url: '/localshoring' },
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
        // rather than 404ing — which means the URL that RESOLVES, the Page, not
        // the planned `/services/localshoring` leaf nothing seeds yet (see the
        // header panel note). TODO(stub): build /tulsa-consulting etc. as
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
