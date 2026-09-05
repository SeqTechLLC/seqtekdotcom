import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/cn'

/**
 * DESIGN_SYSTEM §11.4's reading measure, as a component rather than a habit.
 *
 * The rule is one sentence — "body copy is a left-justified block, capped at
 * `max-w-prose` (65ch), and CENTRED as a block" — and it has been got wrong in
 * both directions by hand: a bare `max-w-prose` (which the rule bans by name as
 * "a workaround for a missing `mx-auto`") and an `mx-auto` that left a
 * full-rail heading stranded above a centred body (which it also forbids).
 *
 * So put the heading INSIDE this, with its body. That is the rule's second
 * clause and the part that reading `max-w-prose` at a call site never conveys.
 *
 * `flush` is the one sanctioned exception: inside a grid cell the column is
 * already positioned by the grid, and centring it there would pull the copy off
 * the edge it shares with the cell beside it.
 */
type ReadingColumnProps = HTMLAttributes<HTMLDivElement> & {
  /** Left-align within an already-positioned parent (a grid cell). */
  flush?: boolean
  /** Left-align only from `lg` up, where a `lg:grid-cols-*` parent kicks in. */
  flushFrom?: 'lg'
  children: ReactNode
}

export function ReadingColumn({
  flush = false,
  flushFrom,
  className,
  children,
  ...rest
}: ReadingColumnProps) {
  return (
    <div
      className={cn(
        'max-w-prose',
        // Centred by default. A grid item with a definite max-width resolves to
        // START, not centre, so the `mx-auto` is what keeps it concentric while
        // the parent is still a single full-rail column.
        flush ? 'mx-0' : 'mx-auto',
        flushFrom === 'lg' && 'lg:mx-0',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

export default ReadingColumn
