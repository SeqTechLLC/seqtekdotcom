# SEQTEK Website — Architecture & Technical Design

**Date:** May 2026
**Status:** Design — Pre-Implementation

---

## 1. Tech Stack

| Component | Choice | Rationale |
|---|---|---|
| **Framework** | Next.js 16 (App Router, TypeScript) | Static generation + SSR where needed. React ecosystem. Turbopack default. Industry standard for portfolio-quality marketing sites. |
| **CMS** | Payload CMS v3 (self-hosted) | TypeScript-native, embeds directly in Next.js, Postgres-backed. A technology consulting company should run its own CMS — not use a SaaS blog platform. |
| **Database** | AWS RDS PostgreSQL | Shared infrastructure for CMS + future extensibility (portal, gated resources, etc.). Managed backups, failover. |
| **Hosting** | EC2 + CloudFront + ALB | Long-lived Node process for Payload CMS. ACM for auto-renewing SSL. CloudFront CDN at the edge. ALB for health checks and zero-downtime deploys. SEQTEK is an AWS shop — no new vendor accounts. |
| **Container** | Docker + Amazon ECR | Reproducible builds. Eliminates platform mismatches between CI and production. ECR keeps images in-ecosystem. |
| **Styling** | Tailwind CSS v3 | Utility-first, design tokens via `tailwind.config.js`, excellent performance (only ships used CSS). v3 chosen over v4 — see [ADR 0001](decisions/0001-tailwind-v3.md). |
| **Rich Text** | Lexical (via `@payloadcms/richtext-lexical`) | Payload v3 default. Extensible block-based editor with serialization to React components. |
| **Image Optimization** | `next/image` + `sharp` | Automatic format conversion (WebP/AVIF), responsive sizing, lazy loading. |
| **Media Storage** | AWS S3 (via `@payloadcms/storage-s3`) | Centralizes media in durable, CDN-friendly storage. Decouples uploads from the EC2 instance filesystem. |
| **Fonts** | Self-hosted in `/public/fonts` | No Google Fonts CDN dependency. Eliminates extra DNS lookup and connection. `font-display: swap` for performance. |
| **Linting** | ESLint + Prettier | `next/core-web-vitals` config. Strict TypeScript. Consistent formatting. |
| **Secret Detection** | gitleaks + Husky | Pre-commit hook + CI check. Prevents accidental credential commits in a public repo. |

**Version compatibility:** Payload CMS v3 deeply integrates with Next.js — it shares the same Node process, injects admin routes, and hooks into the build pipeline. `@payloadcms/next@3.84+` explicitly supports Next.js 16 (`>=16.2.2`). When upgrading either package independently, always verify the peer dependency range in `@payloadcms/next` before merging.

### Key Packages

| Package | Version | Purpose |
|---|---|---|
| next | 16.x | Framework |
| react, react-dom | 19.x | UI library |
| payload | 3.x | CMS |
| @payloadcms/next | 3.x | Payload-Next.js integration |
| @payloadcms/db-postgres | 3.x | Postgres adapter |
| @payloadcms/richtext-lexical | 3.x | Rich text editor |
| @payloadcms/storage-s3 | 3.x | S3 media storage |
| tailwindcss | ^3.4 | Styling — see [ADR 0001](decisions/0001-tailwind-v3.md) |
| @tailwindcss/typography | 0.5.x | Prose styling for CMS rich text (registered in `tailwind.config.js` `plugins` array) |
| graphql | ^16.8.1 | Required peer dependency for Payload |
| sharp | latest | Image optimization (required by next/image) |
| @next/third-parties | latest | GTM integration optimized for Next.js |
| husky | latest | Git hooks (runs gitleaks on pre-commit) |
| gitleaks | latest (system) | Secret leak detection — pre-commit + CI |

---

## 2. Payload CMS Content Models

All collections are defined in TypeScript. Payload auto-generates the database schema, REST API, GraphQL API, and admin panel from these definitions.

### Document Collections

#### `users`
Payload's built-in auth collection. Controls access to the admin panel at `/admin`.

| Field | Type | Notes |
|---|---|---|
| `email` | email | Login identifier |
| `roles` | select (multi) | `admin`, `editor` — saved to JWT |
| `name` | text | Display name |

Access: Email/password auth with JWT. No public registration. Accounts created by admins only.

#### `pages`
Generic content pages (About, Contact, Privacy Policy, etc.).

| Field | Type | Notes |
|---|---|---|
| `title` | text | Required |
| `slug` | text | Auto-generated from title, editable |
| `content` | richText (Lexical) | Page body with embedded blocks |
| `hero` | group | headline, subheadline, backgroundImage, cta |
| `seo` | group | metaTitle, metaDescription, ogImage |
| `status` | select | `draft`, `published` |

#### `posts`
Blog posts at `/insights/[slug]`.

| Field | Type | Notes |
|---|---|---|
| `title` | text | Required |
| `slug` | text | Auto-generated from title |
| `excerpt` | textarea | 1-2 sentence summary for listings and meta |
| `content` | richText (Lexical) | Post body with inline CTA blocks |
| `featuredImage` | upload (media) | Required — no stock photos |
| `author` | relationship -> teamMembers | Required |
| `categories` | relationship -> categories (hasMany) | For filtering and archive pages |
| `relatedPosts` | relationship -> posts (hasMany) | Manual curation, max 3 |
| `relatedServices` | relationship -> services (hasMany) | For contextual CTAs |
| `seo` | group | metaTitle, metaDescription, ogImage |
| `publishedAt` | date | Controls ordering and display |
| `status` | select | `draft`, `published` |

Versions: Enabled with drafts for preview before publishing.

#### `caseStudies`
The most important content type. Each gets a dedicated page at `/case-studies/[slug]`.

| Field | Type | Notes |
|---|---|---|
| `title` | text | Required |
| `slug` | text | Auto-generated from title |
| `subtitle` | text | Short outcome-focused tagline |
| `industry` | relationship -> industries | Required |
| `services` | relationship -> services (hasMany) | Which SEQTEK services were applied |
| `client` | group | `name` (text), `logo` (upload, optional), `isAnonymized` (checkbox) |
| `heroImage` | upload (media) | Must be project-relevant — not stock |
| `problem` | richText | The challenge the client faced |
| `solution` | richText | What SEQTEK did |
| `impact` | richText | Results and outcomes |
| `metrics` | array | Objects with `number` (text), `label` (text), `context` (text) |
| `technologies` | array of text | Tag list (e.g., ".NET", "React", "AWS") |
| `testimonial` | relationship -> testimonials | Optional — client quote about this engagement |
| `relatedCaseStudies` | relationship -> caseStudies (hasMany) | Max 3 |
| `seo` | group | metaTitle, metaDescription, ogImage |
| `publishedAt` | date | |
| `status` | select | `draft`, `published` |

#### `services`
Individual service pages at `/services/[pillar]/[slug]`.

| Field | Type | Notes |
|---|---|---|
| `title` | text | e.g., "Change Management & Transformation" |
| `slug` | text | Auto-generated |
| `pillar` | relationship -> servicePillars | Which of the 3 pillars this belongs to |
| `description` | richText | Detailed service description (800-1200 words target) |
| `approach` | richText | Methodology / how SEQTEK delivers this service |
| `deliverables` | array of text | Bulleted list of what the client receives |
| `icon` | text | Icon identifier for card displays |
| `relatedCaseStudies` | relationship -> caseStudies (hasMany) | |
| `faq` | array | Objects with `question` (text), `answer` (richText) |
| `seo` | group | |
| `order` | number | Display ordering within pillar |
| `status` | select | `draft`, `published` |

