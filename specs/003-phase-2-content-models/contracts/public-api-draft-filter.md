# Contract: Public API draft filter

**Surface**: every draftable collection's `access.read` function (via the shared `publishedOrAuthed` helper at `src/payload/access/publishedOrAuthed.ts`).

**Cited from**: `docs/ARCHITECTURE.md` §6 + spec FR-016, SC-006.

## Behaviour

```typescript
// src/payload/access/publishedOrAuthed.ts
import type { Access } from 'payload'

export const publishedOrAuthed: Access = ({ req }) => {
  if (req.user?.roles?.length) return true
  return { _status: { equals: 'published' } }
}
```

**Effect**:

- Authenticated `admin` / `editor` → unrestricted (sees drafts + published).
- Unauthenticated request (REST, GraphQL, Local API without `req.user`) → query is filtered to `_status: 'published'` rows only.
- Result is exposed identically on **list** (`/api/{collection}`), **detail** (`/api/{collection}/:id`), and **GraphQL** queries — Payload applies the `Where` clause uniformly.

## What it means for callers

- A public page rendering `payload.find({ collection: 'caseStudies' })` without `overrideAccess: true` automatically gets only published rows.
- An admin/editor calling the same with `req.user` populated gets everything.
- The preview route deliberately uses `payload.find({ ..., draft: true, overrideAccess: true })` — `overrideAccess` is the only path drafts escape the filter, and it's only used inside the auth-gated preview route handler.

## Test contract

- `tests/int/collections/draftLeak.test.ts` (SC-006):
  - For each of `pages`, `posts`, `caseStudies`, `services`, `servicePillars`, `workshops`, `industries`, `locations`, `homepage`, `siteSettings`, `navigation`:
    1. Create a draft (`_status: 'draft'`) via the admin (authenticated request).
    2. Query the public REST endpoint unauthenticated → assert the document does NOT appear in list results.
    3. Query the public REST endpoint unauthenticated by ID → assert 404 (not 401, per FR-016).
    4. Query the public GraphQL endpoint unauthenticated → same.

## Stability

- The helper is one source-of-truth — every collection that wants the same behaviour passes the same `Access` function to `access.read`.
- Collections with different rules (`categories` always public; `testimonials` filtered by `isActive`) define their own access functions inline; not affected by this contract.
