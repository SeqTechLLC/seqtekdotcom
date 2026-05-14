# SEQTEK Website — Integration Specifications

**Date:** May 2026
**Status:** Design — Pre-Implementation

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

**Ordering note:** The HubSpot tracking script and GTM both load with `afterInteractive`, so their exact load order is not deterministic. The GTM consent default state (`gtag('consent', 'default', { ... denied })`) must therefore be initialized via an inline `<head>` script *before* either third-party loads. See §2.2 for the snippet.

### 1.2 Forms

**Recommended approach: Custom React forms with HubSpot Forms API submission.**

SEQTEK's forms must look native to the site design, not like HubSpot iframe embeds. Build custom form components styled with Tailwind, submit directly to the HubSpot Forms API.

**API endpoint:** `https://api.hsforms.com/submissions/v3/integration/submit/{portalId}/{formGuid}`

- Portal ID and Form GUID are not secrets (visible in any HubSpot embed code)
- The API is CORS-enabled for browser submissions
- No server-side proxy needed
- Form GUID is configured per form in HubSpot, referenced as a constant or env var

**Forms to build:**

| Form | Location | Fields | HubSpot Form GUID |
|---|---|---|---|
| Contact | `/contact` | First name, last name, email, phone, inquiry type (dropdown), message | TBD — create in HubSpot |
| Book a Call | `/contact/book-a-call` | HubSpot Meetings embed (see 1.4) | N/A (Meetings widget) |
| Newsletter | Blog sidebar/footer | Email | TBD |
| Workshop Inquiry | `/touchstone-workshops` | Name, email, company, workshop interest, message | TBD |

**Form submission flow:**
1. User fills out custom React form (client-side validation with Zod or native)
2. On submit, POST to HubSpot Forms API
3. HubSpot creates/updates a contact and triggers any configured workflows
4. Show success message in the UI
5. Optional: fire GTM event for conversion tracking

**Fallback:** If a form needs features only available in HubSpot's embed (conditional logic, progressive profiling), use HubSpot's embed code as an iframe. Acceptable for lower-priority forms where design control matters less.

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
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'granted',
    wait_for_update: 500,
  });
