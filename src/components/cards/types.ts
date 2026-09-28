import type { ComponentType } from 'react'

/**
 * The internals behind the `cards` block (`src/components/sections/Cards.tsx`).
 * One module per collection, each owning the card that collection has always
 * been drawn as; the block picks one by `collection` and wraps it in the
 * section chrome. Nothing here is a block on its own.
 */

/** Card title level. A section with its own `h2` puts its cards at `h3`. */
export type CardHeadingLevel = 'h2' | 'h3'

export interface GridProps<T> {
  docs: T[]
  headingLevel: CardHeadingLevel
  /** Position of `docs[0]` in the whole list, for cards that number themselves. */
  offset?: number
}

export interface MediaLike {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  sizes?: Record<string, { url?: string | null; width?: number | null } | null | undefined> | null
}

/** What the featured layout needs from any one document. */
export interface FeaturedItem {
  title: string
  subtitle?: string | null
  /** Where the item's page lives. No page, no button. */
  href?: string | null
  ctaLabel?: string
  image?: (MediaLike & { url: string }) | null
  /** A logo is shown whole on a plain panel rather than cropped to fill. */
  imageIsLogo?: boolean
}

/** Everything the block needs to draw one collection. */
export interface CardKind<T> {
  /** Keeps what this card can draw; bare ids and other shapes fall out. */
  isDoc: (value: unknown) => value is T
  Grid: ComponentType<GridProps<T>>
  featured: (doc: T) => FeaturedItem
}

export const isMedia = (v: unknown): v is MediaLike & { url: string } =>
  typeof v === 'object' && v !== null && 'url' in (v as object) && !!(v as { url: unknown }).url

/** A populated document carrying `key` — how each card tells a doc from an id. */
export const hasKey =
  <T>(key: string) =>
  (v: unknown): v is T =>
    typeof v === 'object' && v !== null && key in (v as object)
