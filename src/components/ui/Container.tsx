import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

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

export function Container({
  size = 'xl',
  padded = true,
  className,
  children,
  ...rest
}: ContainerProps) {
  return (
    <div
      className={cn('mx-auto w-full', sizeClass[size], padded && 'px-4 md:px-6 lg:px-8', className)}
      {...rest}
    >
      {children}
    </div>
  )
}