#### `servicePillars`
The 3 top-level groupings at `/services/[slug]`.

| Field | Type | Notes |
|---|---|---|
| `title` | text | "Organizational Strategy", "Technology & Data", "AI & Automation" |
| `slug` | text | |
| `description` | richText | Pillar overview |
| `heroImage` | upload (media) | |
| `seo` | group | |
| `order` | number | Display ordering (1, 2, 3) |

#### `teamMembers`
Team bios for `/about/team` and blog post authorship.

| Field | Type | Notes |
|---|---|---|
| `name` | text | Full name |
| `slug` | text | |
| `title` | text | Job title (e.g., "CEO") |
| `role` | text | 1-sentence role description |
| `photo` | upload (media) | Professional headshot — required |
| `bio` | richText | 200-350 words for leadership, 75-150 for others |
| `expertise` | array of text | Areas of expertise |
| `certifications` | array of text | PMP, AWS, PROSCI, etc. |
| `education` | array | Objects with `degree` (text), `institution` (text) |
| `linkedinUrl` | text | |
| `email` | text | Optional |
| `personalFacts` | array of text | 1-2 humanizing details |
| `quote` | textarea | Personal philosophy quote |
| `isLeadership` | checkbox | Controls featured display |
| `order` | number | Display ordering |

#### `testimonials`
Full-attribution testimonials used across the site.

| Field | Type | Notes |
|---|---|---|
| `quote` | textarea | The testimonial text |
| `personName` | text | Full name (NOT first name + initial) |
| `personTitle` | text | Job title |
| `company` | text | Company name |
| `photo` | upload (media) | Headshot |
| `caseStudy` | relationship -> caseStudies | Optional link to related case study |
| `isActive` | checkbox | Controls visibility |

#### `workshops`
Touchstone Workshop pages at `/touchstone-workshops/[slug]`.

| Field | Type | Notes |
|---|---|---|
| `title` | text | e.g., "Five Dysfunctions Workshop" |
| `slug` | text | |
| `description` | richText | Full workshop description |
| `format` | richText | Agenda, duration, format details |
| `audience` | richText | Who this workshop is for |
| `deliverables` | array of text | What participants leave with |
| `facilitator` | relationship -> teamMembers | |
| `testimonial` | relationship -> testimonials | From a past participant |
| `order` | number | Sequence in the 3-workshop progression |
| `seo` | group | |

#### `industries`
Industry/vertical pages at `/industries/[slug]`.

| Field | Type | Notes |
|---|---|---|
| `title` | text | e.g., "Energy & Oil/Gas" |
| `slug` | text | |
| `description` | richText | Industry context and challenges |
| `relevantServices` | relationship -> services (hasMany) | |
| `clientLogos` | array of upload (media) | Industry-specific logos |
| `seo` | group | |

#### `locations`
Market landing pages at `/consulting/[slug]`.

| Field | Type | Notes |
|---|---|---|
| `city` | text | e.g., "Tulsa" |
| `slug` | text | e.g., "tulsa" |
| `description` | richText | SEQTEK's presence in this market |
| `address` | group | street, city, state, zip (if physical office) |
| `hasOffice` | checkbox | |
| `seo` | group | |

#### `media`
Payload's built-in upload collection with S3 storage adapter.

| Field | Type | Notes |
|---|---|---|
| `alt` | text | Required — accessibility and SEO. Validation enforced in schema. |
| `caption` | text | Optional |

#### `categories`
Blog post categories.

| Field | Type | Notes |
|---|---|---|
| `title` | text | e.g., "AI Strategy", "Change Management" |
| `slug` | text | |

Access: Public read (no draft status on categories). Create/update requires admin or editor. Delete requires admin.

### Globals (Singletons)

#### `siteSettings`
Company-wide settings edited in one place, used across the site.

| Field | Type | Notes |
|---|---|---|
| `companyName` | text | "SEQTEK" |
| `tagline` | text | |
| `phone` | text | |
| `email` | text | |
| `address` | group | street, city, state, zip |
| `socialLinks` | group | linkedinUrl, twitterUrl, facebookUrl |
| `footerText` | text | Copyright line |
| `stats` | array | Objects with `number` (text), `label` (text), `suffix` (text) — e.g., "25+", "Years", "" |

#### `navigation`
Controls the site navigation structure.

| Field | Type | Notes |
|---|---|---|
| `mainNav` | array | Objects with `label` (text), `url` (text), `children` (array) |
| `footerNav` | array | Same structure |
| `ctaButton` | group | `label` (text), `url` (text) — the nav CTA button |

#### `homepage`
Homepage-specific content.

| Field | Type | Notes |
|---|---|---|
| `hero` | group | headline, subheadline, backgroundImage, cta |
| `stats` | relationship -> siteSettings.stats | Or inline |
| `featuredCaseStudy` | relationship -> caseStudies | Highlighted on homepage |
| `brandTeaser` | group | headline, body (short Sequoyah teaser), linkUrl |
| `clientLogos` | array of upload (media) | Logo bar |
| `featuredTestimonials` | relationship -> testimonials (hasMany) | Max 3 |

---

## 3. Rendering Strategy

All public pages use ISR (Incremental Static Regeneration) — pages are statically generated at build time, cached to disk on the EC2 instance, and revalidated on-demand when content changes in Payload. Because the Node process is long-lived, the ISR disk cache persists across requests (unlike Lambda, where cache can evaporate between invocations).

**Primary revalidation:** On-demand via Payload `afterChange` hook → Next.js `revalidateTag()`. Content updates propagate in seconds on the origin server.

**Fallback revalidation:** Time-based ISR acts as a safety net in case the on-demand hook fails. Set conservatively — not for freshness, just for resilience.

| Route | Strategy | Fallback Revalidate | Notes |
|---|---|---|---|
| `/` | ISR | 3600s (1hr) | Homepage — changes infrequently |
| `/about`, `/about/*` | ISR | 3600s | Rarely changes |
| `/services` | ISR | 3600s | Overview page |
| `/services/[pillar]` | ISR | 3600s | Pillar landing pages |
| `/services/[pillar]/[service]` | ISR | 3600s | Individual services |
| `/case-studies` | ISR | 3600s | Listing + individual |
| `/case-studies/[slug]` | ISR | 3600s | Individual case studies |
| `/insights` | ISR | 3600s | Blog listing |
| `/insights/[slug]` | ISR | 3600s | Individual posts |
| `/touchstone-workshops` | ISR | 3600s | Workshop landing |
| `/touchstone-workshops/[slug]` | ISR | 3600s | Individual workshops |
| `/industries/[slug]` | ISR | 3600s | Industry pages |
| `/consulting/[market]` | ISR | 3600s | Market landing pages |
| `/contact` | Static | N/A | Form is client-side (HubSpot) |
| `/resources/organizational-maturity-assessment` | Static | N/A | ScoreApp link/embed |
| `/privacy-policy` | ISR | 86400s (24hr) | |
| `/admin/[[...segments]]` | SSR (no cache) | N/A | Payload admin panel — authenticated only |
| `/api/*` | SSR | N/A | Payload API routes + webhook handlers |
| `/sitemap.xml` | ISR | 3600s | Dynamic from Payload content |
| `/robots.txt` | Static | N/A | |

