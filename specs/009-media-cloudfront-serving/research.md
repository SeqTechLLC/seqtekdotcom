# Research: Media via CloudFront `/media/*`

**Feature**: 009-media-cloudfront-serving | **Date**: 2026-06-09

All findings below were verified against the installed package source (versions: `payload@3.85`, `@payloadcms/storage-s3@3.85`, `@payloadcms/plugin-cloud-storage@3.85`) — file list in §Sources. Nothing here is from training-data memory.

## R1 — URL-generation seam: `generateFileURL`, and it wins the hook chain

**Decision**: Configure `collections.media.generateFileURL` on the `s3Storage` options in `src/payload/storage/s3.ts`. Signature (from `hooks/afterRead.js`): `({ collection, filename, prefix, size }) => string | Promise<string>` — `prefix` is the **per-document stored prefix** (`data.prefix`), and for size variants the hook passes that size's own `filename` (`data.sizes[size.name].filename`), so one helper covers originals and all variants.

**Rationale — the hook-order proof (this is the load-bearing internals finding)**:

1. Payload core's base `url` field (`uploads/getBaseFields.js`) carries an `afterRead` hook (`generateFilePathOrURL`) that _regenerates_ `${serverURL}/api/<slug>/file/<filename>` unless the incoming value is "external" — and "external" is defined as _not starting with `/` and not starting with `serverURL`_ (`generateFilePathOrURL.js:11-16`). A CDN URL on the **site domain starts with `serverURL`**, so if core's hook ran last it would silently overwrite our CDN URL with the app-proxy URL.
2. But the merge order saves us: `collections/config/sanitize.js:215` calls `mergeBaseFields(sanitized.fields, uploadFields)` where the plugin's `url` field (added before sanitize) is the _match_ and core's is the _base_; `mergeBaseFields.js:22` deep-merges with default `deepmerge` array handling (**concat: base first, match second**). Final `afterRead` order: core's `generateFilePathOrURL` → plugin's `getAfterReadHook`. The plugin hook runs **last**, and with `generateFileURL` set it returns its result **unconditionally** (`afterRead.js:6-12`) — never consulting the incoming value.
3. Same structure on `beforeChange` (`beforeChange.js`): what's persisted is also the `generateFileURL` output — but irrelevant in practice, because every read recomputes (point 2).

**Alternatives considered**:

- `disablePayloadAccessControl: true` + adapter `generateURL` — rejected: emits raw S3 endpoint URLs (`generateURL.js:14`: `<endpoint>/<bucket>/<key>`), bypassing CloudFront, and removes the `/api/media/file/*` static-handler fallback (`plugin.js:73-74`) that the admin and any legacy references still use.
- Overriding the `url` field on the collection — rejected: fights the plugin's own field injection (`getFields.js` splices and re-adds `url`); `generateFileURL` is the documented seam for exactly this.

## R2 — URL form: absolute `${NEXT_PUBLIC_SITE_URL}/media/<key>`, recomputed per read

**Decision**: `generateFileURL` returns `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100'}/${posix.join(prefix || '', encodedFilename)}` (encoding mirrors `storage-s3/generateURL.js`: encode the basename, preserve the path joiner). Extract as a pure exported helper (e.g. `mediaFileURL({ prefix, filename })`) so Vitest covers it directly.

**Rationale**:

- **Absolute, not relative**: `src/lib/metadata.ts:40-42` feeds `media.url` straight into OG images and `src/lib/structured-data.ts:61` into JSON-LD — both require absolute URLs for external consumers. Rendering is plain `<img>`/`<picture>` everywhere (`ResponsiveImage.tsx` deliberately bypasses `next/image` — "Payload + CloudFront already serves optimized variants"; `TeamGrid.tsx:55` is a plain `<img>`), so no `remotePatterns`/`localPatterns` work and no Next image-optimizer loop-back concern.
- **Site domain, not `S3_BUCKET_HOSTNAME`**: per ADR 0008 + spec assumption — the `/media/*` behavior already exists on the main distribution; same-origin also means zero CSP delta (the `S3_BUCKET_HOSTNAME` img-src wiring in `src/lib/csp.ts` stays as harmless belt-and-braces).
- **Never stale**: because the plugin's `afterRead` recomputes unconditionally (R1), the persisted `url` column value never surfaces; env changes (staging → prod cutover) take effect on next read with **no data migration**. This also makes the staging→prod DB dump/restore path (STAGING_INGEST notes) safe.
- Uses the doc's **stored `prefix`**, not a hardcoded `'media'`, mirroring how `uploadFile.js`/`getFileKey.js` compute the actual object key — URL and key cannot drift per-document.