</script>
```

Setting the defaults inline (rather than relying solely on GTM-container-side defaults) ensures `window.dataLayer` already reflects "all denied" by the time GTM or HubSpot arrive — neither's load order is deterministic under `afterInteractive`. The `wait_for_update: 500` window gives HubSpot's banner time to read its prior-consent cookie on returning visits and fire `__hs_opt_in_consent` before any tag evaluates consent.

**HubSpot–GTM consent bridge:** HubSpot's cookie banner fires a `__hs_opt_in_consent` event. A GTM Custom Event trigger listens for this and pushes a `consent` update (`gtag('consent', 'update', { ... })`) reflecting the user's choice. For returning visitors with a prior-consent cookie, HubSpot fires the event on initialization — no banner UI is shown, but the consent state is rehydrated through the same path. Several community GTM templates implement this bridge.

### 2.3 Managed Pixels

All tracking pixels are configured INSIDE GTM, not in the Next.js codebase. This means:
- Pixel scripts never appear in source code
- Marketing can add/modify pixels without code deploys
- Consent requirements are configured per tag in GTM
- The Next.js app loads exactly two third-party scripts: HubSpot and GTM

**Pixels managed in GTM:**

| Pixel | Count | Consent Requirement | Notes |
|---|---|---|---|
| Meta Pixel (Tulsa A) | 1 | ad_storage | A/B test variant |
| Meta Pixel (Tulsa B) | 1 | ad_storage | A/B test variant |
| Meta Pixel (OKC A) | 1 | ad_storage | |
| Meta Pixel (OKC B) | 1 | ad_storage | |
| Meta Pixel (NW Arkansas A) | 1 | ad_storage | |
| Meta Pixel (NW Arkansas B) | 1 | ad_storage | |
| Meta Pixel (Kansas City A) | 1 | ad_storage | |
| Meta Pixel (Kansas City B) | 1 | ad_storage | |
| LinkedIn Insight Tag | 1 | ad_storage | |
| Google Ads (AW-810041431) | 1 | ad_storage | Conversion tracking |

**Action required:** Verify all pixel IDs from the current Wix site and configure them in the GTM container. The current site loads these directly — they need to be moved into GTM for proper consent management.

### 2.4 GTM DataLayer Events

Push custom events to GTM's dataLayer for conversion tracking:

| Event | Trigger | Purpose |
|---|---|---|
| `form_submission` | Any HubSpot form submitted | Track lead conversions |
| `contact_form_submit` | Contact form submitted | Primary conversion |
| `booking_complete` | HubSpot Meetings booking | High-value conversion |
| `assessment_start` | ScoreApp link clicked | Assessment funnel tracking |
| `newsletter_signup` | Newsletter form submitted | Email list growth |
| `case_study_view` | Case study page viewed | Content engagement |
| `cta_click` | Any CTA button clicked | CTA effectiveness |

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

## 6. Environment Variables — Complete Inventory

### Server-Side Only (Never Exposed to Browser)

| Variable | Purpose | Example Value |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | `postgresql://user:pass@host:5432/seqtek` |
| `PAYLOAD_SECRET` | Payload auth token encryption | Random 32+ character string |
| `S3_BUCKET` | S3 bucket name for media | `seqtek-media` |
| `S3_REGION` | AWS region | `us-east-1` |
| `S3_BUCKET_HOSTNAME` | For next/image remotePatterns | `seqtek-media.s3.us-east-1.amazonaws.com` |
| `REVALIDATION_SECRET` | Webhook validation | Random 32+ character string |

**S3 authentication:** No static AWS credentials are used. In production and staging, the EC2 instance profile (IAM role) provides S3 access; the AWS SDK inside the container auto-discovers and rotates credentials via IMDSv2 (hop limit 2 — set in the launch template's metadata options so the container can reach IMDS through Docker's bridge network). Locally, Payload falls back to filesystem storage when the S3 env vars are absent — see [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md). `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are not used anywhere in this codebase.

### Client-Side (`NEXT_PUBLIC_` Prefix — Visible in Browser JS)

| Variable | Purpose | Example Value |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical URL, OG tags | `https://seqtek.com` |
| `NEXT_PUBLIC_HUBSPOT_PORTAL_ID` | HubSpot portal | `8504846` |
| `NEXT_PUBLIC_GTM_ID` | GTM container | `GTM-XXXXXXX` |
| `NEXT_PUBLIC_SCOREAPP_URL` | ScoreApp assessment URL | `https://app.scoreapp.com/...` |
| `NEXT_PUBLIC_HUBSPOT_CONTACT_FORM_ID` | Contact form GUID | HubSpot form ID |
| `NEXT_PUBLIC_HUBSPOT_NEWSLETTER_FORM_ID` | Newsletter form GUID | HubSpot form ID |

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

