import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  INSIGHT_SCRIPT_SRC,
  linkedInInsightSnippet,
} from '../../../src/lib/analytics/linkedInInsight'

// Runs the inline snippet the way the browser does, with a bare `_hsp` queue
// standing in for HubSpot, then invokes the consent listener it registered the
// way HubSpot does on a banner choice or on init. jsdom's `location` can't be
// stubbed, so the snippet's bare `location` is shadowed with a fake.

type Listener = (consent: unknown) => void
type Win = Window & {
  _hsp?: unknown[]
  lintrk?: unknown
  _linkedin_partner_id?: string
  _linkedin_data_partner_ids?: string[]
}

const w = window as Win
const reload = vi.fn()
const insightScripts = () =>
  Array.from(document.querySelectorAll('script')).filter((s) => s.src === INSIGHT_SCRIPT_SRC)

function runSnippet(): Listener {
  new Function('location', linkedInInsightSnippet('3952964'))({ reload })
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
    delete w._linkedin_partner_id
    delete w._linkedin_data_partner_ids
    reload.mockClear()
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

  it('neither loads nor reloads when advertising is denied up front', () => {
    runSnippet()({ allowed: false, categories: { analytics: true, advertisement: false } })
    expect(insightScripts()).toHaveLength(0)
    expect(w.lintrk).toBeUndefined()
    expect(reload).not.toHaveBeenCalled()
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

  it('clears li_adsId and reloads the page on a deny after the tag has loaded', () => {
    const listener = runSnippet()
    listener({ allowed: true })
    localStorage.setItem('li_adsId', 'abc')
    document.cookie = 'li_adsId=abc; path=/'
    expect(reload).not.toHaveBeenCalled()
    listener({ allowed: false, categories: { advertisement: false } })
    expect(localStorage.getItem('li_adsId')).toBeNull()
    expect(document.cookie).not.toContain('li_adsId')
    expect(reload).toHaveBeenCalledTimes(1)
  })
})
