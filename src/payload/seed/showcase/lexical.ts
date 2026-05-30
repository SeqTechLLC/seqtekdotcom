import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

const paragraph = (text: string): Record<string, unknown> => ({
  type: 'paragraph',
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  textFormat: 0,
  textStyle: '',
  children: [
    {
      type: 'text',
      version: 1,
      detail: 0,
      format: 0,
      mode: 'normal',
      style: '',
      text,
    },
  ],
})

const heading = (text: string, tag: 'h2' | 'h3' | 'h4'): Record<string, unknown> => ({
  type: 'heading',
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  tag,
  children: [
    {
      type: 'text',
      version: 1,
      detail: 0,
      format: 0,
      mode: 'normal',
      style: '',
      text,
    },
  ],
})

const inlineBlockNode = (
  blockType: string,
  fields: Record<string, unknown>,
): Record<string, unknown> => ({
  type: 'inlineBlock',
  version: 2,
  fields: { ...fields, blockType },
})

/** Build a Lexical state from a flat list of block descriptors. Keeps fixtures readable. */
export function buildLexical(
  blocks: Array<
    | { kind: 'p'; text: string }
    | { kind: 'h'; tag: 'h2' | 'h3' | 'h4'; text: string }
    | {
        kind: 'p-with-inline'
        text: string
        inline: { blockType: string; fields: Record<string, unknown> }
      }
  >,
): SerializedEditorState {
  const children = blocks.map((b) => {
    if (b.kind === 'h') return heading(b.text, b.tag)
    if (b.kind === 'p') return paragraph(b.text)
    // Paragraph with an inline block appended in the middle of the text run.
    return {
      type: 'paragraph',
      version: 1,
      format: '',
      indent: 0,
      direction: 'ltr',
      textFormat: 0,
      textStyle: '',
      children: [
        {
          type: 'text',
          version: 1,
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: `${b.text} `,
        },
        inlineBlockNode(b.inline.blockType, b.inline.fields),
        {
          type: 'text',
          version: 1,
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: ' (after).',
        },
      ],
    }
  })

  return {
    root: {
      type: 'root',
      version: 1,
      format: '',
      indent: 0,
      direction: 'ltr',
      children,
    },
  } as unknown as SerializedEditorState
}
