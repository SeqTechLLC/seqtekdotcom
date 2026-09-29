import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'

/**
 * Plain text → Lexical AST, for the content seeder's `$lexical` directive
 * (`tools/payload-seed/resolve.ts`). The input carries no markup, so nodes are
 * emitted directly rather than parsed from HTML. The output is the same
 * `SerializedEditorState` the admin saves.
 *
 * Detection rules. Blocks are separated by blank lines:
 * - A block of two or more lines that all start with a bullet (`•`, `–`, `—`,
 *   `-`, `*`) becomes one unordered list.
 * - A single line `1. Text` becomes a heading (`sectionTag`, default `h3`)
 *   with the number stripped.
 * - A single line wrapped in quotes (curly or straight) becomes a quote.
 * - Anything else becomes one paragraph, trimmed, with internal whitespace
 *   collapsed.
 */

interface LexicalNode {
  type: string
  version: number
  [key: string]: unknown
}

interface TextNode extends LexicalNode {
  type: 'text'
  text: string
  format: number
  detail: number
  mode: 'normal' | 'token' | 'segmented'
  style: string
}

interface ParagraphNode extends LexicalNode {
  type: 'paragraph'
  format: ''
  indent: 0
  direction: 'ltr'
  textFormat: 0
  textStyle: ''
  children: TextNode[]
}

interface HeadingNode extends LexicalNode {
  type: 'heading'
  tag: 'h2' | 'h3' | 'h4'
  format: ''
  indent: 0
  direction: 'ltr'
  children: TextNode[]
}

interface ListItemNode extends LexicalNode {
  type: 'listitem'
  format: ''
  indent: 0
  direction: 'ltr'
  value: number
  children: TextNode[]
}

interface ListNode extends LexicalNode {
  type: 'list'
  tag: 'ul' | 'ol'
  listType: 'bullet' | 'number'
  start: 1
  format: ''
  indent: 0
  direction: 'ltr'
  children: ListItemNode[]
}

interface QuoteNode extends LexicalNode {
  type: 'quote'
  format: ''
  indent: 0
  direction: 'ltr'
  children: TextNode[]
}

const BULLET_PREFIX = /^[•–—\-*]\s+/

function textNode(text: string): TextNode {
  return {
    type: 'text',
    version: 1,
    text,
    format: 0,
    detail: 0,
    mode: 'normal',
    style: '',
  }
}

function paragraph(text: string): ParagraphNode {
  return {
    type: 'paragraph',
    version: 1,
    format: '',
    indent: 0,
    direction: 'ltr',
    textFormat: 0,
    textStyle: '',
    children: [textNode(text)],
  }
}

function heading(text: string, tag: 'h2' | 'h3' | 'h4'): HeadingNode {
  return {
    type: 'heading',
    version: 1,
    tag,
    format: '',
    indent: 0,
    direction: 'ltr',
    children: [textNode(text)],
  }
}

function listItem(text: string): ListItemNode {
  return {
    type: 'listitem',
    version: 1,
    format: '',
    indent: 0,
    direction: 'ltr',
    value: 1,
    children: [textNode(text)],
  }
}

function bulletList(items: string[]): ListNode {
  return {
    type: 'list',
    version: 1,
    tag: 'ul',
    listType: 'bullet',
    start: 1,
    format: '',
    indent: 0,
    direction: 'ltr',
    children: items.map(listItem),
  }
}

function quote(text: string): QuoteNode {
  return {
    type: 'quote',
    version: 1,
    format: '',
    indent: 0,
    direction: 'ltr',
    children: [textNode(text)],
  }
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function isCallout(line: string): boolean {
  // Curly or straight quotes wrapping the whole line.
  return /^[“"][\s\S]+[”"]\s*$/.test(line.trim())
}

function stripQuotes(line: string): string {
  return line.trim().replace(/^[“"]/, '').replace(/[”"]$/, '').trim()
}

function isNumberedHeading(line: string): boolean {
  return /^\d+\.\s+\S/.test(line)
}

function stripNumberPrefix(line: string): string {
  return line.replace(/^\d+\.\s+/, '')
}

/**
 * Convert a single section's text into Lexical nodes. Blocks are separated
 * by blank lines; within each block we emit a paragraph, bulleted list,
 * heading, or quote per the detection rules above.
 */
export function textToLexicalNodes(
  source: string,
  options: { sectionTag?: 'h2' | 'h3' } = {},
): SerializedLexicalNode[] {
  if (!source.trim()) return []
  const blocks = source
    .replace(/​/g, '')
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0)

  const nodes: SerializedLexicalNode[] = []
  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    if (lines.length === 0) continue

    // All-bulleted block → unordered list.
    if (lines.length > 1 && lines.every((line) => BULLET_PREFIX.test(line))) {
      nodes.push(
        bulletList(lines.map((line) => collapseWhitespace(line.replace(BULLET_PREFIX, '')))),
      )
      continue
    }

    // Single line: numbered heading, callout, or paragraph.
    if (lines.length === 1) {
      const single = lines[0]
      if (isNumberedHeading(single)) {
        nodes.push(
          heading(collapseWhitespace(stripNumberPrefix(single)), options.sectionTag ?? 'h3'),
        )
        continue
      }
      if (isCallout(single)) {
        nodes.push(quote(collapseWhitespace(stripQuotes(single))))
        continue
      }
      nodes.push(paragraph(collapseWhitespace(single)))
      continue
    }

    // Multi-line block: join lines into one paragraph, collapsing whitespace.
    nodes.push(paragraph(collapseWhitespace(lines.join(' '))))
  }
  return nodes
}

/** Empty editor state — used when a field is structurally required but the
 * audit had no source text (e.g. post stubs). */
export function emptyLexical(): SerializedEditorState {
  return {
    root: {
      type: 'root',
      version: 1,
      format: '',
      indent: 0,
      direction: 'ltr',
      children: [paragraph('')],
    },
  } as unknown as SerializedEditorState
}

/** Wrap nodes in the standard editor-state shell. */
export function lexicalFromNodes(nodes: SerializedLexicalNode[]): SerializedEditorState {
  return {
    root: {
      type: 'root',
      version: 1,
      format: '',
      indent: 0,
      direction: 'ltr',
      children: nodes.length > 0 ? nodes : [paragraph('')],
    },
  } as unknown as SerializedEditorState
}

/** Convenience: text → full editor state. */
export function textToLexical(source: string): SerializedEditorState {
  return lexicalFromNodes(textToLexicalNodes(source))
}
