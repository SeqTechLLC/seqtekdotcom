# SEQTEK Website — Integration Specifications

**Date:** May 2026
**Status:** Reference — Phase 1 implementation

---

## 1. HubSpot Integration

**Portal ID:** 8504846
**Role:** CRM, marketing automation, forms, live chat, analytics, cookie consent, ad pixel orchestration

### 1.1 Tracking Code

The HubSpot tracking script loads on every page via the root `layout.tsx`.

**Script:** `//js.hs-scripts.com/8504846.js`

**Loading strategy:** Next.js `<Script>` component with `strategy="afterInteractive"`. Never render-blocking. This single script includes:

- HubSpot analytics
- Cookie consent banner
- Chat widget (HubSpot Messages)
- Collected forms tracking
- Web interactives
- Ad pixel bridge (`hsadspixel`)

**Implementation:**

```
Root Layout (layout.tsx)
  └── <Script src="//js.hs-scripts.com/8504846.js" strategy="afterInteractive" />
```

No additional HubSpot scripts need to be loaded individually — the main tracking script bootstraps everything else based on portal configuration.

**Ordering note:** The HubSpot tracking script and GTM both load with `afterInteractive`, so their exact load order is not deterministic. The GTM consent default state (`gtag('consent', 'default', { ... denied })`) must therefore be initialized via an inline `<head>` script _before_ either third-party loads. See §2.2 for the snippet.

### 1.2 Forms

**Recommended approach: Custom React forms with HubSpot Forms API submission.**

SEQTEK's forms must look native to the site design, not like HubSpot iframe embeds. Build custom form components styled with Tailwind, submit directly to the HubSpot Forms API.

**API endpoint:** `https://api.hsforms.com/submissions/v3/integration/submit/{portalId}/{formGuid}`

- Portal ID and Form GUID are not secrets (visible in any HubSpot embed code)
- The API is CORS-enabled for browser submissions
- No server-side proxy needed
- Form GUID is configured per form in HubSpot, referenced as a constant or env var
- **Forms with HubSpot CAPTCHA / SPAM-prevention enabled reject API submissions** (`FORM_HAS_RECAPTCHA_ENABLED`). Keep CAPTCHA off on any form we submit here and protect against spam on our own page. See the provisioning checklist below.

**Forms to build:**

| Form             | Location                | Fields                                                                | HubSpot Form GUID                      |
| ---------------- | ----------------------- | --------------------------------------------------------------------- | -------------------------------------- |
| Contact          | `/contact`              | First name, last name, email, phone, inquiry type (dropdown), message | TBD — create in HubSpot                |
| Book a Call      | `/contact/book-a-call`  | HubSpot Meetings embed (see 1.4)                                      | N/A (Meetings widget)                  |
| Workshop Inquiry | `/touchstone-workshops` | First/last name, email, phone, company, workshop type (free text)     | `66dba2bf-f099-44d5-8c6e-f24292cefe53` |

#### Provisioning checklist (request from the HubSpot portal admin)

Every live form is blocked on HubSpot-side setup. For each form we submit via the API, the portal admin must create the form, apply two settings, and return five values. Portal ID is already known (**8504846**).

**Values to obtain (per form):**