### On-Demand Revalidation

Payload's `afterChange` hook calls `revalidateTag()` directly within the same Node process — no external webhook needed. When an editor publishes a case study, the hook revalidates the ISR cache on the origin *and* issues a targeted CloudFront invalidation for the affected paths (e.g., `/case-studies/the-slug` + `/case-studies`). Content updates propagate to all edge locations immediately.

For external integrations that need to trigger revalidation (e.g., a CI pipeline), the `/api/revalidate` endpoint accepts POST requests secured with a shared secret (`REVALIDATION_SECRET`). Requests without a valid secret are rejected with 401.

### CloudFront Cache Behaviors

ISR revalidation only updates the page cache on the EC2 origin. CloudFront edge caches sit in front of the ALB and will continue serving stale content until their TTL expires. Explicit cache behaviors ensure each route type gets the right caching strategy:

| Path Pattern | Origin | Cache Policy | TTL | Notes |
|---|---|---|---|---|
| `/_next/static/*` | ALB | Long-lived | 1 year (immutable) | Content-hashed by Next.js — new deploys use new URLs |
| `/media/*` | S3 bucket | Long-lived | 1 year | Versioning handled by S3 object keys |
| `/admin/*` | ALB | `CachingDisabled` | None | Payload admin panel — authenticated, dynamic, never cached |
| `/api/*` | ALB | `CachingDisabled` | None | Payload API routes, health checks, webhooks |
| `Default (*)` | ALB | Short-lived | 60-120s | Public HTML pages — ISR-generated, short edge TTL |

**Content-publish invalidation:** When an editor publishes content, the Payload `afterChange` hook revalidates the ISR cache on the origin *and* issues a targeted CloudFront invalidation for the affected paths (e.g., `/case-studies/the-slug` + `/case-studies`). This eliminates edge staleness — editors see their content live immediately. The invalidation targets specific paths, not `/*`, so it stays well within the 1,000 free invalidation paths per month.

**Deploy-time invalidation:** The CI/CD pipeline issues a CloudFront invalidation for `/*` after each deploy to ensure new HTML and assets are served immediately.

### ISR Cache on Instance Replacement

The ISR disk cache lives on the EC2 instance. If the ASG replaces the instance (hardware failure, scaling event), the cache starts empty. For a site with ~50-100 pages, full regeneration happens organically within minutes as visitors hit each page. A post-deploy cache warming script (`scripts/warm-cache.ts`) fetches the URL list from `/sitemap.xml` and hits each page to pre-warm the ISR cache immediately after any instance launch or deploy. This is a Node script rather than a static URL list — as pages are added or removed in the CMS, the warm-up set stays current automatically.

---

## 4. Directory Structure

```
/
├── src/
│   ├── app/
│   │   ├── (site)/                        # Route group: public site
│   │   │   ├── layout.tsx                 # Root layout (HubSpot, GTM, fonts, nav, footer)
│   │   │   ├── page.tsx                   # Homepage
│   │   │   ├── about/
│   │   │   │   ├── page.tsx               # About landing
│   │   │   │   ├── our-story/page.tsx
│   │   │   │   ├── team/page.tsx
│   │   │   │   ├── localshoring/page.tsx
│   │   │   │   └── careers/page.tsx
│   │   │   ├── services/
│   │   │   │   ├── page.tsx               # Services overview
│   │   │   │   └── [pillar]/
│   │   │   │       ├── page.tsx           # Pillar landing
│   │   │   │       └── [service]/page.tsx # Individual service
│   │   │   ├── case-studies/
│   │   │   │   ├── page.tsx               # Listing
│   │   │   │   └── [slug]/page.tsx        # Individual
│   │   │   ├── insights/
│   │   │   │   ├── page.tsx               # Blog listing
│   │   │   │   ├── [slug]/page.tsx        # Individual post
│   │   │   │   └── category/[slug]/page.tsx
│   │   │   ├── touchstone-workshops/
│   │   │   │   ├── page.tsx               # Workshop landing
│   │   │   │   └── [slug]/page.tsx        # Individual workshop
│   │   │   ├── industries/
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── contact/
│   │   │   │   ├── page.tsx
│   │   │   │   └── book-a-call/page.tsx
│   │   │   ├── resources/
│   │   │   │   └── organizational-maturity-assessment/page.tsx
│   │   │   ├── consulting/
│   │   │   │   └── [market]/page.tsx      # Market landing pages
│   │   │   ├── privacy-policy/page.tsx
│   │   │   └── terms-of-service/page.tsx
│   │   │
│   │   ├── (payload)/                     # Route group: Payload admin
│   │   │   └── admin/
│   │   │       └── [[...segments]]/page.tsx
│   │   │
│   │   ├── api/
│   │   │   ├── health/route.ts            # ALB health check endpoint
│   │   │   ├── revalidate/route.ts        # Webhook handler for on-demand ISR
│   │   │   └── [...payload]/route.ts      # Payload REST/GraphQL API
│   │   │
│   │   ├── sitemap.ts                     # Dynamic sitemap
│   │   ├── robots.ts                      # Dynamic robots.txt
│   │   └── not-found.tsx
│   │
│   ├── middleware.ts                       # CSP nonce generation
│   │
│   ├── components/
│   │   ├── ui/                            # Primitives: Button, Card, Badge, Container, Section
│   │   ├── layout/                        # Header, Footer, Navigation, MobileNav
│   │   ├── sections/                      # Hero, StatsBar, LogoBar, TestimonialCarousel, CTASection
│   │   ├── blog/                          # PostCard, PostList, CategoryFilter
│   │   ├── case-studies/                  # CaseStudyCard, MetricDisplay, TechStack
│   │   ├── forms/                         # HubSpotForm (API submission wrapper)
│   │   └── integrations/                  # HubSpotTracking, GTMScript, CookieConsent
│   │
│   ├── payload/
│   │   ├── collections/                   # All collection configs (one file per collection)
│   │   │   ├── Users.ts
│   │   │   ├── Pages.ts
│   │   │   ├── Posts.ts
│   │   │   ├── CaseStudies.ts
│   │   │   ├── Services.ts
│   │   │   ├── ServicePillars.ts
│   │   │   ├── TeamMembers.ts
│   │   │   ├── Testimonials.ts
│   │   │   ├── Workshops.ts
│   │   │   ├── Industries.ts
│   │   │   ├── Locations.ts
│   │   │   ├── Media.ts
│   │   │   └── Categories.ts
│   │   ├── globals/                       # Singleton configs
│   │   │   ├── SiteSettings.ts
│   │   │   ├── Navigation.ts
│   │   │   └── Homepage.ts
│   │   ├── access/                        # Reusable access control functions
│   │   │   ├── isAdmin.ts
│   │   │   ├── isAdminOrEditor.ts
│   │   │   └── publishedOnly.ts
│   │   ├── hooks/                         # Payload hooks (beforeChange, afterChange)
│   │   │   └── revalidateOnChange.ts      # Triggers ISR revalidation + CloudFront path invalidation
│   │   └── seed/                          # Data seeding scripts
│   │       └── migrateFromAudit.ts        # Import extracted content from audit/ JSON
│   │
│   ├── lib/
│   │   ├── payload.ts                     # Payload client for server components
│   │   ├── metadata.ts                    # generateMetadata() helpers
│   │   ├── structured-data.ts             # JSON-LD generators (Organization, Article, etc.)
│   │   ├── constants.ts                   # Site-wide constants
│   │   └── utils.ts                       # General utilities
│   │
│   └── styles/
│       └── globals.css                    # @tailwind base/components/utilities, brand-token CSS custom properties
│
├── public/
│   ├── fonts/                             # Self-hosted font files
│   └── images/                            # Static images (logo, favicon, og-default)
│
├── scripts/
│   └── warm-cache.ts                      # Post-deploy ISR cache warming (fetches URL list from sitemap)
│
├── Dockerfile                             # Production container image
├── .dockerignore
├── docker-compose.yml                     # Local dev: Postgres + app
├── payload.config.ts                      # Root Payload configuration
├── next.config.ts                         # Next.js config wrapped with withPayload()
├── tsconfig.json
├── .gitleaks.toml                         # Secret detection rules (pre-commit + CI)
├── .env.local                             # Local env vars (gitignored)
├── .env.example                           # Template with all vars documented (committed)
├── package.json
└── README.md                              # Setup instructions, architecture overview
```

