# 0008. Serve Payload media via CloudFront `/media/*`, not the app proxy

**Status:** Proposed
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

Open sub-decisions to resolve during implementation:

- **Key shape:** keep `<filename>` (simplest; matches what's already uploaded) **or** move to `<media-id>/<filename>` (matches ARCHITECTURE §5; requires re-keying the 27 already-uploaded staging objects + updating the `s3.ts` prefix/comment). Recommend picking one and making ARCHITECTURE, `s3.ts`, and the CloudFront origin path agree.
- **URL host:** site domain (`/media/*` behavior on the main distribution, already defined) vs. a dedicated media host (`S3_BUCKET_HOSTNAME`). The `/media/*` behavior already exists, so the site domain is the lower-friction choice.
- **`serverURL`:** provision `next_public_site_url` regardless (it also affects canonical URLs / OG tags / sitemap absolute URLs, not just media).

## Consequences

- **Gain:** media served from the CDN edge (fast, cached, EC2 offloaded); correct absolute URLs across media, canonical tags, OG, and sitemap once `serverURL` is set; the already-wired `S3_BUCKET_HOSTNAME`/CSP/`/media/*` plumbing finally used as designed.
- **Cost:** a storage-adapter URL-generation change + an infra change (the SSM param, mirroring #38); if the key shape changes, the 27 staging objects must be re-keyed (delete + re-push via `tools/ingest-photos/push-to-payload.ts`, which is idempotent). Prod is unaffected today (not yet live) but inherits the same fix at cutover.

## Revisit when

Production cutover (the same `serverURL`/media-URL config must be provisioned for the prod env), or if Payload/`@payloadcms/storage-s3` changes its default file-URL generation.
