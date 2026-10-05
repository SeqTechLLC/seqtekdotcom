/**
 * LinkedIn Insight Tag (INTEGRATIONS.md §3). It loads from the code, not GTM,
 * because the only container is the Wix-era one and stays off the lanes until
 * it is rebuilt.
 *
 * The partner globals are set up front, but `insight.min.js` loads only once
 * HubSpot reports advertising consent, through a second
 * `addPrivacyConsentListener` alongside the consent bridge's (HubSpot supports
 * several). The mapping is the bridge's: `consent.allowed` (notice-only) or the
 * `advertisement` category. Every call records the decision in
 * `window.__linkedInAdsConsent`, and `LinkedInPageViews` sends page views only
 * while it is true, so a later deny stops them. A loaded script can't be
 * unloaded.
 */

declare global {
  interface Window {
    lintrk?: ((action: string, data?: Record<string, unknown>) => void) & { q?: unknown[] }
    __linkedInAdsConsent?: boolean
  }
}

export const INSIGHT_SCRIPT_SRC = 'https://snap.licdn.com/li.lms-analytics/insight.min.js'

export function linkedInInsightSnippet(partnerId: string): string {
  return `
window._linkedin_partner_id = ${JSON.stringify(partnerId)};
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(window._linkedin_partner_id);
var _hsp = (window._hsp = window._hsp || []);
_hsp.push(['addPrivacyConsentListener', function(consent){
  var ads = !!(consent && (consent.allowed || (consent.categories && consent.categories.advertisement)));
  window.__linkedInAdsConsent = ads;
  if (!ads || window.lintrk) return;
  window.lintrk = function(a, b){ window.lintrk.q.push([a, b]); };
  window.lintrk.q = [];
  var s = document.createElement('script');
  s.async = true;
  s.src = ${JSON.stringify(INSIGHT_SCRIPT_SRC)};
  document.head.appendChild(s);
}]);
`.trim()
}
