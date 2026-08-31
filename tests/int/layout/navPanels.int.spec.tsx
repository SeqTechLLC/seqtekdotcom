import { fireEvent, render, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MobileNav } from '../../../src/components/layout/MobileNav'
import { PrimaryNav } from '../../../src/components/layout/PrimaryNav'
import { navigation, type NavItem } from '../../../src/lib/site-content'

/**
 * ROADMAP NAV-1. The shipped nav data has exactly one shape today: two
 * single-group panels, no group URLs, because Brent's grouped service list had
 * not arrived when this was built. So the interesting halves of the component
 * — several columns, and a group that is itself a link — have no live instance
 * to exercise them.
 *
 * That is precisely the condition the INERT-2 gate exists to stop: a control
 * that ships without anything proving it draws. These fixtures stand in for
 * the data until it lands.
 */
const FIXTURE: NavItem[] = [
  {
    label: 'What we do',
    url: '/services',
    panel: {
      groups: [
        {
          label: 'Build',
          url: '/services/build',
          items: [
            { label: 'Custom Software', url: '/services/custom-software' },
            { label: 'Application Modernization', url: '/services/app-modernization' },
          ],
        },
        {
          label: 'Operate',
          items: [{ label: 'Process Automation', url: '/services/process-automation' }],
        },
      ],
    },
  },
  { label: 'Contact', url: '/contact' },
]

const CTA = { label: 'Book a Call', url: '/contact' }

describe('<PrimaryNav /> — the desktop dropdown panel', () => {
  it('leaves every top-level item a link, so no axis page is stranded behind a menu', () => {
    const { getByRole } = render(<PrimaryNav items={navigation.mainNav} />)
    for (const item of navigation.mainNav) {
      expect(getByRole('link', { name: item.label }).getAttribute('href')).toBe(item.url)
    }
  })

  it('starts closed and gives the caret its own accessible name', () => {
    const { getByRole, getByTestId } = render(<PrimaryNav items={FIXTURE} />)
    const caret = getByRole('button', { name: 'What we do menu' })
    expect(caret.getAttribute('aria-expanded')).toBe('false')
    expect(getByTestId('nav-panel-0').hasAttribute('hidden')).toBe(true)
    // The caret controls the element it claims to control.
    expect(caret.getAttribute('aria-controls')).toBe(getByTestId('nav-panel-0').id)
  })

  it('opens on click and closes on a second click', () => {
    const { getByRole, getByTestId } = render(<PrimaryNav items={FIXTURE} />)
    const caret = getByRole('button', { name: 'What we do menu' })

    fireEvent.click(caret)
    expect(caret.getAttribute('aria-expanded')).toBe('true')
    expect(getByTestId('nav-panel-0').hasAttribute('hidden')).toBe(false)

    fireEvent.click(caret)
    expect(caret.getAttribute('aria-expanded')).toBe('false')
    expect(getByTestId('nav-panel-0').hasAttribute('hidden')).toBe(true)
  })

  // The int environment loads no CSS, so `getComputedStyle(panel).display` is
  // 'none' whether or not a display class is present — it cannot see this
  // regression. Assert on the class list, which it can.
  it('keeps every display utility off the element that `hidden` hides', () => {
    const { getByTestId } = render(<PrimaryNav items={FIXTURE} />)
    expect(getByTestId('nav-panel-0').className).not.toMatch(
      /(?:^|\s)(?:grid|flex|block|inline-flex|inline-block|table|contents)(?:\s|$)/,
    )
  })

  it('draws one column per group', () => {
    const { getByTestId } = render(<PrimaryNav items={FIXTURE} />)
    const grid = getByTestId('nav-panel-0').firstElementChild as HTMLElement
    expect(grid.style.gridTemplateColumns).toBe('repeat(2, minmax(10rem, max-content))')
  })

  it('renders a linked group as a link and a headless group as plain text', () => {
    const { getByTestId, getByRole, queryByRole } = render(<PrimaryNav items={FIXTURE} />)
    fireEvent.click(getByRole('button', { name: 'What we do menu' }))
    const panel = within(getByTestId('nav-panel-0'))

    expect(panel.getByRole('link', { name: 'Build' }).getAttribute('href')).toBe('/services/build')
    // "Operate" has no URL, so it is a heading and nothing more.
    expect(queryByRole('link', { name: 'Operate' })).toBeNull()
    expect(panel.getByText('Operate').tagName).toBe('SPAN')
  })

  it('names each column by its own group, so a leaf is announced with its group', () => {
    const { getByTestId, getByRole } = render(<PrimaryNav items={FIXTURE} />)
    fireEvent.click(getByRole('button', { name: 'What we do menu' }))
    const lists = getByTestId('nav-panel-0').querySelectorAll('ul')
    expect(lists).toHaveLength(2)
    for (const [index, label] of ['Build', 'Operate'].entries()) {
      const labelledBy = lists[index].getAttribute('aria-labelledby')
      expect(document.getElementById(labelledBy ?? '')?.textContent).toBe(label)
    }
  })

  it('labels a single-group panel by the trigger instead of repeating it', () => {
    const { getByTestId } = render(<PrimaryNav items={navigation.mainNav} />)
    // mainNav[1] is Services: one group, so no group title is drawn.
    const panel = getByTestId('nav-panel-1')
    const list = panel.querySelector('ul') as HTMLElement
    const labelledBy = list.getAttribute('aria-labelledby') ?? ''
    expect(document.getElementById(labelledBy)?.textContent).toBe('Services')
    // The point is that the group title is not repeated inside the panel, not
    // that the panel contains no <span> at all.
    expect(within(panel).queryByText('Services')).toBeNull()
  })

  it('closes when its own trigger link navigates away', () => {
    // `SiteHeader` lives in the persistent frontend layout, so this component
    // is not remounted across a route change: without an explicit close the
    // panel hangs over the page the trigger just navigated to.
    const { getByRole, getByTestId } = render(<PrimaryNav items={FIXTURE} />)
    fireEvent.click(getByRole('button', { name: 'What we do menu' }))
    expect(getByTestId('nav-panel-0').hasAttribute('hidden')).toBe(false)

    fireEvent.click(getByRole('link', { name: 'What we do' }))
    expect(getByTestId('nav-panel-0').hasAttribute('hidden')).toBe(true)
  })

  it('closes on Escape and puts focus back on the caret', () => {
    const { getByRole, getByTestId } = render(<PrimaryNav items={FIXTURE} />)
    const caret = getByRole('button', { name: 'What we do menu' })
    fireEvent.click(caret)

    fireEvent.keyDown(getByTestId('nav-panel-0'), { key: 'Escape' })
    expect(getByTestId('nav-panel-0').hasAttribute('hidden')).toBe(true)
    expect(document.activeElement).toBe(caret)
  })

  it('closes on Escape even when nothing inside the nav has focus', () => {
    // Safari and Firefox on macOS do not focus a <button> when it is clicked,
    // so after a mouse-open there is nothing focused in the nav. A nav-scoped
    // key handler would never fire there; this one is on the document.
    const { getByRole, getByTestId } = render(<PrimaryNav items={FIXTURE} />)
    fireEvent.click(getByRole('button', { name: 'What we do menu' }))
    ;(document.activeElement as HTMLElement | null)?.blur()

    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(getByTestId('nav-panel-0').hasAttribute('hidden')).toBe(true)
  })

  it('closes when a pointer lands outside the nav', () => {
    const { getByRole, getByTestId } = render(<PrimaryNav items={FIXTURE} />)
    fireEvent.click(getByRole('button', { name: 'What we do menu' }))
    fireEvent.pointerDown(document.body)
    expect(getByTestId('nav-panel-0').hasAttribute('hidden')).toBe(true)
  })

  it('does not trap focus — it is a disclosure, not a modal', () => {
    const { getByRole, getByTestId } = render(<PrimaryNav items={FIXTURE} />)
    fireEvent.click(getByRole('button', { name: 'What we do menu' }))
    const outside = document.createElement('button')
    document.body.appendChild(outside)

    fireEvent.blur(getByTestId('nav-panel-0').closest('nav') as HTMLElement, {
      relatedTarget: outside,
    })
    expect(getByTestId('nav-panel-0').hasAttribute('hidden')).toBe(true)
    outside.remove()
  })
})

