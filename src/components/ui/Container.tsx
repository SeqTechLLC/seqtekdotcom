import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { SHELL_RAIL } from '@/lib/layoutGeometry'

export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

const sizeClass: Record<ContainerSize, string> = {
  sm: 'max-w-container-sm',
  md: 'max-w-container-md',
  lg: 'max-w-container-lg',
  xl: 'max-w-container-xl',
  full: 'max-w-full',
}

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  size?: ContainerSize
  padded?: boolean
  children: ReactNode
}

/**
 * The same shell as `ui/Section`, for page chrome that is not a block.
 *
 * Its default rail is `SHELL_RAIL`, so the header, the footer and the blocks
 * between them cannot drift apart: they are one number. They HAD drifted —
 * the chrome passed `size="lg"` explicitly, which is a second statement of the
 * rail and stayed put when the blocks moved.
 *
 * Padding sits OUTSIDE the max-width box (same model as the section
 * components: padded wrapper, then `mx-auto max-w-*`). With padding inside
 * the box, Container content sat 32px right of section content at the same
 * size — the header/footer never shared the page grid edge.
 */
export function Container({
  size = SHELL_RAIL,
  padded = true,
  className,
  children,
  ...rest
}: ContainerProps) {
  return (
    <div className={cn(padded && 'px-4 md:px-6 lg:px-8')}>
      <div className={cn('mx-auto w-full', sizeClass[size], className)} {...rest}>
        {children}
      </div>
    </div>
  )
}
