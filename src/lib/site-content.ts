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
              // Localshoring is not here: it is a how-we-work item and lives
              // on that axis (SVC-3's one-subject-one-URL rule).
              // TODO(stub): no Careers page exists yet. Re-add when the stub
              // ships (docs/CONTENT_NEEDS.md §"Missing pages — linked but 404").
            ],
          },
        ],
      },
    },
    // ROADMAP NAV-1 / SVC-2 — the TWO AXES. Brent's structure (CONTENT_NEEDS
    // §12) is "What We Do": three groups across, three services under each.
    // Hank's constraint is the other half — who-we-are and how-we-work read
    // top-left, services sit to the right — so the things a client buys and the
    // way we deliver them are separate menus, not one "Services" bucket.
    //
    // That split is why Localshoring and Workshops are NOT here: both are how
    // we work, not what we do (CONTENT_NEEDS §12 says so, which is why
    // Localshoring is outside Brent's nine). They moved to the axis below.
    //
    // Group `url` is optional by design — a group with no URL is just a
    // heading — so this structure could ship before the group pages existed.
    // They exist now, so each group links to its own page.
    {
      label: 'What We Do',
      url: '/services/what-we-do',
      panel: {
        groups: [
          {
            label: 'Strategy and Business Consulting',
            url: '/services/strategy-and-business-consulting',
            items: [
              { label: 'Strategy and Alignment', url: '/services/strategy-and-alignment' },
              {
                label: 'Business Process Consulting',
                url: '/services/business-process-consulting',
              },
              { label: 'Change Management', url: '/services/change-management' },
            ],
          },
          {
            label: 'Technology and Data',
            url: '/services/technology-and-data',
            items: [
              { label: 'Enterprise Architecture', url: '/services/enterprise-architecture' },
              {
                label: 'Data Engineering and Warehousing',
                url: '/services/data-engineering-and-warehousing',
              },
              {
                label: 'Business Intelligence and Analytics',
                url: '/services/business-intelligence-and-analytics',
              },
            ],
          },
          {
            label: 'AI and Automation',
            url: '/services/ai-and-automation',
            items: [
              { label: 'Generative AI', url: '/services/generative-ai' },
              { label: 'Machine Learning', url: '/services/machine-learning' },
              { label: 'Agentic AI', url: '/services/agentic-ai' },
            ],
          },
          // ROADMAP IND-1. Industries sit HERE rather than as a seventh
          // top-level item, and that is a measurement, not a preference: the
          // header row is capped at `max-w-container-lg` (1024px) and already
          // measures ~1002px with six items, the logo at `md:h-8` and the CTA.
          // A seventh item overflows by ~78px at every desktop width, and
          // "Industries" is the shortest label that could go there. The panel
          // grid is `groups.length` columns, so a fourth group is a data edit.
          //
          // No group URL: there is no `/industries` listing route, only
          // `/industries/<slug>` detail pages — the same shape `services` has.
          // A group without a `url` renders as a heading, which is exactly the
          // optional-group-URL design NAV-1 built for.
          {
            label: 'Industries',
            items: [
              { label: 'Oil and Gas', url: '/industries/oil-and-gas' },
              { label: 'Energy', url: '/industries/energy' },
              { label: 'Manufacturing', url: '/industries/manufacturing' },
              { label: 'Healthcare', url: '/industries/healthcare' },
              { label: 'FinTech', url: '/industries/fintech' },
              { label: 'Aerospace', url: '/industries/aerospace' },
              { label: 'Leadership and Training', url: '/industries/leadership-and-training' },
            ],
          },
        ],
      },
    },
    // The second axis. One group, so no group title renders — the trigger is
    // the heading. Workshops keeps its own top-level URL as the primary funnel;
    // it is listed here because this is the axis it belongs to, not duplicated
    // as a seventh top-level item.
    {
      label: 'How We Work',
      url: '/services/how-we-work',
      panel: {
        groups: [
          {
            label: 'How We Work',
            items: [
              { label: 'Workshops', url: '/workshops' },
              // Stays on the `localshoring` PAGE, which is seeded and resolves
              // today — not the planned `/services/localshoring` leaf, which
              // lives only in an unseeded `services.json`. Same rule as the
              // market links in the footer: the twelve service links above have
              // no working target to give up, this one does. Moving it early
              // would also put two Localshoring URLs in chrome at once, the
              // dead one in the header, which is what SVC-3's
              // one-subject-one-URL rule exists to prevent. Move both together
              // when the leaf is seeded and the Page retires.
              { label: 'Localshoring', url: '/localshoring' },
            ],
          },
        ],
      },
    },
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
    // NO SERVICES COLUMN, deliberately. The footer used to list offerings, and
    // under the two-axis IA that would mean either nine leaves (which dwarfs
    // every other column) or three group names (the longest of which wrapped to
    // three lines in a column a sixth of the container wide). Neither earns its
    // place: the services menu lives in the header, where it has room to be the
    // Argano-shaped panel Brent asked for. Repeating a cut-down version below
    // it is a second, worse copy of the same navigation.
    //
    // If a single "what we do" link or a full offerings index belongs here
    // later, that is a decision to take on its own terms — not a leftover.
    {
      label: 'Resources',
      url: '/insights',
      children: [
        { label: 'Case Studies', url: '/case-studies' },
        { label: 'Insights', url: '/insights' },
        // Workshops stays: it is a listing route in its own right and predates
        // the services IA, not an offering promoted into the footer.
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
        // links point at localshoring (our local-delivery model) rather than
        // 404ing. They stay on the `localshoring` PAGE, which is seeded and
        // resolves today — NOT the planned `/services/localshoring` leaf, which
        // exists only in an unseeded `services.json`. An earlier cut of this PR
        // moved them and turned four working links into 404s for nothing; the
        // twelve new service links above have no working target to give up,
        // which is not the same trade. Move these when the leaf is seeded and
        // the Page retires, in that order.
        // TODO(stub): build /tulsa-consulting etc. as per-market SEO pages
        // (CONTENT_NEEDS §"Missing pages — linked but 404").
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
