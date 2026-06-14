/**
 * Shared Lexical helpers for splicing a `figure` block into post content.
 * Used by both insert.ts (local, Payload Local API) and push-staging.ts (REST).
 */
import { randomBytes } from 'node:crypto'

export interface LexNode {
  type: string
  tag?: string
  children?: Array<{ text?: string }>
  fields?: { blockType?: string }
  [k: string]: unknown
}

const headingText = (n: LexNode): string =>
  n.type === 'heading' ? (n.children ?? []).map((c) => c.text ?? '').join('') : ''

export const hasFigure = (children: LexNode[]): boolean =>
  children.some((n) => n.type === 'block' && n.fields?.blockType === 'figure')

/** Block-level `figure` Lexical node (mirrors editorConfig BlocksFeature). */
export function figureNode(mediaId: number | string, caption: string): LexNode {
  return {
    type: 'block',
    version: 2,
    format: '',
    fields: {
      id: randomBytes(12).toString('hex'),
      blockType: 'figure',
      image: mediaId,
      caption,
    },
  }
}

/**
 * Insert `node` after the first paragraph of the section whose heading text
 * starts with `afterHeading`. Falls back to right after the heading, then to
 * end-of-document. Returns the new children array plus a human-readable note.
 */
export function spliceAfterSection(
  children: LexNode[],
  afterHeading: string,
  node: LexNode,
): { children: LexNode[]; at: string } {
  const hIdx = children.findIndex((n) => headingText(n).startsWith(afterHeading))
  if (hIdx === -1) return { children: [...children, node], at: 'end (heading not found)' }
  let insertAt = hIdx + 1
  for (let i = hIdx + 1; i < children.length; i++) {
    if (children[i].type === 'heading') break // next section started
    if (children[i].type === 'paragraph') {
      insertAt = i + 1 // after the first paragraph of the section
      break
    }
  }
  const next = [...children.slice(0, insertAt), node, ...children.slice(insertAt)]
  return { children: next, at: `after section "${afterHeading}" (index ${insertAt})` }
}
