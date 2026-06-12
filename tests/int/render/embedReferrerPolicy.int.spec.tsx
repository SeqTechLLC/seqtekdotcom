import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Hero } from '../../../src/components/sections/Hero'
import { VideoEmbed } from '../../../src/components/sections/VideoEmbed'

// YouTube's embedded player requires the Referer header to validate the
// embedding origin; `no-referrer` renders "Error 153: Video player
// configuration error" instead of the player (PR #51). These assertions pin
// the working value so a future privacy-hardening sweep can't silently
// re-break every YouTube embed.
const REQUIRED_POLICY = 'strict-origin-when-cross-origin'

describe('third-party embed iframes send the origin referrer', () => {
  it('<VideoEmbed /> youtube iframe uses the required referrer policy', () => {
    const { container } = render(
      <VideoEmbed provider="youtube" videoId="dQw4w9WgXcQ" title="Workshop recap" />,
    )
    const iframe = container.querySelector('iframe')
    expect(iframe).not.toBeNull()
    expect(iframe?.getAttribute('referrerpolicy')).toBe(REQUIRED_POLICY)
  })

  it('<Hero /> with-video iframe uses the required referrer policy', () => {
    const { container } = render(
      <Hero
        variant="with-video"
        headline="Who We Are"
        videoUrl="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
      />,
    )
    const iframe = container.querySelector('iframe')
    expect(iframe).not.toBeNull()
    expect(iframe?.getAttribute('referrerpolicy')).toBe(REQUIRED_POLICY)
  })
})
