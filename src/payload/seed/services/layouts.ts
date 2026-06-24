/**
 * Block layouts for the four peer-offering Pages (feat/services-restructure).
 * Every section maps to an EXISTING block (no new blocks). Gated copy is marked
 * with a [PLACEHOLDER — …] prefix so an editor can find and replace it.
 *
 * Funnel rule (decided): Workshops is the primary funnel. Every closing CTA's
 * primary action is "Start with a workshop" → /workshops; secondary is
 * "Book a call" → /contact/book-a-call.
 */
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { buildLexical } from '../showcase/lexical'

type Block = Record<string, unknown> & { blockType: string }

const WORKSHOPS_URL = '/workshops'
const BOOK_URL = '/contact/book-a-call'

const PLACEHOLDER = (who: string, note: string): string =>
  `[PLACEHOLDER - ${who}-gated copy: ${note}]`

/** Closing CTA shared by every offering page (workshops-first funnel). */
const closingCta = (headline: string, body: string): Block => ({
  blockType: 'cta-section',
  variant: 'centered',
  headline,
  body,
  primaryCta: { label: 'Start with a workshop', url: WORKSHOPS_URL },
  secondaryCta: { label: 'Book a call', url: BOOK_URL },
  background: 'accent',
})

const content = (
  body: SerializedEditorState,
  width: 'narrow' | 'standard' | 'wide' = 'standard',
): Block => ({
  blockType: 'content',
  width,
  background: 'none',
  body,
})

// ---------------------------------------------------------------------------
// 1. /services overview
// ---------------------------------------------------------------------------
export function overviewLayout(opts: { featuredCaseStudyId: string | number | null }): Block[] {
  const blocks: Block[] = [
    {
      blockType: 'hero',
      variant: 'text-only',
      eyebrow: 'How we help',
      headline: 'Pick where you want to start.',
      subheadline:
        'Four ways to work with SEQTEK, one delivery model behind all of them: senior US engineers who ship. Most engagements start with a workshop so we align before we build.',
      primaryCta: { label: 'Start with a workshop', url: WORKSHOPS_URL, variant: 'primary' },
      secondaryCta: { label: 'Book a call', url: BOOK_URL },
      alignment: 'left',
    },
    {
      blockType: 'nav-cards',
      cards: [
        {
          title: 'Workshops',
          description:
            'A focused working session that turns a fuzzy problem into a plan you can act on. The best first step into any engagement.',
          linkUrl: WORKSHOPS_URL,
        },
        {
          title: 'Localshoring',
          description:
            'A senior US engineering team that plugs into your roadmap. The velocity of an in-house team without the hiring overhead.',
          linkUrl: '/services/localshoring',
        },
        {
          title: 'AI Integration',
          description:
            'Where AI actually fits your business, and where it does not. Practical wins, not buzzwords.',
          linkUrl: '/services/ai-integration',
        },
        {
          title: 'Digital Transformation',
          description:
            'Custom software plus the change management to make it stick, including fractional product ownership.',
          linkUrl: '/services/digital-transformation',
        },
      ],
    },
  ]

  if (opts.featuredCaseStudyId != null) {
    blocks.push({
      blockType: 'featured-case-study',
      heading: 'What this looks like in practice',
      caseStudy: opts.featuredCaseStudyId,
    })
  }

  blocks.push(
    closingCta(
      'Not sure which fits?',
      'A workshop is the fastest way to find out. We will look at where you are, where you want to be, and the shortest path between them.',
    ),
  )
  return blocks
}

