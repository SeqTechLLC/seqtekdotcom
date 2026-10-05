import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LinkedInPageViews } from '../../../src/components/integrations/LinkedInPageViews'
import {
  INSIGHT_SCRIPT_SRC,
  linkedInInsightSnippet,
} from '../../../src/lib/analytics/linkedInInsight'

const nav = vi.hoisted(() => ({ pathname: '/' }))
vi.mock('next/navigation', () => ({ usePathname: () => nav.pathname }))

// Runs the inline snippet the way the browser does, with a bare `_hsp` queue
// standing in for HubSpot, then invokes the consent listener it registered the
// way HubSpot does on a banner choice or on init.

type Listener = (consent: unknown) => void
type Win = Window & {
  _hsp?: unknown[]
  _linkedin_partner_id?: string
  _linkedin_data_partner_ids?: string[]
}

const w = window as Win
const insightScripts = () =>
  Array.from(document.querySelectorAll('script')).filter((s) => s.src === INSIGHT_SCRIPT_SRC)

function runSnippet(): Listener {
  new Function(linkedInInsightSnippet('3952964'))()
  const entry = (w._hsp ?? []).find(
    (e) => Array.isArray(e) && e[0] === 'addPrivacyConsentListener',
  ) as [string, Listener] | undefined
  if (!entry) throw new Error('snippet registered no consent listener')
  return entry[1]
}

describe('linkedInInsightSnippet', () => {
  beforeEach(() => {
    w._hsp = []
    delete w.lintrk
    delete w.__linkedInAdsConsent
    delete w._linkedin_partner_id
    delete w._linkedin_data_partner_ids
  })

  afterEach(() => {
    insightScripts().forEach((s) => s.remove())
  })

  it('sets the partner globals without loading the tag', () => {
    runSnippet()
    expect(w._linkedin_partner_id).toBe('3952964')
    expect(w._linkedin_data_partner_ids).toEqual(['3952964'])
    expect(insightScripts()).toHaveLength(0)
    expect(w.lintrk).toBeUndefined()
  })

  it('does not load when advertising is denied', () => {
    runSnippet()({ allowed: false, categories: { analytics: true, advertisement: false } })
    expect(insightScripts()).toHaveLength(0)
    expect(w.lintrk).toBeUndefined()
  })

  it('loads once on the advertisement category', () => {
    const listener = runSnippet()
    listener({ allowed: false, categories: { advertisement: true } })
    listener({ allowed: false, categories: { advertisement: true } })
    expect(insightScripts()).toHaveLength(1)
    expect(typeof w.lintrk).toBe('function')
  })

  it('loads under notice-only, where HubSpot reports consent.allowed', () => {
    runSnippet()({ allowed: true })
    expect(insightScripts()).toHaveLength(1)
  })

  it('records a later deny so page views stop', () => {
    const listener = runSnippet()
    listener({ allowed: true })
    expect(w.__linkedInAdsConsent).toBe(true)
    listener({ allowed: false, categories: { advertisement: false } })
    expect(w.__linkedInAdsConsent).toBe(false)
  })
})

describe('LinkedInPageViews', () => {
  afterEach(() => {
    delete w.lintrk
    delete w.__linkedInAdsConsent
  })

  it('tracks client-side navigations only while advertising consent holds', () => {
    const track = vi.fn()
    w.lintrk = track
    w.__linkedInAdsConsent = true
    nav.pathname = '/'
    const view = render(<LinkedInPageViews />)
    expect(track).not.toHaveBeenCalled()

    nav.pathname = '/services'
    view.rerender(<LinkedInPageViews />)
    expect(track).toHaveBeenCalledTimes(1)

    w.__linkedInAdsConsent = false
    nav.pathname = '/contact'
    view.rerender(<LinkedInPageViews />)
    expect(track).toHaveBeenCalledTimes(1)
  })
})
