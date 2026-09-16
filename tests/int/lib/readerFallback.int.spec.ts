// @vitest-environment node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// `src/lib/payload.ts` opens with `import 'server-only'` (throws outside the
// react-server condition). Mock it so the wrapper can be imported.
vi.mock('server-only', () => ({}))

import { PayloadReadTimeoutError, READ_TIMEOUT_MS, withReadTimeout } from '../../../src/lib/payload'
import { navigation } from '../../../src/lib/site-content'

/**
 * ADR 0010 amendment / contracts/read-timeout-telemetry.md (amendment
 * 2026-09-16) — `getNavigation` is the one cached reader that must never throw.
 *
 * WHY THIS FILE EXISTS. `SiteHeader` awaits the menu and renders in
 * `(frontend)/layout.tsx`, and Next's `error.js` "does not wrap the `layout.js`
 * … above it in the same segment" — so a throw here skips the branded
 * `error.tsx` and takes EVERY public route to `global-error.tsx`. The fallback
 * therefore has to cover both ways the read can fail.
 *
 * THE BUG THIS PINS, stated plainly because it shipped once in this PR and was
 * caught in review rather than by a test: the first fix put the `try/catch`
 * INSIDE the function `withReadTimeout` wraps. An inner catch sees only what the
 * inner read rejects with. The 5s budget rejection is raised by `Promise.race`
 * in the wrapper itself and rethrown from the wrapper's own catch, so it sails
 * straight past an inner handler. Result: DB-error handled, DB-STALL still
 * fatal — while three comments and two docs claimed it was closed.
 *
 * WHAT THIS PROVES AND WHAT IT DOES NOT. `getNavigation` cannot be invoked here
 * (it reaches `getPayloadInstance` and `unstable_cache`, neither of which works
 * outside the Next server), so this file does two things instead: it exercises
 * the real `withReadTimeout` against both failure modes to prove the OUTSIDE
 * placement actually catches them, and it asserts structurally that
 * `src/lib/payload.ts` uses that placement. The second half is the one that
 * would have caught the original mistake.
 */

const FALLBACK = navigation.mainNav

/** The shape `getNavigation` uses: the catch wraps the WRAPPED reader. */
const withFallback =
  <T>(read: () => Promise<T>, fallback: T) =>
  async (): Promise<T> => {
    try {
      return await read()
    } catch {
      return fallback
    }
  }

describe('the nav reader fallback covers BOTH failure modes', () => {
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('falls back when the inner read REJECTS (a DB error)', async () => {
    const read = withReadTimeout('getNavigation', async (): Promise<typeof FALLBACK> => {
      throw new Error('db connection refused')
    })
    await expect(withFallback(read, FALLBACK)()).resolves.toBe(FALLBACK)
  })

  // The half the first fix missed. A catch placed inside the wrapped function
  // passes this test's sibling above and still fails this one.
  it('falls back when the read EXCEEDS THE BUDGET (a DB stall)', async () => {
    vi.useFakeTimers()
    const read = withReadTimeout(
      'getNavigation',
      () => new Promise<typeof FALLBACK>(() => {}), // never settles
    )
    const settled = withFallback(read, FALLBACK)()

    await vi.advanceTimersByTimeAsync(READ_TIMEOUT_MS + 10)

    await expect(settled).resolves.toBe(FALLBACK)
  })

  it('still emits the C-2 warn log on the stall — telemetry is not swallowed', async () => {
    vi.useFakeTimers()
    const read = withReadTimeout('getNavigation', () => new Promise<typeof FALLBACK>(() => {}))
    const settled = withFallback(read, FALLBACK)()
    await vi.advanceTimersByTimeAsync(READ_TIMEOUT_MS + 10)
    await settled

    expect(warn).toHaveBeenCalledTimes(1)
    const record = JSON.parse((warn.mock.calls[0] as [string])[0])
    expect(record).toMatchObject({ type: 'payload_read_timeout', reader: 'getNavigation' })
  })

  it('a catch INSIDE the wrapper would not have caught the stall (the original bug)', async () => {
    vi.useFakeTimers()
    // The broken shape, reproduced: the fallback is applied to the inner
    // function, and `withReadTimeout` wraps the already-guarded read.
    const broken = withReadTimeout(
      'getNavigation',
      withFallback(() => new Promise<typeof FALLBACK>(() => {}), FALLBACK),
    )
    const settled = broken().catch((e: unknown) => e)
    await vi.advanceTimersByTimeAsync(READ_TIMEOUT_MS + 10)

    // Escapes as a rejection — which in production is every route on the site
    // rendering `global-error.tsx`.
    expect(await settled).toBeInstanceOf(PayloadReadTimeoutError)
  })
})

describe('src/lib/payload.ts keeps the catch OUTSIDE the timeout wrapper', () => {
  // Source-level on purpose, the same way `payload-cache-tags.int.spec.ts`
  // asserts `overrideAccess: false`: the defect is a code SHAPE, and the
  // function cannot be called in this environment.
  const src = readFileSync(resolve(process.cwd(), 'src/lib/payload.ts'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')

  it('wraps the raw read under a separate, non-exported binding', () => {
    expect(src).toMatch(/const readNavigation = withReadTimeout\(/)
  })

  it('exports getNavigation as a plain async function, not a wrapped reader', () => {
    expect(src).toMatch(/export const getNavigation = async \(\)/)
    // The regression shape: the wrapper applied directly to the export, which
    // puts any internal catch inside the race.
    expect(src).not.toMatch(/export const getNavigation = withReadTimeout\(/)
  })

  it('falls back to the code-owned menu in its catch', () => {
    const body = src.slice(src.indexOf('export const getNavigation'))
    expect(body).toMatch(/catch\s*\{[\s\S]*?return navigation\.mainNav/)
  })
})
