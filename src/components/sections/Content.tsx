import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { RichText } from '../richText/RichText'

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
    <section className={`px-4 py-12 md:px-6 lg:px-8 ${bgCls}`}>
      {/* Outer rail = the page grid (container-lg); the reading measure
          stays narrow but left-aligned to the shared edge, not centered. */}
      <div className="mx-auto max-w-container-lg">
        <div className={widthCls}>
          <RichText data={body} />
        </div>
      </div>
    </section>
  )
}

export default Content