describe('<MobileNav /> — the same data, collapsed', () => {
  it('starts collapsed rather than rendering the whole tree expanded', () => {
    const { getByTestId } = render(<MobileNav navItems={FIXTURE} ctaButton={CTA} />)
    expect(getByTestId('mobile-nav-panel-0').hasAttribute('hidden')).toBe(true)
    expect(getByTestId('mobile-nav-caret-0').getAttribute('aria-expanded')).toBe('false')
  })

  it('gives a panel item a link and a separate caret, each with its own name', () => {
    const { getByRole } = render(<MobileNav navItems={FIXTURE} ctaButton={CTA} />)
    expect(getByRole('link', { name: 'What we do', hidden: true }).getAttribute('href')).toBe(
      '/services',
    )
    expect(getByRole('button', { name: 'What we do menu', hidden: true })).toBeTruthy()
  })

  it('leaves a plain item without a caret at all', () => {
    const { queryByTestId } = render(<MobileNav navItems={FIXTURE} ctaButton={CTA} />)
    expect(queryByTestId('mobile-nav-caret-1')).toBeNull()
  })

  it('expands to one nested disclosure per group when there are several', () => {
    const { getByTestId, getByRole } = render(<MobileNav navItems={FIXTURE} ctaButton={CTA} />)
    fireEvent.click(getByTestId('mobile-nav-caret-0'))
    expect(getByTestId('mobile-nav-panel-0').hasAttribute('hidden')).toBe(false)

    const groupCaret = getByRole('button', { name: 'Operate links', hidden: true })
    expect(groupCaret.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(groupCaret)
    expect(groupCaret.getAttribute('aria-expanded')).toBe('true')
    expect(getByRole('link', { name: 'Process Automation', hidden: true })).toBeTruthy()
  })

  it('puts the leaves straight under a single-group item, with no repeated title', () => {
    const { getByTestId } = render(<MobileNav navItems={navigation.mainNav} ctaButton={CTA} />)
    fireEvent.click(getByTestId('mobile-nav-caret-1'))
    const panel = within(getByTestId('mobile-nav-panel-1'))
    expect(panel.getByRole('link', { name: 'AI Integration', hidden: true })).toBeTruthy()
    // No nested group disclosure and no duplicated "Services" heading.
    expect(panel.queryByRole('button', { hidden: true })).toBeNull()
  })
})
