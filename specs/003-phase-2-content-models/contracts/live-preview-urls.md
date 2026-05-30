# Contract: Live preview URLs + draft-mode entry route

**Files**:

- `src/payload/livePreview/url.ts` — URL builder consumed by `admin.livePreview.url` on each of the four preview collections.
- `src/app/(frontend)/preview/[collection]/[slug]/route.ts` — Next.js route handler that sets `draftMode` cookie and redirects to the public route.

**Cited from**: `docs/ARCHITECTURE.md` §6 + spec FR-019, FR-020, FR-021.

## URL pattern

```text
${process.env.NEXT_PUBLIC_SITE_URL}/preview/{collection}/{slug}?secret={PREVIEW_SECRET}
```

Where `{collection}` is one of: `pages`, `posts`, `caseStudies`, `services`.

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

`GET /preview/{collection}/{slug}?secret=...`:

1. **Auth check**: validate the requesting user has an `admin` or `editor` cookie session (reuse the spec 001 `extractUser` helper). No session → 302 to `/admin/login?redirect=...`.
2. **Secret check**: constant-time compare `secret` query param against `process.env.PREVIEW_SECRET`. Mismatch → 401.
3. **Collection check**: ensure `{collection}` is one of the four supported. Otherwise → 404.
4. **Document existence**: `payload.find({ collection, where: { slug: { equals: slug } }, draft: true, limit: 1, depth: 0 })`. Not found → 404.
5. **Enable draft mode**: `draftMode().enable()` (Next.js 15+ API; sets a signed cookie).
6. **Redirect**: 302 to the public route. Mapping:
   - `pages` → `/${slug}` (or `/about/${slug}`, `/our-story`, etc. — public router decides; default `/${slug}`).
   - `posts` → `/insights/${slug}`.
   - `caseStudies` → `/case-studies/${slug}`.
   - `services` → `/services/${pillar.slug}/${slug}` (requires depth=1 to resolve pillar).

## Preview banner

Public page components are responsible for rendering a "PREVIEW MODE" banner when `draftMode().isEnabled === true` (FR-020). Phase 3 page templates include the banner; Phase 2 provides a `<PreviewBanner />` component in `src/components/layout/PreviewBanner.tsx` that pages can drop in.

## Test contract

- `tests/e2e/preview/pagesPreview.spec.ts` (and one per collection):
  - Authenticated editor: click preview from admin → lands on preview URL → sees banner → sees draft content.
  - Unauthenticated: same URL → redirected to `/admin/login`. (FR-021)
  - Wrong secret: 401 directly.
- `tests/int/preview/livePreviewUrl.test.ts`:
  - `buildPreviewUrl` returns expected string for each collection.
  - Returns `null` when slug is missing.

## Stability

- `PREVIEW_SECRET` is a per-environment secret in Parameter Store.
- The shared route handler means adding a fifth preview-supported collection in a future spec is one entry change, not a new route file.
