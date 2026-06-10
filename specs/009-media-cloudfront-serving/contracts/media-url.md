# Contract: Media URL ↔ S3 Key ↔ CDN Behavior

**Feature**: 009-media-cloudfront-serving

The single agreement that FR-004 demands. Any change to one column requires changing all three (Constitution III).

| Surface       | Form                                                                            | Source of truth                                           |
| ------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Public URL    | `${NEXT_PUBLIC_SITE_URL}/media/<encoded-filename>`                              | `mediaFileURL()` helper, `src/payload/storage/s3.ts`      |
| S3 object key | `media/<filename>` (originals and variants, flat)                               | adapter `prefix: 'media'` → `getFileKey()`                |
| CDN mapping   | `/media/*` behavior, **no originPath** → URL path forwarded verbatim as the key | `infra/lib/edge-stack.ts` `/media/*` behavior (unchanged) |

## URL helper contract (`mediaFileURL`)

```
mediaFileURL({ prefix: string | null | undefined, filename: string }): string
```

- Returns `<host>/<posix.join(prefix || '', encodeURIComponent-basename(filename))>`.
- `<host>` = `process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100'`, no trailing slash.
- Encoding mirrors `@payloadcms/storage-s3` `generateURL.js`: encode the filename segment, never the `/` joiner.
- Pure: no I/O, no Payload imports — Vitest-testable in isolation.
- Invoked by `generateFileURL` for the original and once per size variant (with the variant's filename, doc-level prefix).

### Test cases (Vitest, `tests/int/media-url.int.spec.ts`)

| Input                                                      | Expected (with `NEXT_PUBLIC_SITE_URL=https://seqtek-preview.com`)                                            |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `{prefix: 'media', filename: 'headshot-hank-haines.webp'}` | `https://seqtek-preview.com/media/headshot-hank-haines.webp`                                                 |
| `{prefix: 'media', filename: 'team photo (1).webp'}`       | `https://seqtek-preview.com/media/team%20photo%20(1).webp` (per `encodeURIComponent` semantics)              |
| `{prefix: '', filename: 'x.webp'}`                         | `https://seqtek-preview.com/x.webp` (legacy/un-migrated doc — documents the failure shape, asserts no crash) |
| env unset                                                  | `http://localhost:3100/media/x.webp` (fallback parity with `payload.config.ts`)                              |

## Serving paths after this feature

| Requester                 | Path                                              | Served by                                                                                        |
| ------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Public page views         | `https://<site>/media/<filename>`                 | CloudFront edge → S3 via OAC (`CachingOptimized`, compressed) — zero app involvement             |
| Admin panel / legacy refs | `https://<site>/api/media/file/<filename>`        | App static handler (resolves per-doc prefix from DB) — kept as fallback, not emitted in new URLs |
| Local dev / CI            | `http://localhost:3100/api/media/file/<filename>` | Local FS static handler (plugin disabled — core URL generation untouched)                        |

## Out of contract

- S3 403→404 remap at the edge: deferred (Phase 5.5, per `edge-stack.ts` note) — missing media returns 403 from CloudFront.
- `S3_BUCKET_HOSTNAME` direct-S3 host: unused by URL generation (site-domain decision); CSP wiring retained as belt-and-braces.
