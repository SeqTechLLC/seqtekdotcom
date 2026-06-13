import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { RichText } from '../richText/RichText'

interface FAQItem {
  id?: string | null
  question: string
  answer: SerializedEditorState | null | undefined
}

interface FAQProps {
  heading?: string | null
  items: FAQItem[]
}

export function FAQ({ heading, items }: FAQProps) {
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-lg">
        <h2 className="text-h2 font-bold">{heading ?? 'Frequently asked questions'}</h2>
        <ul className="mt-8 divide-y divide-border-subtle border-y border-border-subtle">
          {items.map((item, i) => (
            <li key={item.id ?? i}>
              <details className="group">
                <summary className="flex cursor-pointer items-center justify-between py-4 text-body-lg font-semibold">
                  <span>{item.question}</span>
                  <span className="ml-4 text-accent-strong transition group-open:rotate-180">
                    ▾
                  </span>
                </summary>
                <div className="pb-4">
                  <RichText data={item.answer} withProse />
                </div>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default FAQ
