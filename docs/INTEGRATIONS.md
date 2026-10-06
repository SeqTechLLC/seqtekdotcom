# Integrations

HubSpot (portal `8504846`) runs tracking, forms, chat and the cookie banner. The LinkedIn
Insight Tag loads from the code (§3), and Google Tag Manager holds the other ad pixels.
Environment variables are listed in `ARCHITECTURE.md` §6. The portal, form, container and pixel
IDs below are public: they ship in the browser bundle.

## 1. HubSpot

### 1.1 Tracking code

`HubSpotTracking.tsx` loads `https://js.hs-scripts.com/<portalId>.js` `afterInteractive`, with
the request nonce, and only when `NEXT_PUBLIC_HUBSPOT_PORTAL_ID` is set. That one script brings
analytics, the cookie banner, chat, collected-forms tracking and the ad-pixel bridge; CSP
`'strict-dynamic'` covers what it loads. The consent default (§2.2) runs before it.

### 1.2 Forms

Forms are our own components. They POST from the browser to the HubSpot Forms API,
`https://api.hsforms.com/submissions/v3/integration/submit/{portalId}/{formGuid}`, and every
submission goes through `src/lib/hubspot/submit.ts`.

| Form             | Component                                                                          | GUID                                   |
| ---------------- | ---------------------------------------------------------------------------------- | -------------------------------------- |
| Contact          | `ContactForm.tsx` on `/contact`                                                    | `8dc61ff4-9f95-46c5-b43e-8c82a394de42` |
| Workshop inquiry | `WorkshopInquiryForm.tsx`, via the `hubspot-form` block                            | `66dba2bf-f099-44d5-8c6e-f24292cefe53` |
| Any other        | the `hubspot-form` block and the `cta` block's `newsletter` and `download` actions | the form ID the editor enters          |

Field names are HubSpot property internal names:

| Form             | Fields                                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contact          | `firstname`, `lastname`, `email`, `phone`, `inquiry_type` (`new_project`, `general`, `partnership`, `careers`), `message`                            |
| Workshop inquiry | `firstname`, `lastname`, `email`, `phone` (required), `company`, `marketing_info` (the workshop type as free text; the form has no message property) |

Every form we submit to through the API needs the portal set up like this:

- **CAPTCHA off.** HubSpot rejects API submissions to a form with CAPTCHA
  (`FORM_HAS_RECAPTCHA_ENABLED`).
- **Every submitted field exists on the form.** A missing field fails with
  `PROPERTY_DOESNT_EXIST`.
- **Dropdowns take the option's internal value.**
- **`legalConsentOptions` only when the form collects consent.** Neither current form does.

`submit.ts` runs each submission like this:

- **Timeouts and retries.** The request times out after 15 s. A 5xx, network error or timeout
  gets one retry after 1 s; a 4xx is not retried. A 200 whose body says `status: "error"`
  counts as a 4xx.
- **Error copy.**
  - 4xx: "Some information looks invalid. Please check the highlighted fields and try again."
  - Everything else: "We couldn't reach our forms service right now. Please try again in a
    moment, or email contact@seqtek.com directly."
- **Events.** It pushes the `form_submission_*` events (`docs/contracts/datalayer-events.md`).
- **Half-wired mode.** Without a portal ID and a valid GUID, submit returns a stub success, so
  the whole lifecycle runs in CI, tests and local dev without reaching HubSpot.

Forms collect contact details only, with no payment or sensitive data, so a retry is safe.

### 1.3 Chat

The tracking script loads HubSpot chat. It is configured in the portal.

### 1.4 Meetings

Booking is a Google Calendar appointment page (`bookACall`, `site-content.ts`; ROADMAP BOOK-1), opened in a new
tab. `booking_complete` (§2.4) listens for HubSpot Meetings' message, which a Google booking never sends, so it does
not fire.

### 1.5 Cookie banner

The banner comes with the tracking script, and the portal configures it per hostname (§4.1).

## 2. Google Tag Manager

### 2.1 Loading

`GtmScript.tsx` renders the GTM snippet `afterInteractive`, with the request nonce, only when
`NEXT_PUBLIC_GTM_ID` is set. The container is `GTM-54KBJ2Z3`. **Both deployed lanes build with
`NEXT_PUBLIC_GTM_ID` empty (`deploy.yml`), so GTM loads on neither.** `deploy.yml`'s reason: the
container is the one the live Wix site uses.

### 2.2 Consent mode

`ConsentDefault.tsx` is an inline, nonced script that React hoists into `<head>`, so it runs
before HubSpot and GTM.

- **Defaults.** It sets the Consent Mode defaults: `analytics_storage`, `ad_storage`,
  `ad_user_data` and `ad_personalization` denied, `functionality_storage` granted, and
  `wait_for_update: 500`.
- **The bridge.** It registers HubSpot's `addPrivacyConsentListener`. When HubSpot reports
  consent, the bridge grants analytics if `consent.allowed` or `categories.analytics` is set,
  and grants the three ad signals if `consent.allowed` or `categories.advertisement` is set.
  It then fires `hubspotConsentUpdate`. HubSpot reports `consent.allowed` for notice-only
  policies, so under one of those the bridge grants everything.
