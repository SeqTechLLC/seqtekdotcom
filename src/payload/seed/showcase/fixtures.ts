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
      blockType: 'cta',
      variants: [
        {
          name: 'buttons-centered',
          data: {
            blockType: 'cta',
            action: 'buttons',
            variant: 'centered',
            background: 'brand',
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
          name: 'team-members',
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
      blockType: 'embed',
      variants: [
        {
          name: 'video-vimeo-poster',
          data: {
            blockType: 'embed',
            kind: 'video',
            provider: 'vimeo',
            videoId: '76979871',
            heading: 'A recorded session',
            title: 'Vimeo embed behind a click-to-load poster',
            thumbnail: media.screenshot,
          },
        },
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
