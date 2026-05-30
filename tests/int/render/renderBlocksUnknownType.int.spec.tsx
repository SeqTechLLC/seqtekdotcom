import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RenderBlocks } from '../../../src/components/sections/RenderBlocks'

describe('<RenderBlocks />', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('empty / null / undefined produce no DOM and no warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { container: a } = render(<RenderBlocks blocks={[]} />)
    expect(a.firstChild).toBeNull()

    const { container: b } = render(<RenderBlocks blocks={null} />)
    expect(b.firstChild).toBeNull()

    const { container: c } = render(<RenderBlocks blocks={undefined} />)
    expect(c.firstChild).toBeNull()

    expect(warn).not.toHaveBeenCalled()
  })

  it('known blockType renders the registered component', () => {
    const blocks = [
      {
        blockType: 'hero',
        headline: 'Hello world',
        variant: 'text-only',
      },
    ]
    const { getByText } = render(<RenderBlocks blocks={blocks} />)
    expect(getByText('Hello world')).toBeTruthy()
  })

  it('unknown blockType in dev → single dev warning + skip', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { container } = render(
      <RenderBlocks blocks={[{ blockType: 'not-a-real-block', headline: 'x' }]} />,
    )
    expect(container.textContent).toBe('')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toContain('Unknown blockType: not-a-real-block')
  })

  it('unknown blockType in production → silent skip', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { container } = render(
      <RenderBlocks blocks={[{ blockType: 'not-a-real-block', headline: 'x' }]} />,
    )
    expect(container.textContent).toBe('')
    expect(warn).not.toHaveBeenCalled()
  })
})