- **The footer.** The "Cookie preferences" control (`ConsentPreferences.tsx`) pushes
  `showBanner` and `revokeCookieConsent`.

The contract is `docs/contracts/consent-bridge.md`. The GTM-side configuration and the
accept/deny/customize check are in `infra/gtm/README.md`.

### 2.3 Pixels

Pixels other than LinkedIn's (§3) live in GTM, not in the code, and each requires `ad_storage`.
When GTM is enabled, only the Google Ads conversion tag (`AW-810041431`) fires site-wide.

The eight Meta browser pixels are staged with no trigger:

| Market      | A                  | B                  |
| ----------- | ------------------ | ------------------ |
| Tulsa       | `4208687456061834` | `1220594586925181` |
| OKC         | `1257168352957823` | `1478518097610326` |
| NW Arkansas | `1441004027824917` | `2012483126370954` |
| Kansas City | `1186714053236201` | `884182914464592`  |

Their Wix-era per-market landing paths now 301 to `/workshops/touchstone` (`src/lib/redirects.ts`),
so a path trigger on them could never fire. The site sends no server-side Conversions API events.

### 2.4 dataLayer events

Every push goes through `pushDataLayer()` in `src/lib/analytics/dataLayer.ts`. The event
catalogue is `docs/contracts/datalayer-events.md`. Payloads carry no personal data.

## 3. LinkedIn Insight Tag

`LinkedInInsightTag.tsx` renders the tag on every page when `NEXT_PUBLIC_LINKEDIN_PARTNER_ID` is
set; both lanes build with partner `3952964`. It loads from the code because the GTM container
stays off the lanes until it is rebuilt (§2.1).

- **Consent.** The snippet registers its own `addPrivacyConsentListener` and loads
  `insight.min.js` only when HubSpot reports `consent.allowed` or the `advertisement` category,
  the same mapping as the bridge (§2.2). On a hostname with no banner policy (§4.1), HubSpot
  reports consent immediately and the tag loads with the page.
- **Deny after load.** A deny or withdrawal after the tag has loaded reloads the page. The loaded
  script can't be unloaded, and the reloaded page never loads it.
- **Page views.** The tag reports client-side navigations itself; the site calls none of its API.
- **One tag, many sites.** The partner ID is per ad account, not per domain, so the same tag can
  run on the Wix site and this one at once.

## 4. Cookie consent

### 4.1 Portal-side state

The HubSpot banner appears only on a hostname that has a published policy in the portal. The
policies are listed by hostname in `https://js.hs-banner.com/v2/8504846/banner.js`. On
2026-09-29 it held policies for:

- `blog.seqtek.com`
- `info.seqtek.com`
- `www.seqtek.com`
- the retired `seqtek-preview.com`

It had none for `preview.seqtek.com` or `ww3.seqtek.com`. So on the lanes the banner never
shows, and the footer control does nothing.

To integrate a lane (in the HubSpot portal, no code change):

1. Go to Settings → Privacy & Consent → Cookies → Add policy, and add one for the hostname
   (`preview.seqtek.com`, `ww3.seqtek.com`, and later `seqtek.com`). If the domain field only
   offers connected domains, add the host under Settings → Website → Domains & URLs first.
2. Enable "Display cookies by category", so the policy reports the `analytics`,
   `advertisement` and `functionality` categories the bridge reads.
3. Publish.
4. On the lane, check four things:
   - the banner shows on first load;
   - the footer control reopens it;
   - Accept updates Consent Mode (`hubspotConsentUpdate`);
   - Withdraw clears it and prompts again.

## 8. Content Security Policy

`src/lib/csp.ts` builds the policy, and `src/proxy.ts` applies it to every request except
static assets.

- **Scripts.** `script-src` is the request nonce plus `'strict-dynamic'`.
- **Integration hosts.** They are allowlisted in `connect-src`, `img-src`, `frame-src` and
  `form-action`; `csp.ts` is the list.
- **Styles.** Public `style-src` is `'self'`; `/admin` adds `'unsafe-inline'` for the Lexical
  editor.

### Rollout mechanism

`CSP_MODE` is `enforce`, `report-only` or `off`, and unset means `report-only`. No lane sets it,
so both lanes run report-only. Browsers send reports to `/api/csp-report`, which logs one JSON
line per report to the lane's CloudWatch log group. No metric filter or alarm reads them.

Before switching production to `enforce` (`ROADMAP.md` P3):

- **Watch the reports.** Run report-only against real traffic until no new directive has
  appeared for 3 days.
- **Resolve the one known risk.** The HubSpot banner may inject inline styles, which public
  `style-src 'self'` blocks. If the reports show `style-src` `inline` from `js.hs-banner.com`,
  add `'unsafe-inline'` to the public `style-src` in `csp.ts` and watch again.
- **Ignore the noise.** Inline styles and scripts from browser extensions, and styles from Next's
  dev-mode HMR overlay, are expected.

## 9. Redirects

The map is `src/lib/redirects.ts`, pinned by `tests/int/config/redirects.int.spec.ts`.
`permanent: true` emits a 308. After the cutover, crawl the old URLs (`ROADMAP.md` P3).
