import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { RichText } from '../richText/RichText'
import { Section } from '../ui/Section'

interface ContentProps {
  width?: 'narrow' | 'standard' | 'wide' | null
  body: SerializedEditorState | null | undefined
  background?: 'none' | 'subtle' | 'accent' | null
}

const WIDTH_CLASSES: Record<NonNullable<ContentProps['width']>, string> = {
  narrow: 'max-w-2xl',
  standard: 'max-w-3xl',
  wide: 'max-w-5xl',
}

const BACKGROUND_CLASSES: Record<NonNullable<ContentProps['background']>, string> = {
  none: '',
  subtle: 'bg-surface-subtle',
  accent: 'bg-accent/5',
}

export function Content({ width = 'standard', body, background = 'none' }: ContentProps) {
  const widthCls = WIDTH_CLASSES[width ?? 'standard']
  const bgCls = BACKGROUND_CLASSES[background ?? 'none']
  return (
    <Section padding="default" className={bgCls}>
      {/* Centered reading column (DESIGN_SYSTEM.md "Reading column"): the text
          column is centered within the page rail, NOT left-justified. Body copy
          keeps its 65ch measure and is centered, so it shares a vertical axis
          with everything else on the page. */}
      <div className={`${widthCls} mx-auto`}>
        <RichText data={body} className="mx-auto" />
      </div>
    </Section>
  )
}

export default Content
