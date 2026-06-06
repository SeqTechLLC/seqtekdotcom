import { TrackedCtaLink } from '@/components/analytics/TrackedCtaLink'

interface InlineCtaProps {
  label?: string | null
  url?: string | null
  variant?: 'primary' | 'secondary' | 'ghost' | 'link' | null
}

const VARIANT_CLASSES: Record<NonNullable<InlineCtaProps['variant']>, string> = {
  primary: 'underline font-semibold text-accent-strong',
  secondary: 'underline text-text-secondary',
  ghost: 'underline',
  link: 'underline',
}

export function InlineCta({ label, url, variant = 'primary' }: InlineCtaProps) {
  if (!label || !url) return null
  const cls = VARIANT_CLASSES[variant ?? 'primary']
  return (
    <TrackedCtaLink href={url} ctaId="inline-cta" location="inline" label={label} className={cls}>
      {label}
    </TrackedCtaLink>
  )
}

export default InlineCta
