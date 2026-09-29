# Contract: live preview URLs and the draft-mode entry route

- `src/payload/livePreview/url.ts` builds the URL. Each preview collection wires it with
  `admin.livePreview: livePreviewFor('<collection>')`.
- `src/app/(frontend)/preview/[collection]/[slug]/route.ts` turns on draft mode and redirects to
  the public page.

## URL pattern

```text
${NEXT_PUBLIC_SITE_URL}/preview/{collection}/{slug}
```

`{collection}` is one of `PREVIEW_COLLECTIONS`: `pages`, `posts`, `caseStudies`, `services`,
`workshops`, `teamMembers`, `partners`, `industries`. `buildPreviewUrl(collection, doc)` returns
`null` for an unknown collection or a document with no slug, and `livePreviewFor` turns that into
`''`, which hides Payload's Preview button.

The URL carries no secret. The route is same-origin with the admin, so the `payload-token` session
cookie comes with the request and is the auth boundary. A secret in the iframe `src` would leak into
the admin DOM, Referer headers and access logs.

Breakpoints: mobile 375×667, tablet 768×1024, desktop 1280×800.

## Route behaviour

`GET /preview/{collection}/{slug}`:

1. An unsupported collection returns 404 JSON.
2. An empty slug returns 400 JSON.
3. A user without the `admin` or `editor` role is redirected (302) to
   `/admin/login?redirect=<original path>`.
4. The route loads the draft by slug at `depth: 0`. No document returns 404 JSON.
5. The public path comes from `publicPathFor` (`PUBLIC_PATH_BUILDERS`). No path returns 404 JSON.
6. It turns on draft mode (`(await draftMode()).enable()`) and redirects (302) to the public path.

| Collection    | Public path            |
| ------------- | ---------------------- |
| `pages`       | `/{slug}`              |
| `posts`       | `/insights/{slug}`     |
| `caseStudies` | `/case-studies/{slug}` |
| `services`    | `/services/{slug}`     |
| `workshops`   | `/workshops/{slug}`    |
| `teamMembers` | `/team/{slug}`         |
| `partners`    | `/partners/{slug}`     |
| `industries`  | `/industries/{slug}`   |

In draft mode each public route renders `<PreviewBanner />`
(`src/components/layout/PreviewBanner.tsx`).

## Tests

- `tests/int/preview/livePreviewUrl.int.spec.ts` covers the builder, `publicPathFor` and
  `isPreviewCollection`.
- `tests/e2e/preview/{pages,posts,caseStudies}Preview.e2e.spec.ts` cover the route: the editor
  redirect with the draft-mode cookie, the unauthenticated login redirect, a missing document, and
  an unsupported collection.

Adding a preview collection means adding one entry each to `PREVIEW_COLLECTIONS` and
`PUBLIC_PATH_BUILDERS`.
