import type { SupportingIds } from './supportingDocs'
import { buildLexical } from './lexical'

export interface MediaIdMap {
  photo: string | number
  screenshot: string | number
  logo: string | number
  illustration: string | number
}

// Sourced from the canonical taxonomy (spec 011) so the showcase harness and
// the admin block picker cannot drift apart. Re-exported for existing callers.
import { blockCategoryFromGroupLabel, type BlockCategory } from '../../blocks/categories'
import { layoutBlocks } from '../../blocks/layout'

export type { BlockCategory }

export interface BlockVariant {
  /** Slug-safe variant id, used in the per-block page slug suffix. */
  name: string
  /** Saved Payload block JSON (includes `blockType`). */
  data: Record<string, unknown>
}

interface AuthoredBlockFixture {
  blockType: string
  /** One entry per visually-distinct variant. */
  variants: BlockVariant[]
}

export interface BlockFixture extends AuthoredBlockFixture {
  /**
   * Derived from the block's own `admin.group`, never authored here. The
   * assignment lives in one place — the block config — so the showcase
   * harness and the admin picker cannot disagree about what a block is.
   * (They did before spec 011 US2: fixtures had `faq` under specialty and
   * `mission-vision-values` under content, each the reverse of the section it
   * sits in in BLOCK_LIBRARY.md §5.)
   */
  category: BlockCategory
}

/**
 * A polymorphic `manualItems` value, as Payload stores it: the `cards` block's
 * one relationship spans every listable collection, so each pick names its own.
 */
const picks = (relationTo: string, ids: Array<string | number>) =>
  ids.map((value) => ({ relationTo, value }))

/**
 * Returns the canonical fixture set. Add entries here as new blocks land — the
 * seed script will pick them up automatically.
 *
 * Per-block showcase pages stack every variant of the block. Per-category
 * showcase pages stack the first variant of every block in that category.
 */
