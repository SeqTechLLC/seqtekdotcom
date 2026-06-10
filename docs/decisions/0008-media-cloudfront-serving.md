# 0008. Serve Payload media via CloudFront `/media/*`, not the app proxy

**Status:** Accepted (2026-06-10, spec 009)
**Date:** 2026-06-09

## Context

Staging activated S3 media storage (PRs #38 `s3_region`, #39 `prefix` migration, #41 always-register plugin). The first real content seed (27 curated images + 10 team members via the REST API) exposed that **media does not render on the live site**: 10/12 images on `/team` are broken.

The media docs generate URLs like:

```
http://localhost:3100/api/media/file/headshot-hank-haines.webp
```

Three independent gaps between the intended design and the actual config:

1. **Host is `localhost:3100`.** `payload.config.ts` sets `serverURL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100'`, and staging provisions **no** `next_public_site_url` SSM param (only `google_client_*`, `s3_*`, `slack_webhook_url`), so `serverURL` falls back to localhost on the deployed container.
2. **Path is the app proxy `/api/media/file/...`, not the CDN.** `edge-stack.ts` already defines a CloudFront **`/media/*`** behavior backed by the S3 media bucket via OAC (long TTL), and `S3_BUCKET_HOSTNAME` is already wired into `src/proxy.ts` and the CSP (`src/lib/csp.ts`). But `@payloadcms/storage-s3` defaults to serving through the Next app (`<serverURL>/api/media/file/<filename>`), which streams from S3 on every request — bypassing the CDN and pinning every media hit to EC2.
3. **Key shape is bare `<filename>`.** `src/payload/storage/s3.ts` sets `prefix: ''`, so objects land at `<filename>`. ARCHITECTURE.md §5 and the in-file comment claim `<media-id>/<filename>`. The CloudFront `/media/*` behavior and any direct-URL generation must agree with the actual key shape.

This was invisible until now because no rendered media existed on any deployed page.

## Options considered

- **A — Full CloudFront wiring.** Configure the storage adapter's URL generation (e.g. `generateFileURL`) to emit `https://<site or media host>/media/<key>` matching the existing `/media/*` behavior; settle the key shape; set `serverURL` correctly. Edge-cached media per the intended architecture.
- **B — `serverURL`-only stopgap.** Provision `next_public_site_url=https://seqtek-preview.com` (SSM param + launch-template mapping, exactly like the #38 `s3_region` fix). Images then load via `https://seqtek-preview.com/api/media/file/<filename>` — correct and immediate, but app-proxied (no CDN cache; every image hits EC2).
- **C — Hybrid.** Ship B now to unblock rendering, then do A as the real fix.

## Decision

Adopt **A** as the target design (media served from CloudFront `/media/*`, edge-cached, URLs generated against `S3_BUCKET_HOSTNAME`/the site domain), reconciling the key shape to a single documented form. Use **B as an interim unblock** only if staging media needs to render before A lands — but B alone is not the finish line, because it defeats the CDN the edge stack was built to provide.

Sub-decisions — **resolved at implementation** (spec 009, clarified 2026-06-09; see `specs/009-media-cloudfront-serving/` for the full research trail):

- **Key shape → `media/<filename>`** (a third option neither original bullet named): the `/media/*` CloudFront behavior has **no originPath**, so the URL path forwards verbatim as the S3 key — neither bare `<filename>` nor `<media-id>/<filename>` maps onto it without extra edge config. A static `media` prefix on the storage adapter makes path == key with zero infra change; Payload's per-collection filename uniqueness covers collisions. ARCHITECTURE §5/§6, `s3.ts`, and the CDN behavior now state this one shape (`specs/009-media-cloudfront-serving/contracts/media-url.md`).
- **URL host → site domain** (the existing `/media/*` behavior on the main distribution). `S3_BUCKET_HOSTNAME` stays wired into the CSP as belt-and-braces but is not used for URL generation.
- **`serverURL` → `next_public_site_url` SSM parameter**, provisioned by the data stack whenever `cfg.domainName` is set (staging now; prod automatically at the Phase 6 cutover). The compute-stack user-data loop maps it to `NEXT_PUBLIC_SITE_URL` with no launch-template change.
- **Re-key mechanics → in place** (S3 server-side move + per-document `prefix` PATCH via `tools/ingest-photos/rekey-staging.ts`), not the delete + re-push originally sketched: the seeded media docs are referenced by team members, and delete + re-push would mint new IDs and orphan those relations. Metadata-only PATCHes upload/delete nothing in the storage plugin, so the move is safe with IDs preserved.
- **Consequence accepted:** stable keys forfeit the "new key per change" cache busting this ADR's context assumed — a Media `afterChange`/`afterDelete` hook (spec 009 FR-011) invalidates the affected `/media/*` paths on file replace/delete via the existing `invalidateCloudFrontPaths` plumbing.

## Consequences

- **Gain:** media served from the CDN edge (fast, cached, EC2 offloaded); correct absolute URLs across media, canonical tags, OG, and sitemap once `serverURL` is set; the already-wired `S3_BUCKET_HOSTNAME`/CSP/`/media/*` plumbing finally used as designed.
- **Cost:** a storage-adapter URL-generation change + an infra change (the SSM param, mirroring #38); if the key shape changes, the 27 staging objects must be re-keyed (delete + re-push via `tools/ingest-photos/push-to-payload.ts`, which is idempotent). Prod is unaffected today (not yet live) but inherits the same fix at cutover.

## Revisit when

Production cutover (the same `serverURL`/media-URL config must be provisioned for the prod env), or if Payload/`@payloadcms/storage-s3` changes its default file-URL generation.
