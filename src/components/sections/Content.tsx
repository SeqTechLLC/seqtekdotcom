import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { RichText } from '../richText/RichText'
import { Section, type SectionBackground } from '../ui/Section'

interface ContentProps {
  width?: 'narrow' | 'standard' | 'wide' | null
  body: SerializedEditorState | null | undefined
  background?: SectionBackground | null
}

// These are READING MEASURES, not the shell: `wide` stays 1024px because it is
// a measure for long-form prose, while `Image`'s `full` variant tracks
// SHELL_RAIL because "full" means the rail. They were coincidentally equal
// before ADR 0012 moved the rail; a page alternating a wide Content band with a
// full Image now steps 128px per side at the image, which is intended.
const WIDTH_CLASSES: Record<NonNullable<ContentProps['width']>, string> = {
  narrow: 'max-w-2xl',
  standard: 'max-w-3xl',
  wide: 'max-w-5xl',
}

export function Content({ width = 'standard', body, background = 'none' }: ContentProps) {
  const widthCls = WIDTH_CLASSES[width ?? 'standard']
  // The typography plugin's colours are for a light page; on the dark band the
  // prose needs its inverted set or the body text disappears.
  const proseCls = background === 'inverse' ? 'mx-auto prose-invert' : 'mx-auto'
  return (
    <Section padding="default" background={background ?? 'none'}>
      {/* Centered reading column (DESIGN_SYSTEM.md "Reading column"): the text
          column is centered within the page rail, NOT left-justified. Body copy
          keeps its 65ch measure and is centered, so it shares a vertical axis
          with everything else on the page. */}
      <div className={`${widthCls} mx-auto`}>
        <RichText data={body} className={proseCls} />
      </div>
    </Section>
  )
}

export default Content
