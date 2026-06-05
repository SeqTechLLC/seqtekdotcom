// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// `src/lib/payload.ts` opens with `import 'server-only'` (throws outside the
// react-server condition). Mock it so we can import the wrapper.
vi.mock('server-only', () => ({}))

import { PayloadReadTimeoutError, READ_TIMEOUT_MS, withReadTimeout } from '../../../src/lib/payload'

/**
 * spec 007 US3 — the telemetry contract (contracts/read-timeout-telemetry.md
 * C-1/C-2). Deterministically asserts the warn-log record shape + the timeout
 * mechanics without the flakiness of capturing a separate dev-server's stdout.
 *
 * Note on `requestId`: this suite runs under Vitest's shared module cache
 * (`isolate: false` in vitest.config.mts), and `payload.ts`'s `headers` binding
 * is fixed when another int file imports it first — so `headers()` here is the
 * real one, which throws outside a request scope. The wrapper's defensive
 * `catch` therefore yields `requestId: 'unknown'` (itself a real C-1 behavior:
 * the ISR/non-request scope path, e.g. `sitemap.ts`). The LIVE
 * `headers().get('x-request-id')` correlation is proven end-to-end by
 * `tests/e2e/slow-request.e2e.spec.ts` (the dev server emits the real per-
 * request UUID in the `payload_read_timeout` log).
 */
describe('withReadTimeout (read-timeout layer)', () => {
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('resolves a fast read with its value and emits no log (FR-013 no-op)', async () => {
    const read = withReadTimeout('getThing', async (slug: string) => `value:${slug}`)
    await expect(read('acme')).resolves.toBe('value:acme')
    expect(warn).not.toHaveBeenCalled()
  })

  it('re-throws a fast non-timeout error unchanged and emits no log', async () => {
    const boom = new Error('db connection refused')
    const read = withReadTimeout('getThing', async () => {
      throw boom
    })
    await expect(read()).rejects.toBe(boom)
    expect(warn).not.toHaveBeenCalled()
  })

  it('throws PayloadReadTimeoutError + one warn log of the correct shape past the 5s budget', async () => {
    vi.useFakeTimers()
    // A read that never settles — only the 5s timer can win the race. Attach
    // the rejection handler BEFORE advancing the clock so it is never
    // momentarily unhandled.
    const read = withReadTimeout(
      'getCaseStudyBySlug',
      (_slug: string) => new Promise<string>(() => {}),
    )
    const settled = read('acme-turnaround').catch((e: unknown) => e)

    await vi.advanceTimersByTimeAsync(READ_TIMEOUT_MS + 10)

    expect(await settled).toBeInstanceOf(PayloadReadTimeoutError)
    expect(warn).toHaveBeenCalledTimes(1)

    const record = JSON.parse((warn.mock.calls[0] as [string])[0])
    expect(record).toMatchObject({
      type: 'payload_read_timeout',
      reader: 'getCaseStudyBySlug',
      args: 'acme-turnaround',
    })
    expect(typeof record.ts).toBe('string')
    // requestId is always present and a string; here it resolves to the
    // defensive 'unknown' fallback (real headers() throws outside a request
    // scope — the ISR-scope path). The live request-bound value is proven E2E.
    expect(typeof record.requestId).toBe('string')
    expect(record.requestId).toBe('unknown')
  })

  it('omits args for a no-arg reader (e.g. a global)', async () => {
    vi.useFakeTimers()
    const read = withReadTimeout('getHomepage', () => new Promise<string>(() => {}))
    const settled = read().catch((e: unknown) => e)
    await vi.advanceTimersByTimeAsync(READ_TIMEOUT_MS + 10)

    expect(await settled).toBeInstanceOf(PayloadReadTimeoutError)
    const record = JSON.parse((warn.mock.calls[0] as [string])[0])
    expect(record.reader).toBe('getHomepage')
    expect(record.args).toBeUndefined()
  })
})
