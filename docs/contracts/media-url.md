# Contract: media URL ↔ S3 key ↔ CDN behaviour

The three columns change together (ADR 0008).

| Surface       | Form                                                                        | Source of truth                                  |
| ------------- | --------------------------------------------------------------------------- | ------------------------------------------------ |
| Public URL    | `${NEXT_PUBLIC_SITE_URL}/media/<encoded-filename>`                          | `mediaFileURL()` in `src/payload/storage/s3.ts`  |
| S3 object key | `media/<filename>`; originals and size variants sit flat side by side       | the adapter's `prefix: 'media'` → `getFileKey()` |
| CDN mapping   | the `/media/*` behaviour has no `originPath`, so the URL path is the S3 key | `infra/lib/edge-stack.ts`                        |

## `mediaFileURL({ prefix, filename })`

- Returns `<host>/<posix.join(prefix || '', encodeURIComponent(filename))>`.
- `<host>` is `NEXT_PUBLIC_SITE_URL`, or `http://localhost:3100`, with no trailing slash.
- It encodes the filename segment and never the `/` joiner, as `@payloadcms/storage-s3` does.
- It is pure (no I/O, no Payload imports) and is called for the original and for each size
  variant.
- `tests/int/media-url.int.spec.ts` pins it.

## Serving paths

| Requester             | Path                                              | Served by                                                |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| Public pages          | `https://<site>/media/<filename>`                 | CloudFront → S3 via OAC (`CachingOptimized`), no app hop |
| Admin panel, old refs | `https://<site>/api/media/file/<filename>`        | the app's static handler; never emitted in new URLs      |
| Local dev, CI         | `http://localhost:3100/api/media/file/<filename>` | the local filesystem handler (S3 plugin off)             |

A missing object returns 403 from CloudFront; the edge does not remap it to 404.
`S3_BUCKET_HOSTNAME` plays no part in URL generation; it only feeds the CSP `img-src`.
