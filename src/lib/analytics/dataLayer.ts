/**
 * Shared GTM dataLayer emitter (spec 008 US3, INTEGRATIONS.md §2.4).
 *
 * Generalizes the proven `src/lib/hubspot/submit.ts` push pattern so every
 * conversion signal flows through ONE SSR-safe emitter with ONE
 * `Window.dataLayer` global declaration (data-model §A, INV-1). Pushes are a
 * no-op under SSR (no `window`) and harmless when `NEXT_PUBLIC_GTM_ID` is unset
 * — GTM simply isn't there to consume them (INV-4). No call site should touch
 * `window.dataLayer` directly.
 *
 * The events are interaction signals only — no PII (INV-2, INTEGRATIONS.md
 * §1.2). The existing `form_submission_*` events (spec 005) are pushed through
 * this same emitter from `submit.ts`; their shapes are unchanged (INV-3).
 */

declare global {
  interface Window {
    // The single source of truth for the dataLayer global across the app.
    dataLayer?: Array<Record<string, unknown>>
  }
}

/** Any dataLayer entry is an object carrying the string `event` discriminant. */
export type DataLayerEvent = { event: string } & Record<string, unknown>

/**
 * The conversion events this feature adds (contracts/datalayer-events.md).
 * Call sites construct one of these (use `satisfies AnalyticsEvent`) so the
 * documented shapes are checked at the push site.
 */
export type AnalyticsEvent =
  | { event: 'cta_click'; ctaId: string; label: string; location: string; href?: string }
  | { event: 'case_study_view'; slug: string; title: string }
  | { event: 'booking_complete'; meetingUrl: string }

/** SSR-safe dataLayer push. No-op when `window` is undefined. */
export function pushDataLayer(event: DataLayerEvent): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push(event)
}
