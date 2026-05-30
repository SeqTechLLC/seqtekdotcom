import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'

/**
 * Plain-text → Lexical AST transformer for the Wix audit seed pipeline.
 *
 * The audit JSON is text-only (no HTML markup) per `docs/CONTENT_MIGRATION.md`
 * §4 — so we bypass HTML parsing and emit Lexical nodes directly. The output
 * shape is the same `SerializedEditorState` admin saves so seed and admin
 * stay structurally identical (R-15).
 *
 * The file keeps the canonical name `htmlToLexical` (per tasks.md T100) even
 * though the runtime path is text-only — when a fuller HTML re-crawl arrives
 * later, the `htmlToLexical` wrapper below routes to
 * `@payloadcms/richtext-lexical/convertHTMLToLexical`.
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
 * heading, or quote per the §4 detection rules.
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

    // Multi-line block: join lines into one paragraph, collapsing whitespace
    // — matches the §4 "trim, collapse internal whitespace" rule for prose.
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