function getAuthoredFixtures(media: MediaIdMap, supporting: SupportingIds): AuthoredBlockFixture[] {
  return [
    {
      blockType: 'hero',
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
          name: 'cover-left',
          data: {
            blockType: 'hero',
            variant: 'cover',
            alignment: 'left',
            eyebrow: 'COVER · LEFT',
            headline: 'Words over a full-width photo',
            subheadline:
              'A dark scrim sits between the photo and the copy, so the words stay readable whatever the picture.',
            media: media.photo,
            primaryCta: { label: 'Primary action', url: '/showcase', variant: 'primary' },
            secondaryCta: { label: 'Secondary', url: '/showcase' },
          },
        },
        {
          name: 'cover-center',
          data: {
            blockType: 'hero',
            variant: 'cover',
            alignment: 'center',
            eyebrow: 'COVER · CENTER',
            headline: 'A centered cover for a campaign page',
            subheadline: 'The outlined button style turns white on the scrim.',
            media: media.photo,
            primaryCta: { label: 'Outlined action', url: '/showcase', variant: 'secondary' },
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
            subheadline: 'The image sits beside the copy and stacks under it on a phone.',
            media: media.photo,
            primaryCta: { label: 'Text-only action', url: '/showcase', variant: 'ghost' },
            secondaryCta: { label: 'Secondary', url: '/showcase' },
          },
        },
      ],
    },
    {
      blockType: 'case-study-hero',
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
          name: 'standard-inverse',
          data: {
            blockType: 'content',
            width: 'standard',
            background: 'inverse',
            body: buildLexical([
              { kind: 'h', tag: 'h2', text: 'Standard on the dark band' },
              {
                kind: 'p',
                text: 'The prose switches to its light-on-dark colours so it stays readable.',
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
      blockType: 'media-text',
      variants: [
        {
          name: 'media-left',
          data: {
            blockType: 'media-text',
            mediaPosition: 'left',
            media: media.photo,
            background: 'none',
            body: buildLexical([
              { kind: 'h', tag: 'h2', text: 'One point with a picture' },
              {
                kind: 'p',
                text: 'The image sits on the left and the words on the right; on a phone the image comes first.',
              },
            ]),
            cta: { label: 'See the work', url: '/showcase' },
          },
        },
        {
          name: 'media-right-subtle',
          data: {
            blockType: 'media-text',
            mediaPosition: 'right',
            media: media.illustration,
            background: 'subtle',
            body: buildLexical([
              { kind: 'h', tag: 'h2', text: 'The same shape, mirrored' },
              {
                kind: 'p',
                text: 'Alternate the side down a page so it does not read as a ladder.',
              },
            ]),
          },
        },
        {
          name: 'teaser-accent',
          data: {
            blockType: 'media-text',
            mediaPosition: 'left',
            media: media.screenshot,
            background: 'accent',
            body: buildLexical([
              { kind: 'h', tag: 'h2', text: 'A headline, a paragraph and a link' },
              {
                kind: 'p',
                text: 'The teaser shape: a short heading, two or three sentences, and a button that leads to the full story.',
              },
            ]),
            cta: { label: 'Read the story', url: '/showcase' },
          },
        },
        {
          name: 'media-right-inverse',
          data: {
            blockType: 'media-text',
            mediaPosition: 'right',
            media: media.photo,
            background: 'inverse',
            body: buildLexical([
              { kind: 'h', tag: 'h2', text: 'On the dark band' },
              { kind: 'p', text: 'The prose turns light so it reads against the dark surface.' },
            ]),
            cta: { label: 'Primary action', url: '/showcase' },
          },
        },
      ],
    },
    {
      blockType: 'two-column',
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
          name: 'wide-accent',
          data: {
            blockType: 'image',
            image: media.screenshot,
            caption: 'Wider measure for product screenshots and diagrams.',
            width: 'wide',
            alignment: 'center',
            background: 'accent',
          },
        },
        {
          name: 'narrow-left-subtle',
          data: {
            blockType: 'image',
            image: media.illustration,
            caption: 'Narrow, set to the left of the page.',
            width: 'narrow',
            alignment: 'left',
            background: 'subtle',
          },
        },
        {
          name: 'standard-right-inverse',
          data: {
            blockType: 'image',
            image: media.photo,
            caption: 'Standard, set to the right, on the dark band.',
            width: 'standard',
            alignment: 'right',
            background: 'inverse',
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
      variants: [
        {
          name: 'grid-four',
          data: {
            blockType: 'gallery',
            heading: 'Four pictures run four across',
            intro: 'The grid picks its columns from the count; there is no column setting.',
            layout: 'grid',
            items: [
              { image: media.photo, caption: 'Discovery session' },
              { image: media.screenshot, caption: 'Whiteboard mapping' },
              { image: media.illustration, caption: 'Plan of record' },
              { image: media.photo, caption: 'Team readout' },
            ],
          },
        },
        {
          name: 'grid-five-subtle',
          data: {
            blockType: 'gallery',
            heading: 'Five pictures run three across',
            layout: 'grid',
            background: 'subtle',
            items: [
              { image: media.photo, caption: 'One' },
              { image: media.screenshot, caption: 'Two' },
              { image: media.illustration, caption: 'Three' },
              { image: media.photo, caption: 'Four' },
              { image: media.screenshot, caption: 'Five' },
            ],
          },
        },
        {
          name: 'grid-single-accent',
          data: {
            blockType: 'gallery',
            heading: 'A single picture holds a reading width',
            layout: 'grid',
            background: 'accent',
            items: [{ image: media.photo, caption: 'Centred at the standard image measure' }],
          },
        },
        {
          name: 'carousel-inverse',
          data: {
            blockType: 'gallery',
            heading: 'A carousel on the dark band',
            intro: 'Swipe or scroll sideways; the row takes keyboard focus.',
            layout: 'carousel',
            background: 'inverse',
            items: [
              { image: media.photo, caption: 'On-site week one' },
              { image: media.screenshot, caption: 'Build phase' },
              { image: media.illustration, caption: 'Handoff' },
              { image: media.photo, caption: 'Retrospective' },
            ],
          },
        },
        {
          name: 'logos-eight',
          data: {
            blockType: 'gallery',
            heading: 'Organizations we have worked with',
            layout: 'logos',
            items: [
              { image: media.logo, caption: 'Example Co.' },
              { image: media.logo },
              { image: media.logo, caption: 'Sample Group' },
              { image: media.logo },
              { image: media.logo },
              { image: media.logo, caption: 'Demo Partners' },
              { image: media.logo },
              { image: media.logo },
            ],
          },
        },
        {
          name: 'logos-three-subtle',
          data: {
            blockType: 'gallery',
            layout: 'logos',
            background: 'subtle',
            items: [{ image: media.logo }, { image: media.logo }, { image: media.logo }],
          },
        },
      ],
    },
    {
      blockType: 'process-steps',
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
      blockType: 'table',
      variants: [
        {
          name: 'comparison',
          data: {
            blockType: 'table',
            heading: 'Three ways to staff a team',
            intro:
              'The same questions asked of each model, with a closing row on who each one suits.',
            background: 'none',
            columns: [
              { label: 'Option A', tagline: 'Same time zone' },
              { label: 'Option B', tagline: 'A few hours apart' },
              { label: 'Option C', tagline: 'Half a day apart' },
            ],
            rows: [
              {
                dimension: 'Hours of overlap',
                cells: [{ value: '8 hours' }, { value: '5-6 hours' }, { value: '1-2 hours' }],
              },
              {
                dimension: 'Ramp-up time',
                cells: [{ value: '1-2 weeks' }, { value: '2-4 weeks' }, { value: '6+ weeks' }],
              },
              {
                dimension: 'Relative cost',
                cells: [{ value: 'Higher' }, { value: 'Middle' }, { value: 'Lower' }],
              },
            ],
            bestForRow: [
              { value: 'Critical roadmap work' },
              { value: 'Steady feature work' },
              { value: 'Maintenance' },
            ],
          },
        },
        {
          // Six columns and a short row: wider than a phone, so the frame
          // scrolls on its own and the missing cell is padded blank.
          name: 'many-columns',
          data: {
            blockType: 'table',
            heading: 'Plan comparison',
            background: 'subtle',
            columns: [
              { label: 'Starter' },
              { label: 'Team' },
              { label: 'Growth' },
              { label: 'Scale' },
              { label: 'Enterprise' },
              { label: 'Custom' },
            ],
            rows: [
              {
                dimension: 'Seats',
                cells: [
                  { value: '1' },
                  { value: '5' },
                  { value: '15' },
                  { value: '50' },
                  { value: '200' },
                  { value: 'Any' },
                ],
              },
              {
                dimension: 'Support',
                cells: [
                  { value: 'Email' },
                  { value: 'Email' },
                  { value: 'Chat' },
                  { value: 'Phone' },
                  { value: 'Named lead' },
                ],
              },
            ],
          },
        },
      ],
    },
    {
      blockType: 'mission-vision-values',
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
      variants: [
        {
          name: 'inline',
          data: {
            blockType: 'stats-bar',
            heading: 'By the numbers',
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
      variants: [
        {
          name: 'inline-grayscale',
          data: {
            blockType: 'logo-bar',
            heading: 'Trusted by leadership teams',
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
      variants: [
        {
          name: 'three-up',
          data: {
            blockType: 'featured-testimonials',
            heading: 'What clients are saying',
            testimonials: supporting.testimonialIds,
          },
        },
      ],
    },
    {
      blockType: 'testimonial-block',
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
      blockType: 'quote',
      variants: [
        {
          name: 'one-testimonial-centered',
          data: {
            blockType: 'quote',
            source: 'testimonials',
            testimonials: [supporting.testimonialIds[0]],
            layout: 'centered',
            background: 'subtle',
          },
        },
        {
          name: 'with-photo-left',
          data: {
            blockType: 'quote',
            source: 'testimonials',
            testimonials: [supporting.testimonialIds[1]],
            layout: 'with-photo-left',
            background: 'none',
          },
        },
        {
          name: 'with-photo-right',
          data: {
            blockType: 'quote',
            source: 'testimonials',
            testimonials: [supporting.testimonialIds[2]],
            layout: 'with-photo-right',
            background: 'accent',
          },
        },
        {
          name: 'grid',
          data: {
            blockType: 'quote',
            heading: 'What clients are saying',
            intro: 'Several testimonials always sit in a grid, whatever the layout says.',
            source: 'testimonials',
            testimonials: supporting.testimonialIds,
            background: 'none',
          },
        },
        {
          name: 'typed-pull-quote',
          data: {
            blockType: 'quote',
            source: 'custom',
            quote: 'Put the people who do the work in the room where the plan gets made.',
            attribution: 'A founder',
            role: 'From a keynote',
            layout: 'centered',
            background: 'inverse',
          },
        },
      ],
    },
    {
      blockType: 'client-logo-grid',
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
          // No supporting sentence — the heading has to carry the ask alone.
          // (A variant with no form GUID would render nothing at all, by
          // design: there is no way to subscribe without one.)
          name: 'heading-only',
          data: {
            blockType: 'newsletter-cta',
            heading: 'Stay in the loop',
            formId: '00000000-aaaa-bbbb-cccc-dddddddddddd',
          },
        },
      ],
    },
    {
      blockType: 'contact-cta',
      variants: [
        {
          name: 'with-meeting-url',
          data: {
            blockType: 'contact-cta',
            heading: 'Talk to a pillar lead',
            body: 'Tell us what you are trying to ship and we will tell you whether we are the right team for it.',
            primaryCta: { label: 'Book a call', url: '/contact' },
            secondaryCta: { label: 'Email us', url: 'mailto:hello@seqtechllc.com' },
            meetingUrl: 'https://meetings.hubspot.com/seqtek/intro',
          },
        },
        {
          name: 'no-meeting-url',
          data: {
            blockType: 'contact-cta',
            heading: 'Get in touch',
            body: 'No HubSpot meetings URL: the section collapses to one full-width column.',
            primaryCta: { label: 'Contact us', url: '/contact' },
          },
        },
      ],
    },
    {
      blockType: 'cta',
      variants: [
        {
          name: 'buttons-centered',
          data: {
            blockType: 'cta',
            action: 'buttons',
            variant: 'centered',
            background: 'accent',
            heading: 'Ready when you are',
            body: 'A centered ask with a main button and a lighter second link.',
            primaryCta: { label: 'Book a call', url: '/showcase', variant: 'primary' },
            secondaryCta: { label: 'Learn more', url: '/showcase' },
          },
        },
        {
          name: 'buttons-split',
          data: {
            blockType: 'cta',
            action: 'buttons',
            variant: 'split',
            background: 'subtle',
            heading: 'Copy on the left, buttons on the right',
            body: 'On a phone the two stack.',
            primaryCta: { label: 'Get started', url: '/showcase', variant: 'secondary' },
            secondaryCta: { label: 'See the work', url: '/showcase' },
          },
        },
        {
          name: 'buttons-inverse',
          data: {
            blockType: 'cta',
            action: 'buttons',
            variant: 'centered',
            background: 'inverse',
            heading: 'The loudest band on the page',
            body: 'Dark background, with the lighter button styles turned white.',
            primaryCta: { label: 'Talk to us', url: '/showcase', variant: 'ghost' },
          },
        },
        {
          name: 'meeting-split',
          data: {
            blockType: 'cta',
            action: 'meeting',
            variant: 'split',
            background: 'none',
            heading: 'Talk to a lead',
            body: 'Tell us what you are trying to ship and we will tell you whether we are the right team for it.',
            primaryCta: { label: 'Book a call', url: '/contact', variant: 'primary' },
            secondaryCta: { label: 'Email us', url: 'mailto:hello@example.com' },
            meetingUrl: 'https://meetings.hubspot.com/example/intro',
          },
        },
        {
          name: 'meeting-centered',
          data: {
            blockType: 'cta',
            action: 'meeting',
            variant: 'centered',
            background: 'accent',
            heading: 'Book a 30-minute intro call',
            meetingUrl: 'https://meetings.hubspot.com/example/intro',
          },
        },
        {
          name: 'newsletter-centered',
          data: {
            blockType: 'cta',
            action: 'newsletter',
            variant: 'centered',
            background: 'accent',
            heading: 'Subscribe to the newsletter',
            body: 'Quarterly notes on regional tech teams and what is working.',
            formId: '00000000-aaaa-bbbb-cccc-dddddddddddd',
          },
        },
        {
          name: 'newsletter-split-inverse',
          data: {
            blockType: 'cta',
            action: 'newsletter',
            variant: 'split',
            background: 'inverse',
            heading: 'Stay in the loop',
            formId: '00000000-aaaa-bbbb-cccc-dddddddddddd',
          },
        },
        {
          name: 'download-split',
          data: {
            blockType: 'cta',
            action: 'download',
            variant: 'split',
            background: 'none',
            heading: 'The buyer’s guide to staffing models',
            body: 'A short PDF comparing total cost, velocity and risk across three ways to staff a team.',
            coverImage: media.illustration,
            formId: '00000000-aaaa-bbbb-cccc-dddddddddddd',
            fileUrl: 'https://example.com/staffing-guide.pdf',
          },
        },
        {
          name: 'download-centered',
          data: {
            blockType: 'cta',
            action: 'download',
            variant: 'centered',
            background: 'subtle',
            heading: 'Get the checklist',
            body: 'One page, twelve questions to ask before you sign a statement of work.',
            coverImage: media.illustration,
            formId: '00000000-aaaa-bbbb-cccc-dddddddddddd',
            fileUrl: 'https://example.com/checklist.pdf',
          },
        },
      ],
    },
    {
      // The Query Loop block. One grid per collection first (the preview tool
      // captures the first variants), then the featured layout per collection:
      // with a photo, with a logo, and on a panel for the kinds that have none.
      // Hand-picked where the seeded docs make that deterministic; `all` and
      // `filtered` where the showcase set is the whole of what they find.
      blockType: 'cards',
      variants: [
        {
          name: 'case-studies-grid',
          data: {
            blockType: 'cards',
            heading: 'Recent case studies',
            intro: 'A few engagements, each with the outcome the client measured.',
            collection: 'caseStudies',
            source: 'manual',
            manualItems: picks('caseStudies', supporting.caseStudyIds),
            display: 'grid',
          },
        },
        {
          name: 'posts-grid',
          data: {
            blockType: 'cards',
            heading: 'Latest insights',
            collection: 'posts',
            source: 'manual',
            manualItems: picks('posts', supporting.postIds),
            display: 'grid',
          },
        },
        {
          name: 'services-by-group',
          data: {
            blockType: 'cards',
            heading: 'Services in this group',
            collection: 'services',
            source: 'filtered',
            serviceGroup: supporting.serviceGroupIds[0],
            display: 'grid',
            background: 'subtle',
          },
        },
        {
          name: 'service-groups',
          data: {
            blockType: 'cards',
            heading: 'Three service groups',
            collection: 'services',
            source: 'manual',
            manualItems: picks('services', supporting.serviceGroupIds),
            display: 'grid',
          },
        },
        {
          name: 'industries-grid',
          data: {
            blockType: 'cards',
            heading: 'Industries we serve',
            collection: 'industries',
            source: 'manual',
            manualItems: picks('industries', supporting.industryIds),
            display: 'grid',
          },
        },
        {
          name: 'workshops-grid',
          data: {
            blockType: 'cards',
            heading: 'Workshops',
            collection: 'workshops',
            source: 'manual',
            manualItems: picks('workshops', supporting.workshopIds),
            display: 'grid',
          },
        },
        {
          name: 'team-grid',
          data: {
            blockType: 'cards',
            heading: 'Leadership',
            collection: 'teamMembers',
            source: 'manual',
            manualItems: picks('teamMembers', supporting.teamMemberIds),
            display: 'grid',
          },
        },
        {
          name: 'locations-grid',
          data: {
            blockType: 'cards',
            heading: 'Where we work',
            collection: 'locations',
            source: 'manual',
            manualItems: picks('locations', supporting.locationIds),
            display: 'grid',
            background: 'subtle',
          },
        },
        {
          name: 'partners-grid',
          data: {
            blockType: 'cards',
            heading: 'Partners',
            collection: 'partners',
            source: 'manual',
            manualItems: picks('partners', supporting.partnerIds),
            display: 'grid',
          },
        },
        {
          name: 'case-studies-featured',
          data: {
            blockType: 'cards',
            heading: 'Featured work',
            collection: 'caseStudies',
            source: 'manual',
            manualItems: picks('caseStudies', supporting.caseStudyIds),
            display: 'featured',
          },
        },
        {
          name: 'posts-featured',
          data: {
            blockType: 'cards',
            heading: 'From the blog',
            collection: 'posts',
            source: 'manual',
            manualItems: picks('posts', supporting.postIds),
            limit: 2,
            display: 'featured',
            background: 'subtle',
          },
        },
        {
          name: 'services-featured',
          data: {
            blockType: 'cards',
            heading: 'Where most clients start',
            collection: 'services',
            source: 'manual',
            manualItems: picks('services', supporting.serviceIds),
            display: 'featured',
          },
        },
        {
          name: 'industries-featured',
          data: {
            blockType: 'cards',
            heading: 'Industries',
            collection: 'industries',
            source: 'manual',
            manualItems: picks('industries', supporting.industryIds),
            display: 'featured',
            background: 'accent',
          },
        },
        {
          name: 'workshops-featured',
          data: {
            blockType: 'cards',
            heading: 'Start with a workshop',
            collection: 'workshops',
            source: 'manual',
            manualItems: picks('workshops', supporting.workshopIds),
            display: 'featured',
          },
        },
        {
          name: 'team-featured',
          data: {
            blockType: 'cards',
            heading: 'The people you would work with',
            collection: 'teamMembers',
            source: 'manual',
            manualItems: picks('teamMembers', supporting.teamMemberIds),
            display: 'featured',
            background: 'inverse',
          },
        },
        {
          name: 'locations-featured',
          data: {
            blockType: 'cards',
            heading: 'Markets',
            collection: 'locations',
            source: 'manual',
            manualItems: picks('locations', supporting.locationIds),
            display: 'featured',
          },
        },
        {
          name: 'partners-featured',
          data: {
            blockType: 'cards',
            heading: 'Partner spotlight',
            collection: 'partners',
            source: 'manual',
            manualItems: picks('partners', supporting.partnerIds),
            display: 'featured',
          },
        },
      ],
    },
    {
      blockType: 'case-study-grid',
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
            pillar: supporting.serviceGroupIds[0],
          },
        },
      ],
    },
    {
      blockType: 'featured-case-study',
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
          // Capped below the number of posts picked, and with the default
          // heading. (A variant with nothing picked renders nothing at all, by
          // design — the block does not fill itself in.)
          name: 'capped',
          data: {
            blockType: 'related-posts',
            manualItems: supporting.postIds.slice(0, 3),
            limit: 2,
          },
        },
      ],
    },
    {
      blockType: 'industry-grid',
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
      variants: [
        {
          name: 'accordion',
          data: {
            blockType: 'accordion',
            display: 'accordion',
            background: 'none',
            heading: 'Honest answers',
            intro: 'Each panel opens in place. Answers are rich text.',
            items: [
              {
                title: 'How long does an engagement take?',
                body: buildLexical([
                  {
                    kind: 'p',
                    text: 'Usually 4 to 12 weeks: one week of discovery, two to ten of build, one of handoff.',
                  },
                ]),
              },
              {
                title: 'Who is on the team?',
                body: buildLexical([
                  {
                    kind: 'p',
                    text: 'A lead, a principal engineer, and one or two senior engineers depending on scope.',
                  },
                ]),
              },
              {
                title: 'How do we hear about progress?',
                body: buildLexical([
                  {
                    kind: 'p',
                    text: 'A written readout every Friday afternoon, and standups when they help.',
                  },
                ]),
              },
            ],
          },
        },
        {
          name: 'tabs',
          data: {
            blockType: 'accordion',
            display: 'tabs',
            background: 'subtle',
            heading: 'Ways to work together',
            items: [
              {
                title: 'Workshop',
                body: buildLexical([
                  { kind: 'p', text: 'One week, on-site or virtual, at a fixed fee.' },
                ]),
              },
              {
                title: 'Project',
                body: buildLexical([
                  {
                    kind: 'p',
                    text: 'Four to twelve weeks of fixed scope, embedded with your team.',
                  },
                ]),
              },
              {
                title: 'Retained',
                body: buildLexical([
                  { kind: 'p', text: 'A quarterly engagement for ongoing platform decisions.' },
                ]),
              },
              {
                title: 'Advisory',
                body: buildLexical([
                  { kind: 'p', text: 'A few hours a month with a senior lead on call.' },
                ]),
              },
            ],
          },
        },
      ],
    },
    {
      blockType: 'tabs',
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
      variants: [
        {
          name: 'video-youtube-subtle',
          data: {
            blockType: 'embed',
            kind: 'video',
            heading: 'A video, embedded directly',
            eyebrow: 'FROM THE ARCHIVE',
            provider: 'youtube',
            videoId: 'dQw4w9WgXcQ',
            title: 'YouTube embed example',
            background: 'subtle',
          },
        },
        {
          name: 'video-vimeo-poster',
          data: {
            blockType: 'embed',
            kind: 'video',
            provider: 'vimeo',
            videoId: '76979871',
            title: 'Vimeo embed behind a click-to-load poster',
            thumbnail: media.screenshot,
          },
        },
        {
          name: 'map-short',
          data: {
            blockType: 'embed',
            kind: 'map',
            heading: 'Where to find us',
            title: 'Map of an example office',
            url: 'https://www.openstreetmap.org/export/embed.html?bbox=-95.999%2C36.149%2C-95.985%2C36.156&layer=mapnik',
            caption: '123 Example Street, Anytown',
            height: 'short',
          },
        },
        {
          name: 'page-medium-accent',
          data: {
            blockType: 'embed',
            kind: 'page',
            title: 'Example embedded page',
            url: 'https://example.com',
            caption: 'Any https page that allows embedding, framed in a sandbox.',
            height: 'medium',
            background: 'accent',
          },
        },
        {
          name: 'page-tall-inverse',
          data: {
            blockType: 'embed',
            kind: 'page',
            heading: 'A tall frame on the dark band',
            title: 'Example embedded page, tall',
            url: 'https://example.com',
            caption: 'Tall suits a form or a dashboard.',
            height: 'tall',
            background: 'inverse',
          },
        },
      ],
    },
    // ---- Deferred catalog blocks (BLOCK_LIBRARY.md §5.7) ----
    {
      blockType: 'deliverables',
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
      variants: [
        {
          name: 'three-pillars',
          data: {
            blockType: 'service-pillar-cards',
            heading: 'Three service pillars',
            pillars: supporting.serviceGroupIds,
          },
        },
      ],
    },
    {
      blockType: 'team-grid',
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
            filter: 'all',
            layout: 'compact',
          },
        },
      ],
    },
    {
      blockType: 'download-card',
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
      variants: [
        {
          name: 'lead-capture',
          data: {
            blockType: 'hubspot-form',
            heading: 'Get in touch',
            description: 'Tell us about your team and what you are trying to ship.',
            formId: '11111111-aaaa-bbbb-cccc-dddddddddddd',
          },
        },
        {
          name: 'lead-capture-inverse',
          data: {
            blockType: 'hubspot-form',
            heading: 'A form on the dark band',
            description: 'The form sits on a light panel so its fields keep their contrast.',
            formId: '11111111-aaaa-bbbb-cccc-dddddddddddd',
            background: 'inverse',
          },
        },
        {
          name: 'lead-capture-subtle',
          data: {
            blockType: 'hubspot-form',
            heading: 'A form on the subtle band',
            formId: '11111111-aaaa-bbbb-cccc-dddddddddddd',
            background: 'subtle',
          },
        },
        {
          name: 'lead-capture-accent',
          data: {
            blockType: 'hubspot-form',
            heading: 'A form on the accent band',
            formId: '11111111-aaaa-bbbb-cccc-dddddddddddd',
            background: 'accent',
          },
        },
      ],
    },
    {
      blockType: 'hubspot-meetings',
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
      variants: [
        {
          name: 'sequoyah',
          data: {
            blockType: 'brand-teaser',
            headline: 'Why SEQTEK is named for Sequoyah',
            body: 'The Cherokee scholar who built a writing system from scratch in the early 1800s. The name signals the kind of patient, generation-spanning work we want to be known for.',
            linkLabel: 'Read our story',
            linkUrl: '/our-story',
            image: media.illustration,
          },
        },
      ],
    },
    {
      blockType: 'nav-cards',
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
                linkUrl: '/our-story',
              },
              {
                title: 'The team',
                description: 'Senior engineers and pillar leads.',
                image: media.photo,
                linkUrl: '/team',
              },
              {
                title: 'Localshoring',
                description: 'The delivery model the company is built on.',
                image: media.photo,
                // /about/localshoring was never a built route; the page is flat.
                linkUrl: '/localshoring',
              },
            ],
          },
        },
      ],
    },
    {
      blockType: 'key-takeaways',
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

/**
 * Returns the canonical fixture set, each entry carrying the category its
 * block declares in `admin.group`. Add entries to `getAuthoredFixtures` as
 * new blocks land — the seed script picks them up automatically.
 *
 * Per-block showcase pages stack every variant of the block. Per-category
 * showcase pages stack the first variant of every block in that category.
 */
export function getBlockFixtures(media: MediaIdMap, supporting: SupportingIds): BlockFixture[] {
  const categoryBySlug = new Map<string, BlockCategory>()
  for (const block of layoutBlocks) {
    const category = blockCategoryFromGroupLabel(block.admin?.group)
    if (category) categoryBySlug.set(block.slug, category)
  }

  return getAuthoredFixtures(media, supporting).map((fixture) => {
    const category = categoryBySlug.get(fixture.blockType)
    if (!category) {
      // A fixture for a block that is not registered, or a block with no
      // admin.group. adminMetadata.int.spec.ts fails on the second case; this
      // guard keeps the seed from silently filing it under a wrong heading.
      throw new Error(
        `showcase fixture "${fixture.blockType}" has no registered block with an admin.group`,
      )
    }
    return { ...fixture, category }
  })
}
