/**
 * LinkedIn Insight Tag (INTEGRATIONS.md §3). It loads from the code, not GTM,
 * because the only container is the Wix-era one and stays off the lanes until
 * it is rebuilt.
 *
 * The partner globals are set up front, but `insight.min.js` loads only once
 * HubSpot reports advertising consent, through a second
 * `addPrivacyConsentListener` alongside the consent bridge's (HubSpot supports
 * several). The mapping is the bridge's: `consent.allowed` (notice-only) or the
 * `advertisement` category.
 *
 * A deny after the tag has loaded reloads the page. The loaded script can't be
 * unloaded and reports client-side navigations on its own, so a reload is the
 * only way to stop it; the reloaded page never loads it. A deny on a page where
 * it never loaded does nothing, so a returning visitor's deny can't loop.
 */

export const INSIGHT_SCRIPT_SRC = 'https://snap.licdn.com/li.lms-analytics/insight.min.js'

export function linkedInInsightSnippet(partnerId: string): string {
  return `
window._linkedin_partner_id = ${JSON.stringify(partnerId)};
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(window._linkedin_partner_id);
var _hsp = (window._hsp = window._hsp || []);
_hsp.push(['addPrivacyConsentListener', function(consent){
  var ads = !!(consent && (consent.allowed || (consent.categories && consent.categories.advertisement)));
  if (!ads) {
    if (window.lintrk) location.reload();
    return;
  }
  if (window.lintrk) return;
  window.lintrk = function(a, b){ window.lintrk.q.push([a, b]); };
  window.lintrk.q = [];
  var s = document.createElement('script');
  s.async = true;
  s.src = ${JSON.stringify(INSIGHT_SCRIPT_SRC)};
  document.head.appendChild(s);
}]);
`.trim()
}
