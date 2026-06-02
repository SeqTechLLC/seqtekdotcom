import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { isHubspotLive, submitHubspotForm } from '../../../src/lib/hubspot/submit'

const LIVE_GUID = '12345678-1234-1234-1234-1234567890ab'

function response(status: number, body: unknown = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response
}

describe('submitHubspotForm (INTEGRATIONS.md §1.2 state machine)', () => {
  beforeEach(() => {
    // jsdom provides window/document; reset the dataLayer between cases.
    window.dataLayer = []
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('half-wired (no portal id) → stub success, no network call, full event pair', async () => {
    vi.stubEnv('NEXT_PUBLIC_HUBSPOT_PORTAL_ID', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await submitHubspotForm({
      formId: LIVE_GUID,
      fields: [{ name: 'email', value: 'a@b.co' }],
    })

    expect(result).toEqual({ status: 'success', stub: true })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(window.dataLayer).toEqual([
      { event: 'form_submission_attempt', formId: LIVE_GUID },
      { event: 'form_submission_success', formId: LIVE_GUID },
    ])
  })

  describe('live target configured', () => {
    beforeEach(() => {
      vi.stubEnv('NEXT_PUBLIC_HUBSPOT_PORTAL_ID', '8504846')
    })

    it('isHubspotLive is true only for a real GUID', () => {
      expect(isHubspotLive(LIVE_GUID)).toBe(true)
      expect(isHubspotLive('TBD')).toBe(false)
      expect(isHubspotLive('')).toBe(false)
    })

    it('200 → success with a single network call', async () => {
      const fetchMock = vi.fn(async () => response(200))
      vi.stubGlobal('fetch', fetchMock)

      const result = await submitHubspotForm({ formId: LIVE_GUID, fields: [] })

      expect(result).toEqual({ status: 'success', stub: false })
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(window.dataLayer?.at(-1)).toEqual({
        event: 'form_submission_success',
        formId: LIVE_GUID,
      })
    })

    it('4xx → no retry, failure event', async () => {
      const fetchMock = vi.fn(async () => response(400))
      vi.stubGlobal('fetch', fetchMock)

      const result = await submitHubspotForm({ formId: LIVE_GUID, fields: [] })

      expect(result.status).toBe('error')
      if (result.status === 'error') expect(result.errorClass).toBe('4xx')
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('5xx → one retry then failure', async () => {
      const fetchMock = vi.fn(async () => response(503))
      vi.stubGlobal('fetch', fetchMock)

      const result = await submitHubspotForm({ formId: LIVE_GUID, fields: [] })

      expect(result.status).toBe('error')
      if (result.status === 'error') expect(result.errorClass).toBe('5xx')
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(window.dataLayer?.at(-1)).toEqual({
        event: 'form_submission_failure',
        formId: LIVE_GUID,
        errorClass: '5xx',
      })
    })
  })
})
