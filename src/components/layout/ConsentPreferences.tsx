'use client'

/**
 * Footer consent-preferences control (spec 006 US4 / contracts/consent-bridge.md C3).
 *
 * Re-opens HubSpot's own banner and offers a withdraw affordance via HubSpot's
 * official privacy command queue (`_hsp`) — no custom consent UI is built, so
 * there is a single source of truth for consent (HubSpot's banner):
 *   - "Cookie preferences" → `_hsp.push(['showBanner'])` resurfaces the banner
 *     with the visitor's current choices (research R2).
 *   - "Withdraw consent"   → `_hsp.push(['revokeCookieConsent'])` clears the
 *     HubSpot consent cookies; the next load returns to the all-denied default.
 *
 * MUST be inert when HubSpot is not loaded (`NEXT_PUBLIC_HUBSPOT_PORTAL_ID`
 * unset locally/CI, or the script not yet arrived) — the handlers no-op rather
 * than throw, so the control is always safe to render on every page. Rendered
 * inside the footer's legal `<ul>`, so it emits `<li>` items to flow with the
 * sibling legal links.
 */

type HspQueue = { push: (args: unknown[]) => void }

function pushHsp(command: string): void {
  if (typeof window === 'undefined') return
  const hsp = (window as unknown as { _hsp?: HspQueue })._hsp
  // `_hsp` is an array before HubSpot loads and an object after; both expose
  // `.push`. Guard so an unset/never-loaded HubSpot is a no-op, not a throw.
  if (hsp && typeof hsp.push === 'function') {
    hsp.push([command])
  }
}

const itemClass = 'text-text-inverse opacity-70 transition-opacity duration-fast hover:opacity-100'

export function ConsentPreferences() {
  return (
    <>
      <li>
        <button
          type="button"
          data-testid="consent-preferences"
          className={itemClass}
          onClick={() => pushHsp('showBanner')}
        >
          Cookie preferences
        </button>
      </li>
      <li>
        <button
          type="button"
          data-testid="consent-withdraw"
          className={itemClass}
          onClick={() => pushHsp('revokeCookieConsent')}
        >
          Withdraw consent
        </button>
      </li>
    </>
  )
}