---

## 5. Deployment Architecture

```
GitHub (public repo, main branch)
    │
    ▼
CI/CD (GitHub Actions)
    │
    ├── Build Docker image
    ├── Push to Amazon ECR
    └── Trigger ASG Instance Refresh (blue-green)
    
CloudFront (CDN + SSL termination)
    │  - ACM certificate (auto-renewing, zero maintenance)
    │  - Edge caching for static assets and ISR pages
    │  - www.seqtek.com → seqtek.com redirect
    │  - Deploy-time invalidation (/*) for immediate freshness
    │
    ▼
ALB (Application Load Balancer)
    │  - Health checks (/api/health)
    │  - Routes traffic to healthy EC2 targets
    │
    ▼
Auto Scaling Group (min=1, max=2, desired=1)
    │  - Blue-green deploys: temporarily scales to 2 during Instance Refresh
    │  - New instance must pass health check before old is terminated
    │  - Zero-downtime guaranteed
    │
    └── EC2 (t3.small, private subnet)
        │  - Docker container running Next.js + Payload (`next start`)
        │  - Single container serves public site + admin + API
        │  - Payload runs database migrations on container startup
        │  - ISR disk cache persists within the container lifecycle
        │  - Self-provisioning via launch template + user data script
        │  - IMDS hop limit 2 for IAM role access from container
    │
    ├── RDS PostgreSQL (db.t3.small, private subnet, same VPC)
    │   ├── Production database: all content, users, media metadata, versions/drafts
    │   └── Staging database: separate logical database in same RDS instance
    │
    ├── ECR (Elastic Container Registry)
    │   └── seqtek-website repository (tagged by git SHA + latest)
    │
    └── S3
        └── Media uploads bucket
            ├── Images (team photos, case study images, blog images)
            ├── Documents (if any downloadable resources)
            └── Served via CloudFront (separate origin, /media/* path pattern)
```

### Why EC2 Over Serverless

Payload CMS v3 is a long-lived Node process — it manages database connections, runs migrations on startup, and serves an admin panel that benefits from warm responses. Lambda's cold starts, connection churn, and ephemeral filesystem fight this at every level. A `t3.small` (~$10/month reserved) gives Payload a stable runtime and simplifies the entire deployment model to a single `next start` process.

### Container Strategy

The application is packaged as a Docker image and stored in Amazon ECR. This eliminates the platform mismatch problem of shipping `node_modules` cross-architecture — native modules like `sharp` compile correctly inside the container build.

The Dockerfile uses a multi-stage build: a `node:24-alpine` builder stage runs `npm ci && npm run build`, and a slim production stage copies only the built artifacts + production dependencies. Next.js is configured with `output: 'standalone'`, which produces a self-contained build that includes only the necessary `node_modules` — no full `node_modules` tree in the production image. The container entrypoint runs `node server.js` (the standalone server) directly — no process manager layer. Docker's own restart policy (`--restart=unless-stopped`) handles process recovery, and the ALB health check handles instance-level failure detection.

**IAM credentials in Docker:** The EC2 instance profile provides S3, Parameter Store, ECR, and CloudWatch access — no static AWS credentials. The launch template sets `HttpPutResponseHopLimit: 2` on the instance metadata options so the container can reach IMDSv2 through Docker's bridge network. The AWS SDK inside the container auto-discovers and auto-rotates credentials from the instance profile.

The EC2 instance runs Docker and pulls the latest image from ECR on launch. The launch template's user data script handles this bootstrapping automatically, making every instance fully self-provisioning.

### Deployment Pipeline (GitHub Actions)

On push to `main`:

1. **Build** the Docker image in GitHub Actions
2. **Push** the image to ECR, tagged with the git SHA and `latest`
3. **Update** the ASG launch template to reference the new image tag
4. **Trigger** an ASG Instance Refresh with `MinHealthyPercentage: 100`
5. **Post-deploy** — after the new instance is healthy: issue a CloudFront invalidation for `/*` and run the cache warming script

The Instance Refresh process: ASG launches a new instance with the updated launch template → new instance pulls the new Docker image from ECR → container starts, Payload runs migrations, health check passes → ALB routes traffic to the new instance → ASG terminates the old instance. Zero-downtime, zero manual intervention.

**Cost of blue-green:** A second `t3.small` runs for ~5-10 minutes during each deploy. At $0.0208/hour, that's ~$0.003 per deploy — fractions of a penny.

### Branch Strategy & Environments

| Branch | Deploys To | Database | Purpose |
|---|---|---|---|
| `main` | Production EC2 (`seqtek.com`) | `seqtek_prod` on RDS | Stable, reviewed code only |
| `staging` | Staging EC2 (staging subdomain) | `seqtek_staging` on RDS | Pre-production testing |
| feature branches | Local development | Local Postgres (Docker Compose) | Development |

Staging shares the RDS instance with production but uses a separate logical database. Connection limits are enforced per-database (`ALTER ROLE ... CONNECTION LIMIT`) to prevent staging from starving production. Development runs against a local Postgres instance via Docker Compose — no risk to RDS resources, and developers don't need VPN access or RDS credentials to work on features. Each deployed environment has its own S3 bucket to prevent media collisions.

Environment variables are stored in AWS Systems Manager Parameter Store and loaded into the EC2 instance environment via the instance profile. They are not in the repo or the CI pipeline.

### Local Development

Docker Compose provides a local Postgres instance. The app runs via `next dev` (not Docker) for fast HMR. S3 is not required — Payload falls back to local filesystem storage when S3 env vars are absent. No AWS credentials needed for local development. See [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) for full setup instructions.

### DNS & SSL

- **CloudFront** terminates SSL using an ACM (AWS Certificate Manager) certificate
- ACM certs are free and auto-renew — zero maintenance, no certbot, no Let's Encrypt cron jobs
- Redirect: `www.seqtek.com` → `seqtek.com` (CloudFront behavior)
- After DNS cutover, submit updated sitemap to Google Search Console

