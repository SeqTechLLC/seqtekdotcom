import { fireEvent, render } from '@testing-library/react'
import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { Cta } from '../../../src/components/sections/Cta'
import { Cta as CtaBlock } from '../../../src/payload/blocks/layout/Cta'

/**
 * The `cta` block replaces cta-section, contact-cta, newsletter-cta,
 * download-card and hubspot-meetings. The first describe is
 * `contactCta.int.spec.tsx` carried over onto the `meeting` action.
 */

const base = {
  heading: 'Talk to us',
  body: 'We answer in a day.',
  primaryCta: { label: 'Book a call', url: '/contact' },
}

// Not a GUID on purpose: `isHubspotLive` is false for it, so a submit takes
// the stub path even with a real portal id in .env.local, and nothing leaves
// the test process.
const FORM = 'test-form'

describe('<Cta action="meeting" /> scheduling panel (INERT-2, from contact-cta)', () => {
  const meeting = { ...base, action: 'meeting' as const, variant: 'split' as const }

  it('publishes no placeholder copy when there is no meeting URL', () => {
    const { container } = render(<Cta {...meeting} />)
    expect(container.textContent).not.toMatch(/Configure a HubSpot/i)
    expect(container.textContent).not.toMatch(/HubSpot Meetings embed/i)
  })

  it('drops the empty second column rather than reserving half the width for it', () => {
    const { container } = render(<Cta {...meeting} />)
    expect(container.querySelector('div.grid')).toBeNull()
    const column = container.querySelector('section > div')
    expect(column?.className).not.toMatch(/grid-cols-2/)
    expect(column?.children.length).toBe(1)
  })

  it('still renders the heading, body and buttons without a meeting URL', () => {
    const { getByText } = render(
      <Cta {...meeting} secondaryCta={{ label: 'Email us', url: '/e' }} />,
    )
    expect(getByText('Talk to us')).toBeTruthy()
    expect(getByText('We answer in a day.')).toBeTruthy()
    expect(getByText('Book a call')).toBeTruthy()
    expect(getByText('Email us')).toBeTruthy()
  })

  it('treats a whitespace-only meeting URL as blank, the way the validator does', () => {
    const { container } = render(<Cta {...meeting} meetingUrl="   " />)
    expect(container.textContent).not.toMatch(/See available times/)
    expect(container.querySelector('div.grid')).toBeNull()
  })

  it('renders the panel as a second column when a meeting URL is set', () => {
    const url = 'https://meetings.hubspot.com/seqtek'
    const { container, getByRole } = render(<Cta {...meeting} meetingUrl={url} />)
    const grid = container.querySelector('div.grid')
    expect(grid?.className).toMatch(/grid-cols-2/)
    expect(grid?.children.length).toBe(2)
    // The panel books the meeting rather than printing the address at the
    // reader: the URL belongs in the href, not in the copy.
    const booking = getByRole('link', { name: 'See available times' })
    expect(booking.getAttribute('href')).toBe(url)
    expect(booking.getAttribute('target')).toBe('_blank')
    expect(container.textContent).not.toContain(url)
  })

  it('draws the panel under the copy when centered, and needs no button', () => {
    const url = 'https://meetings.hubspot.com/seqtek'
    const { container, getByRole } = render(
      <Cta heading="Book a time" action="meeting" meetingUrl={url} />,
    )
    expect(container.querySelector('div.grid')).toBeNull()
    expect(getByRole('link', { name: 'See available times' }).getAttribute('href')).toBe(url)
    expect(container.querySelectorAll('a')).toHaveLength(1)
  })

  it('ignores the meeting URL under every other action', () => {
    const { container } = render(
      <Cta {...base} action="buttons" meetingUrl="https://meetings.hubspot.com/seqtek" />,
    )
    expect(container.textContent).not.toMatch(/See available times/)
  })
})

describe('<Cta action="buttons" /> (from cta-section)', () => {
  it('centres the copy and buttons by default', () => {
    const { container, getByRole } = render(<Cta {...base} />)
    expect(container.querySelector('section > div')?.className).toMatch(/text-center/)
    expect(getByRole('link', { name: 'Book a call' }).getAttribute('href')).toBe('/contact')
  })

  it('puts the buttons in a second column when split', () => {
    const { container } = render(<Cta {...base} variant="split" />)
    const grid = container.querySelector('div.grid')
    expect(grid?.className).toMatch(/lg:grid-cols-2/)
    expect(grid?.children[1].textContent).toBe('Book a call')
  })

  it('collapses the split to one column when there is no button to put beside the copy', () => {
    const { container } = render(<Cta heading="Just a line" variant="split" />)
    expect(container.querySelector('div.grid')).toBeNull()
  })

  it('draws a button only when it has both its words and a link', () => {
    const { container } = render(
      <Cta heading="Half-filled" primaryCta={{ label: 'Go', url: '' }} />,
    )
    expect(container.querySelectorAll('a')).toHaveLength(0)
  })

  it('styles the main button by its chosen weight', () => {
    const style = (variant: 'primary' | 'secondary' | 'ghost') =>
      render(
        <Cta heading="h" background="none" primaryCta={{ label: variant, url: '/x', variant }} />,
      )
        .getByRole('link', { name: variant })
        .getAttribute('class')
    expect(style('primary')).toMatch(/bg-accent-strong/)
    expect(style('secondary')).toMatch(/border-accent-strong/)
    expect(style('ghost')).toMatch(/underline/)
  })

  it('turns the lighter button styles white on the dark band', () => {
    // Green-700 text on neutral-900 fails AA contrast.
    const { getByRole } = render(
      <Cta
        heading="h"
        background="inverse"
        primaryCta={{ label: 'Go', url: '/x', variant: 'secondary' }}
      />,
    )
    const cls = getByRole('link', { name: 'Go' }).getAttribute('class') ?? ''
    expect(cls).toMatch(/text-white/)
    expect(cls).not.toMatch(/text-accent-strong/)
  })

  it('sits on the solid brand band unless told otherwise, with a white main button', () => {
    const { container, getAllByRole } = render(<Cta {...base} />)
    expect(container.querySelector('section')?.className).toMatch(/bg-accent-strong/)
    expect(getAllByRole('link')[0].getAttribute('class')).toMatch(/bg-white/)
  })
})

