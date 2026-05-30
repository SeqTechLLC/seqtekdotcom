import Link from 'next/link'

interface InlineCtaProps {
  label?: string | null
  url?: string | null
  variant?: 'primary' | 'secondary' | 'ghost' | 'link' | null
}

const VARIANT_CLASSES: Record<NonNullable<InlineCtaProps['variant']>, string> = {
  primary: 'underline font-semibold text-accent',
  secondary: 'underline text-text-secondary',
  ghost: 'underline',
  link: 'underline',
}

export function InlineCta({ label, url, variant = 'primary' }: InlineCtaProps) {
  if (!label || !url) return null
  const cls = VARIANT_CLASSES[variant ?? 'primary']
  return (
    <Link href={url} className={cls}>
      {label}
    </Link>
  )
}

export default InlineCta
