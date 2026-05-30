import type { MigrationLogger } from '../log'

/**
 * SiteSettings parser: the contact line + footer block are identical across
 * every audit page (`Headquarters \n 12 N Cheyenne Ave. \n Tulsa, OK 74103
 * \n 918-493-7200 \n contact@seqtek.com`). We hardcode the canonical
 * address from `project_seqtek_address` memory — "Cheyenne" is a Tulsa
 * street, not Wyoming — so future contributors aren't tempted to interpret
 * the audit footer text differently.
 */

export interface ParsedSiteSettings {
  companyName: string
  tagline: string
  phone: string
  email: string
  address: {
    street: string
    city: string
    state: string
    zip: string
  }
  socialLinks: {
    linkedinUrl?: string
    facebookUrl?: string
  }
  footerText: string
  stats: { number: string; suffix?: string; label: string }[]
}

export interface ParseSiteSettingsOptions {
  logger: MigrationLogger
}

export function parseSiteSettings(options: ParseSiteSettingsOptions): ParsedSiteSettings {
  const { logger } = options

  logger.log({
    level: 'INFO',
    kind: 'AUDIT_GAP',
    collection: 'siteSettings',
    slug: '<global>',
    detail:
      'social links: LinkedIn / Facebook / YouTube URLs are referenced in footer text but not as URLs — editor backfills with canonical seqtechllc URLs',
  })

  return {
    companyName: 'SEQTEK',
    tagline: 'Localshoring since 1999',
    phone: '918-493-7200',
    email: 'contact@seqtek.com',
    address: {
      street: '12 N Cheyenne Ave',
      city: 'Tulsa',
      state: 'OK',
      zip: '74103',
    },
    socialLinks: {},
    footerText: '© SEQTEK. All rights reserved.',
    stats: [
      { number: '20', suffix: '+', label: 'Years of experience' },
      { number: '411', suffix: '+', label: 'Successful projects delivered' },
      { number: '8221', suffix: '+', label: 'Lives changed' },
    ],
  }
}
