import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RichText } from '../../../src/components/richText/RichText'

// Tiny SerializedEditorState builder for the tests. Keeps the test self-
// contained and decoupled from the showcase seed helpers.
const root = (children: unknown[]) =>
  ({
    root: {
      type: 'root',
      version: 1,
      format: '',
      indent: 0,
      direction: 'ltr',
      children,
    },
  }) as unknown as Parameters<typeof RichText>[0]['data']

const paragraph = (text: string) => ({
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

const inlineBlock = (blockType: string, fields: Record<string, unknown> = {}) => ({
  type: 'inlineBlock',
  version: 2,
  fields: { blockType, ...fields },
})

describe('<RichText /> (contract: inline-block-converter.md)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('null / undefined input → null', () => {
    const { container: a } = render(<RichText data={null} />)
    expect(a.firstChild).toBeNull()
    const { container: b } = render(<RichText data={undefined} />)
    expect(b.firstChild).toBeNull()
  })

  it('empty children → null', () => {
    const { container } = render(<RichText data={root([])} />)
    expect(container.firstChild).toBeNull()
  })

  it('plain paragraph renders inside <Prose>', () => {
    const { container, getByText } = render(<RichText data={root([paragraph('Hello world')])} />)
    expect(getByText('Hello world')).toBeTruthy()
    // <Prose> wraps with `prose` class
    expect(container.querySelector('.prose')).toBeTruthy()
  })

  it('paragraph containing inline-block renders without throwing', () => {
    // Smoke: the converter dispatches to the registry without crashing.
    // End-to-end visual verification of each registered inline block is
    // covered by tests/e2e/visual/showcase.e2e.spec.ts — under jsdom
    // here, next/link does not produce a real <a> element without a
    // router context, so we cannot meaningfully assert rendered output.
    const data = root([
      {
        type: 'paragraph',
        version: 1,
        format: '',
        indent: 0,
        direction: 'ltr',
        textFormat: 0,
        textStyle: '',
        children: [
          inlineBlock('inline-cta', { label: 'Click me', url: '/test', variant: 'primary' }),
        ],
      },
    ])
    expect(() => render(<RichText data={data} />)).not.toThrow()
  })

  it('unknown inline blockType renders without throwing', () => {
    // Payload's react RichText routes unconverted inline-block children
    // through its own fallback path before our converter sees them; the
    // load-bearing guarantee here is that the page does NOT crash on
    // unknown content. The warn-once-in-dev contract for the layout path
    // is verified by tests/int/render/renderBlocksUnknownType.int.spec.tsx
    // (T044) — it does not also need to be re-asserted for the inline path.
    const data = root([
      {
        type: 'paragraph',
        version: 1,
        format: '',
        indent: 0,
        direction: 'ltr',
        textFormat: 0,
        textStyle: '',
        children: [inlineBlock('not-a-real-inline-block')],
      },
    ])
    expect(() => render(<RichText data={data} />)).not.toThrow()
  })
})
