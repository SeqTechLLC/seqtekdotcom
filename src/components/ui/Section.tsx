import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/cn'
import { SHELL_RAIL, type RailSize } from '@/lib/layoutGeometry'

/**
 * The block shell, owned in one place.
 *
 * Every block used to restate this recipe itself — 46 of 46 hand-wrote
 * `px-4 md:px-6 lg:px-8`, 44 hand-wrote `mx-auto max-w-container-*`, and none
 * used the `Container` primitive that already described the same model. So the
 * rail width was a fact stated 46 times, and moving it was a 44-file change
 * that silently invalidated every geometry derived from it (DESIGN_SYSTEM
 * §11.4, ADR 0012).
 *
 * A block says what it IS — padding rhythm, background, rail — and this owns
 * how that becomes CSS. `src/lib/layoutGeometry.ts` holds the numbers so
 * `sizes` attributes can be derived from the same source rather than typed.
 */

/** Vertical rhythm. Maps to DESIGN_SYSTEM §4's section padding scale. */
export type SectionPadding = 'none' | 'tight' | 'default' | 'spacious'

/** Surface the block sits on. Names are semantic, not colour values. */
export type SectionBackground = 'none' | 'subtle' | 'accent' | 'inverse'

/** Hairlines some blocks use to separate themselves from a neighbour. */
export type SectionBorder = 'none' | 'y' | 'top'

const PADDING: Record<SectionPadding, string> = {
  none: '',
  tight: 'py-10',
  default: 'py-12',
  spacious: 'py-16',
}

const BACKGROUND: Record<SectionBackground, string> = {
  none: '',
  subtle: 'bg-surface-subtle',
  // accent-strong, not `bg-accent`: brand-green-500 fails WCAG AA against
  // white text at 2.39:1. DESIGN_SYSTEM.md §14.
  accent: 'bg-surface-accent',
  inverse: 'bg-surface-inverse text-text-inverse',
}

const BORDER: Record<SectionBorder, string> = {
  none: '',
  y: 'border-y border-border-subtle',
  top: 'border-t border-border-subtle',
}

export const RAIL_CLASS: Record<RailSize, string> = {
  sm: 'max-w-container-sm',
  md: 'max-w-container-md',
  lg: 'max-w-container-lg',
  xl: 'max-w-container-xl',
}

type SectionProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  padding?: SectionPadding
  background?: SectionBackground
  border?: SectionBorder
  /** Rail cap. `xl` is the site shell; narrower is a deliberate column. */
  rail?: RailSize
  /** Classes for the OUTER <section> — backgrounds, positioning, overflow. */
  className?: string
  /** Classes for the INNER rail div — grid/flex the block lays out inside it. */
  innerClassName?: string
  /**
   * Content that belongs to the section but not to the rail — a full-bleed
   * background image, typically `absolute inset-0`. Rendered before the rail
   * div so it sits behind the content without inheriting the max-width.
   */
  bleed?: ReactNode
  children: ReactNode
}

export function Section({
  padding = 'spacious',
  background = 'none',
  border = 'none',
  rail = SHELL_RAIL,
  className,
  innerClassName,
  bleed,
  children,
  ...rest
}: SectionProps) {
  return (
    <section
      className={cn(
        'px-4 md:px-6 lg:px-8',
        PADDING[padding],
        BACKGROUND[background],
        BORDER[border],
        className,
      )}
      {...rest}
    >
      {bleed}
      <div className={cn('mx-auto', RAIL_CLASS[rail], innerClassName)}>{children}</div>
    </section>
  )
}

export default Section
