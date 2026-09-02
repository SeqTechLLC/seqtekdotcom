import { fireEvent, render, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MobileNav } from '../../../src/components/layout/MobileNav'
import { PrimaryNav } from '../../../src/components/layout/PrimaryNav'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { navigation, type NavItem } from '../../../src/lib/site-content'

/**
 * ROADMAP NAV-1. Written when the shipped nav had exactly one shape — two
 * single-group panels and no group URLs — so the interesting halves of the
 * component (several columns, and a group that is itself a link) had no live
 * instance, the condition the INERT-2 gate exists to stop.
 *
 * Brent's structure has since landed, and "What We Do" exercises both of those
 * against the real `navigation.mainNav` further down. The fixture stays for
 * what the shipped data still does NOT cover: a group with a title that is not
 * a link, which neither axis produces (a single-group panel suppresses its
 * title, and every multi-group entry carries a URL).
 */
const FIXTURE: NavItem[] = [
  {
    label: 'What we do',
    url: '/fixture-axis',
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

/**
 * A `hidden` element must carry no display utility: Tailwind's preflight rule
 * lives in the base layer and any `display` utility beats it from the later
 * utilities layer, leaving a panel that can never close.
 *
 * The int environment loads no CSS, so `getComputedStyle(el).display` reports
 * `none` whether or not such a class is present and cannot see the regression.
 * The class list can. The `(?:[a-z0-9-]+:)*` prefix matters most of all — this
 * is a `hidden lg:flex` nav, so `lg:grid` is the likeliest reintroduction, and
 * an unanchored pattern is blind to exactly that shape.
 */
const DISPLAY_UTILITY =
  /(?:^|\s)(?:[a-z0-9-]+:)*(?:grid|inline-grid|flex|inline-flex|block|inline-block|inline|table|inline-table|flow-root|list-item|contents)(?:\s|$)/

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

  it('keeps every display utility off the element that `hidden` hides', () => {
    const { getByTestId } = render(<PrimaryNav items={FIXTURE} />)
    expect(getByTestId('nav-panel-0').className).not.toMatch(DISPLAY_UTILITY)
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
    const { getByRole } = render(<PrimaryNav items={navigation.mainNav} />)
    // "How We Work" carries one group, so no group title is drawn. (The
    // multi-group path is covered by "What We Do" below, and by FIXTURE above.) Resolved through `aria-controls`
    // rather than a positional test id, so reordering the nav fails on
    // behaviour instead of on a missing element.
    const controls = getByRole('button', { name: 'How We Work menu' }).getAttribute('aria-controls')
    const panel = document.getElementById(controls ?? '') as HTMLElement
    const list = panel.querySelector('ul') as HTMLElement
    const labelledBy = list.getAttribute('aria-labelledby') ?? ''
    expect(document.getElementById(labelledBy)?.textContent).toBe('How We Work')
    // The point is that the group title is not repeated inside the panel, not
    // that the panel contains no <span> at all.
    expect(within(panel).queryByText('How We Work')).toBeNull()
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

  it('closes on Escape and puts focus back on the caret it came from', () => {
    // The keyboard path: the caret holds focus, so Escape must hand it back
    // rather than dropping the user at the top of the document.
    const { getByRole, getByTestId } = render(<PrimaryNav items={FIXTURE} />)
    const caret = getByRole('button', { name: 'What we do menu' })
    caret.focus()
    fireEvent.click(caret)
    expect(document.activeElement).toBe(caret)

    fireEvent.keyDown(getByTestId('nav-panel-0'), { key: 'Escape' })
    expect(getByTestId('nav-panel-0').hasAttribute('hidden')).toBe(true)
    expect(document.activeElement).toBe(caret)
  })

  it('closes on Escape when nothing in the nav has focus, without stealing it', () => {
    // The mouse path. Safari and Firefox on macOS do not focus a <button> when
    // it is clicked — and neither does jsdom — so after a mouse-open there is
    // nothing focused in the nav. A nav-scoped key handler would never fire
    // there; this one is on the document. But the user may have tabbed well
    // past the nav by now, so Escape must close WITHOUT dragging focus back.
    const { getByRole, getByTestId } = render(<PrimaryNav items={FIXTURE} />)
    fireEvent.click(getByRole('button', { name: 'What we do menu' }))

    const elsewhere = document.createElement('button')
    document.body.appendChild(elsewhere)
    elsewhere.focus()

    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(getByTestId('nav-panel-0').hasAttribute('hidden')).toBe(true)
    expect(document.activeElement).toBe(elsewhere)
    elsewhere.remove()
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
      '/fixture-axis',
    )
    expect(getByRole('button', { name: 'What we do menu', hidden: true })).toBeTruthy()
  })

  it('keeps every display utility off the elements that `hidden` hides', () => {
    const { getByTestId, getByRole } = render(<MobileNav navItems={FIXTURE} ctaButton={CTA} />)
    expect(getByTestId('mobile-nav-panel-0').className).not.toMatch(DISPLAY_UTILITY)

    // The nested group region is hidden the same way, so it carries the same
    // constraint.
    fireEvent.click(getByTestId('mobile-nav-caret-0'))
    const groupRegion = getByRole('button', { name: 'Operate links', hidden: true }).getAttribute(
      'aria-controls',
    )
    expect(document.getElementById(groupRegion ?? '')?.className).not.toMatch(DISPLAY_UTILITY)
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

  /**
   * Open a top-level axis by ACCESSIBLE NAME and return its panel, resolved
   * through `aria-controls` — the same way the desktop tests above do. The
   * mobile block used ordinal test ids (`mobile-nav-caret-1`), which fail on a
   * wrong-element assertion the moment the nav is reordered rather than on the
   * behaviour under test. Reordering is exactly what this PR did.
   */
  const openAxis = (r: ReturnType<typeof render>, label: string) => {
    const caret = r.getByRole('button', { name: `${label} menu`, hidden: true })
    fireEvent.click(caret)
    const id = caret.getAttribute('aria-controls') ?? ''
    return within(document.getElementById(id) as HTMLElement)
  }

  it('puts the leaves straight under a single-group item, with no repeated title', () => {
    const r = render(<MobileNav navItems={navigation.mainNav} ctaButton={CTA} />)
    // "How We Work" is the single-group axis; "What We Do" carries Brent's
    // three groups and exercises the nested-disclosure path instead.
    const panel = openAxis(r, 'How We Work')
    expect(panel.getByRole('link', { name: 'Localshoring', hidden: true })).toBeTruthy()
    // No nested group disclosure and no duplicated "How We Work" heading.
    expect(panel.queryByRole('button', { hidden: true })).toBeNull()
  })

  it('gives the multi-group axis one nested disclosure per group', () => {
    const r = render(<MobileNav navItems={navigation.mainNav} ctaButton={CTA} />)
    const panel = openAxis(r, 'What We Do')
    // Brent's three groups (CONTENT_NEEDS §12), each its own disclosure.
    for (const group of [
      'Strategy and Business Consulting',
      'Technology and Data',
      'AI and Automation',
    ]) {
      expect(panel.getByRole('button', { name: `${group} links`, hidden: true })).toBeTruthy()
    }
  })
})

// ---------------------------------------------------------------------------
// The footer grid track count is COUPLED to `footerNav.length` and nothing
// enforced it. `SiteFooter` puts the brand block on `lg:col-span-2` and each
// nav column on `lg:col-span-1`, so the row needs `2 + footerNav.length`
// tracks. NAV-1 removed the services column and left the count at 6, so the
// footer rendered five-sixths wide with a dead track — visible on every page,
// caught by hand rather than by CI. The existing e2e only asserts the column
// HEADINGS are visible, which passes just as happily with the extra track.
// ---------------------------------------------------------------------------
describe('SiteFooter grid fits its columns', () => {
  it('declares 2 + footerNav.length tracks at lg', () => {
    // Same pattern as `noBespokeBodyTemplates.int.spec.ts`: resolve from cwd.
    const source = readFileSync(
      resolve(process.cwd(), 'src/components/layout/SiteFooter.tsx'),
      'utf8',
    )
    const declared = source.match(/lg:grid-cols-(\d+)/)
    expect(declared, 'no lg:grid-cols-N on the footer grid').toBeTruthy()
    expect(Number(declared![1])).toBe(2 + navigation.footerNav.length)
  })
})