## R3 — `serverURL` provisioning: one SSM param, zero compute-stack change

**Decision**: Add `next_public_site_url` as an `ssm.StringParameter` in `infra/lib/data-stack.ts` next to the `s3_region` param (`data-stack.ts:156-160`, the #38 pattern). Value per env (staging: `https://seqtek-preview.com`); wire the value through `DataStackProps` (the stack already receives env-specific config). After deploy, **refresh the ASG instances** — the user-data loop runs at boot.

**Rationale**: `compute-stack.ts:240-243` already maps **every** parameter under the path prefix into `/etc/seqtek-website.env` as `UPPERCASE_BASENAME=value` (`key=$(basename "$name" | tr '[:lower:]' '[:upper:]')`). `next_public_site_url` → `NEXT_PUBLIC_SITE_URL` automatically. No launch-template or compute-stack edit needed — the #38 fix proved this exact path.

**Alternatives considered**: Docker build-arg baking — rejected: ties the image to an environment and the standalone server reads `process.env` at runtime anyway for server code (see R6).

## R4 — Re-key mechanics: **in-place** (S3 move + `PATCH prefix`), not delete + re-push

**Decision**: Re-key the 27 staging objects in place with a small one-shot script (`tools/ingest-photos/rekey-staging.ts`):

1. For every root-level key in `seqtek-media-staging` (originals + variants): server-side copy to `media/<key>`, then delete the old key (`aws s3 mv` semantics via SDK or CLI).
2. For every media doc: REST `PATCH { prefix: 'media' }` using an `IMPORT_TOKEN` (same auth pattern as `push-to-payload.ts`).

This **amends spec FR-005** (which said delete + re-push); the spec is updated in the same change (Constitution III).

**Rationale — delete + re-push has a hidden cost the clarify session didn't surface**: the 27 media docs are **referenced** (10 team-member headshots at minimum; no repo script wires those relations — they were wired by hand/REST, so they would not heal). Deleting media docs orphans the relations; re-push mints **new IDs** (`push-to-payload.ts` skips by filename only); every referencing doc would then need manual re-pointing. The in-place path preserves IDs, so **no relation is touched**. Verified safe against the source:

- The `prefix` field is a plain text field (`getFields.js:14-21` — `admin.hidden/readOnly` is UI-only, no field access control) → API-writable by an authenticated user.
- `afterChange` is a **no-op without an incoming file** (`afterChange.js`: gated on `getIncomingFiles(...).length > 0`) → a metadata-only PATCH uploads nothing, deletes nothing.
- `beforeChange` on `url` recomputes from the new prefix (R1) and the static-handler fallback resolves the prefix **from the doc** (`getFilePrefix.js`: DB lookup by filename incl. size filenames) → `/api/media/file/<filename>` keeps working post-move.
- `afterDelete` (`afterDelete.js`) covers originals + all size variants — relevant only for the fallback path.

**Fallback**: delete + re-push via the idempotent `push-to-payload.ts` (+ manual re-wiring of team-member headshots from the regenerated `staging-media-ids.json`) remains documented in quickstart.md if the in-place script hits trouble. Laptop AWS access for the S3 move is already an established prereq (STAGING_INGEST.md §Prereqs grants `s3:PutObject/GetObject` on the staging bucket).

## R5 — Local dev / CI: untouched by construction

**Decision**: No conditional logic needed in `generateFileURL` for local dev.

**Rationale**: With `S3_BUCKET`/`S3_REGION` unset the plugin takes the `enabled: false` + `alwaysInsertFields` path (`storage-s3/index.js:45-63`), which calls `cloudStoragePlugin` with `adapter: null`; `getFields.js:39/64` only attaches the `generateFileURL` hooks **when an adapter exists**. Locally the `url` field keeps only core's hook → `${serverURL}/api/media/file/<filename>` → served from local FS. The `prefix` field still exists (defaultValue `'media'` per `getFields.js:151` once we set the option — harmless locally; the local static route resolves files by filename from `staticDir`, and `next.config.ts` `localPatterns` already allows `/api/media/file/**`).

## R6 — `NEXT_PUBLIC_*` build-time inlining: a documented non-issue (today)

**Decision**: Rely on runtime env for `NEXT_PUBLIC_SITE_URL`; add a comment at the s3.ts helper noting the constraint.

**Rationale**: Next.js inlines `NEXT_PUBLIC_*` into **client** bundles at build time (CI builds without the value). All four current consumers are server-side (`payload.config.ts:33`, `sitemap.ts:12`, `structured-data.ts:11`, `livePreview/url.ts:25` — evaluated in server config context), and the standalone server reads `process.env` at runtime. The Dockerfile bakes no site-URL arg. **Constraint to record**: any future _client-component_ use of `NEXT_PUBLIC_SITE_URL` would silently get the build-time (empty) value, not the SSM value.

## R7 — Stable keys lose natural cache-busting → invalidation hook on replace/delete

**Decision**: Add a Media collection `afterChange` (file-replacement) + `afterDelete` hook that calls the existing `invalidateCloudFrontPaths()` (`src/lib/cloudfront/invalidate.ts`) with `/media/<filename>` + all variant paths. Env-gated by `CLOUDFRONT_DISTRIBUTION_ID` exactly like the page-revalidation hooks (no-op locally/CI).

**Rationale**: ARCHITECTURE §6 line 572 justifies the long-TTL `CachingOptimized` policy with "any content change produces a new key — cache busting happens naturally". That was written for `<media-id>/<filename>` keys. With stable `media/<filename>` keys, replacing a file **under the same filename keeps the same key** → the edge serves stale bytes up to a year. Payload dedupes filenames for _new_ docs, so this bites only on replace-in-place — rare, but silent and long-lived when it happens. The helper, env var, and IAM grant already exist for page revalidation; the hook is ~15 lines + test. Documenting the gap instead was considered and rejected: Constitution III forces the §6 edit either way, and "known to serve stale for a year" is a poor sentence to write into ARCHITECTURE when the fix is this small.

## Sources (Constitution Principle I enumeration)

Read in full or at the cited line ranges before settling the design:

| File                                                                                                     | What it settled                                                                                                           |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `@payloadcms/storage-s3/dist/index.js`                                                                   | enabled/disabled paths; collections passthrough to cloud-storage; `alwaysInsertFields` with `adapter: null`               |
| `@payloadcms/storage-s3/dist/generateURL.js`                                                             | adapter default URL = raw S3 endpoint (why `disablePayloadAccessControl` is wrong here); basename-encoding pattern reused |
| `@payloadcms/storage-s3/dist/uploadFile.js`                                                              | object key = `getFileKey(join(docPrefix ‖ collectionPrefix, filename))`                                                   |
| `@payloadcms/plugin-cloud-storage/dist/plugin.js`                                                        | static-handler registration (kept as fallback); hook wiring; `disableLocalStorage` default                                |
| `…/fields/getFields.js`                                                                                  | `url` + `sizes.*.url` hook injection; `prefix` field is plain text (API-writable), defaultValue from collection prefix    |
| `…/hooks/afterRead.js`                                                                                   | `generateFileURL({collection, filename, prefix, size})` precedence — unconditional when set                               |
| `…/hooks/beforeChange.js`                                                                                | persisted URL also from `generateFileURL`                                                                                 |
| `…/hooks/afterChange.js`                                                                                 | **no-op without incoming file** → metadata-only PATCH is safe (R4)                                                        |
| `…/hooks/afterDelete.js`                                                                                 | deletes original + all size variants (fallback path correctness)                                                          |
| `…/utilities/getFileKey.js`, `…/getFilePrefix.js`                                                        | key shape; static handler resolves per-doc prefix from DB                                                                 |
| `payload/dist/uploads/getBaseFields.js`, `…/generateFilePathOrURL.js`                                    | core `url` afterRead regeneration + the `startsWith(serverURL)` external-URL pitfall                                      |
| `payload/dist/collections/config/sanitize.js`, `…/fields/mergeBaseFields.js`, `…/utilities/deepMerge.js` | hook merge order proof: core hook first, plugin hook second (deepmerge array concat)                                      |

Repo files establishing the integration surface: `src/payload/storage/s3.ts`, `src/payload.config.ts:33`, `src/collections/Media.ts` (imageSizes), `src/proxy.ts:70` + `src/lib/csp.ts` (mediaHost), `src/lib/{metadata.ts,structured-data.ts}`, `src/components/ui/ResponsiveImage.tsx`, `src/components/sections/TeamGrid.tsx:55`, `src/lib/cloudfront/invalidate.ts`, `next.config.ts:35-43`, `infra/lib/data-stack.ts:138-160`, `infra/lib/compute-stack.ts:231-243`, `infra/lib/edge-stack.ts:79-160`, `infra/test/data-stack.test.ts` (harness exists), `tools/ingest-photos/{push-to-payload.ts,STAGING_INGEST.md}`.
