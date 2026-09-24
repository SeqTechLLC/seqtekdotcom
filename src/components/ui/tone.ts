import type { SectionBackground } from './Section'

/**
 * Text, rule and highlight colours that stay legible on each `Section`
 * background.
 *
 * The semantic tokens (`text-text-secondary`, `text-text-muted`,
 * `border-border-subtle`) are tuned for the light surfaces. On the `inverse`
 * band they disappear (neutral-700 on neutral-900), so a block that offers
 * every background reads its secondary colours from here instead of writing
 * them inline.
 */
export interface Tone {
  /** True on the dark and brand bands, where body text is already white. */
  inverse: boolean
  /** True on the solid brand-green band, where the primary button turns white. */
  brand: boolean
  secondary: string
  muted: string
  /** Meaning-bearing green text (DESIGN_SYSTEM §2.4: never `text-accent`). */
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
  accent: 'text-brand-green-300',
  rule: 'border-neutral-700',
  ruleStrong: 'border-neutral-600',
  highlight: 'bg-neutral-800',
}

const BRAND: Tone = {
  inverse: true,
  brand: true,
  secondary: 'text-brand-green-50',
  muted: 'text-brand-green-100',
  accent: 'text-white',
  rule: 'border-white/30',
  ruleStrong: 'border-white/50',
  highlight: 'bg-accent-hover',
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
