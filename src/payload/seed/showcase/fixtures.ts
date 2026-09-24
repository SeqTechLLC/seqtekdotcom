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
          name: 'with-image',
          data: {
            blockType: 'hero',
            variant: 'with-image',
            alignment: 'left',
            eyebrow: 'WITH-IMAGE',
            headline: 'Hero with a supporting image',
            subheadline: 'The image sits below the copy, full container width.',
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
            subheadline: 'The same image, set beside the copy instead of below it.',
            media: media.photo,
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
      blockType: 'items',
      variants: [
        {
          name: 'numbered-cards',
          data: {
            blockType: 'items',
            heading: 'How a project starts',
            layout: 'grid',
            markers: 'numbers',
            style: 'card',
            items: [
              { title: 'Listen', body: 'Interviews with the people who do the work today.' },
              {
                title: 'Plan',
                body: 'A short written plan with named owners and a first milestone.',
              },
              {
                title: 'Build',
                body: 'The smallest useful piece, in front of real users within weeks.',
              },
              {
                title: 'Hand over',
                body: 'Runbooks and a walkthrough, so your team owns what shipped.',
              },
            ],
          },
        },
        {
          name: 'plain-grid',
          data: {
            blockType: 'items',
            heading: 'What we do',
            intro: 'Three kinds of work, each run by the people who will do it.',
            layout: 'grid',
            style: 'plain',
            items: [
              {
                title: 'Build',
                body: 'Software that fits how your team already works, shipped in small pieces you can see and use.',
              },
              {
                title: 'Modernize',
                body: 'Older systems moved onto current ground one piece at a time, without stopping the business.',
              },
              {
                title: 'Advise',
                body: 'A senior second opinion on the plan, the budget and the risks before the money is spent.',
              },
            ],
          },
        },
        {
          name: 'stats-row',
          data: {
            blockType: 'items',
            heading: 'By the numbers',
            layout: 'grid',
            markers: 'custom',
            background: 'inverse',
            items: [
              { marker: '25+', title: 'years in business' },
              { marker: '0.7x', title: 'cost of a full-time hire' },
              { marker: '52%', title: 'less unplanned downtime' },
              { marker: '8h', title: 'shared working hours a day' },
            ],
          },
        },
        {
          name: 'single-metric',
          data: {
            blockType: 'items',
            layout: 'grid',
            markers: 'custom',
            background: 'accent',
            items: [
              {
                marker: '0.7x',
                title: 'Cost against a full-time hire',
                body: 'Across embedded engagements of four weeks or longer.',
              },
            ],
          },
        },
        {
          name: 'linked-cards',
          data: {
            blockType: 'items',
            heading: 'Where to next',
            layout: 'grid',
            style: 'card',
            items: [
              {
                title: 'Our story',
                body: 'How the company got here, and why it stayed.',
                image: media.photo,
                link: { url: '/our-story', label: 'Read our story' },
              },
              {
                title: 'The team',
                body: 'The engineers and leads you would work with.',
                image: media.photo,
                link: { url: '/team' },
              },
              {
                title: 'Case studies',
                body: 'Problems we were handed and what changed after.',
                image: media.photo,
                link: { url: '/case-studies', label: 'See the work' },
              },
            ],
          },
        },
        {
          name: 'lettered-line',
          data: {
            blockType: 'items',
            heading: 'Four habits that keep a project honest',
            layout: 'line',
            markers: 'custom',
            items: [
              {
                marker: 'S',
                title: 'Scope',
                body: 'Agree what is in and what is out before anything is built.',
              },
              {
                marker: 'H',
                title: 'Hypothesize',
                body: 'Say what you expect to happen, so the result can prove you wrong.',
              },
              {
                marker: 'I',
                title: 'Implement',
                body: 'Build the smallest piece that can test the idea.',
              },
              {
                marker: 'P',
                title: 'Prove',
                body: 'Check the result against what you expected, then decide the next step.',
              },
            ],
          },
        },
        {
          name: 'numbered-line',
          data: {
            blockType: 'items',
            heading: 'Three steps to a first release',
            layout: 'line',
            markers: 'numbers',
            items: [
              {
                title: 'Map the work',
                body: 'Walk the current process end to end with the people in it.',
              },
              {
                title: 'Cut the first slice',
                body: 'Pick the one change that proves the approach.',
              },
              {
                title: 'Ship and measure',
                body: 'Release it, watch it, and decide what comes next.',
              },
            ],
          },
        },
        {
          name: 'dated-line',
          data: {
            blockType: 'items',
            heading: 'Milestones',
            layout: 'line',
            markers: 'custom',
            items: [
              {
                marker: '1999',
                title: 'Founded',
                body: 'A two-person practice serving local manufacturers.',
              },
              {
                marker: '2008',
                title: 'A second city',
                body: 'The first engagement outside the home market.',
              },
              {
                marker: '2018',
                title: 'The model gets a name',
                body: 'An informal way of working, written down.',
              },
              {
                marker: '2024',
                title: 'Workshops',
                body: 'A workshop series for leadership teams.',
              },
            ],
          },
        },
        {
          name: 'dotted-line',
          data: {
            blockType: 'items',
            heading: 'What happens after you call',
            layout: 'line',
            items: [
              { title: 'A reply the same day', body: 'From a person, not a queue.' },
              { title: 'A short call', body: 'Thirty minutes on what you are trying to change.' },
              { title: 'A written next step', body: 'Whether or not it involves us.' },
            ],
          },
        },
        {
          name: 'bullet-list',
          data: {
            blockType: 'items',
            heading: 'What you get',
            layout: 'list',
            items: [
              { title: 'A plan with named owners' },
              { title: 'Weekly written readouts' },
              { title: 'Production-ready code behind a feature flag' },
              { title: 'Runbooks for your team' },
              { title: 'A handover session' },
            ],
          },
        },
        {
          name: 'numbered-list',
          data: {
            blockType: 'items',
            heading: 'Key takeaways',
            layout: 'list',
            markers: 'numbers',
            background: 'subtle',
            items: [
              { title: 'A team in your time zone catches problems before they reach a ticket.' },
              { title: 'Fixed-scope work ends when the work is done, not when the budget is.' },
              { title: 'A discovery week pays back most when the team is split today.' },
            ],
          },
        },
        {
          name: 'tags',
          data: {
            blockType: 'items',
            heading: 'Tools we use',
            layout: 'tags',
            items: [
              { title: 'TypeScript' },
              { title: 'Next.js', link: { url: '/services' } },
              { title: 'Postgres' },
              { title: 'AWS' },
              { title: 'Payload CMS' },
              { title: 'Tailwind' },
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
