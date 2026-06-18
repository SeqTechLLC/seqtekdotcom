import type { SupportingIds } from './supportingDocs'
import { buildLexical } from './lexical'

export interface MediaIdMap {
  photo: string | number
  screenshot: string | number
  logo: string | number
  illustration: string | number
}

export type BlockCategory =
  | 'hero'
  | 'content'
  | 'social-proof'
  | 'cta'
  | 'content-collection'
  | 'specialty'

export interface BlockVariant {
  /** Slug-safe variant id, used in the per-block page slug suffix. */
  name: string
  /** Saved Payload block JSON (includes `blockType`). */
  data: Record<string, unknown>
}

export interface BlockFixture {
  blockType: string
  category: BlockCategory
  /** One entry per visually-distinct variant. */
  variants: BlockVariant[]
}

/**
 * Returns the canonical fixture set. Add entries here as new blocks land — the
 * seed script will pick them up automatically.
 *
 * Per-block showcase pages stack every variant of the block. Per-category
 * showcase pages stack the first variant of every block in that category.
 */
export function getBlockFixtures(media: MediaIdMap, supporting: SupportingIds): BlockFixture[] {
  return [
    {
      blockType: 'hero',
      category: 'hero',
      variants: [
        {
          name: 'text-only-left',
          data: {
            blockType: 'hero',
            variant: 'text-only',
            alignment: 'left',
            eyebrow: 'TEXT-ONLY · LEFT',
            headline: 'A focused hero with no media',
            subheadline:
              'Used on listings and resource landing pages where the words carry the page on their own.',
            primaryCta: { label: 'Primary action', url: '/showcase', variant: 'primary' },
            secondaryCta: { label: 'Secondary', url: '/showcase' },
          },
        },
        {
          name: 'text-only-center',
          data: {
            blockType: 'hero',
            variant: 'text-only',
            alignment: 'center',
            eyebrow: 'TEXT-ONLY · CENTER',
            headline: 'Centered headline emphasis',
            subheadline: 'Symmetrical layout when there is no media to anchor.',
            primaryCta: { label: 'Primary action', url: '/showcase', variant: 'primary' },
          },
        },
        {
          name: 'with-image',
          data: {
            blockType: 'hero',
            variant: 'with-image',
            alignment: 'left',
            eyebrow: 'WITH-IMAGE',
            headline: 'Hero with a supporting image',
            subheadline: 'Image renders below the copy in this current renderer.',
            media: media.photo,
            primaryCta: { label: 'Primary action', url: '/showcase', variant: 'primary' },
          },
        },
        {
          name: 'with-video',
          data: {
            blockType: 'hero',
            variant: 'with-video',
            alignment: 'left',
            eyebrow: 'WITH-VIDEO',
            headline: 'Hero with an embedded video',
            subheadline: 'Allowed hosts only: YouTube, Vimeo, Wistia.',
            videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
          },
        },
        {
          name: 'split',
          data: {
            blockType: 'hero',
            variant: 'split',
            alignment: 'left',
            eyebrow: 'SPLIT',
            headline: 'Split hero with image',
            subheadline: 'Same image affordance as with-image but typically rendered side-by-side.',
            media: media.photo,
          },
        },
      ],
    },
    {
      blockType: 'case-study-hero',
      category: 'hero',
      variants: [
        {
          name: 'default',
          data: {
            blockType: 'case-study-hero',
            eyebrow: 'MANUFACTURING · OPERATIONS',
            headline: 'Cut downtime in half on three shifts',
            metric: {
              number: '52%',
              label: 'reduction in unplanned downtime',
              context: 'Measured across 12 production lines over 90 days post-launch.',
            },
            heroImage: media.screenshot,
          },
        },
      ],
    },
    {
      blockType: 'service-pillar-hero',
      category: 'hero',
      variants: [
        {
          name: 'with-cta',
          data: {
            blockType: 'service-pillar-hero',
            pillarName: 'ORGANIZATIONAL STRATEGY',
            headline: 'Make the call sooner, with sharper data',
            subheadline:
              'Pillar lead: aligning leadership, ops, and product on a single quarterly thesis.',
            heroImage: media.illustration,
            primaryCta: { label: 'Talk to a pillar lead', url: '/showcase' },
          },
        },
        {
          name: 'no-cta',
          data: {
            blockType: 'service-pillar-hero',
            pillarName: 'TECHNOLOGY & DATA',
            headline: 'Ship the system without inheriting tech debt',
            subheadline: 'Pillar lead: pragmatic data + platform work that compounds.',
            heroImage: media.illustration,
          },
        },
      ],
    },
    {
      blockType: 'homepage-hero',
      category: 'hero',
      variants: [
        {
          name: 'with-background',
          data: {
            blockType: 'homepage-hero',
            eyebrow: 'DELIVERING TRANSFORMATIVE TECHNOLOGIES',
            headline: 'Localshoring talent for teams that ship outcomes',
            subheadline:
              'Senior engineers in Tulsa, OKC, Northwest Arkansas, and Kansas City. Embedded with your team. No offshore handoffs.',
            backgroundImage: media.photo,
            primaryCta: { label: 'Book a call', url: '/showcase' },
            secondaryCta: { label: 'Take the assessment', url: '/showcase' },
          },
        },
      ],
    },
    {
      blockType: 'content',
      category: 'content',
      variants: [
        {
          name: 'standard',
          data: {
            blockType: 'content',
            width: 'standard',
            background: 'none',
            body: buildLexical([
              { kind: 'h', tag: 'h2', text: 'Standard content block' },
              {
                kind: 'p',
                text: 'Standard width, no background. The default for body copy on most pages.',
              },
              { kind: 'h', tag: 'h3', text: 'A subheading' },
              { kind: 'p', text: 'And a paragraph of supporting copy beneath it.' },
            ]),
          },
        },
        {
          name: 'narrow-subtle',
          data: {
            blockType: 'content',
            width: 'narrow',
            background: 'subtle',
            body: buildLexical([
              { kind: 'h', tag: 'h2', text: 'Narrow with subtle background' },
              {
                kind: 'p',
                text: 'For shorter passages that need to feel like a callout from the surrounding flow.',
              },
            ]),
          },
        },
        {
          name: 'wide-accent',
          data: {
            blockType: 'content',
            width: 'wide',
            background: 'accent',
            body: buildLexical([
              { kind: 'h', tag: 'h2', text: 'Wide with accent background' },
              {
                kind: 'p',
                text: 'Wider measure for richer layouts; accent background to break up a long page.',
              },
            ]),
          },
        },
        {
          name: 'with-inline-cta',
          data: {
            blockType: 'content',
            width: 'standard',
            background: 'none',
            body: buildLexical([
              { kind: 'h', tag: 'h2', text: 'Content with an inline CTA' },
              {
                kind: 'p-with-inline',
                text: 'Verifies the inline-block path renders inside paragraphs:',
                inline: {
                  blockType: 'inline-cta',
                  fields: {
                    label: 'Inline CTA',
                    url: '/showcase',
                    variant: 'primary',
                  },
                },
              },
            ]),
          },
        },
      ],
    },
    {
      blockType: 'two-column',
      category: 'content',
      variants: [
        {
          name: 'media-left',
          data: {
            blockType: 'two-column',
            mediaPosition: 'left',
            media: media.photo,
            body: buildLexical([
              { kind: 'h', tag: 'h2', text: 'Media-left two-column' },
              {
                kind: 'p',
                text: 'Side-by-side content for product proofs, before/after, or testimonial pairings.',
              },
            ]),
            cta: { label: 'See the work', url: '/showcase' },
          },
        },
        {
          name: 'media-right',
          data: {
            blockType: 'two-column',
            mediaPosition: 'right',
            media: media.illustration,
            body: buildLexical([
              { kind: 'h', tag: 'h2', text: 'Media-right two-column' },
              { kind: 'p', text: 'Same shape, opposite arrangement.' },
            ]),
          },
        },
      ],
    },
    {
      blockType: 'image',
      category: 'content',
      variants: [
        {
          name: 'standard-center',
          data: {
            blockType: 'image',
            image: media.photo,
            caption: 'Standard width, centered on the reading axis.',
            width: 'standard',
            alignment: 'center',
          },
        },
        {
          name: 'wide',
          data: {
            blockType: 'image',
            image: media.screenshot,
            caption: 'Wider measure for product screenshots and diagrams.',
            width: 'wide',
            alignment: 'center',
          },
        },
        {
          name: 'full-bleed',
          data: {
            blockType: 'image',
            image: media.photo,
            width: 'full',
            alignment: 'center',
          },
        },
      ],
    },
    {
      blockType: 'gallery',
      category: 'content',
      variants: [
        {
          name: 'grid-three',
          data: {
            blockType: 'gallery',
            heading: 'What a real workshop looks like',
            layout: 'grid',
            columns: '3',
            items: [
              { image: media.photo, caption: 'Discovery session' },
              { image: media.screenshot, caption: 'Whiteboard mapping' },
              { image: media.illustration, caption: 'Plan of record' },
              { image: media.photo, caption: 'Team readout' },
            ],
          },
        },
        {
          name: 'carousel',
          data: {
            blockType: 'gallery',
            heading: 'Engagement gallery (carousel)',
            layout: 'carousel',
            items: [
              { image: media.photo, caption: 'On-site week one' },
              { image: media.screenshot, caption: 'Build phase' },
              { image: media.illustration, caption: 'Handoff' },
            ],
          },
        },
      ],
    },
    {
      blockType: 'process-steps',
      category: 'content',
      variants: [
        {
          name: 'three-steps',
          data: {
            blockType: 'process-steps',
            heading: 'How a Touchstone engagement starts',
            steps: [
              {
                title: 'Discovery week',
                body: 'A small senior team co-locates with yours to map workflows and surface friction.',
              },
              {
                title: 'Plan of record',
                body: 'We commit to a four-week plan with named owners and weekly readouts.',
              },
              {
                title: 'Ship and stabilize',
                body: 'Code lands behind a flag, then ramps. We document the runbooks before we leave.',
              },
            ],
          },
        },
        {
          name: 'six-steps',
          data: {
            blockType: 'process-steps',
            heading: 'Service delivery framework',
            steps: [
              { title: 'Listen', body: 'Stakeholder interviews and prior-art review.' },
              {
                title: 'Frame',
                body: 'Synthesize the problem statement, success metric, constraints.',
              },
              { title: 'Prototype', body: 'Build the smallest thing that can be tested.' },
              { title: 'Validate', body: 'Run against real workflows and decision-makers.' },
              { title: 'Productionize', body: 'Harden, document, monitor.' },
              { title: 'Handoff', body: 'Train the internal team and exit cleanly.' },
            ],
          },
        },
      ],
    },
    {
      blockType: 'comparison-table',
      category: 'content',
      variants: [
        {
          name: 'localshoring',
          data: {
            blockType: 'comparison-table',
            heading: 'Localshoring vs offshore vs nearshore',
            columns: [
              { label: 'Localshoring', tagline: 'Senior US engineers' },
              { label: 'Nearshore', tagline: 'LATAM / 1-2h offset' },
              { label: 'Offshore', tagline: 'APAC / 9-12h offset' },
            ],
            rows: [
              {
                dimension: 'Hours of overlap',
                cells: [{ value: '8 hours' }, { value: '5-6 hours' }, { value: '1-2 hours' }],
              },
              {
                dimension: 'Cultural and language fit',
                cells: [{ value: 'Native' }, { value: 'Strong' }, { value: 'Variable' }],
              },
              {
                dimension: 'Cost vs full-time hire',
                cells: [{ value: '0.7x' }, { value: '0.5x' }, { value: '0.3x' }],
              },
              {
                dimension: 'Velocity ramp',
                cells: [{ value: '1-2 weeks' }, { value: '2-4 weeks' }, { value: '6+ weeks' }],
              },
            ],
            bestForRow: [
              { value: 'Critical roadmap work' },
              { value: 'Mature platform features' },
              { value: 'Maintenance + steady-state' },
            ],
          },
        },
      ],
    },
    {
      blockType: 'mission-vision-values',
      category: 'content',
      variants: [
        {
          name: 'grid',
          data: {
            blockType: 'mission-vision-values',
            mission:
              'Deliver transformative technologies that help mid-market teams ship outcomes their leadership can stand behind.',
            vision:
              'A regional consulting model where senior US engineers and the businesses they serve grow together for decades, not project cycles.',
            values: [
              {
                name: 'Localshoring',
                description:
                  'Senior talent in the same time zone and culture, embedded with your team.',
              },
              {
                name: 'Outcomes over hours',
                description: 'Engagements end when the work works, not when the budget runs.',
              },
              {
                name: 'Plain language',
                description: 'No jargon, no theatre, no slides that hide what we mean.',
              },
              {
                name: 'Compound trust',
                description:
                  'We optimize for the next decade with each client, not the next quarter.',
              },
            ],
            layout: 'grid',
          },
        },
      ],
    },
    {
      blockType: 'timeline',
      category: 'content',
      variants: [
        {
          name: 'company-milestones',
          data: {
            blockType: 'timeline',
            heading: 'SEQTEK milestones',
            items: [
              {
                date: '1999',
                title: 'Founded in Tulsa',
                body: 'Started as a small consulting practice serving regional manufacturers.',
              },
              {
                date: '2008',
                title: 'First multi-market engagement',
                body: 'Expanded from Tulsa-only into OKC with a healthcare data project.',
              },
              {
                date: '2018',
                title: 'Localshoring model formalized',
                body: 'Named the senior-engineer, in-time-zone delivery model that had been informal until then.',
              },
              {
                date: '2024',
                title: 'Touchstone workshop series launched',
                body: 'Three-workshop arc anchoring discovery, alignment, and decision-making for leadership teams.',
              },
            ],
          },
        },
      ],
    },
    {
      blockType: 'stats-bar',
      category: 'social-proof',
      variants: [
        {
          name: 'inline',
          data: {
            blockType: 'stats-bar',
            heading: 'By the numbers',
            source: 'inline',
            items: [
              { number: '25', label: 'years operating', suffix: '+' },
              { number: '0.7', label: 'cost vs FTE hire', suffix: 'x' },
              { number: '52', label: 'reduction in downtime', suffix: '%' },
              { number: '8', label: 'overlap hours', suffix: 'h' },
            ],
          },
        },
      ],
    },
    {
      blockType: 'logo-bar',
      category: 'social-proof',
      variants: [
        {
          name: 'inline-grayscale',
          data: {
            blockType: 'logo-bar',
            heading: 'Trusted by leadership teams',
            source: 'inline',
            logos: [
              { logo: media.logo },
              { logo: media.logo },
              { logo: media.logo },
              { logo: media.logo },
              { logo: media.logo },
            ],
            treatment: 'grayscale-on-color-hover',
          },
        },
      ],
    },
    {
      blockType: 'featured-testimonials',
      category: 'social-proof',
      variants: [
        {
          name: 'three-up',
          data: {
            blockType: 'featured-testimonials',
            heading: 'What clients are saying',
            testimonials: supporting.testimonialIds,
            autoplay: false,
          },
        },
      ],
    },
    {
      blockType: 'testimonial-block',
      category: 'social-proof',
      variants: [
        {
          name: 'centered',
          data: {
            blockType: 'testimonial-block',
            testimonial: supporting.testimonialIds[0],
            layout: 'centered',
          },
        },
        {
          name: 'with-photo-left',
          data: {
            blockType: 'testimonial-block',
            testimonial: supporting.testimonialIds[1],
            layout: 'with-photo-left',
          },
        },
        {
          name: 'with-photo-right',
          data: {
            blockType: 'testimonial-block',
            testimonial: supporting.testimonialIds[2],
            layout: 'with-photo-right',
          },
        },
      ],
    },
    {
      blockType: 'client-logo-grid',
      category: 'social-proof',
      variants: [
        {
          name: 'four-col',
          data: {
            blockType: 'client-logo-grid',
            heading: 'Industry partners',
            logos: [
              { logo: media.logo, caption: 'Manufacturing' },
              { logo: media.logo, caption: 'Healthcare' },
              { logo: media.logo, caption: 'FinTech' },
              { logo: media.logo, caption: 'Energy' },
              { logo: media.logo, caption: 'Logistics' },
              { logo: media.logo, caption: 'Education' },
              { logo: media.logo, caption: 'Public sector' },
              { logo: media.logo, caption: 'Nonprofits' },
            ],
            columns: '4',
          },
        },
      ],
    },
    {
      blockType: 'cta-section',
      category: 'cta',
      variants: [
        {
          name: 'centered',
          data: {
            blockType: 'cta-section',
            variant: 'centered',
            headline: 'Centered CTA',
            body: 'Symmetrical CTA used at the end of pages.',
            primaryCta: { label: 'Book a call', url: '/showcase' },
            secondaryCta: { label: 'Learn more', url: '/showcase' },
            background: 'default',
          },
        },
        {
          name: 'split',
          data: {
            blockType: 'cta-section',
            variant: 'split',
            headline: 'Split CTA',
            body: 'Left-aligned CTA pairing with adjacent context above or below.',
            primaryCta: { label: 'Primary', url: '/showcase' },
            background: 'default',
          },
        },
        {
          name: 'inverse',
          data: {
            blockType: 'cta-section',
            variant: 'inverse',
            headline: 'Inverse CTA',
            body: 'Brand-color background; high-contrast button.',
            primaryCta: { label: 'Get started', url: '/showcase' },
            background: 'accent',
          },
        },
        {
          name: 'centered-image-bg',
          data: {
            blockType: 'cta-section',
            variant: 'centered',
            headline: 'Centered CTA with image background',
            body: 'Image renders behind the copy at reduced opacity.',
            primaryCta: { label: 'Primary action', url: '/showcase' },
            background: 'image',
            backgroundImage: media.photo,
          },
        },
      ],
    },
    {
      blockType: 'newsletter-cta',
      category: 'cta',
      variants: [
        {
          name: 'with-body',
          data: {
            blockType: 'newsletter-cta',
            heading: 'Subscribe to SEQTEK Insights',
            body: 'Quarterly notes on localshoring, mid-market consulting, and what is working in regional tech teams.',
            formId: '00000000-aaaa-bbbb-cccc-dddddddddddd',
          },
        },
        {
          name: 'no-form-id',
          data: {
            blockType: 'newsletter-cta',
            heading: 'Stay in the loop',
            body: 'Falls back to the env-var form GUID at render time.',
          },
        },
      ],
    },
    {
      blockType: 'contact-cta',
      category: 'cta',
      variants: [
        {
          name: 'with-meeting-url',
          data: {
            blockType: 'contact-cta',
            heading: 'Talk to a pillar lead',
            body: 'Tell us what you are trying to ship and we will tell you whether we are the right team for it.',
            primaryCta: { label: 'Book a call', url: '/contact/book-a-call' },
            secondaryCta: { label: 'Email us', url: 'mailto:hello@seqtechllc.com' },
            meetingUrl: 'https://meetings.hubspot.com/seqtek/intro',
          },
        },
        {
          name: 'no-meeting-url',
          data: {
            blockType: 'contact-cta',
            heading: 'Get in touch',
            body: 'No HubSpot meetings URL: the fallback card shows.',
            primaryCta: { label: 'Contact us', url: '/contact' },
          },
        },
      ],
    },
    {
      blockType: 'case-study-grid',
      category: 'content-collection',
      variants: [
        {
          name: 'manual',
          data: {
            blockType: 'case-study-grid',
            heading: 'Recent case studies',
            source: 'manual',
            manualItems: supporting.caseStudyIds,
            limit: 3,
          },
        },
        {
          name: 'by-industry',
          data: {
            blockType: 'case-study-grid',
            heading: 'By industry',
            source: 'by-industry',
            industry: supporting.industryIds[0],
            limit: 3,
          },
        },
      ],
    },
    {
      blockType: 'service-cards',
      category: 'content-collection',
      variants: [
        {
          name: 'manual',
          data: {
            blockType: 'service-cards',
            heading: 'Services',
            source: 'manual',
            manualItems: supporting.serviceIds,
          },
        },
        {
          name: 'by-pillar',
          data: {
            blockType: 'service-cards',
            heading: 'By pillar',
            source: 'by-pillar',
            pillar: supporting.servicePillarIds[0],
          },
        },
      ],
    },
    {
      blockType: 'featured-case-study',
      category: 'content-collection',
      variants: [
        {
          name: 'default',
          data: {
            blockType: 'featured-case-study',
            heading: 'Featured case study',
            caseStudy: supporting.caseStudyIds[0],
          },
        },
      ],
    },
    {
      blockType: 'post-list',
      category: 'content-collection',
      variants: [
        {
          name: 'manual',
          data: {
            blockType: 'post-list',
            heading: 'Latest insights',
            source: 'manual',
            manualItems: supporting.postIds,
            limit: 3,
          },
        },
        {
          name: 'latest',
          data: {
            blockType: 'post-list',
            heading: 'Latest',
            source: 'latest',
            limit: 6,
          },
        },
      ],
    },
    {
      blockType: 'related-posts',
      category: 'content-collection',
      variants: [
        {
          name: 'manual',
          data: {
            blockType: 'related-posts',
            heading: 'Related posts',
            manualItems: supporting.postIds.slice(0, 3),
          },
        },
        {
          name: 'fallback',
          data: {
            blockType: 'related-posts',
            heading: 'No manual items',
          },
        },
      ],
    },
    {
      blockType: 'industry-grid',
      category: 'content-collection',
      variants: [
        {
          name: 'four-up',
          data: {
            blockType: 'industry-grid',
            heading: 'Industries we serve',
            industries: supporting.industryIds,
          },
        },
      ],
    },
    {
      blockType: 'locations-list',
      category: 'content-collection',
      variants: [
        {
          name: 'all-markets',
          data: {
            blockType: 'locations-list',
            heading: 'Where we work',
            locations: supporting.locationIds,
          },
        },
      ],
    },
    {
      blockType: 'workshop-list',
      category: 'content-collection',
      variants: [
        {
          name: 'touchstone-progression',
          data: {
            blockType: 'workshop-list',
            heading: 'Touchstone workshops',
            workshops: supporting.workshopIds,
          },
        },
      ],
    },
    {
      blockType: 'video-embed',
      category: 'specialty',
      variants: [
        {
          name: 'youtube',
          data: {
            blockType: 'video-embed',
            provider: 'youtube',
            videoId: 'dQw4w9WgXcQ',
            title: 'YouTube embed example',
          },
        },
        {
          name: 'with-facade-thumbnail',
          data: {
            blockType: 'video-embed',
            provider: 'youtube',
            videoId: 'dQw4w9WgXcQ',
            title: 'Facade-style embed with click-to-load',
            thumbnail: media.screenshot,
          },
        },
      ],
    },
    {
      blockType: 'faq',
      category: 'specialty',
      variants: [
        {
          name: 'three-questions',
          data: {
            blockType: 'faq',
            heading: 'Frequently asked questions',
            items: [
              {
                question: 'What is localshoring?',
                answer: buildLexical([
                  {
                    kind: 'p',
                    text: 'Senior US engineers in the same time zone and culture as your team, embedded for the duration of the engagement. No offshore handoffs.',
                  },
                ]),
              },
              {
                question: 'How does pricing work?',
                answer: buildLexical([
                  {
                    kind: 'p',
                    text: 'Fixed-fee engagements scoped at the start, with clearly named deliverables. No hourly billing.',
                  },
                ]),
              },
              {
                question: 'How small an engagement do you accept?',
                answer: buildLexical([
                  {
                    kind: 'p',
                    text: 'Touchstone workshops start at one week. Full engagements typically start at four weeks of senior-team effort.',
                  },
                ]),
              },
            ],
          },
        },
      ],
    },
    {
      blockType: 'accordion',
      category: 'specialty',
      variants: [
        {
          name: 'generic-disclosure',
          data: {
            blockType: 'accordion',
            heading: 'More details',
            items: [
              {
                title: 'Engagement timeline',
                body: 'A typical engagement is 4 to 12 weeks: 1 week of discovery, 2 to 10 weeks of build, 1 week of handoff.',
              },
              {
                title: 'Team composition',
                body: 'You get a pillar lead, a principal engineer, and 1 to 2 senior engineers depending on scope.',
              },
              {
                title: 'Reporting cadence',
                body: 'Weekly written readouts on Friday afternoon; daily standups as needed.',
              },
            ],
          },
        },
      ],
    },
    {
      blockType: 'tabs',
      category: 'specialty',
      variants: [
        {
          name: 'engagement-models',
          data: {
            blockType: 'tabs',
            heading: 'Engagement models',
            tabs: [
              {
                label: 'Workshop',
                body: 'One week, on-site or virtual. Fixed fee. Discovery, alignment, or decision-making.',
              },
              {
                label: 'Project',
                body: 'Four to twelve weeks. Fixed scope. Senior team embedded with yours.',
              },
              {
                label: 'Retained',
                body: 'Quarterly engagement. Senior leadership pairing for ongoing platform decisions.',
              },
            ],
          },
        },
      ],
    },
    {
      blockType: 'map',
      category: 'specialty',
      variants: [
        {
          name: 'tulsa-osm',
          data: {
            blockType: 'map',
            heading: 'Tulsa headquarters',
            embedUrl:
              'https://www.openstreetmap.org/export/embed.html?bbox=-95.999%2C36.149%2C-95.985%2C36.156&layer=mapnik',
            caption: '12 N Cheyenne Ave, Tulsa, OK 74103',
            height: 360,
          },
        },
      ],
    },
    {
      blockType: 'embed',
      category: 'specialty',
      variants: [
        {
          name: 'placeholder-iframe',
          data: {
            blockType: 'embed',
            title: 'Demo embed',
            url: 'https://example.com',
            caption: 'Sandbox iframe placeholder',
            height: 400,
          },
        },
      ],
    },
    // ---- Deferred catalog blocks (BLOCK_LIBRARY.md §5.7) ----
    {
      blockType: 'deliverables',
      category: 'content',
      variants: [
        {
          name: 'four-deliverables',
          data: {
            blockType: 'deliverables',
            heading: 'What ships from a Touchstone engagement',
            items: [
              { label: 'Plan of record with named owners' },
              { label: 'Weekly Friday readouts (written)' },
              { label: 'Production-ready code behind a feature flag' },
              { label: 'Runbook + handoff session for the internal team' },
            ],
          },
        },
      ],
    },
    {
      blockType: 'metric-display',
      category: 'social-proof',
      variants: [
        {
          name: 'accent',
          data: {
            blockType: 'metric-display',
            number: '0.7x',
            label: 'Cost vs full-time hire',
            context: 'Across embedded engagements 4 weeks and longer.',
            background: 'accent',
          },
        },
        {
          name: 'inverse',
          data: {
            blockType: 'metric-display',
            number: '8h',
            label: 'Overlap with US business hours',
            context: 'Every day. No async-only handoffs.',
            background: 'inverse',
          },
        },
      ],
    },
    {
      blockType: 'service-pillar-cards',
      category: 'content-collection',
      variants: [
        {
          name: 'three-pillars',
          data: {
            blockType: 'service-pillar-cards',
            heading: 'Three service pillars',
            pillars: supporting.servicePillarIds,
          },
        },
      ],
    },
    {
      blockType: 'team-grid',
      category: 'content-collection',
      variants: [
        {
          name: 'manual-cards',
          data: {
            blockType: 'team-grid',
            heading: 'Leadership',
            filter: 'leadership-only',
            layout: 'cards',
            manualItems: supporting.teamMemberIds,
          },
        },
        {
          name: 'filter-only',
          data: {
            blockType: 'team-grid',
            heading: 'Featured team',
            filter: 'featured',
            layout: 'compact',
          },
        },
      ],
    },
    {
      blockType: 'download-card',
      category: 'specialty',
      variants: [
        {
          name: 'with-cover',
          data: {
            blockType: 'download-card',
            title: 'Localshoring vs offshore: the 2026 buyer’s guide',
            description:
              'A short PDF for engineering and operations leaders comparing total cost, velocity, and risk across the three sourcing models.',
            coverImage: media.illustration,
            formId: '00000000-aaaa-bbbb-cccc-dddddddddddd',
            fileUrl: 'https://example.com/localshoring-guide.pdf',
          },
        },
      ],
    },
    {
      blockType: 'hubspot-form',
      category: 'specialty',
      variants: [
        {
          name: 'with-redirect',
          data: {
            blockType: 'hubspot-form',
            heading: 'Get in touch',
            description: 'Tell us about your team and what you are trying to ship.',
            formId: '11111111-aaaa-bbbb-cccc-dddddddddddd',
            submitRedirect: '/contact/thank-you',
          },
        },
      ],
    },
    {
      blockType: 'hubspot-meetings',
      category: 'specialty',
      variants: [
        {
          name: 'intro-call',
          data: {
            blockType: 'hubspot-meetings',
            heading: 'Book a 30-minute intro call',
            meetingUrl: 'https://meetings.hubspot.com/seqtek/intro',
          },
        },
      ],
    },
    {
      blockType: 'brand-teaser',
      category: 'specialty',
      variants: [
        {
          name: 'sequoyah',
          data: {
            blockType: 'brand-teaser',
            headline: 'Why SEQTEK is named for Sequoyah',
            body: 'The Cherokee scholar who built a writing system from scratch in the early 1800s. The name signals the kind of patient, generation-spanning work we want to be known for.',
            linkLabel: 'Read our story',
            linkUrl: '/about/our-story',
            image: media.illustration,
          },
        },
      ],
    },
    {
      blockType: 'nav-cards',
      category: 'specialty',
      variants: [
        {
          name: 'three-cards',
          data: {
            blockType: 'nav-cards',
            cards: [
              {
                title: 'Our story',
                description: 'A 25-year arc of how SEQTEK got here.',
                image: media.photo,
                linkUrl: '/about/our-story',
              },
              {
                title: 'The team',
                description: 'Senior engineers and pillar leads.',
                image: media.photo,
                linkUrl: '/about/team',
              },
              {
                title: 'Localshoring',
                description: 'The delivery model the company is built on.',
                image: media.photo,
                linkUrl: '/about/localshoring',
              },
            ],
          },
        },
      ],
    },
    {
      blockType: 'key-takeaways',
      category: 'specialty',
      variants: [
        {
          name: 'three-takeaways',
          data: {
            blockType: 'key-takeaways',
            heading: 'Key takeaways',
            items: [
              {
                label:
                  'A senior team in your time zone catches half the problems before they reach a ticket.',
              },
              {
                label: 'Fixed-scope, fixed-fee engagements end at the work, not the budget.',
              },
              {
                label:
                  'Discovery weeks pay back the most when the team is split across timezones today.',
              },
            ],
          },
        },
      ],
    },
    {
      blockType: 'tech-stack',
      category: 'specialty',
      variants: [
        {
          name: 'web-platform',
          data: {
            blockType: 'tech-stack',
            heading: 'Technologies in this engagement',
            items: [
              { label: 'TypeScript' },
              { label: 'Next.js', linkUrl: '/services/web-platform' },
              { label: 'Postgres' },
              { label: 'AWS' },
              { label: 'Payload CMS' },
              { label: 'Tailwind' },
            ],
          },
        },
      ],
    },
  ]
}
