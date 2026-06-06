/**
 * HubSpot Forms API submission engine (spec 005, INTEGRATIONS.md §1.2).
 *
 * Shared by every custom form on the site. Runs the documented submission
 * state machine, classifies failures, and pushes GTM dataLayer events.
 *
 * HALF-WIRED (v1): the live POST to api.hsforms.com only fires when BOTH the
 * portal ID and a real form GUID are configured. Until the HubSpot admin
 * returns the GUIDs (INTEGRATIONS.md §1.2 provisioning checklist), submit
 * short-circuits to a stub success so the full client-side lifecycle —
 * validation, submitting state, success view, dataLayer events — is exercisable
 * end-to-end without hitting HubSpot. Drop a GUID into the env var to go live.
 *
 * NOTE (go-live): `api.hsforms.com` is already allowed in CSP `connect-src`
 * (src/lib/csp.ts — `*.hsforms.com`, spec 005), so going live needs no CSP change.
 */

import { pushDataLayer } from '@/lib/analytics/dataLayer'

const SUBMIT_TIMEOUT_MS = 15_000
const RETRY_BACKOFF_MS = 1_000
const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type HubspotErrorClass = '4xx' | '5xx' | 'network' | 'timeout'

export interface HubspotField {
  name: string
  value: string
}

export type HubspotSubmitResult =
  | { status: 'success'; stub: boolean }
  | {
      status: 'error'
      errorClass: HubspotErrorClass
      message: string
      fieldErrors?: Record<string, string>
    }

const TRANSIENT_COPY =
  "We couldn't reach our forms service right now. Please try again in a moment, or email contact@seqtek.com directly."

const ERROR_COPY: Record<HubspotErrorClass, string> = {
  '4xx': 'Some information looks invalid. Please check the highlighted fields and try again.',
  '5xx': TRANSIENT_COPY,
  network: TRANSIENT_COPY,
  timeout: TRANSIENT_COPY,
}

const RETRYABLE: ReadonlySet<HubspotErrorClass> = new Set(['5xx', 'network', 'timeout'])

/** True only when a live submit can actually reach HubSpot. */
export function isHubspotLive(formId: string | undefined | null): boolean {
  return Boolean(process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID && formId && GUID_RE.test(formId))
}

// Form events ride the shared SSR-safe emitter (src/lib/analytics/dataLayer.ts)
// — one push path, one `Window.dataLayer` declaration. Shapes are unchanged
// from spec 005 (INV-3): existing GTM triggers depend on them.
type FormSubmissionEvent =
  | { event: 'form_submission_attempt'; formId: string }
  | { event: 'form_submission_success'; formId: string }
  | { event: 'form_submission_failure'; formId: string; errorClass: HubspotErrorClass }

/** Read the HubSpot visitor cookie so the submit links to the tracked session. */
function readHutk(): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]+)/)
  return match?.[1]
}

interface SubmitArgs {
  formId: string
  fields: HubspotField[]
  /** Exact consent text + subscription type, when the form collects consent. */
  legalConsentOptions?: Record<string, unknown>
}

async function postOnce(args: SubmitArgs): Promise<HubspotSubmitResult> {
  const portalId = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS)
  try {
    const res = await fetch(
      `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${args.formId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: args.fields,
          context: {
            hutk: readHutk(),
            pageUri: typeof window !== 'undefined' ? window.location.href : undefined,
            pageName: typeof document !== 'undefined' ? document.title : undefined,
          },
          ...(args.legalConsentOptions ? { legalConsentOptions: args.legalConsentOptions } : {}),
        }),
        signal: controller.signal,
      },
    )

    if (res.ok) {
      // HubSpot can return 200 with a validation-error body.
      const body = (await res.json().catch(() => ({}))) as { status?: string }
      if (body.status === 'error') {
        return { status: 'error', errorClass: '4xx', message: ERROR_COPY['4xx'] }
      }
      return { status: 'success', stub: false }
    }

    const errorClass: HubspotErrorClass = res.status >= 500 ? '5xx' : '4xx'
    return { status: 'error', errorClass, message: ERROR_COPY[errorClass] }
  } catch (err) {
    const errorClass: HubspotErrorClass =
      err instanceof DOMException && err.name === 'AbortError' ? 'timeout' : 'network'
    return { status: 'error', errorClass, message: ERROR_COPY[errorClass] }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Submit a form to HubSpot, running the full §1.2 state machine: one retry on
 * transient (5xx/network/timeout) failures after a 1s backoff, no retry on 4xx.
 * Pushes attempt/success/failure dataLayer events around the lifecycle.
 */
export async function submitHubspotForm(args: SubmitArgs): Promise<HubspotSubmitResult> {
  pushDataLayer({
    event: 'form_submission_attempt',
    formId: args.formId,
  } satisfies FormSubmissionEvent)

  // HALF-WIRED: no live target yet → exercise the lifecycle, skip the network.
  if (!isHubspotLive(args.formId)) {
    pushDataLayer({
      event: 'form_submission_success',
      formId: args.formId,
    } satisfies FormSubmissionEvent)
    return { status: 'success', stub: true }
  }

  let result = await postOnce(args)

  // Worst case on a timeout path is bounded but slow: 15s abort + 1s backoff +
  // 15s abort ≈ 31s before the error view shows. Accepted per the §1.2 state
  // machine (single retry on transient failures); the button stays in its
  // submitting state throughout.
  if (result.status === 'error' && RETRYABLE.has(result.errorClass)) {
    await new Promise((resolve) => setTimeout(resolve, RETRY_BACKOFF_MS))
    result = await postOnce(args)
  }

  if (result.status === 'success') {
    pushDataLayer({
      event: 'form_submission_success',
      formId: args.formId,
    } satisfies FormSubmissionEvent)
  } else {
    pushDataLayer({
      event: 'form_submission_failure',
      formId: args.formId,
      errorClass: result.errorClass,
    } satisfies FormSubmissionEvent)
  }

  return result
}