### VPC & Connectivity

EC2 and RDS both live in the same VPC. The Node process maintains a persistent connection pool to Postgres via Payload's built-in adapter (`@payloadcms/db-postgres`). Pool size is configured explicitly via the `pool` option — set to 10 connections for production. With a single Node process (no cluster mode) and a `db.t3.small` RDS instance (~150 max connections), this leaves ample headroom for staging and for Payload's admin queries. Security groups restrict:

- **EC2 inbound:** port 3000 from ALB security group only
- **RDS inbound:** port 5432 from EC2 security group only
- **ALB inbound:** port 443 from CloudFront managed prefix list
- **All outbound:** allowed (npm, S3, external APIs)

### Next.js Configuration

`next.config.ts` is wrapped with Payload's `withPayload()` and configures:

- **Output mode:** `output: 'standalone'` — produces a self-contained build with only the required `node_modules` files. Required for the Docker deployment strategy.
- **Image optimization:** `remotePatterns` allowlists the S3 bucket hostname (from `S3_BUCKET_HOSTNAME` env var). The env var is validated at runtime in the image loader, not at config load time, so local dev works without S3 credentials.
- **Security headers:** Applied to all routes — `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` disabling camera/microphone/geolocation. CSP is handled via middleware (see Section 6).
- **301 redirects:** Old Wix URLs mapped to new routes (`/about-us-1` → `/about`, `/our-services` → `/services`, `/blog-old` → `/insights`, `/workshops` → `/touchstone-workshops`). Full redirect map maintained in INTEGRATIONS.md.

### Scaling Path

If traffic or admin usage grows beyond what a single `t3.small` handles, the scaling path is horizontal — increase the ASG desired count. Each instance runs the full application (public site + admin + API). The ALB distributes traffic across instances automatically. This is simpler and more resilient than trying to separate admin and public workloads into different services.

---

## 6. Security Model (Public Repo)

The repo is public on GitHub. This is standard for marketing sites and consistent with the portfolio goal. The security model ensures no secrets leak while the code remains inspectable.

### Environment Variables

All secrets and configuration are managed via environment variables, never committed to the repo.

| Variable | Scope | Classification | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Server | **Secret** | Postgres connection string (includes credentials) |
| `PAYLOAD_SECRET` | Server | **Secret** | Payload encryption key for auth tokens |
| `S3_BUCKET` | Server | Config | S3 bucket name |
| `S3_REGION` | Server | Config | AWS region |
| `S3_BUCKET_HOSTNAME` | Server | Config | For next/image remotePatterns |
| `REVALIDATION_SECRET` | Server | **Secret** | Validates webhook requests |
| `NEXT_PUBLIC_SITE_URL` | Client | Public | Canonical URL (`https://seqtek.com`) |
| `NEXT_PUBLIC_HUBSPOT_PORTAL_ID` | Client | Public | HubSpot portal (8504846) |
| `NEXT_PUBLIC_GTM_ID` | Client | Public | GTM container ID |
| `NEXT_PUBLIC_SCOREAPP_URL` | Client | Public | ScoreApp assessment URL |

