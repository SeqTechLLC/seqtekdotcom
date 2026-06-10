# Feature Specification: Media via CloudFront `/media/*`

**Feature Branch**: `feat/009-media-cloudfront-serving`

**Created**: 2026-06-09

**Status**: Draft

**Input**: User description: "Serve Payload media via CloudFront /media/\* with correct serverURL (implements ADR 0008). Staging activated S3 media storage (PRs #38/#39/#41) and the first content seed exposed that Payload generates media URLs as http://localhost:3100/api/media/file/<filename>, so headshots are broken on https://seqtek-preview.com/team."

## Context & Background

Staging activated S3 media storage (PRs #38 `s3_region`, #39 `prefix` migration, #41 always-register plugin), and the first real content seed — 27 curated images + 10 team members pushed over the REST API — exposed that **media does not render on the live site**: 10/12 images on `https://seqtek-preview.com/team` are broken. The media documents carry URLs like `http://localhost:3100/api/media/file/headshot-hank-haines.webp`.

ADR 0008 (`docs/decisions/0008-media-cloudfront-serving.md`, Proposed) holds the full analysis. Three independent gaps:

1. **Wrong host.** `payload.config.ts` sets `serverURL` from `NEXT_PUBLIC_SITE_URL` with a `http://localhost:3100` fallback, and staging provisions no `next_public_site_url` SSM parameter — so every deployed container falls back to localhost. This poisons more than media: canonical URLs, OG tags, and sitemap absolute URLs all derive from the same value.
2. **Wrong path.** The storage adapter defaults to serving media through the Next app (`<serverURL>/api/media/file/<filename>`), streaming from S3 on every request. But the edge stack already defines a CloudFront **`/media/*`** behavior backed by the media bucket via OAC with `CACHING_OPTIMIZED` (`infra/lib/edge-stack.ts`), and `S3_BUCKET_HOSTNAME` is already wired into `src/proxy.ts` and the CSP. The intended CDN path exists and is unused.
3. **Ambiguous key shape.** `src/payload/storage/s3.ts` sets `prefix: ''` (objects land at bare `<filename>`) while its own comment and ARCHITECTURE.md §5 claim `<media-id>/<filename>`. The CloudFront `/media/*` behavior has **no originPath**, so a request for `/media/<x>` is forwarded to S3 as key `media/<x>` — the URL path, the S3 key shape, and the CDN behavior must be reconciled to a single agreeing form.

A compounding detail: the Media collection generates **image-size variants** (`src/collections/Media.ts` `imageSizes`), each stored as its own S3 object with its own URL — so the key-shape and URL-generation decisions apply to every variant, not just originals.

ADR 0008 adopts full CloudFront wiring (Option A) as the target, allowing the `serverURL`-only stopgap (Option B) as an interim unblock only. This feature implements Option A and flips the ADR to Accepted.

## Clarifications

### Session 2026-06-09

- Q: Which S3 object-key shape should media use, given the `/media/*` CloudFront behavior has no originPath (URL path forwards verbatim as the S3 key)? → A: **`media/<filename>`** — a static `media` prefix on the storage adapter. The CDN behavior works as-is (path == key, zero infra change); Payload's per-collection filename uniqueness handles collisions; the id-namespaced form (`<media-id>/<filename>`) is dropped from ARCHITECTURE §5 in favor of the settled shape. The 27 already-uploaded staging objects (stored at bare `<filename>`) plus their size variants must be re-keyed via delete + re-push. _(Re-key mechanics amended at plan time to an in-place S3 move + per-document prefix update — see FR-005 and plan research R4; the key-shape answer itself is unchanged.)_

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Visitors see media, served from the edge (Priority: P1)

A visitor opens `https://seqtek-preview.com/team` and every team headshot renders. The images are delivered from the CloudFront edge cache via the `/media/*` behavior — not proxied through the application server — so repeat views are cache hits and media traffic never pins the app instances.

**Why this priority**: This is the user-visible breakage (10/12 broken images on a marquee page) and the reason the feature exists. It also realizes the CDN architecture the edge stack was built for — the stopgap alternative (app-proxied media) would render images but defeat the edge cache.

**Independent Test**: Load staging `/team` and confirm all headshots render; request an image URL twice and confirm the second response is served from the CDN cache (cache-hit response header) with a long-lived cache policy, and that the URL path is `/media/...`, not `/api/media/file/...`.

**Acceptance Scenarios**:

1. **Given** the seeded staging content, **When** a visitor loads `/team`, **Then** all team-member headshots render (no broken images).
2. **Given** a rendered media URL on any staging page, **When** it is inspected, **Then** it points at the `/media/*` edge path on a correct public host — never `localhost` and never the app-proxy path.
3. **Given** a media URL requested twice, **When** the second response is inspected, **Then** it is served from the edge cache with the long-TTL cache policy and compression.
4. **Given** a newly uploaded media document (via admin or the ingest tooling), **When** its URL is generated, **Then** it follows the same edge path and renders without any re-keying step.

---

### User Story 2 - Correct absolute URLs site-wide (Priority: P2)

Search engines and social platforms consuming staging pages see correct absolute URLs: canonical tags, Open Graph tags, structured data, and the sitemap all reference the real public host instead of `localhost:3100`.

**Why this priority**: The missing public-site-URL provisioning is one of the three root causes and silently corrupts SEO surfaces beyond media. It is invisible to a human visitor but harmful to crawlers and link previews. It is separable from Story 1 (it fixes the host; Story 1 fixes the path and caching).

**Independent Test**: Fetch staging pages and the sitemap; confirm no `localhost` appears in any canonical, OG, structured-data, or sitemap URL.

**Acceptance Scenarios**:

1. **Given** the deployed staging environment, **When** any page's canonical/OG/structured-data URLs are inspected, **Then** they use `https://seqtek-preview.com`.
2. **Given** the staging sitemap, **When** it is fetched, **Then** every entry is an absolute URL on the public host.
3. **Given** the production environment at cutover, **When** the same provisioning pattern is applied with the production domain, **Then** no code change is required — only configuration.

---

### User Story 3 - One documented key shape, ADR accepted (Priority: P3)

An engineer reading ARCHITECTURE.md §5, the storage adapter, or the edge-stack config sees the **same** object-key shape everywhere, and the actual objects in the bucket match it. ADR 0008 records the settled decision as Accepted.

**Why this priority**: Today three sources of truth disagree (config says bare `<filename>`, two docs say `<media-id>/<filename>`, and the CDN behavior implies a `media/`-prefixed mapping). Left unreconciled, the next media change re-introduces this class of bug. It is documentation/consistency work that depends on the Story 1 decision but doesn't block rendering.

**Independent Test**: Read ARCHITECTURE.md §5, the adapter source, and the edge-stack `/media/*` behavior; confirm all three state the settled `media/<filename>` shape, confirm the bucket's actual objects match it, and confirm ADR 0008 status is Accepted.

**Acceptance Scenarios**:

1. **Given** the settled `media/<filename>` key shape, **When** ARCHITECTURE.md §5, the storage adapter, and the CDN behavior are compared, **Then** all three agree, with the `/media/*` URL path mapping verbatim to the S3 key (no originPath, no rewrite).
2. **Given** the 27 already-uploaded staging objects (plus their size variants) stored at bare `<filename>`, **When** they are re-keyed in place (S3 move + per-document prefix update, per FR-005), **Then** the bucket holds only `media/`-prefixed objects, media IDs and team-member relations are unchanged, and `/team` still renders afterward.
3. **Given** the implemented design, **When** ADR 0008 is reviewed, **Then** its status is Accepted and its open sub-decisions (key shape, URL host, serverURL) record the chosen answers.

---

### Edge Cases

- **Local dev / CI (S3 disabled)**: the storage plugin is registered but inactive without `S3_BUCKET`/`S3_REGION`; uploads use the local filesystem and serve via the app path. The URL-generation change MUST NOT break this fallback — local dev keeps working with no S3 access and no CDN.
- **Image-size variants**: every generated variant is its own S3 object with its own URL; the key shape and edge-path URL generation must hold for variants, not just originals. An in-place re-key must move every variant object alongside its original (the fallback delete + re-push would regenerate them instead).
- **URL path ↔ key mapping**: the `/media/*` behavior forwards the full request path as the S3 key (no originPath), so a bare-`<filename>` object is **not** reachable at `/media/<filename>`. Resolved by the settled key shape: objects gain the static `media/` prefix and the path maps verbatim — no originPath, no rewrite function.
- **Missing object**: S3 returns 403 (not 404) for missing keys under OAC; the 404 remap is a known deferred item (edge-stack comment, Phase 5.5) and stays out of scope here.
- **Admin panel**: media thumbnails and previews in `/admin` consume the same generated URLs; they must render for authenticated editors after the change.
- **Stale URLs in seeded content**: media documents seeded before the fix carry localhost URLs only if URLs are persisted rather than computed; if any URL is stored in the database, the fix must account for refreshing it (Payload computes URLs at read time from config, so this is expected to be a non-issue — verify, don't assume).
- **CSP**: the image-source allowlist already includes `S3_BUCKET_HOSTNAME`; if the chosen URL host is the site domain (`/media/*` on the main distribution), same-origin already passes — confirm no CSP regression either way.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Deployed environments MUST provision the public site URL (a `next_public_site_url` SSM parameter mapped into the container environment, mirroring the #38 `s3_region` pattern) so `serverURL` resolves to the real public host — `https://seqtek-preview.com` on staging — and never falls back to localhost.
- **FR-002**: Generated media URLs in deployed environments MUST point at the CloudFront `/media/*` edge path instead of the app-proxy path (`/api/media/file/...`), for originals and all image-size variants.
- **FR-003**: Media requests on the edge path MUST be served by the existing S3-via-OAC behavior with its long-TTL cache policy — media bytes are not streamed through the application server.
- **FR-004**: The S3 object-key shape is settled as **`media/<filename>`** (static `media` prefix on the storage adapter, originals and size variants alike) and MUST agree across the storage adapter, the CDN behavior's verbatim path→key mapping (`/media/<filename>` → key `media/<filename>`, no originPath, no rewrite), and ARCHITECTURE.md §5 (updated from its current `<media-id>/<filename>` claim).
- **FR-005**: The existing staging objects — stored at bare `<filename>`, which the settled shape obsoletes — MUST be re-keyed (originals and size variants) **in place**: S3 server-side move to `media/<key>` plus a per-document `prefix` update over the REST API (with an `IMPORT_TOKEN`), preserving media IDs so the seeded relations (team-member headshots) are untouched, and the seeded pages MUST render correctly afterward. _(Amended at plan time from "delete + re-push via `push-to-payload.ts`" — plan research R4: delete + re-push mints new media IDs and orphans the hand-wired team-member relations; delete + re-push remains the documented fallback.)_
- **FR-006**: Local development and CI (S3 inactive) MUST continue to work unchanged: local-filesystem uploads, app-served media, no S3 or CDN dependency.
- **FR-007**: Absolute URLs derived from the server URL — canonical tags, OG tags, structured data, sitemap — MUST use the provisioned public host in deployed environments.
- **FR-008**: The production environment MUST inherit the same design at cutover via configuration only (its own site-URL value), with no further code change.
- **FR-009**: ADR 0008 MUST be updated from Proposed to Accepted, recording the resolved sub-decisions (key shape, URL host, serverURL provisioning).
- **FR-010**: The fix MUST be verified on staging: `/team` headshots render, media responses are edge-cached, and no localhost URL appears in any rendered page, feed, or sitemap.
- **FR-011**: Replacing or deleting a media file MUST NOT leave stale bytes served from the edge: with stable `media/<filename>` keys, a same-filename replacement no longer produces a new key, so the affected `/media/*` paths (original + size variants) MUST be invalidated at the CDN on replace and delete. No-op in environments without a CDN (local dev / CI). _(Added at analysis time to cover the plan R7 scope — stable keys forfeit the natural cache-busting that ARCHITECTURE §6 previously relied on.)_

### Key Entities _(include if feature involves data)_

- **Media document**: a Payload upload record (original + generated size variants); its public URL is computed at read time from server configuration — the subject of the URL-generation fix.
- **S3 object key**: the storage address of one media file (original or variant); settled as `media/<filename>`, matching the CDN's verbatim path→key mapping and the docs.
- **`/media/*` edge behavior**: the existing CloudFront cache behavior (S3 origin via OAC, long TTL, compression) that becomes the public serving path for all media.
- **Public site URL**: the per-environment absolute origin (`https://seqtek-preview.com` staging; `https://seqtek.com` prod at cutover) feeding `serverURL` and all absolute-URL surfaces; provisioned as deploy configuration, never hardcoded.
- **Staging seed set**: the 27 curated images (+ variants) and 10 team members already uploaded; the migration surface for the settled key-shape change.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of images on staging `/team` render (currently 2 of 12).
- **SC-002**: A repeated request for any staging media URL is served from the CDN edge cache (observable cache-hit indicator), and zero media requests reach the application server's media-file route in normal page views.
- **SC-003**: Zero occurrences of `localhost` in any URL emitted by staging pages, OG/canonical tags, structured data, or the sitemap.
- **SC-004**: ARCHITECTURE.md §5, the storage adapter, and the CDN configuration all state the settled `media/<filename>` key shape, and 100% of objects in the staging media bucket conform to it.
- **SC-005**: ADR 0008 status is Accepted with all three open sub-decisions recorded.
- **SC-006**: A fresh upload through the admin or ingest tooling renders on a staging page with no manual URL or key fix-up.

## Assumptions

- **URL host is the site domain.** ADR 0008 leaves site-domain vs. dedicated media host (`S3_BUCKET_HOSTNAME`) open, but the `/media/*` behavior already exists on the main distribution and the ADR itself names it the lower-friction choice — this spec assumes the site domain unless clarification says otherwise. CSP is unaffected (same-origin).
- **`serverURL` provisioning happens regardless of the media path decision** — ADR 0008 calls it out as needed for canonical/OG/sitemap correctness independent of media.
- **Payload computes media URLs at read time** from server configuration rather than persisting them per-document, so already-seeded documents pick up corrected URLs without a data migration (verified during implementation; the re-key in FR-005 is only about S3 object keys, not stored URLs).
- **The 27-object staging set is small enough to re-key in place** in minutes: a one-shot idempotent script performs the S3 server-side moves plus the per-document prefix updates (FR-005); delete + re-push via the existing ingest tooling remains the documented fallback.
- **Production is unaffected today** (not yet live); it inherits the fix at cutover per FR-008.
- **The S3 403-for-missing-object → 404 remap stays deferred** (Phase 5.5 polish per the edge-stack note); this feature does not change error-page behavior.