1. **Form GUID** — the `formId` in the form's Share / Embed code (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`). Fills the `TBD` cells above; stored per form as a constant / env var.
2. **Field internal names** — the property internal name of every field on the form (e.g. `firstname`, `lastname`, `email`, `company`, `message`), _not_ the display label. The `fields[].name` we POST must match these exactly, and each field must exist on the form, or the submit 400s with `PROPERTY_DOESNT_EXIST`.
3. **Dropdown option values** — for enumeration fields (e.g. Contact "inquiry type"), the internal **value** of each option (not the label). We submit the value. (The Workshop form's "workshop type" is a free-text property, not a dropdown — see the provisioned block below.)
4. **Subscription type ID(s)** — only if the form collects a marketing opt-in (see consent below); needed for `legalConsentOptions.consent.communications[].subscriptionTypeId`.
5. **Portal / Hub ID confirmation** — confirm **8504846**.

**Settings the admin must apply:**

- **Disable CAPTCHA / SPAM prevention on every API-submitted form.** A form with HubSpot reCAPTCHA enabled rejects all API submissions with `FORM_HAS_RECAPTCHA_ENABLED` ("Form '…' can't receive API submissions as Captcha (SPAM prevention) is enabled"). Spam protection lives on our page (honeypot / Cloudflare Turnstile), not in HubSpot, for the API path.
- **GDPR / consent decision.** If the form needs consent-to-process and/or a marketing opt-in, the admin supplies the exact consent text + subscription type ID(s); we echo them back in `legalConsentOptions` or the submit fails validation. If the portal isn't running GDPR consent on this form, confirm so we omit `legalConsentOptions`.
- **Domain allowlist (if any).** We submit from `seqtek-preview.com` (staging) and `seqtek.com` (launch). Confirm no form-level domain restriction blocks these.
- **On-submit automation** (admin-owned, FYI only): internal notification, owner / routing, list membership, lifecycle stage, autoresponder, workflows. These fire automatically server-side on a successful submit; no code trigger needed.

**Submit payload reference** (what each requested value maps to):

```http
POST https://api.hsforms.com/submissions/v3/integration/submit/8504846/{FORM_GUID}
Content-Type: application/json

{
  "fields": [
    { "name": "<field internal name>", "value": "<user input | dropdown option value>" }
  ],
  "context": {
    "hutk": "<hubspotutk cookie — set by the §1.1 tracking script; links the submit to the visitor>",
    "pageUri": "https://seqtek.com/touchstone-workshops/…",
    "pageName": "<document title>"
  },
  "legalConsentOptions": {
    "consent": {
      "consentToProcess": true,
      "text": "<exact processing-consent text from the admin>",
      "communications": [
        { "value": true, "subscriptionTypeId": "<id from the admin>", "text": "<opt-in text>" }
      ]
    }
  }
}
```

- `legalConsentOptions` is included only when the form collects consent (item 4 / the consent decision above).
- Success returns `{ inlineMessage }` (or `{ redirectUrl }`); validation failures return `status: "error"` with an `errors[]` array — drive the §1.2 failure-handling state machine off that.
- `Book a Call` is a Meetings embed (§1.4), not an API form — no GUID. Newsletter was dropped (2026-06-02): no newsletter program, and the old site had none (see spec 005).

> **Open content dependency (not the HubSpot admin's task):** the Workshop landing's lead-magnet asset (the gated download behind `DownloadCard`) is a content-lead decision, tracked separately. The form can ship without it; the download just has nothing to deliver until that asset lands.

_Verified against the HubSpot Forms API docs + the documented `FORM_HAS_RECAPTCHA_ENABLED` limitation (2026-06)._

#### Workshop Inquiry — provisioned (confirmed with HubSpot admin, 2026-06-02)

First form off the checklist. Values confirmed by Chad Coleman (portal admin):

- **Form GUID:** `66dba2bf-f099-44d5-8c6e-f24292cefe53` (env `NEXT_PUBLIC_HUBSPOT_WORKSHOP_FORM_ID`)
- **Portal / Hub ID:** `8504846` — confirmed
- **Region:** `na1` (from the embed `data-region`)
- **CAPTCHA / SPAM prevention:** off (never enabled) — API submissions accepted
- **Consent / GDPR:** none on this form — omit `legalConsentOptions` from the payload
- **Domain allowlist:** none to clear — the Forms API submit endpoint is open / CORS-enabled (see above), no per-form domain restriction for `seqtek-preview.com` or `seqtek.com`

**Field internal names** (the `fields[].name` we POST):

| Page field    | Internal name    | Required | Notes                                                                    |
| ------------- | ---------------- | -------- | ------------------------------------------------------------------------ |
| First name    | `firstname`      | Yes      |                                                                          |
| Last name     | `lastname`       | Yes      |                                                                          |
| Email         | `email`          | Yes      |                                                                          |
| Phone         | `phone`          | Yes      | Required on the form — the page must collect it and submit it every time |
| Company       | `company`        | No       | Added at our request                                                     |
| Workshop type | `marketing_info` | No       | **Free-text property, not a dropdown** — see note                        |

- **`marketing_info` is a plain text input, not an enumeration.** The admin keeps it as a reusable text property, so HubSpot does no option-value validation. The workshop-interest choices (Touchstone, Five Dysfunctions, etc.) are a page-side decision: render the dropdown on our page and POST the selected string into `marketing_info`. There are no HubSpot-side option values to match.
- **Message field dropped.** The admin removed it; there is no HubSpot property to receive a free-text message on this form, so the page omits it (deviation from the field list in the table above). If we want message capture later, the admin must add a property and return its internal name.

**Form submission flow:**

1. User fills out custom React form (client-side validation with Zod or native)
2. On submit, POST to HubSpot Forms API
3. HubSpot creates/updates a contact and triggers any configured workflows
4. Show success message in the UI
5. Optional: fire GTM event for conversion tracking

**Fallback:** If a form needs features only available in HubSpot's embed (conditional logic, progressive profiling), use HubSpot's embed code as an iframe. Acceptable for lower-priority forms where design control matters less.

#### Failure handling

Every form on the site goes through the same submission state machine and error model. No silent drops.

**Client-side validation:** Zod schemas per form (or React Hook Form with the Zod resolver). All fields validate before submit fires; the submit button stays disabled until the schema passes. Field-level errors render inline as the user types or on blur.

**Submission state machine:** `idle → submitting → (success | error)`.

- `submitting`: submit button disabled, spinner visible, fields locked.
- `success`: form replaced with a confirmation block (clear next-step copy, no residual form UI).
- `error`: form values preserved, inline error message rendered above the submit button with a retry button. The user never has to re-enter what they typed.

**Error classes and copy:**

| Class                 | Trigger                                        | Auto-retry               | User-facing copy                                                                                                                                                                          |
| --------------------- | ---------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `4xx`                 | HubSpot Forms API returns 400/422 (validation) | No — a 4xx will repeat   | "Some information looks invalid. Please check the highlighted fields and try again." Server-returned field errors are mapped to inline field-level errors when the payload includes them. |
| `5xx`                 | HubSpot Forms API returns 500–599              | Single retry, 1s backoff | "We couldn't reach our forms service right now. Please try again in a moment, or email contact@seqtek.com directly." A `mailto:contact@seqtek.com` link renders as a fallback action.     |
| `network` / `timeout` | Fetch reject, or no response within 15s        | Same path as `5xx`       | Same copy as 5xx.                                                                                                                                                                         |

**GTM dataLayer events** pushed from the submission lifecycle:

| Event                     | Payload                                                            | When                                                 |
| ------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------- |
| `form_submission_attempt` | `{ formId }`                                                       | On submit fire, before the network call              |
| `form_submission_success` | `{ formId }`                                                       | On 200 response from HubSpot                         |
| `form_submission_failure` | `{ formId, errorClass: '4xx' \| '5xx' \| 'network' \| 'timeout' }` | On any terminal failure (after retry, if applicable) |

**Data handling:** No payment or sensitive data is collected by any form on this site. The contact and workshop-inquiry forms capture name, email, company, and message only — no SSN, no payment, no health data. This constrains the failure surface meaningfully: a failed submission can be safely retried client-side without secondary-storage concerns.

### 1.3 Chat Widget

The HubSpot Messages chat widget loads automatically with the tracking script. Fully configured in the HubSpot portal — no custom code needed.

Configuration in HubSpot:

- Target pages (show on all or specific pages)
- Availability hours
- Chatflows (bot or live agent)
- Appearance (colors — should match site brand)

The widget respects cookie consent — it won't activate until the user accepts the necessary cookie category.

### 1.4 HubSpot Meetings (Calendar Booking)

For the `/contact/book-a-call` page:

**Option A: HubSpot Meetings embed** — Drop the meetings embed code into the page. Renders as an iframe with calendar availability and booking flow. This is the standard approach and works well.

**Option B: HubSpot Meetings link** — A direct link to the HubSpot Meetings page (opens in new tab or same tab). Simpler but takes users off-site.

**Recommendation:** Option A (embed) on the dedicated booking page. Option B (link) for CTAs elsewhere on the site that say "Book a Strategy Call."

### 1.5 Cookie Consent Banner

HubSpot provides a cookie consent banner as part of the tracking script (`//js.hs-banner.com/v2/8504846/banner.js`, loaded automatically by the main tracking script).

**Configuration in HubSpot portal (Privacy & Consent settings):**

- Cookie categorization: Necessary, Analytics, Advertising, Functionality
- Consent collection: Opt-in (GDPR-style) or notice-only (depends on legal requirements)
- Banner appearance: Customizable colors and text — should match site brand
- Geographic targeting: Can show different banners by region

**Critical behavior:** The consent banner controls what other scripts can fire. Analytics cookies (HubSpot analytics) and advertising cookies (Meta Pixels, LinkedIn Insight Tag) must only activate after consent is granted. This is managed through the GTM consent mode integration (see Section 2).

---

## 2. Google Tag Manager (GTM)

**Container ID:** TBD (use existing or create new)
**Role:** Container for all tracking pixels. Single point of management for Meta Pixels, LinkedIn Insight Tag, and any future tracking scripts.

### 2.1 GTM Loading

Use `@next/third-parties` package for optimized GTM loading in Next.js:

```
Root Layout (layout.tsx)
  └── <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
```

This loads GTM with Next.js-optimized performance (deferred, non-blocking).

### 2.2 Consent Mode Integration

GTM must integrate with HubSpot's cookie consent banner to conditionally fire pixels.

**Flow:**

```
1. Page loads
2. GTM loads with default consent state: DENIED for all categories
3. HubSpot tracking script loads (includes cookie banner)
4. User sees cookie banner
5. User interacts (accept all / customize / deny)
6. HubSpot fires consent update event
7. GTM listens for consent update via HubSpot-GTM bridge
8. GTM updates consent state (analytics: granted, ad_storage: granted, etc.)
9. Tags configured with consent requirements begin firing
```

**GTM Consent Mode defaults:**

- `analytics_storage`: denied
- `ad_storage`: denied
- `ad_user_data`: denied
- `ad_personalization`: denied
- `functionality_storage`: granted (necessary cookies)

**Consent default initialization** (inline `<head>` script with the request nonce — runs before any third-party script):

```html
<script nonce="{REQUEST_NONCE}">
  window.dataLayer = window.dataLayer || []
  function gtag() {
    dataLayer.push(arguments)
  }
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'granted',
    wait_for_update: 500,
  })
</script>
```

Setting the defaults inline (rather than relying solely on GTM-container-side defaults) ensures `window.dataLayer` already reflects "all denied" by the time GTM or HubSpot arrive — neither's load order is deterministic under `afterInteractive`. The `wait_for_update: 500` window gives HubSpot's banner time to read its prior-consent cookie on returning visits and fire `__hs_opt_in_consent` before any tag evaluates consent.

**HubSpot–GTM consent bridge:** HubSpot's cookie banner fires a `__hs_opt_in_consent` event. A GTM Custom Event trigger listens for this and pushes a `consent` update (`gtag('consent', 'update', { ... })`) reflecting the user's choice. For returning visitors with a prior-consent cookie, HubSpot fires the event on initialization — no banner UI is shown, but the consent state is rehydrated through the same path. Several community GTM templates implement this bridge.

#### Implementation

The consent default script (above) initializes `dataLayer` and the `gtag` shim. Directly after it — same `<head>`, same request nonce — register the HubSpot bridge as a second inline script:

```html
<script nonce="{REQUEST_NONCE}">
  window.addEventListener('__hs_opt_in_consent', (e) => {
    const c = (e && e.detail) || {}
    gtag('consent', 'update', {
      analytics_storage: c.analytics ? 'granted' : 'denied',
      ad_storage: c.advertisement ? 'granted' : 'denied',
      ad_user_data: c.advertisement ? 'granted' : 'denied',
      ad_personalization: c.advertisement ? 'granted' : 'denied',
      functionality_storage: 'granted',
    })
  })
</script>
```

Registering the listener inline (before GTM and HubSpot load under `afterInteractive`) guarantees the bridge is already wired when HubSpot fires the event — either from the banner interaction (first-time visitor) or from rehydrating the consent cookie on init (returning visitor). The returning-visitor case takes exactly the same listener path: no banner UI is shown, but consent state is restored before any tag evaluates.

**GTM container configuration:** Tag, trigger, and variable configuration lives in the GTM web UI. On every meaningful change, export the container as JSON and commit it to `infra/gtm/container.json`. This gives the configuration a reviewable diff, a rollback target, and a reproducible state — without it, the container is effectively unversioned production config.

**Paid pixel tag configuration in GTM** — all 8 Meta Pixels, the LinkedIn Insight Tag, and the Google Ads conversion tag (AW-810041431) are configured with:

- **Required additional consent:** `ad_storage`
- **Consent mode "Wait for update" behavior:** enabled — the tag respects the `wait_for_update: 500` window from the consent default, giving HubSpot's banner time to rehydrate a prior-consent cookie before the tag evaluates and either fires or holds.

**Test plan** — exercise three flows in staging via the GTM Preview/Debug mode:

| Flow                                      | Expected pixel-fire pattern                                                               |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| Accept all                                | Analytics + all ad-storage tags fire after the consent update event                       |
| Deny all                                  | No analytics, no ad-storage tags fire; functionality-only tags allowed                    |
| Customize (analytics yes, advertising no) | Analytics fires; Meta/LinkedIn/Google Ads tags held; no ad-storage beacons leave the page |

Each scenario should be verified in the GTM Debug pane (tag fire/not-fire status) and corroborated against Network tab — no pixel host should appear in network traffic for the Deny flow.

### 2.3 Managed Pixels

All tracking pixels are configured INSIDE GTM, not in the Next.js codebase. This means:

- Pixel scripts never appear in source code
- Marketing can add/modify pixels without code deploys
- Consent requirements are configured per tag in GTM
- The Next.js app loads exactly two third-party scripts: HubSpot and GTM

**Pixels managed in GTM:**

| Pixel                      | Count | Consent Requirement | Notes               |
| -------------------------- | ----- | ------------------- | ------------------- |
| Meta Pixel (Tulsa A)       | 1     | ad_storage          | A/B test variant    |
| Meta Pixel (Tulsa B)       | 1     | ad_storage          | A/B test variant    |
| Meta Pixel (OKC A)         | 1     | ad_storage          |                     |
| Meta Pixel (OKC B)         | 1     | ad_storage          |                     |
| Meta Pixel (NW Arkansas A) | 1     | ad_storage          |                     |
| Meta Pixel (NW Arkansas B) | 1     | ad_storage          |                     |
| Meta Pixel (Kansas City A) | 1     | ad_storage          |                     |
| Meta Pixel (Kansas City B) | 1     | ad_storage          |                     |
| LinkedIn Insight Tag       | 1     | ad_storage          |                     |
| Google Ads (AW-810041431)  | 1     | ad_storage          | Conversion tracking |

**Action required:** Verify all pixel IDs from the current Wix site and configure them in the GTM container. The current site loads these directly — they need to be moved into GTM for proper consent management.

### 2.4 GTM DataLayer Events

Push custom events to GTM's dataLayer for conversion tracking:

| Event                 | Trigger                    | Purpose                    |
| --------------------- | -------------------------- | -------------------------- |
| `form_submission`     | Any HubSpot form submitted | Track lead conversions     |
| `contact_form_submit` | Contact form submitted     | Primary conversion         |
| `booking_complete`    | HubSpot Meetings booking   | High-value conversion      |
| `assessment_start`    | ScoreApp link clicked      | Assessment funnel tracking |
| `newsletter_signup`   | Newsletter form submitted  | Email list growth          |
| `case_study_view`     | Case study page viewed     | Content engagement         |
| `cta_click`           | Any CTA button clicked     | CTA effectiveness          |

Implementation: Push to `window.dataLayer` from React event handlers. GTM triggers fire on these events and can route them to any configured pixel/tag.

---

## 3. ScoreApp Integration

**Role:** External assessment/quiz tool replacing the defunct custom business-assessments app.

### 3.1 Integration Approach

**Recommended: Dedicated landing page with external link.**

The `/resources/organizational-maturity-assessment` page serves as a conversion-optimized landing page that explains the assessment and links out to ScoreApp.

**Page structure:**

1. What the assessment measures
2. What the user gets back (report format, insights)
3. How long it takes
4. Who it's for
5. Social proof (how many have taken it, any results stats)
6. CTA button -> ScoreApp URL (opens in new tab)

**Environment variable:** `NEXT_PUBLIC_SCOREAPP_URL` — the ScoreApp assessment URL. Configurable without code changes.

### 3.2 Alternative: ScoreApp Embed

If ScoreApp provides an embed/iframe option:

- Embed below the explanatory content on the landing page
- Keeps users on-site
- Trade-off: iframe styling conflicts, additional load time, mobile responsiveness depends on ScoreApp

**Recommendation:** Start with the external link approach (simpler, more reliable). Switch to embed if the user experience warrants it after testing.

### 3.3 ScoreApp + HubSpot Integration

ScoreApp likely has a native HubSpot integration or webhook capability:

- Assessment completions should create/update contacts in HubSpot
- Assessment scores and results should be synced as contact properties
- This is configured in ScoreApp's settings, not in the website code

**Action required:** Review ScoreApp's HubSpot integration options and configure the data flow.

### 3.4 Tracking

When the "Take the Assessment" CTA is clicked:

- Push `assessment_start` event to GTM dataLayer
- GTM can fire conversion events on configured pixels
- Track outbound click for attribution

---

## 4. Cookie Consent Flow (End-to-End)

This is the most important integration detail to get right. Incorrect consent handling creates legal liability and can result in ad platform penalties.

```
┌─────────────────────────────────────────────────────┐
│                    Page Load                         │
│                                                     │
│  1. Next.js renders page (SSR/ISR)                  │
│  2. Static content visible immediately              │
│                                                     │
│  3. GTM loads (consent defaults: all DENIED)         │
│  4. HubSpot tracking script loads                   │
│     └── Cookie banner appears                       │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │         User Cookie Choice                   │    │
│  │                                             │    │
│  │  Accept All ──┐                             │    │
│  │               │                             │    │
│  │  Customize ───┤  HubSpot fires consent      │    │
│  │               │  update event               │    │
│  │  Deny All ────┘                             │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  5. GTM receives consent update                     │
│     ├── analytics_storage: granted/denied           │
│     ├── ad_storage: granted/denied                  │
│     ├── ad_user_data: granted/denied                │
│     └── ad_personalization: granted/denied          │
│                                                     │
│  6. Tags fire based on consent state:               │
│     ├── Analytics granted → HubSpot analytics       │
│     ├── Ad storage granted → Meta Pixels (all 8)    │
│     ├── Ad storage granted → LinkedIn Insight Tag   │
│     └── Ad storage granted → Google Ads tag         │
│                                                     │
│  7. Chat widget activates (if consent granted)      │
└─────────────────────────────────────────────────────┘
```

**Key principles:**

- No tracking fires before consent
- Consent state persists across page navigations (HubSpot cookie)
- Returning visitors with prior consent don't see the banner again
- "Deny" must actually block all non-essential tracking
- Consent preferences link should be in the footer for users to change their choice

---

## 5. Payload CMS Webhook (On-Demand ISR)

When content changes in Payload (create, update, delete, publish), the site should revalidate affected pages without waiting for the ISR timer.

### 5.1 Payload afterChange Hook

A Payload hook on content-change events sends a POST to the site's revalidation endpoint:

```
Content updated in Payload Admin
  │
  ▼
Payload afterChange hook fires
  │
  ▼
POST /api/revalidate
  Headers: x-revalidation-secret: <REVALIDATION_SECRET>
  Body: {
    collection: 'posts',     // which collection changed
    operation: 'update',     // create, update, delete
    doc: { id: '...', slug: '...' }
  }
  │
  ▼
API route validates secret
  │
  ▼
Calls revalidateTag('posts')      // revalidates all pages that fetch posts
  or revalidatePath('/insights/[slug]')  // revalidates specific page
  │
  ▼
Next ISR cache invalidated → next request gets fresh content
```

### 5.2 Tag-Based Revalidation

Each data fetch in the Next.js app is tagged with the collection name:

```
fetch(payloadURL, { next: { tags: ['posts'] } })
```

When the webhook fires `revalidateTag('posts')`, all pages that fetched posts data are invalidated. This is more efficient than revalidating individual paths.

### 5.3 Security

- Webhook endpoint validates `REVALIDATION_SECRET` header on every request
- Invalid or missing secret returns 401
- Endpoint does not expose any data — only triggers cache invalidation
- Rate limiting recommended if exposed to the internet (though in practice, only Payload sends requests)

---

## 6. Transactional Email (AWS SES)

Payload sends authentication and password-reset emails out of the box, and the site itself will eventually send notification emails (form acknowledgements, future workflows). In development, Payload's default behavior — log emails to the console — is fine. Production requires a real transport.

**Decision: AWS SES via the v2 SDK (`@aws-sdk/client-sesv2`), not SMTP.** The SDK path uses the EC2 instance profile for credentials — the same credential flow already established for S3 (see §7 Environment Variables). No SMTP password to rotate, no static secret in env, no IAM user. SMTP would require a long-lived `AWS_SES_SMTP_PASSWORD` derived from an IAM user's secret key, which is exactly the credential shape this stack otherwise avoids.

### Production Prerequisites

1. **Verify the sending domain** (`seqtek.com`) as an SES identity. Domain-level verification (not single-address) so any `@seqtek.com` sender works.
2. **Publish DKIM** (3 CNAME records, generated by SES) and **SPF** (`v=spf1 include:amazonses.com -all`, or merged with existing SPF) records in the `seqtek.com` zone.
3. **Request production access.** SES accounts start in sandbox mode: outbound is restricted to verified addresses, capped at 200/day, 1/sec. Request increase before launch; AWS turnaround is usually <24h with a clear use case.

### Bounce and Complaint Handling

A configuration set is attached to every send, with event publishing to an SNS topic for `Bounce` and `Complaint` events. A CloudWatch metric filter on the SNS subscription (or directly on a delivery-event Lambda) emits bounce-rate and complaint-rate metrics. **Alarm on bounce rate >5% rolling 24h** — AWS's account-suspension threshold is 10%, so alarming at 5% gives lead time to investigate before SES throttles or pauses the account. Complaint-rate alarm at 0.1% (AWS threshold: 0.5%).

### Failure Mode

If SES is unreachable (network, throttle, regional outage), Payload's mailer logs the error and the request continues. (Admin password reset is **not** an SES use case in this stack — `/admin` uses Google Workspace SSO per spec 001, so there is no password-reset endpoint. SES remains here for future transactional email needs.)

### Addresses

- **From:** `no-reply@seqtek.com` — distinct from any human mailbox, makes the system origin clear.
- **Reply-To:** set to a monitored inbox (e.g., `contact@seqtek.com`) on any user-facing message where a reply is plausible (form acknowledgements). Omit for auth/reset emails where a reply makes no sense.

### Environment Variables

| Variable           | Purpose                                           | Example               |
| ------------------ | ------------------------------------------------- | --------------------- |
| `SES_REGION`       | SES API region (verified identity must live here) | `us-east-1`           |
| `SES_FROM_ADDRESS` | Default From address                              | `no-reply@seqtek.com` |

**No AWS credentials in env.** The EC2 instance profile carries an IAM policy granting `ses:SendEmail` and `ses:SendRawEmail` scoped to the verified identity ARN. Same credential discovery path as S3 (IMDSv2, hop limit 2 — see §7).

---

## 7. Environment Variables — Complete Inventory

### Server-Side Only (Never Exposed to Browser)

| Variable              | Purpose                                           | Example Value                             |
| --------------------- | ------------------------------------------------- | ----------------------------------------- |
| `DATABASE_URL`        | Postgres connection string                        | `postgresql://user:pass@host:5432/seqtek` |
| `PAYLOAD_SECRET`      | Payload auth token encryption                     | Random 32+ character string               |
| `S3_BUCKET`           | S3 bucket name for media                          | `seqtek-media`                            |
| `S3_REGION`           | AWS region                                        | `us-east-1`                               |
| `S3_BUCKET_HOSTNAME`  | For next/image remotePatterns                     | `seqtek-media.s3.us-east-1.amazonaws.com` |
| `REVALIDATION_SECRET` | Webhook validation                                | Random 32+ character string               |
| `SES_REGION`          | AWS region for SES (verified identity lives here) | `us-east-1`                               |
| `SES_FROM_ADDRESS`    | Default From address for transactional email      | `no-reply@seqtek.com`                     |

**S3 authentication:** No static AWS credentials are used. In production and staging, the EC2 instance profile (IAM role) provides S3 access; the AWS SDK inside the container auto-discovers and rotates credentials via IMDSv2 (hop limit 2 — set in the launch template's metadata options so the container can reach IMDS through Docker's bridge network). Locally, Payload falls back to filesystem storage when the S3 env vars are absent — see [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md). `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are not used anywhere in this codebase.

### Client-Side (`NEXT_PUBLIC_` Prefix — Visible in Browser JS)

| Variable                               | Purpose                    | Example Value                          |
| -------------------------------------- | -------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                 | Canonical URL, OG tags     | `https://seqtek.com`                   |
| `NEXT_PUBLIC_HUBSPOT_PORTAL_ID`        | HubSpot portal             | `8504846`                              |
| `NEXT_PUBLIC_GTM_ID`                   | GTM container              | `GTM-XXXXXXX`                          |
| `NEXT_PUBLIC_SCOREAPP_URL`             | ScoreApp assessment URL    | `https://app.scoreapp.com/...`         |
| `NEXT_PUBLIC_HUBSPOT_CONTACT_FORM_ID`  | Contact form GUID          | HubSpot form ID                        |
| `NEXT_PUBLIC_HUBSPOT_WORKSHOP_FORM_ID` | Workshop Inquiry form GUID | `66dba2bf-f099-44d5-8c6e-f24292cefe53` |

### `.env.example` (Committed to Repo)

```
# Database
DATABASE_URL=

# Payload CMS
PAYLOAD_SECRET=

# AWS S3 (Media Storage)
# In production: credentials come from the EC2 instance profile (no static keys).
# Locally: leave these blank — Payload falls back to filesystem storage.
S3_BUCKET=
S3_REGION=
S3_BUCKET_HOSTNAME=

# ISR Revalidation
REVALIDATION_SECRET=

# AWS SES (Transactional Email)
# Credentials come from the EC2 instance profile in production — no static keys.
SES_REGION=
SES_FROM_ADDRESS=

# Public Configuration
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_HUBSPOT_PORTAL_ID=
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_SCOREAPP_URL=
NEXT_PUBLIC_HUBSPOT_CONTACT_FORM_ID=
NEXT_PUBLIC_HUBSPOT_WORKSHOP_FORM_ID=
```

---

## 8. Content Security Policy (CSP)

The authoritative CSP policy lives in [ARCHITECTURE.md §6](ARCHITECTURE.md#content-security-policy). This section enumerates the third-party hostnames each integration adds and why.

**Policy approach:** nonce-based `script-src` with `'strict-dynamic'`. Trust is propagated from the initial nonced loader to scripts it requests (GTM → its tags, HubSpot tracking → its sub-scripts), so explicit script-src hostname allowlists are unnecessary — and ignored by modern browsers when `'strict-dynamic'` is in effect. Only `img-src`, `connect-src`, and `frame-src` need per-integration hostname allowlists.

### Hostnames Added by Each Integration

| Integration                       | Directive     | Hosts                                                                                | Reason                                                                                           |
| --------------------------------- | ------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| HubSpot tracking + analytics      | `connect-src` | `*.hubspot.com`, `*.hs-analytics.net`, `*.hs-banner.com`, `*.usemessages.com`        | Analytics beacons, banner config, chat                                                           |
| HubSpot Forms API                 | `connect-src` | `*.hsforms.net`                                                                      | Custom form submissions                                                                          |
| HubSpot forms / Meetings embeds   | `frame-src`   | `*.hubspot.com`, `*.hsforms.net`, `meetings.hubspot.com`, `*.hubspotusercontent.com` | Iframe embeds for Meetings (meetings.hubspot.com) + Meetings static assets + fallback form embed |
| HubSpot form / chat imagery       | `img-src`     | `*.hubspot.com`, `*.hsforms.net`                                                     | Form field icons, chat assets                                                                    |
| GTM + GA                          | `connect-src` | `*.googletagmanager.com`, `*.google-analytics.com`                                   | Container fetch, analytics beacons                                                               |
| ScoreApp (only if iframe variant) | `frame-src`   | `*.scoreapp.com`                                                                     | Optional — omit if using outbound link (recommended; see §3.1)                                   |
| Media (S3 / CloudFront)           | `img-src`     | Value of `S3_BUCKET_HOSTNAME` (or media CloudFront hostname in prod)                 | Payload-uploaded media                                                                           |

### Implementation Notes

- **Consent default init** runs as a small inline `<head>` script carrying the request nonce — it must execute before any third-party script. See §2.2 for the snippet.
- **`style-src` is path-scoped** in the proxy (Next.js 16 renamed `middleware.ts` → `proxy.ts`): public routes get `'self'`; `/admin/*` gets `'self' 'unsafe-inline'` to accommodate the Payload admin's Lexical editor.
- **Rollout**: start in staging with `Content-Security-Policy-Report-Only` to surface violations without breaking the page. Promote to enforcing once the report endpoint is clean. See _Rollout mechanism_ below for the operational pieces.

### Rollout mechanism

**Environment posture:**

| Environment | Mode                                  | Rationale                                                                                                                         |
| ----------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Dev         | Enforcing                             | Surface CSP issues at development time, where they are cheapest to fix. Local breakage is acceptable; production breakage is not. |
| Staging     | `Content-Security-Policy-Report-Only` | Collects real violations under production-like traffic without blocking the page. The soak environment for promotion.             |
| Production  | Enforcing                             | Set only after the staging soak passes the promote-to-enforce checklist below.                                                    |

**Report endpoint:** `app/api/csp-report/route.ts` accepts violation reports with content type `application/csp-report` or `application/reports+json`, validates the basic shape (presence of `violated-directive` / `blocked-uri` or the modern report `body` equivalent), and writes a structured JSON line to stdout. CloudWatch Logs picks them up via the container's `awslogs` Docker log driver — no separate shipper needed.

**Metrics and alerting:** a CloudWatch metric filter on the log group emits a count metric per directive per day. Alarm: if a single directive exceeds **100 violations/hour**, page the on-call. That threshold is high enough to ignore normal browser-extension noise but low enough to catch a real regression — typically a new third-party (marketing tag, embedded widget) introducing an unallowed origin.

**Promote-to-enforce checklist (staging → production):**

1. Report-Only header active in staging for **7+ days** against production-like traffic.
2. No **new** violation directives in the last **3 days** of that window. Existing/known violations from third parties are acceptable noise.
3. Known-violation list maintained in `docs/CSP_VIOLATIONS_KNOWN.md` (future doc — out of scope here) so the on-call can distinguish "expected" from "new" without archeology.
4. Sign-off from one engineer (recorded in the cutover ticket).
5. Cutover date set in the team calendar with an owner. Don't let Report-Only become permanent — a Report-Only policy is observability, not enforcement.

**Report retention:** 30 days on the CSP report log group. Long enough to debug a regression introduced in the prior release cycle, short enough to keep CloudWatch costs sane.

Note: ARCHITECTURE.md §6 CSP table should be kept in sync with this list — if it isn't, treat this doc as authoritative.

---

## 9. 301 Redirect Map — Complete

All redirects configured in `next.config.ts` `redirects()`. These preserve any SEO value from the existing Wix URLs.

| Source                                 | Destination                                     | Permanent |
| -------------------------------------- | ----------------------------------------------- | --------- |
| `/about-us-1`                          | `/about`                                        | Yes       |
| `/our-services`                        | `/services`                                     | Yes       |
| `/workshops`                           | `/touchstone-workshops`                         | Yes       |
| `/blog-old`                            | `/insights`                                     | Yes       |
| `/blog-old/:path*`                     | `/insights/:path*`                              | Yes       |
| `/organizational-strategy-1-5`         | `/resources/organizational-maturity-assessment` | Yes       |
| `/organizational-strategy-1-1-1-3`     | `/case-studies/airline-automation`              | Yes       |
| `/organizational-strategy-1-1-1-3-1`   | `/case-studies/oil-gas-modernization`           | Yes       |
| `/organizational-strategy-1-1-1-3-1-1` | `/case-studies/banking-integration-platform`    | Yes       |
| `/organizational-strategy-1-3-1-1-1`   | `/case-studies`                                 | Yes       |
| `/case-study-3`                        | `/case-studies/mobile-apps-remote-operations`   | Yes       |
| `/case-study-4`                        | `/case-studies/retail-pos-update-experience`    | Yes       |
| `/case-study-5`                        | `/case-studies/data-warehouse-strategy`         | Yes       |
| `/driving-innovation-case-study`       | `/case-studies/healthcare-ux-redesign`          | Yes       |
| `/modernizing-healthcare-case-study`   | `/case-studies/healthcare-data-modernization`   | Yes       |
| `/contact`                             | `/contact`                                      | Yes       |
| `/privacy-policy`                      | `/privacy-policy`                               | Yes       |

**Post-launch verification:** After DNS cutover, crawl all old URLs to confirm 301 responses and correct destinations. Use a tool like Screaming Frog or a simple script.

---

## 10. Third-Party Script Loading Order

The loading order matters for performance and consent compliance.

```
1. Page HTML rendered (SSR/ISR) — no third-party scripts block this
2. Critical CSS (Tailwind, inlined) — renders immediately
3. Self-hosted fonts (preloaded) — no external dependency
4. Inline <head> consent-default script runs — GTM consent state initialized to ALL DENIED
   (analytics_storage, ad_storage, ad_user_data, ad_personalization = denied;
    functionality_storage = granted; wait_for_update: 500ms — see §2.2)
5. Next.js hydration — page becomes interactive
6. GTM and HubSpot tracking script both load (afterInteractive).
   Order between them is not deterministic — that is why step 4 must happen first.
7. HubSpot banner appears (first-time visitor)
   OR HubSpot reads its prior-consent cookie and fires the consent event (returning visitor)
8. GTM Custom Event trigger receives the consent update — analytics_storage / ad_storage
   states updated to granted or denied per the user's choice
9. Consented tags fire (Meta Pixels, LinkedIn Insight Tag, Google Ads conversion tag)
10. HubSpot chat widget activates (if functionality consent granted)
```

**Performance principle:** Steps 1-5 must complete before any third-party script executes. Step 4 is an ~200-byte inline script, not a third-party load, and it runs synchronously in `<head>`. The user sees and can interact with content before HubSpot, GTM, or any pixel loads. This is the primary mechanism for achieving sub-2s mobile LCP.

---

## 11. Pre-Launch Checklist

### HubSpot

- [ ] Verify portal ID 8504846 is active and accessible
- [ ] Create form GUIDs for: Contact, Newsletter, Workshop Inquiry
- [ ] Configure HubSpot Meetings for booking page
- [ ] Configure cookie banner appearance (match site brand)
- [ ] Set up chatflow (bot or live agent)
- [ ] Configure consent categories (Necessary, Analytics, Advertising)
- [ ] Test form submissions create contacts in HubSpot

### GTM

- [ ] Create or verify GTM container
- [ ] Migrate all 8 Meta Pixel IDs from current Wix site into GTM tags
- [ ] Configure LinkedIn Insight Tag in GTM
- [ ] Configure Google Ads conversion tag (AW-810041431) in GTM
- [ ] Set up consent mode defaults (all denied)
- [ ] Configure HubSpot consent bridge trigger
- [ ] Set up custom event triggers for dataLayer events
- [ ] Test: pixels only fire after consent granted
- [ ] Test: deny all actually blocks all non-essential tracking

### ScoreApp

- [ ] Confirm ScoreApp account and assessment URL
- [ ] Review ScoreApp-HubSpot integration options
- [ ] Configure assessment results to sync with HubSpot contacts
- [ ] Test assessment flow end-to-end

### DNS & SSL

- [ ] Provision ACM certificate in us-east-1 for `seqtek.com` and `www.seqtek.com`
- [ ] Attach ACM certificate to the CloudFront distribution as the alternate domain certificate
- [ ] Configure CloudFront alternate domain names (CNAMEs) for apex and www
- [ ] Configure Route 53 (or external DNS) A/AAAA alias records pointing apex and www to the CloudFront distribution
- [ ] Set up `www.seqtek.com` → `seqtek.com` redirect via CloudFront function or distribution behavior
- [ ] Verify SSL certificate is valid, attached, and auto-renews (ACM handles renewal automatically)
- [ ] Plan DNS cutover window (low-traffic time, weekend morning preferred)

### SEO

- [ ] Submit new sitemap to Google Search Console
- [ ] Verify all 301 redirects resolve correctly
- [ ] Test structured data with Google's Rich Results Test
- [ ] Verify robots.txt allows crawling
- [ ] Check canonical URLs on all pages

### Security

- [ ] Verify no secrets in committed code (scan repo)
- [ ] Test Payload admin requires authentication
- [ ] Verify webhook endpoint rejects invalid secrets
- [ ] Test CSP headers in staging (report-only mode first)
- [ ] Verify draft content is not accessible without auth
