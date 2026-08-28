import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ContactCta } from '../../../src/components/sections/ContactCta'

// ROADMAP INERT-2 — `contact-cta` used to render its scheduling panel
// unconditionally, so the empty branch published the developer sentence
// "Configure a HubSpot meetings URL to embed the scheduler" as body copy. Nine
// blocks in the services content leave `meetingUrl` blank, which made this the
// one inert-control defect that was actually live. The panel is now optional.

const base = {
  heading: 'Talk to us',
  body: 'We answer in a day.',
  primaryCta: { label: 'Book a call', url: '/contact' },
}

describe('<ContactCta /> scheduling panel (INERT-2)', () => {
  it('publishes no placeholder copy when there is no meeting URL', () => {
    const { container } = render(<ContactCta {...base} />)
    expect(container.textContent).not.toMatch(/Configure a HubSpot/i)
    expect(container.textContent).not.toMatch(/HubSpot Meetings embed/i)
  })

  it('drops the empty second column rather than reserving half the width for it', () => {
    const { container } = render(<ContactCta {...base} />)
    // No grid at all in the collapsed state: `grid` and `gap-10` do nothing on
    // a one-child container, so the class string swaps wholesale rather than
    // carrying two inert utilities.
    expect(container.querySelector('div.grid')).toBeNull()
    const column = container.querySelector('section > div')
    expect(column?.className).not.toMatch(/grid-cols-2/)
    expect(column?.children.length).toBe(1)
  })

  it('still renders the heading, body and buttons without a meeting URL', () => {
    const { getByText } = render(
      <ContactCta {...base} secondaryCta={{ label: 'Email us', url: '/e' }} />,
    )
    expect(getByText('Talk to us')).toBeTruthy()
    expect(getByText('We answer in a day.')).toBeTruthy()
    expect(getByText('Book a call')).toBeTruthy()
    expect(getByText('Email us')).toBeTruthy()
  })

  it('treats a whitespace-only meeting URL as blank, the way the validator does', () => {
    // `httpsUrlValidate` accepts '   ' as empty, so it saves; a bare truthiness
    // check in the renderer would put the framed panel back over a blank
    // address line and re-open the defect above.
    const { container } = render(<ContactCta {...base} meetingUrl="   " />)
    expect(container.textContent).not.toMatch(/HubSpot Meetings embed/i)
    expect(container.querySelector('div.grid')).toBeNull()
  })

  it('renders the panel as a second column when a meeting URL is set', () => {
    const url = 'https://meetings.hubspot.com/seqtek'
    const { container, getByText } = render(<ContactCta {...base} meetingUrl={url} />)
    const grid = container.querySelector('div.grid')
    expect(grid?.className).toMatch(/grid-cols-2/)
    expect(grid?.children.length).toBe(2)
    expect(getByText(url)).toBeTruthy()
  })
})