**S3 authentication:** No static AWS credentials (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`). The EC2 instance profile provides S3 access via IAM role. The container reaches the instance metadata service (IMDSv2, hop limit 2) to auto-discover and auto-rotate credentials. Payload's S3 storage adapter uses the default AWS credential chain — no configuration needed beyond the bucket name and region.

**Rules:**
- `.env.local` and all `.env*.local` files are in `.gitignore` (Next.js default)
- `.env.example` is committed with variable names only, no values
- All `NEXT_PUBLIC_*` vars are intentionally public (visible in client-side JS)
- All server-side vars are never exposed to the browser

### Payload Admin Authentication

Payload's admin panel at `/admin` is protected by its own authentication system:

- Email/password login with configurable token expiration
- Max login attempts with lockout (5 attempts, 10-minute lockout)
- JWT-based sessions with role claims
- No public registration endpoint — admin creates accounts

### Access Control

Every Payload collection has explicit access control functions:

- **Public read:** Published content only (status equals `published`)
- **Create:** Admin or Editor role required
- **Update:** Admin or Editor role required
- **Delete:** Admin role only
- **Admin panel access:** Admin role only

Draft content is never exposed to the public API or rendered on the public site without authentication.

| Operation | Public | Editor | Admin |
|---|---|---|---|
| View published content | ✓ | ✓ | ✓ |
| View drafts | — | ✓ | ✓ |
| Create content | — | ✓ | ✓ |
| Update own content | — | ✓ | ✓ |
| Update others' content | — | ✓ | ✓ |
| Publish content | — | ✓ | ✓ |
| Schedule publish (future `publishedAt`) | — | ✓ | ✓ |
| Delete content | — | — | ✓ |
| Manage users | — | — | ✓ |
| Access `/admin` | — | ✓ | ✓ |

**Scheduled publishing:** Editors set a future `publishedAt` date on any draft. A Payload `beforeChange` hook enforces the invariant — if `publishedAt` is in the future, `status` is forced back to `draft` regardless of what the editor submitted. A scheduled job runs every 5 minutes (AWS EventBridge rule → API route trigger at `/api/cron/publish-scheduled`, secured with a shared secret matching the revalidation pattern) and queries for documents where `status = 'draft'` AND `publishedAt <= now()`. Matching documents are flipped to `published`, and the same `afterChange` revalidation path runs — ISR cache busts, CloudFront paths invalidate, content goes live. Editors get publish-at-a-time without standing up a separate scheduling service, and the invariant holds even if the cron misfires (a manual save will still respect the future date).

### Content Security Policy

CSP is enforced via nonce-based policy generated per-request in Next.js middleware (`src/middleware.ts`). This approach provides real XSS protection — unlike `unsafe-inline`, a nonce-based policy ensures only scripts explicitly trusted by the server can execute.

**How it works:** The middleware generates a unique nonce for each request, injects it into the CSP header, and passes it to the root layout via a request header. The layout applies the nonce to all first-party `<script>` tags — including the inline `<head>` script that initializes GTM consent defaults (see INTEGRATIONS.md §2.2) — to the GTM loader (using GTM's nonce-aware script variant), and to HubSpot's tracking script (which also supports nonces). The `strict-dynamic` directive allows scripts loaded by trusted scripts to execute without additional allowlisting. The middleware also branches `style-src` by path: `/admin/*` receives the looser policy required by the Payload admin's Lexical editor; all other routes get the stricter `'self'`-only policy.

**Allowlisted origins:**

| Directive | Allowed Sources | Reason |
|---|---|---|
| `default-src` | `'self'` | Baseline restriction |
| `script-src` | `'nonce-{random}'` `'strict-dynamic'` | Nonce-based trust propagation |
| `style-src` | `'self'` on public routes; `'self' 'unsafe-inline'` on `/admin/*` | Tailwind compiles to static CSS — public pages don't need inline styles. The Payload admin's Lexical editor does need `'unsafe-inline'`, so the middleware applies the broader policy only when the request path begins with `/admin/`. |
| `img-src` | `'self'` `data:` `*.hubspot.com` `*.hsforms.net` S3 hostname | CMS media + HubSpot form images |
| `font-src` | `'self'` | Self-hosted fonts only |
| `connect-src` | `'self'` `*.hubspot.com` `*.hs-analytics.net` `*.hsforms.net` `*.hs-banner.com` `*.usemessages.com` `*.googletagmanager.com` | Analytics + form submissions |
| `frame-src` | `'self'` `*.hubspot.com` `*.hsforms.net` `meetings.hubspot.com` `*.hubspotusercontent.com` | HubSpot form + Meetings iframe embeds; Meetings static assets |

### HTTP Security Headers

Applied to all routes via `next.config.ts`:

| Header | Value | Purpose |
|---|---|---|
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME type sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables unused browser APIs |

### Rate Limiting

CloudFront includes AWS Shield Standard at no additional cost, which handles volumetric DDoS attacks (SYN floods, UDP reflection). For a low-traffic marketing site, this is sufficient at launch.

When needed, AWS WAF can be attached to the CloudFront distribution to add application-level rate limiting. WAF rate-based rules support thresholds as low as 10 requests per 5-minute window per IP. Cost is ~$5/month base + $1/month per rule + $0.60 per million requests evaluated. Add WAF if the site experiences bot abuse or needs fine-grained request throttling — not pre-emptively.

The `/api/revalidate` webhook endpoint validates a shared secret (`REVALIDATION_SECRET`) and rejects unauthenticated requests with 401. For normal content editing, revalidation is handled internally via Payload's `afterChange` hook — no external request needed.

### Secret Leak Prevention

The repo is public — a single accidental commit of credentials means they are in the git history permanently. `.gitignore` is necessary but not sufficient. Defense in depth:

1. **Pre-commit hook (gitleaks):** Runs automatically on every commit via Husky. Scans staged changes for AWS keys, database URLs, high-entropy strings, and common secret patterns. Rejects the commit if a match is found. Configured via `.gitleaks.toml` in the repo root.
2. **CI check:** GitHub Actions runs `gitleaks` against the full diff on every PR. Catches anything that bypassed the local hook (e.g., contributor without Husky installed).
3. **`.gitignore`:** `.env.local`, `.env*.local`, `audit/`, and any file matching common credential patterns.
4. **`.env.example`:** Committed with variable names and comments only — no values, no placeholders that look like real secrets.

### What to Keep Out of the Public Repo

- No `.env` files with values
- No hardcoded API keys, tokens, passwords, or connection strings
- No internal IP addresses, VPN configurations, or infrastructure details
- No client names in content that haven't been approved for public use
- The `audit/` directory is gitignored — it contains crawled content from the current Wix site and internal analysis. Kept locally for reference during content migration, not published.

---

## 7. Performance Targets

| Metric | Target | Current (Wix) | How We Achieve It |
|---|---|---|---|
| Desktop LCP | <500ms | 1.7s | ISR static pages, self-hosted fonts, optimized images |
| Mobile LCP | <2.0s | 7.8s | No Wix framework overhead, lazy-loaded third-party scripts, responsive images |
| FCP | <1.0s | 0.7s desktop / 1.9s mobile | Font preloading, critical CSS inlined by Tailwind |
| CLS | 0 | Unknown | Explicit image dimensions, no layout shift from fonts |
| TBT | <100ms | 4ms desktop / 348ms mobile | Third-party scripts deferred (`afterInteractive`, `lazyOnload`) |
| Lighthouse Performance | 95+ | 92 desktop / 66 mobile | All of the above |
| Lighthouse Best Practices | 95+ | 54 | No Wix framework overhead, proper security headers |
| Lighthouse SEO | 95+ | 85 | Structured data, semantic HTML, meta tags |
| Lighthouse Accessibility | 95+ | Unknown | WCAG 2.1 AA compliance |

### How to Hit These Numbers

1. **Self-hosted fonts** with `font-display: swap` and preload hints in `<head>`
2. **`next/image`** for all images with explicit `width`/`height` and `priority` on above-the-fold images
3. **ISR** for all public pages — visitors always hit the CDN-cached version
4. **Third-party scripts** loaded with `afterInteractive` or `lazyOnload` — never render-blocking
5. **Tailwind CSS** — only ships CSS classes actually used (tree-shaken at build)
6. **`sharp`** for server-side image optimization (WebP/AVIF)
7. **No client-side JavaScript for content** — pages are server-rendered, hydrated minimally
8. **Lazy load below-the-fold sections** — testimonial carousels, logo bars, blog grids
9. **Preconnect** to critical origins (S3/CloudFront, HubSpot) in `<head>`

---

## 8. Monitoring & Health

### Health Check Endpoint

`GET /api/health` — used by the ALB target group health check. Returns HTTP 200 with status, uptime, database connectivity, and timestamp. If the database is unreachable, it returns 503 so the ALB stops routing traffic to the instance.

### CloudWatch Alarms

| Alarm | Metric | Threshold | Action |
|---|---|---|---|
| **5xx Error Rate** | ALB HTTPCode_Target_5XX | >5 in 5 minutes | SNS → email notification |
| **Unhealthy Host** | ALB UnHealthyHostCount | >0 for 2 minutes | SNS → email notification |
| **CPU Utilization** | EC2 CPUUtilization | >80% sustained 10 min | SNS → evaluate scaling |
| **Memory Utilization** | EC2 (CloudWatch Agent) | >85% sustained 10 min | SNS → evaluate instance size |
| **Disk Usage** | EC2 (CloudWatch Agent) | >80% | SNS → clean ISR cache or resize volume |
| **RDS CPU** | RDS CPUUtilization | >80% sustained 10 min | SNS → evaluate instance class |
| **RDS Free Storage** | RDS FreeStorageSpace | <2 GB | SNS → increase storage |
| **RDS Connections** | RDS DatabaseConnections | >80% of max | SNS → investigate connection leaks |

### Application Logging

The Node process writes to stdout/stderr. Docker captures container logs via the `json-file` or `awslogs` logging driver. The CloudWatch Agent forwards logs to CloudWatch Logs for centralized search and retention.

Log levels:
- **Error:** Unhandled exceptions, database failures, S3 upload errors
- **Warn:** Failed login attempts, rate limit hits, revalidation failures
- **Info:** Deployment events, process restarts, migration runs

### Uptime Monitoring

External uptime check (e.g., AWS Route 53 health check or a simple ping service) against `https://seqtek.com/api/health` every 60 seconds. Alerts if the site is unreachable from outside the VPC — catches CloudFront, DNS, and certificate issues that internal health checks wouldn't detect.

### Future Consideration

If error volume or debugging complexity warrants it, add Sentry for application-level error capture with stack traces, breadcrumbs, and release tracking. Not needed at launch for a marketing site with minimal client-side interactivity.

---

## 9. Backups & Availability

### Backups

| Resource | Strategy | Retention | Recovery |
|---|---|---|---|
| **RDS PostgreSQL** | Automated daily snapshots + continuous transaction logs | 7 days | Point-in-time restore to any second within the retention window |
| **S3 Media Bucket** | Versioning enabled on the bucket | 90-day lifecycle rule on non-current versions | Restore any previous version of an object |
| **Docker Images** | ECR retains tagged images | Lifecycle policy: keep last 10 tagged images | Roll back by deploying a previous image tag |
| **EC2 Instance** | Nothing to back up — instance is disposable | N/A | Launch template + Docker image + Parameter Store = fully reconstructable |
| **ISR Cache** | Not backed up — regenerates on next request | N/A | Self-healing; cache warming script accelerates cold start |

RDS automated backups are enabled at instance creation. The backup window should be set to a low-traffic period (e.g., 06:00–07:00 UTC). Manual snapshots can be taken before major migrations and retained indefinitely.

### Availability Architecture

The EC2 instance runs inside an Auto Scaling Group (ASG) with `min=1, max=2, desired=1`. During normal operation, a single instance serves all traffic. The `max=2` allows the ASG to temporarily run two instances during blue-green deploys (Instance Refresh) and during self-healing replacements.

```
CloudFront
    │
    ▼
ALB (health check: /api/health, interval: 30s, threshold: 3)
    │
    ▼
Auto Scaling Group (min=1, max=2, desired=1)
    │
    └── EC2 (launch template)
        ├── Amazon Linux 2023 with Docker + CloudWatch Agent
        ├── User data script: pull image from ECR, load env from Parameter Store, docker run
        ├── Docker restart policy handles process recovery
        └── Healthy in ~2-3 minutes after launch
```

If the instance fails — hardware issue, OS crash, failed health check — the ASG automatically terminates it and launches a replacement from the launch template. This costs nothing beyond the single EC2 instance — the ASG itself is free.

### Failure Scenarios

| Scenario | Impact | Recovery | Time |
|---|---|---|---|
| **EC2 hardware failure** | Site down (CloudFront serves stale cache briefly) | ASG replaces instance automatically | ~3 minutes |
| **Application crash** | Docker restart policy relaunches the container | Automatic (Docker `--restart=unless-stopped`) | ~10 seconds |
| **Bad deploy** | New instance fails health check | ASG Instance Refresh aborts, old instance stays running | Zero impact — blue-green protects against this |
| **RDS failure (single-AZ)** | Site errors on all DB-dependent pages | RDS restores from automated backup | ~15-30 minutes |
| **RDS failure (multi-AZ)** | Brief interruption | Automatic failover to standby | ~1-2 minutes |
| **S3 outage** | Media images broken, uploads fail | Wait for AWS resolution (99.999999999% durability) | Extremely rare |
| **CloudFront outage** | Site unreachable | Wait for AWS resolution | Extremely rare |

### RDS Multi-AZ Decision

Single-AZ RDS is fine for launch — a marketing site can tolerate 15-30 minutes of downtime for a database restore. Multi-AZ adds ~$15/month (doubles the RDS cost for a `db.t3.small`) and provides automatic failover in 1-2 minutes. Enable it when the site is generating meaningful lead volume and downtime has a real cost.

### Launch Template

The ASG launch template captures the full instance configuration:

- Instance type (`t3.small`)
- AMI (Amazon Linux 2023 with Docker and CloudWatch Agent pre-installed)
- Security group (port 3000 from ALB only)
- IAM instance profile (Parameter Store read, ECR pull, S3 access, CloudWatch write)
- Metadata options: IMDSv2 required, `HttpPutResponseHopLimit: 2` (allows container to reach IMDS through Docker bridge network)
- User data script that pulls the Docker image from ECR and starts the container with `--restart=unless-stopped`

This means a new instance is fully self-provisioning — no SSH required for recovery.

---

## 10. Code Quality Standards

Since this is an open-source portfolio piece, code quality must be exemplary.

- **TypeScript strict mode** — `strict: true` in tsconfig, no `any` types
- **ESLint** — `next/core-web-vitals` + strict rules
- **Prettier** — Consistent formatting, enforced in CI
- **File naming** — kebab-case for files, PascalCase for components, camelCase for utilities
- **Component design** — Small, single-purpose, composed into page sections. No god components.
- **Payload types** — Auto-generated from collection configs. No manual type maintenance.
- **Git hygiene** — Meaningful commit messages, clean history, no merge commits on main
- **README** — Setup instructions, architecture overview, deployment notes, environment variable documentation
- **No dead code** — No commented-out blocks, no unused imports, no placeholder TODOs in shipped code
- **Accessibility** — WCAG 2.1 AA minimum. Keyboard navigation, ARIA labels, color contrast, focus indicators, skip-to-content link, alt text on all images (enforced in Payload schema)
- **Semantic HTML** — `<article>`, `<section>`, `<nav>`, `<aside>`, `<main>`. Single `<h1>` per page. Proper heading hierarchy.

---

## 11. Implementation Phases

| Phase | Scope | Estimated Duration |
|---|---|---|
| **1. Foundation** | Next.js + Payload + Tailwind scaffold. Dockerfile + ECR repository. EC2 + ALB + CloudFront infrastructure. RDS + S3 provisioning. GitHub Actions CI/CD with blue-green deploys. Base layout components (Header, Footer, Nav). CSP middleware. HubSpot + GTM in root layout. CloudWatch alarms + health endpoint. | 1-2 weeks |
| **2. Content Models** | All Payload collections and globals defined. Admin panel functional. Seed script imports audit data into Payload. | 1 week |
| **3. Core Pages** | Homepage, About section (4 pages), Services (overview + 3 pillars + 15 services), Case Studies (listing + 8 pages), Contact + booking. | 2-3 weeks |
| **4. Content & Blog** | Blog (listing + posts + categories), Touchstone Workshops (landing + 3 pages), Assessment landing page, Industry pages, Market landing pages. | 1-2 weeks |
| **5. Polish** | SEO (structured data, sitemap, meta tags). Accessibility audit. Performance optimization. 301 redirects from old Wix URLs. Cookie consent flow. Cross-browser/device QA. | 1-2 weeks |
| **6. Launch** | DNS cutover. Monitor errors/performance. Google Search Console submission. Redirect verification. CloudFront cache behavior validation. | 1 week |

**Total engineering estimate: 7-11 weeks** (code only — content production runs in parallel and is the likely bottleneck).

---

## 12. Testing Strategy

Tests exist to protect load-bearing logic and catch regressions before they ship. A marketing site doesn't need 90% line coverage on view components — it needs absolute confidence that access control, content hooks, and the revalidation pipeline behave correctly under every deploy.

### Test Pyramid

| Tool | Purpose | Runtime |
|---|---|---|
| **Vitest** | Unit tests for Payload access functions, hooks, slug generation, metadata builders, structured data generators, utility modules | Pre-commit hook + CI on every commit |
| **Playwright** | E2E flows — admin login, content publish + ISR revalidation, HubSpot form submission, public page rendering, 301 redirect verification | CI on every PR; nightly run on `main` against staging |
| **axe-core** | Accessibility assertions wired into Playwright. Fails CI on any WCAG 2.2 AA violation | CI on every PR (inside Playwright suite) |
| **Lighthouse CI** | Performance budgets matching §7 targets exactly | CI on every PR |
| **`aws-cdk-lib/assertions`** | Infrastructure invariants (covered in §13) | CI on every PR |

Vitest runs on every commit via a Husky pre-commit hook and again in CI. Playwright + axe + Lighthouse run on every pull request via GitHub Actions against an ephemeral preview environment (`next start` against a disposable Postgres container and an S3 stub backed by the local filesystem). A nightly Playwright run hits the deployed staging environment to catch drift between code and infrastructure that PR-time tests can't see.

### Coverage Philosophy

Test load-bearing logic exhaustively. Access control functions, Payload hooks (`beforeChange` slug enforcement, `afterChange` revalidation), the scheduled-publish job, and the `/api/revalidate` secret validation are all unit-tested with every branch covered. UI components are tested via Playwright at the page level — visual regression and accessibility checks catch what unit assertions can't articulate. No coverage gate on component files. The CI gate is "all tests pass and Lighthouse budgets hold," not a coverage percentage.

### Test Data

Vitest uses Postgres via `testcontainers` — each suite spins up a real Postgres container, runs Payload migrations, seeds fixtures, and tears down. No mocking the database; the access control logic depends on real Postgres queries and we test it against real Postgres. Playwright runs against `next start` connected to a disposable Postgres container with S3 stubbed to the local filesystem (Payload's S3 adapter is replaced with the disk adapter for the test run). Fixtures are deterministic — the same seed script runs before every Playwright suite.

### Visual Regression

Playwright captures screenshots of the 5 archetype pages from BLOCK_LIBRARY.md (Home, About, Service Pillar, Service Detail, Case Study) at 3 viewports — 375px, 768px, 1440px — for 15 baseline snapshots. Tolerance is tuned to ignore CMS-driven content text and image differences (per-block masking on dynamic content regions) while still flagging layout, color, and typography changes. Baselines are committed to the repo; failures produce a side-by-side diff in the PR.

### Lighthouse CI Budgets

Budgets match §7 numbers exactly. CI fails if Mobile LCP > 2.0s, TBT > 100ms, or Performance score < 95. Budgets are checked against the 5 archetype pages on a throttled mobile profile. Lighthouse CI runs against the same ephemeral preview as Playwright — same code, same data, same network conditions every run.

---

## 13. Infrastructure as Code

All AWS infrastructure is defined in **AWS CDK (TypeScript)**. No console clicks, no Terraform, no untracked drift. Every resource — VPC, ALB, ASG, RDS, S3, CloudFront, IAM roles, CloudWatch alarms — is declared in code, reviewed via PR, and deployed via CI.

### Why CDK

CDK keeps the entire stack in TypeScript alongside the application. The same engineers who write the app write the infrastructure, using the same language, the same tsconfig, the same linter. CDK generates CloudFormation, which means AWS-native rollback, drift detection, and change-set previews come for free. The L2/L3 constructs for the exact services we use (ALB, ASG, ECR, RDS, CloudFront, ACM, Route53) are mature and well-documented. For an AWS-only shop like SEQTEK, CDK is the strongest fit — Terraform's cross-cloud abstraction is overhead we don't need.

### Project Structure

```
infra/
├── bin/
│   └── app.ts                    # CDK app entry
├── lib/
│   ├── network-stack.ts          # VPC, subnets, SGs, NAT
│   ├── data-stack.ts             # RDS, S3, Parameter Store
│   ├── compute-stack.ts          # ECR, ALB, ASG, launch template, IAM
│   ├── edge-stack.ts             # CloudFront, ACM, Route53
│   └── observability-stack.ts    # CloudWatch alarms, SNS topics
├── test/                         # CDK assertion tests
├── cdk.json
├── package.json
└── tsconfig.json
```

### Stack Split Rationale

Stacks are split by blast radius and rate of change. The network stack (VPC, subnets, security groups, NAT) changes maybe once a year. The compute stack changes on every deploy. Keeping them in separate CloudFormation stacks means an ASG launch template update doesn't drag the VPC plan through CloudFormation's change-set diff — faster deploys, smaller failure surface, no risk of an unrelated resource being touched. Data and edge stacks sit between those two extremes; observability is its own stack because alarms reference resources across all the others and centralizing them keeps the cross-stack references one-directional.

### Environment Handling

One CDK app deploys both production and staging environments via CDK context. `cdk deploy -c env=staging SeqtekStaging*` deploys the staging stacks; `cdk deploy -c env=prod SeqtekProd*` deploys production. Stack names are prefixed (`SeqtekProdNetwork`, `SeqtekStagingNetwork`, `SeqtekProdCompute`, etc.) so the two environments coexist in the same AWS account without name collisions. Per-environment values (instance sizes, RDS class, domain names) live in `cdk.json` under the `context` key, keyed by environment.

### Bootstrap

`cdk bootstrap aws://<account>/<region>` runs once per account/region. Bootstrap provisions the CDK toolkit stack (S3 staging bucket, ECR repository for assets, deploy IAM roles). A dedicated deploy IAM role is referenced via `--role-arn` on every `cdk deploy` — engineers never deploy with their own credentials, only CI does, and CI assumes the deploy role via OIDC.

### CI/CD Integration

| Trigger | CDK Step | Approval |
|---|---|---|
| **PR opened/updated** | `cdk synth` + `cdk diff --strict` posted as PR comment | None (read-only) |
| **Merge to `main`** | Docker build/push to ECR, then `cdk deploy SeqtekProd*Compute --require-approval never` | None (compute only) |
| **Network/data stack changes** | `cdk deploy SeqtekProdNetwork` or `SeqtekProdData` via `workflow_dispatch` | Manual approval in GitHub Environments |
| **CDK assertion tests** | `vitest run infra/test/` | None (gating CI) |

Compute stack deploys are fully automated — they happen on every merge to `main` after the Docker build and ECR push. Network and data stack changes require a `workflow_dispatch` trigger with a manual approval gate. This matches the blast-radius split: deploying a new app version is routine, modifying the VPC or RDS instance is a planned operation.

### Secrets and Config

Parameter Store holds all environment-specific values. CDK references them at deploy time via `StringParameter.valueFromLookup()` (resolved during synth, baked into the CloudFormation template) for values that are safe to embed, or via `StringParameter.fromStringParameterName()` (resolved at runtime by CloudFormation) for values that must stay out of the synthesized template. No secrets in CDK code, no secrets in the synthesized template for sensitive values. The application reads from Parameter Store at runtime via the instance profile — same chain as the AWS SDK credentials.

### Local Dev

Engineers run `cdk synth` and `cdk diff` locally to validate changes against the current account state. `cdk deploy` from a developer machine is forbidden for prod and staging — those deploys only happen through CI. `cdk destroy` is allowed only against ephemeral preview stacks (a future addition; not in scope at launch). The `cdk.json` `app` command points at `npx ts-node bin/app.ts` so no build step is required for local synth.

### CDK Assertion Tests

Vitest-compatible tests under `infra/test/` use `aws-cdk-lib/assertions` to verify critical invariants on the synthesized templates:

- RDS instance is in a private isolated subnet (no internet route)
- ALB has an HTTPS listener with TLS 1.2+ policy
- S3 media bucket has versioning enabled and public access blocked
- CloudFront distribution has the correct Origin Access Control attached to the S3 origin
- EC2 instance profile has the expected IAM policies and no wildcards on sensitive actions
- All security groups deny ingress from `0.0.0.0/0` except the CloudFront-fronted ALB on 443

These tests run in the same CI workflow as the application tests and gate the deploy. An infrastructure change that breaks an invariant fails the PR before `cdk deploy` ever runs.