describe('<Cta action="newsletter" /> (from newsletter-cta)', () => {
  it('renders nothing without a form id, since there is no way to subscribe', () => {
    const { container } = render(<Cta heading="Subscribe" action="newsletter" />)
    expect(container.innerHTML).toBe('')
  })

  it('mounts the shared lead form with the email field only', () => {
    const { getByLabelText, getByRole, queryByLabelText } = render(
      <Cta heading="Subscribe" action="newsletter" formId={FORM} />,
    )
    expect(getByLabelText(/Email/)).toBeTruthy()
    expect(queryByLabelText(/First name/)).toBeNull()
    expect(getByRole('button', { name: 'Subscribe' })).toBeTruthy()
  })

  it('does not paint the form id, which is read only on submit', () => {
    const html = (formId: string) =>
      render(<Cta heading="Subscribe" action="newsletter" formId={formId} />).container.innerHTML
    expect(html('form-a')).toBe(html('form-b'))
  })
})

describe('<Cta action="download" /> (from download-card)', () => {
  const download = {
    heading: 'The guide',
    body: 'Why it is worth the email.',
    action: 'download' as const,
    variant: 'split' as const,
    coverImage: { url: '/media/cover.jpg', alt: 'The cover' },
    formId: FORM,
    fileUrl: 'https://assets.example.com/guide.pdf',
  }

  it('renders nothing without a form id or a file to hand over', () => {
    expect(render(<Cta {...download} formId={null} />).container.innerHTML).toBe('')
    expect(render(<Cta {...download} fileUrl="  " />).container.innerHTML).toBe('')
  })

  it('keeps the file address out of what the page paints', () => {
    const { container } = render(<Cta {...download} />)
    expect(container.innerHTML).not.toContain('guide.pdf')
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/media/cover.jpg')
  })

  it('drops the empty half of the card when there is no cover', () => {
    const { container } = render(<Cta {...download} coverImage={null} />)
    expect(container.querySelector('section > div')?.className).not.toMatch(/md:grid-cols-2/)
  })

  it('hands over the file once the gate form is sent', async () => {
    const { getByLabelText, getByRole, findByRole } = render(<Cta {...download} />)
    fireEvent.change(getByLabelText(/First name/), { target: { value: 'Ada' } })
    fireEvent.change(getByLabelText(/Last name/), { target: { value: 'Lovelace' } })
    fireEvent.change(getByLabelText(/^Email/), { target: { value: 'ada@example.com' } })
    fireEvent.click(getByRole('button', { name: 'Get it' }))
    const link = await findByRole('link', { name: 'Open the download' })
    expect(link.getAttribute('href')).toBe(download.fileUrl)
  })
})

/** The field config's own validators, called the way Payload calls them. */
describe('cta block validation', () => {
  type Validate = (value: unknown, args: Record<string, unknown>) => true | string
  const named = (fields: Field[], name: string): Field => {
    const found = fields.find((f) => 'name' in f && f.name === name)
    if (!found) throw new Error(`no field ${name}`)
    return found
  }
  const validateOf = (field: Field): Validate => (field as { validate: Validate }).validate
  const primaryField = (name: 'label' | 'url') =>
    validateOf(named((named(CtaBlock.fields, 'primaryCta') as { fields: Field[] }).fields, name))

  it('requires the main button for "Click a button" only', () => {
    const label = primaryField('label')
    expect(label('', { blockData: { action: 'buttons' } })).not.toBe(true)
    expect(label('', { blockData: {} })).not.toBe(true)
    expect(label('', { blockData: { action: 'meeting' } })).toBe(true)
    expect(label('Book a call', { blockData: { action: 'buttons' } })).toBe(true)
  })

  it('still rejects an unsafe button link', () => {
    const url = primaryField('url')
    expect(url('javascript:alert(1)', { blockData: { action: 'meeting' } })).not.toBe(true)
    expect(url('/contact', { blockData: { action: 'buttons' } })).toBe(true)
  })

  it('requires the scheduling link for a meeting and still checks it is https', () => {
    const meeting = validateOf(named(CtaBlock.fields, 'meetingUrl'))
    expect(meeting('', { siblingData: { action: 'meeting' } })).not.toBe(true)
    expect(
      meeting('http://meetings.hubspot.com/x', { siblingData: { action: 'meeting' } }),
    ).not.toBe(true)
    expect(meeting('https://meetings.hubspot.com/x', { siblingData: { action: 'meeting' } })).toBe(
      true,
    )
    expect(meeting('', { siblingData: { action: 'buttons' } })).toBe(true)
  })

  it('requires a real HubSpot form id for newsletter and download', () => {
    const formId = validateOf(named(CtaBlock.fields, 'formId'))
    for (const action of ['newsletter', 'download']) {
      expect(formId('', { siblingData: { action } })).not.toBe(true)
      expect(formId('not-a-guid', { siblingData: { action } })).not.toBe(true)
      expect(formId('12345678-90ab-cdef-1234-567890abcdef', { siblingData: { action } })).toBe(true)
    }
    expect(formId('', { siblingData: { action: 'buttons' } })).toBe(true)
  })
})