// ---------------------------------------------------------------------------
// 2. Localshoring (peer offering)
// ---------------------------------------------------------------------------
export function localshoringLayout(): Block[] {
  return [
    {
      blockType: 'hero',
      variant: 'text-only',
      eyebrow: 'Technology partnership',
      headline: 'A senior engineering team that plugs into your roadmap.',
      subheadline:
        'Localshoring is the velocity of an in-house team without the hiring overhead: US-based senior engineers, your timezone, your standards, accountable to your outcomes.',
      primaryCta: { label: 'Start with a workshop', url: WORKSHOPS_URL, variant: 'primary' },
      secondaryCta: { label: 'Book a call', url: BOOK_URL },
      alignment: 'left',
    },
    // Concise definition — Hank-gated placeholder.
    content(
      buildLexical([
        { kind: 'h', tag: 'h2', text: 'What localshoring means' },
        {
          kind: 'p',
          text: PLACEHOLDER(
            'Hank',
            'one to two sentence canonical definition of Localshoring in SEQTEK voice',
          ),
        },
        {
          kind: 'p',
          text: 'In short: senior software talent kept close to the work (same timezone, same language, same accountability as an internal team) at a structure that beats both the cost of hiring in-house and the friction of offshore.',
        },
      ]),
      'narrow',
    ),
    {
      blockType: 'comparison-table',
      heading: 'Localshoring vs nearshore vs offshore',
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
          dimension: 'Seniority of the team',
          cells: [{ value: 'Senior' }, { value: 'Mixed' }, { value: 'Mixed' }],
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
    content(
      buildLexical([
        { kind: 'h', tag: 'h2', text: 'The business case' },
        {
          kind: 'p',
          text: 'Hiring senior engineers is slow and expensive, and a vacancy stalls the roadmap while it stays open. Offshore trades that cost for coordination drag: a question asked at 4pm gets answered tomorrow, and review cycles stretch across the calendar.',
        },
        {
          kind: 'p',
          text: 'Localshoring sits between the two. You get a team that works your hours, writes to your standards, and is accountable to your outcomes, without carrying the fixed cost or hiring risk of building that bench yourself. When priorities shift, the team flexes with them.',
        },
        {
          kind: 'p',
          text: 'For the longer story behind the model and how SEQTEK runs it, see our localshoring overview.',
        },
      ]),
      'narrow',
    ),
    closingCta(
      'See if localshoring fits your roadmap.',
      'Start with a workshop and we will map your roadmap to the team you actually need, or book a call to talk it through.',
    ),
  ]
}

// ---------------------------------------------------------------------------
// 3. AI Integration (anti-hype)
// ---------------------------------------------------------------------------
export function aiIntegrationLayout(): Block[] {
  return [
    {
      blockType: 'hero',
      variant: 'text-only',
      eyebrow: 'AI integration',
      headline: 'Where AI fits your business, and where it does not.',
      subheadline:
        'Most "AI strategy" is a feature looking for a problem. We start from your problems, find the few places AI earns its keep, and say so plainly when it does not.',
      primaryCta: { label: 'Start with a workshop', url: WORKSHOPS_URL, variant: 'primary' },
      secondaryCta: { label: 'Book a call', url: BOOK_URL },
      alignment: 'left',
    },
    content(
      buildLexical([
        { kind: 'h', tag: 'h2', text: 'AI where it makes sense, honesty where it does not' },
        {
          kind: 'p',
          text: 'AI is a tool, not a strategy. It is genuinely good at a handful of things: pulling structure out of messy text, summarizing, classifying, drafting, augmenting search, taking the first pass at repetitive judgment calls. Pointed at the right problem it removes real drag.',
        },
        {
          kind: 'p',
          text: 'It is also wrong about a lot of things, confidently. The fastest way to lose money and trust is to put a model where the cost of a wrong answer is high and there is no human in the loop. Part of our job is telling you which of your ideas are in that category before you spend on them.',
        },
        {
          kind: 'p',
          text: 'So we do not lead with the model. We lead with the workflow: where time and money actually leak, what a correct answer is worth, what a wrong one costs, and whether a simpler non-AI fix would do the job better. AI gets used where that math works out.',
        },
      ]),
      'narrow',
    ),
    {
      blockType: 'process-steps',
      heading: 'How an engagement runs',
      steps: [
        {
          title: 'Map the workflow',
          body: 'We sit with the people doing the work and trace where time, money, and errors actually accumulate, before any technology is on the table.',
        },
        {
          title: 'Score the opportunities',
          body: 'Each candidate gets weighed on value, risk, and the cost of being wrong. Some make the cut. Some get a plain "AI does not belong here."',
        },
        {
          title: 'Prove it small',
          body: 'We build a narrow, measurable pilot against real data so you see the result before committing to scale, not after.',
        },
        {
          title: 'Integrate and hand off',
          body: 'What works gets wired into your systems with guardrails, monitoring, and a path for your team to own it.',
        },
      ],
    },
    {
      blockType: 'faq',
      heading: 'Honest answers',
      items: [
        {
          question: 'Where does AI usually NOT fit?',
          answer: buildLexical([
            {
              kind: 'p',
              text: 'Anywhere the cost of a confident wrong answer is high and no human reviews the output: regulated decisions, financial postings, anything safety-related. It also rarely beats a simple rule or a well-built report when the logic is already deterministic. If a spreadsheet or a small script solves it, that is the better answer and we will tell you so.',
            },
          ]),
        },
        {
          question: 'Do we need a huge amount of data first?',
          answer: buildLexical([
            {
              kind: 'p',
              text: 'Usually no. Many of the highest-value uses lean on general-purpose models plus a modest amount of your own context, not a custom model trained on years of history. We size the data question to the specific use case rather than treating "collect everything" as a prerequisite.',
            },
          ]),
        },
        {
          question: 'Will this replace our people?',
          answer: buildLexical([
            {
              kind: 'p',
              text: 'The engagements that work treat AI as leverage for a team, not a replacement for one. It takes the repetitive first pass so your people spend their time on the judgment calls that actually need them.',
            },
          ]),
        },
        {
          question: 'How do we know it is actually working?',
          answer: buildLexical([
            {
              kind: 'p',
              text: 'We define the metric before we build (time saved, error rate, throughput) and the pilot either moves it or it does not. No vanity demos.',
            },
          ]),
        },
      ],
    },
    closingCta(
      'Find the AI that earns its keep.',
      'A workshop is the cleanest way to separate the real opportunities from the hype. Start there, or book a call.',
    ),
  ]
}

// ---------------------------------------------------------------------------
// 4. Digital Transformation (custom software + change management; FPO lives here)
// ---------------------------------------------------------------------------
export function digitalTransformationLayout(opts: {
  featuredCaseStudyId: string | number | null
}): Block[] {
  const blocks: Block[] = [
    {
      blockType: 'hero',
      variant: 'text-only',
      eyebrow: 'Digital transformation',
      headline: 'Software that ships, and change that sticks.',
      subheadline:
        'Custom software is the easy half. We build the system and the change management around it so it survives go-live, including fractional product ownership when you need the seat filled.',
      primaryCta: { label: 'Start with a workshop', url: WORKSHOPS_URL, variant: 'primary' },
      secondaryCta: { label: 'Book a call', url: BOOK_URL },
      alignment: 'left',
    },
    content(
      buildLexical([
        { kind: 'h', tag: 'h2', text: 'The build is half the job' },
        {
          kind: 'p',
          text: 'Plenty of good software dies at go-live: the tool works, but nobody changed how they work around it, so it quietly reverts to the spreadsheet it was meant to replace. Transformation is the part most projects skip: the rollout, the retraining, the process redesign that makes the new system the path of least resistance.',
        },
        {
          kind: 'p',
          text: 'We do both. We design and build custom software against your actual workflow, and we own the change management that gets it adopted: stakeholder buy-in, phased rollout, the unglamorous work of helping people trade a familiar habit for a better one.',
        },
        { kind: 'h', tag: 'h3', text: 'Fractional product ownership' },
        {
          kind: 'p',
          text: 'When the missing piece is the person who decides what gets built next, we fill that seat. A fractional product owner sets priorities, keeps the backlog honest, and translates between the people who need the software and the people building it, without the cost of a full-time hire you are not ready for.',
        },
      ]),
      'narrow',
    ),
    {
      blockType: 'process-steps',
      heading: 'How we deliver',
      steps: [
        {
          title: 'Discover',
          body: 'We map the current workflow, the people in it, and the outcome you are actually after, usually starting with a workshop.',
        },
        {
          title: 'Design',
          body: 'We shape the software and the rollout together, so the change-management plan is built in from day one rather than bolted on.',
        },
        {
          title: 'Build',
          body: 'Senior engineers ship in tight increments against real users, so course corrections happen early and cheaply.',
        },
        {
          title: 'Adopt',
          body: 'We run the rollout: training, phased cutover, and the support that turns a launch into a habit.',
        },
        {
          title: 'Own and evolve',
          body: 'Fractional product ownership keeps priorities straight and the roadmap moving after the initial build lands.',
        },
      ],
    },
    {
      blockType: 'deliverables',
      heading: 'What you get',
      items: [
        { label: 'Custom software built to your workflow, not a generic template' },
        { label: 'A change-management and rollout plan, executed' },
        { label: 'Fractional product ownership to steer the roadmap' },
        { label: 'Training and documentation your team actually uses' },
        { label: 'A maintainable codebase your team can own' },
      ],
    },
  ]

  if (opts.featuredCaseStudyId != null) {
    blocks.push({
      blockType: 'featured-case-study',
      heading: 'A transformation in the wild',
      caseStudy: opts.featuredCaseStudyId,
    })
  }

  blocks.push(
    closingCta(
      'Build something that sticks.',
      'Start with a workshop to scope it right, or book a call to talk through where you are stuck.',
    ),
  )
  return blocks
}