# Public Configuration
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_HUBSPOT_PORTAL_ID=
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_SCOREAPP_URL=
NEXT_PUBLIC_HUBSPOT_CONTACT_FORM_ID=
NEXT_PUBLIC_HUBSPOT_NEWSLETTER_FORM_ID=
```

---

## 7. Content Security Policy (CSP)

The authoritative CSP policy lives in [ARCHITECTURE.md §6](ARCHITECTURE.md#content-security-policy). This section enumerates the third-party hostnames each integration adds and why.

**Policy approach:** nonce-based `script-src` with `'strict-dynamic'`. Trust is propagated from the initial nonced loader to scripts it requests (GTM → its tags, HubSpot tracking → its sub-scripts), so explicit script-src hostname allowlists are unnecessary — and ignored by modern browsers when `'strict-dynamic'` is in effect. Only `img-src`, `connect-src`, and `frame-src` need per-integration hostname allowlists.

### Hostnames Added by Each Integration

| Integration | Directive | Hosts | Reason |
|---|---|---|---|
| HubSpot tracking + analytics | `connect-src` | `*.hubspot.com`, `*.hs-analytics.net`, `*.hs-banner.com`, `*.usemessages.com` | Analytics beacons, banner config, chat |
| HubSpot Forms API | `connect-src` | `*.hsforms.net` | Custom form submissions |
| HubSpot forms / Meetings embeds | `frame-src` | `*.hubspot.com`, `*.hsforms.net`, `meetings.hubspot.com`, `*.hubspotusercontent.com` | Iframe embeds for Meetings (meetings.hubspot.com) + Meetings static assets + fallback form embed |
| HubSpot form / chat imagery | `img-src` | `*.hubspot.com`, `*.hsforms.net` | Form field icons, chat assets |
| GTM + GA | `connect-src` | `*.googletagmanager.com`, `*.google-analytics.com` | Container fetch, analytics beacons |
| ScoreApp (only if iframe variant) | `frame-src` | `*.scoreapp.com` | Optional — omit if using outbound link (recommended; see §3.1) |
| Media (S3 / CloudFront) | `img-src` | Value of `S3_BUCKET_HOSTNAME` (or media CloudFront hostname in prod) | Payload-uploaded media |

### Implementation Notes

- **Consent default init** runs as a small inline `<head>` script carrying the request nonce — it must execute before any third-party script. See §2.2 for the snippet.
- **`style-src` is path-scoped** in the middleware: public routes get `'self'`; `/admin/*` gets `'self' 'unsafe-inline'` to accommodate the Payload admin's Lexical editor.
- **Rollout**: start in staging with `Content-Security-Policy-Report-Only` to surface violations without breaking the page. Promote to enforcing once the report endpoint is clean.

Note: ARCHITECTURE.md §6 CSP table should be kept in sync with this list — if it isn't, treat this doc as authoritative.

---

## 8. 301 Redirect Map — Complete

All redirects configured in `next.config.ts` `redirects()`. These preserve any SEO value from the existing Wix URLs.

| Source | Destination | Permanent |
|---|---|---|
| `/about-us-1` | `/about` | Yes |
| `/our-services` | `/services` | Yes |
| `/workshops` | `/touchstone-workshops` | Yes |
| `/blog-old` | `/insights` | Yes |
| `/blog-old/:path*` | `/insights/:path*` | Yes |
| `/organizational-strategy-1-5` | `/resources/organizational-maturity-assessment` | Yes |
| `/organizational-strategy-1-1-1-3` | `/case-studies/airline-automation` | Yes |
| `/organizational-strategy-1-1-1-3-1` | `/case-studies/oil-gas-modernization` | Yes |
| `/organizational-strategy-1-1-1-3-1-1` | `/case-studies/banking-integration` | Yes |
| `/organizational-strategy-1-3-1-1-1` | `/case-studies` | Yes |
| `/case-study-3` | `/case-studies/mobile-apps-remote-areas` | Yes |
| `/case-study-4` | `/case-studies/retail-velocity` | Yes |
| `/case-study-5` | `/case-studies/data-strategic-insights` | Yes |
| `/driving-innovation-case-study` | `/case-studies/healthcare-ux-innovation` | Yes |
| `/modernizing-healthcare-case-study` | `/case-studies/healthcare-data-modernization` | Yes |
| `/contact` | `/contact` | Yes |
| `/privacy-policy` | `/privacy-policy` | Yes |

**Post-launch verification:** After DNS cutover, crawl all old URLs to confirm 301 responses and correct destinations. Use a tool like Screaming Frog or a simple script.

---

## 9. Third-Party Script Loading Order

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

## 10. Pre-Launch Checklist

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
