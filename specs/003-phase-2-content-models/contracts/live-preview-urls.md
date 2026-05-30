# Contract: Live preview URLs + draft-mode entry route

**Files**:

- `src/payload/livePreview/url.ts` — URL builder consumed by `admin.livePreview.url` on each of the four preview collections.
- `src/app/(frontend)/preview/[collection]/[slug]/route.ts` — Next.js route handler that sets `draftMode` cookie and redirects to the public route.

**Cited from**: `docs/ARCHITECTURE.md` §6 + spec FR-019, FR-020, FR-021.

## URL pattern

```text
${process.env.NEXT_PUBLIC_SITE_URL}/preview/{collection}/{slug}
```

Where `{collection}` is one of: `pages`, `posts`, `caseStudies`, `services`.

> **Design note (2026-05-30):** the URL deliberately does NOT carry a
> `PREVIEW_SECRET` query parameter. The earlier sketch in this contract did,
> but embedding a long-lived env secret in the iframe `src` leaks it into
> (a) the admin DOM (any admin/editor can inspect), (b) Referer headers on
> any outbound clicks made from inside the preview frame, and (c)
> CloudFront / ALB access logs. The route handler is same-origin with the
> admin, so the `payload-token` session cookie ships automatically — that
> cookie is the real auth boundary. See the rationale block in
> `src/payload/livePreview/url.ts`.

## `admin.livePreview` wiring

Each of the four collections includes:

```typescript
admin: {
  livePreview: {
    url: buildPreviewUrl,
    breakpoints: [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 800 },
    ],
  },
}
```

Where `buildPreviewUrl({ data, collectionConfig })` returns the preview URL string (or `null` when the document has no slug yet — Payload hides the Preview button).

## Route handler behaviour

`GET /preview/{collection}/{slug}`:

1. **Collection check**: ensure `{collection}` is one of the four supported. Otherwise → 404 JSON.
2. **Slug present**: empty slug → 400 JSON.
3. **Auth check**: resolve the request via `payload.auth({ headers })`; require the user to carry an `admin` or `editor` role. No editorial session → 302 to `/admin/login?redirect=<original-path>`.
4. **Document existence**: `payload.find({ collection, where: { slug: { equals: slug } }, draft: true, limit: 1, depth: collection === 'services' ? 1 : 0 })`. Not found → 404 JSON.
5. **Public path resolution**: compute the public path via `publicPathFor(collection, doc)`. Returns `null` when the doc has no slug or (for `services`) no resolvable pillar slug → 404 JSON.
6. **Enable draft mode**: `(await draftMode()).enable()` (Next.js 16+: `draftMode()` returns a Promise; sets a signed cookie).
7. **Redirect**: 302 to the resolved public path. Mapping (mirrors `PUBLIC_PATH_BUILDERS` in `src/payload/livePreview/url.ts`):
   - `pages` → `/${slug}`.
   - `posts` → `/insights/${slug}`.
   - `caseStudies` → `/case-studies/${slug}`.
   - `services` → `/services/${pillar.slug}/${slug}` (falls back to `/services/${slug}` if no pillar — useful for partially-drafted services).

> **Phase 3 dependency:** the public routes referenced above are filled in by
> spec 004 (Phase 3 page templates). Until those land, the redirect
> mechanically points at routes that may 404; this is intentional and
> documented — US2 in spec 003 owns the redirect contract, not the
> downstream render. The dev-only `/showcase/[slug]` route covers visual
> verification in the meantime.

## Preview banner

Public page components are responsible for rendering a "PREVIEW MODE" banner when `draftMode().isEnabled === true` (FR-020). Phase 3 page templates include the banner; Phase 2 provides a `<PreviewBanner />` component in `src/components/layout/PreviewBanner.tsx` that pages can drop in.

## Test contract

- `tests/e2e/preview/{collection}Preview.e2e.spec.ts` (one per collection):
  - Authenticated editor: `GET /preview/{collection}/{slug}` → 302 with `Location` set to the resolved public path and the draft-mode cookie set on the response. (FR-019, SC-003)
  - Unauthenticated: same URL → 302 to `/admin/login?redirect=...`. (FR-021)
  - Missing document: 404 JSON.
  - Unsupported collection: 404 JSON.
  - Visual confirmation (banner + draft content) is verified by spec 004's page-template tests; this contract owns the redirect step only.
- `tests/int/preview/livePreviewUrl.int.spec.ts`:
  - `buildPreviewUrl` returns expected string for each collection.
  - Returns `null` when slug is missing or collection is unknown.
  - `publicPathFor` returns the expected public path per collection (including the pillar fallback for `services`).
  - `isPreviewCollection` narrows the four supported collections and rejects others.

## Stability

- The route gates on the admin session cookie (`payload-token`), which is set per-environment by the same SSO flow. No additional per-environment secret is required.
- The shared route handler means adding a fifth preview-supported collection in a future spec is one entry change (`PREVIEW_COLLECTIONS` + `PUBLIC_PATH_BUILDERS` in `livePreview/url.ts`), not a new route file.
