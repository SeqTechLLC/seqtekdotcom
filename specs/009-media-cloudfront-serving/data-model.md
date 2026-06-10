# Data Model: Media via CloudFront `/media/*`

**Feature**: 009-media-cloudfront-serving | **Date**: 2026-06-09

No new entities. The feature changes how three existing surfaces relate.

## Media document (Payload `media` collection — existing)

| Field                                        | Type                                                                             | Role in this feature                                                                                                                                                                                                 |
| -------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `filename`                                   | text (unique per collection)                                                     | last path segment of both the S3 key and the public URL; uniqueness enforced by Payload at upload (dedup-rename)                                                                                                     |
| `prefix`                                     | text, per-document (column from PR #39; UI-hidden, **API-writable**)             | the migration lever: stores the key prefix the object was uploaded under. Old seeded docs: `''`. Target state: `'media'`. New uploads inherit `'media'` via the field's defaultValue once the adapter option changes |
| `url`                                        | text, **computed on every read** by the plugin's `afterRead` → `generateFileURL` | never load-bearing as a stored value (recomputed unconditionally); persisted copy updated on writes via `beforeChange`                                                                                               |
| `sizes.<name>.filename` / `sizes.<name>.url` | per-variant                                                                      | same rules per image-size variant (~8 per doc from `Media.ts` BREAKPOINTS × {webp, jpeg}); `generateFileURL` is invoked per variant with that variant's filename and the **doc-level** prefix                        |

**State transition (staging migration, research R4)** — per doc, atomic enough in practice (verify order: S3 move first, PATCH second, so the static-handler fallback never 404s):

```
{prefix: '', objects at <filename>, <variant-filename>…}
  → S3 server-side move: <key> → media/<key>   (all root-level keys)
  → REST PATCH {prefix: 'media'}
{prefix: 'media', objects at media/<filename>…}
```

Media **IDs never change** → the 10 team-member `photo` relations (and any other references) are untouched.

## S3 object key (settled shape — clarification 2026-06-09)

```
media/<filename>                  # originals
media/<variant-filename>          # size variants (flat, same prefix — variants are sibling files, not nested)
```

- Produced by `getFileKey(join(docPrefix, filename))` with adapter option `prefix: 'media'`.
- **Verbatim CDN mapping**: CloudFront `/media/*` behavior has no originPath → request path `/media/<x>` _is_ the S3 key. No rewrite function, no originPath, no edge-stack change.
- Invariant (SC-004): every object in the bucket starts with `media/`; ARCHITECTURE §5, `s3.ts`, and the edge behavior all state this shape.

## Public media URL (contract in `contracts/media-url.md`)

```
${NEXT_PUBLIC_SITE_URL}/media/<encoded-filename>
```

Computed by the new pure helper in `src/payload/storage/s3.ts` from `{prefix, filename}`; localhost fallback mirrors `payload.config.ts` (`http://localhost:3100`) but is unreachable in deployed envs once FR-001 provisions the param. Local dev never invokes the helper (plugin disabled → no hook).

## SSM parameter (new, `infra/lib/data-stack.ts`)

| Name                                         | Value (staging)              | Becomes env var                                                                 | Consumer                                                                                  |
| -------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `/seqtek/website/<env>/next_public_site_url` | `https://seqtek-preview.com` | `NEXT_PUBLIC_SITE_URL` (user-data loop, `compute-stack.ts:240-243` — automatic) | `payload.config.ts` serverURL, sitemap, structured-data, live-preview, the new URL helper |

Plain `StringParameter` (public value, like `s3_region`). Prod gets its own value at cutover — config only, per FR-008.

## CloudFront invalidation paths (research R7 hook)

On media file **replace** or **delete**: invalidate `/media/<filename>` plus `/media/<variant-filename>` for every size — paths derive from the doc being changed/deleted (previous doc's filenames on replace). Env-gated on `CLOUDFRONT_DISTRIBUTION_ID`; no-op locally/CI.
