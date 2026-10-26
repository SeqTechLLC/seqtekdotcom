import type { SectionBackground } from './Section'

/**
 * Text, rule and highlight colours for each `Section` background.
 *
 * `.band-dark` and `.band-brand` re-point the semantic text and border tokens, so
 * those already read on every band. This adds the accent, a highlight panel, and
 * the `inverse`/`brand` flags a block branches on.
 */
export interface Tone {
  /** True on the dark and brand bands, where a form needs a light panel of its own. */
  inverse: boolean
  /** True on the solid brand-green band, which reads brand-black text and a black primary button. */
  brand: boolean
  secondary: string
  muted: string
  /** Accent text: the brand black on light bands, the brand green on the dark band (DESIGN_SYSTEM §2.4). */
  accent: string
  rule: string
  ruleStrong: string
  /** A row or panel that has to stand out from the band it sits on. */
  highlight: string
}

const LIGHT: Omit<Tone, 'highlight'> = {
  inverse: false,
  brand: false,
  secondary: 'text-text-secondary',
  muted: 'text-text-muted',
  accent: 'text-accent-strong',
  rule: 'border-border-subtle',
  ruleStrong: 'border-border-strong',
}

const DARK: Tone = {
  inverse: true,
  brand: false,
  secondary: 'text-neutral-200',
  muted: 'text-neutral-300',
  accent: 'text-accent-strong',
  rule: 'border-neutral-700',
  ruleStrong: 'border-neutral-600',
  highlight: 'bg-neutral-800',
}

const BRAND: Tone = {
  inverse: true,
  brand: true,
  secondary: 'text-neutral-800',
  muted: 'text-neutral-800',
  accent: 'text-neutral-900',
  rule: 'border-neutral-900/30',
  ruleStrong: 'border-neutral-900/50',
  highlight: 'bg-accent-fill-hover',
}

export const toneFor = (background: SectionBackground | null | undefined): Tone => {
  if (background === 'inverse') return DARK
  if (background === 'brand') return BRAND
  // The accent band IS `surface-accent`, so a highlight in that colour vanishes.
  return {
    ...LIGHT,
    highlight: background === 'accent' ? 'bg-surface-elevated' : 'bg-surface-accent',
  }
}
