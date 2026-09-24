import { useId } from 'react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { cn } from '@/lib/cn'
import { RichText } from '../richText/RichText'
import { ReadingColumn } from '../ui/ReadingColumn'
import { Section, type SectionBackground } from '../ui/Section'
import { TabSet } from '../ui/TabSet'
import { toneFor } from '../ui/tone'

interface AccordionItem {
  id?: string | null
  title: string
  body: SerializedEditorState | null | undefined
}

interface AccordionProps {
  heading?: string | null
  intro?: string | null
  display?: 'accordion' | 'tabs' | null
  items?: AccordionItem[] | null
  background?: SectionBackground | null
}

/**
 * Replaces `faq`, `accordion` and `tabs`. Heading, intro and panels share one
 * centred reading column (DESIGN_SYSTEM §11.4), whichever way the panels open.
 *
 * `accordion` is native `<details>`: no script, and find-in-page opens a
 * closed panel. `tabs` hands the server-rendered panels to `TabSet`, which
 * owns the selection and the keyboard.
 */
export function AccordionBlock({
  heading,
  intro,
  display = 'accordion',
  items,
  background,
}: AccordionProps) {
  // Only emitted in tabs mode, where the tablist is named by the heading.
  const headingId = useId()
  const rows = (items ?? []).filter((item) => item.title?.trim())
  if (rows.length === 0) return null
  const tone = toneFor(background)
  const tabs = display === 'tabs'
  const prose = tone.inverse ? 'prose-invert' : undefined

  return (
    <Section padding="spacious" background={background ?? 'none'}>
      <ReadingColumn>
        {heading ? (
          <h2 id={tabs ? headingId : undefined} className="text-h2 font-bold">
            {heading}
          </h2>
        ) : null}
        {intro ? (
          <p className={cn('text-body-lg', heading && 'mt-4', tone.secondary)}>{intro}</p>
        ) : null}
        {tabs ? (
          <TabSet
            className={heading || intro ? 'mt-8' : undefined}
            labelledBy={heading ? headingId : undefined}
            inverse={tone.inverse}
            items={rows.map((item, i) => ({
              key: item.id ?? i,
              label: item.title,
              panel: <RichText data={item.body} withProse className={prose} />,
            }))}
          />
        ) : (
          <ul
            className={cn(
              'divide-y border-y',
              tone.inverse ? 'divide-neutral-700' : 'divide-border-subtle',
              tone.rule,
              (heading || intro) && 'mt-8',
            )}
          >
            {rows.map((item, i) => (
              <li key={item.id ?? i}>
                <details className="group">
                  <summary className="flex cursor-pointer items-center justify-between py-4 text-body-lg font-semibold">
                    <span>{item.title}</span>
                    <span
                      aria-hidden="true"
                      className={cn('ml-4 transition group-open:rotate-180', tone.accent)}
                    >
                      ▾
                    </span>
                  </summary>
                  <div className="pb-4">
                    <RichText data={item.body} withProse className={prose} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </ReadingColumn>
    </Section>
  )
}

export default AccordionBlock
