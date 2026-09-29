# 0008. Serve Payload media from CloudFront `/media/*`, not the app

**Status:** Accepted
**Date:** 2026-06-09

## Context

The first seeded content on the old staging lane rendered broken images. Media URLs pointed at
`http://localhost:3100/api/media/file/<filename>`: `serverURL` fell back to localhost, the storage adapter served files
through the app instead of the CDN's `/media/*` behavior, and the S3 key shape did not match that behavior's path.

## Options considered

- **CloudFront serving** — generate `/media/<key>` URLs on the site domain, matching the edge behavior.
- **Set `serverURL` only** — correct URLs, but every image streams through the app.

## Decision

Media is served by CloudFront at `<site>/media/<filename>`. The storage adapter uses a static `media` prefix, so the S3
key is `media/<filename>` and equals the URL path (the behavior has no origin path). `generateFileURL` builds the URL
from `NEXT_PUBLIC_SITE_URL`, which each lane's task definition sets to its own domain. `S3_BUCKET_HOSTNAME` stays in
the CSP but is not used for URLs. The contract is `docs/contracts/media-url.md`.

## Consequences

- Media is cached at the edge, and absolute URLs are right across pages, canonical tags, OG images and the sitemap.
- Stable keys give up cache busting by new key, so Media's `afterChange` and `afterDelete` hooks invalidate the affected
  `/media/*` paths.

## Revisit when

`@payloadcms/storage-s3` changes how it generates file URLs.
