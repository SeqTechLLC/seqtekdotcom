import type { HTMLAttributes, ReactNode } from 'react'

interface ProseProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'compact' | 'default' | 'large'
  tone?: 'default' | 'inverse'
  children: ReactNode
}

const SIZE_CLASSES: Record<NonNullable<ProseProps['size']>, string> = {
  compact: 'prose prose-sm',
  default: 'prose',
  large: 'prose prose-lg',
}

const TONE_CLASSES: Record<NonNullable<ProseProps['tone']>, string> = {
  default: '',
  inverse: 'prose-invert',
}

/**
 * Typography primitive that wraps Lexical-converted JSX with the
 * `@tailwindcss/typography` brand tokens (BLOCK_LIBRARY.md §3).
 */
export function Prose({
  size = 'default',
  tone = 'default',
  className,
  children,
  ...rest
}: ProseProps) {
  const cls = [SIZE_CLASSES[size], TONE_CLASSES[tone], className].filter(Boolean).join(' ')
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  )
}
