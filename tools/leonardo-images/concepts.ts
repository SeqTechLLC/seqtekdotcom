/**
 * Mid-post editorial illustration concepts for the five published insights.
 *
 * One concept per essay, placed at the strongest section break. Style is the
 * site's folksy / warm-paper editorial direction (memory: feedback_design_direction)
 * — gouache-and-ink on grained paper, muted earthy palette, no glossy 3D.
 *
 * `prompt` = SUBJECT + CONTEXT (concept-specific). The shared STYLE + NEGATIVE
 * suffixes are appended by generate.ts so every image reads as one set.
 * `afterHeading` marks the `##` section the figure is inserted AFTER (content
 * step); generation doesn't need it but it keeps placement intent next to the art.
 */
export interface Concept {
  /** Post slug (also the output subdir name). */
  slug: string
  /** Posts.id in the local DB. */
  postId: number
  /** Subject + context for the Leonardo prompt (style suffix added separately). */
  prompt: string
  /** Insert the figure AFTER the section whose h2 text starts with this. */
  afterHeading: string
  /** Media alt text (accessibility — required on the Media collection). */
  alt: string
  /** Figure caption (rendered under the image). */
  caption: string
}

// Shared so the five images read as a single editorial set.
export const STYLE =
  'Warm editorial illustration for a thoughtful longform magazine. Muted earthy ' +
  'palette of warm paper cream, soft ochre, faded sage green, and deep navy ink. ' +
  'Gouache and ink on grained paper with subtle risograph print texture and paper ' +
  'grain. Hand-drawn quality, soft natural light, generous negative space, calm and ' +
  'contemplative mood. Flat editorial composition, not glossy, not a 3D render, not a ' +
  'photograph.'

export const NEGATIVE =
  'text, words, letters, typography, captions, watermark, signature, glossy 3D ' +
  'render, neon, cyberpunk, photorealistic photo, ultra-detailed CGI, cluttered, ' +
  'busy, low quality, deformed, extra fingers'

// Curated winner per concept (the candidate chosen in the review pass).
// slug -> candidate filename under out/<slug>/.
export const WINNERS: Record<string, string> = {
  'software-for-strangers': 'cand-1.jpg',
  'brick-for-stone': 'cand-1.jpg',
  'framing-freedom': 'cand-2.jpg',
  'aipocalypse-just-in-time': 'cand-1.jpg',
  'guarding-the-way': 'cand-1.jpg',
}

export const CONCEPTS: Concept[] = [
  {
    slug: 'software-for-strangers',
    postId: 14,
    prompt:
      'Two small wooden houses sit far apart on opposite sides of a wide empty ' +
      'valley at dusk, connected only by a single long taut string running between ' +
      'two tin cans, the line sagging gently across the distance. Wide landscape, ' +
      'rule-of-thirds composition, the vast quiet space between them is the subject.',
    afterHeading: 'Relational debt',
    alt:
      'Two small houses on opposite sides of a wide empty valley joined only by a ' +
      'single long tin-can-telephone string sagging across the distance.',
    caption: 'Distance is not just geographic. It is relational.',
  },
  {
    slug: 'brick-for-stone',
    postId: 15,
    prompt:
      'An unfinished tower built from thousands of identical uniform bricks rises ' +
      'from a flat plain and dissolves into pale fog near its top, bare scaffolding, ' +
      'no workers, the upper courses fading into uncertainty. Low-angle view, ' +
      'monumental but quiet, a lot of open sky.',
    afterHeading: 'The synoptic conceit',
    alt:
      'An unfinished tower of identical uniform bricks rising from a plain and ' +
      'dissolving into fog near its top, scaffolding bare and no workers present.',
    caption: 'A master plan, specified perfectly, fading where it meets the world.',
  },
  {
    slug: 'framing-freedom',
    postId: 16,
    prompt:
      'A single kite climbs high into a wide open sky, held aloft by one taut line ' +
      'that runs down to a small hand at the bottom edge of the frame; the string is ' +
      'clearly what lets it fly. Generous open sky, asymmetrical balance, the tension ' +
      'in the line is the subject.',
    afterHeading: 'Why constraint is formative',
    alt:
      'A single kite high in an open sky held aloft by one taut line running down to ' +
      'a small hand at the bottom of the frame.',
    caption: 'The string is not what holds the kite back. It is what lets it fly.',
  },
  {
    slug: 'aipocalypse-just-in-time',
    postId: 17,
    prompt:
      'A calm wooden workbench seen from above where a few exact parts arrive in a ' +
      'neat ordered sequence exactly where a pair of working hands needs them, while ' +
      'an enormous ignored pile of surplus parts sits blurred in the far background. ' +
      'Orderly foreground, overwhelming background, the contrast between just-enough ' +
      'and far-too-much is the subject.',
    afterHeading: 'Just-in-time manufacturing',
    alt:
      'A tidy workbench from above where a few exact parts arrive in sequence to a ' +
      'pair of hands, with an enormous ignored pile of surplus parts blurred behind.',
    caption: 'The hype curve is exponential. The workflow it describes is linear.',
  },
  {
    slug: 'guarding-the-way',
    postId: 18,
    prompt:
      'A solid closed wooden gate set into a low stone wall stands on the left; on ' +
      'the right, a simple painted line drawn across bare ground that anyone could ' +
      'step over. Two thresholds side by side on an open plain, straight-on view, the ' +
      'difference between a real boundary and a merely suggested one.',
    afterHeading: 'When authority is just data',
    alt:
      'A solid closed gate in a low stone wall beside a simple painted line on bare ' +
      'ground, two thresholds side by side on an open plain.',
    caption: 'In a comment, a boundary is a request. In the type system, it is a fact.',
  },
]
