# Contract: `/api/revalidate` route handler

**File**: `src/app/(frontend)/api/revalidate/route.ts`

**Cited from**: `docs/ARCHITECTURE.md` §3.

## Method & path

`POST /api/revalidate`

## Request

```json
{
  "tags": ["caseStudies_oil-gas-modernization", "caseStudies_list"],
  "paths": ["/case-studies/oil-gas-modernization", "/case-studies"]
}
```

- **Body**: JSON. Either or both of `tags` (array of strings, passed to `revalidateTag`) and `paths` (array of strings, passed to CloudFront's `CreateInvalidation`). At least one of the two MUST be a non-empty array.
- **Header**: `Authorization: Bearer ${REVALIDATION_SECRET}`. Constant-time string compare against `process.env.REVALIDATION_SECRET`.
- **Content-Type**: `application/json`.

## Response

- `200 OK` body `{ revalidated: { tags: number, paths: number }, ms: number }` on success.
- `401 Unauthorized` body `{ error: 'invalid secret' }` on missing/wrong header.
- `400 Bad Request` body `{ error: '<message>' }` on malformed body (non-JSON, both arrays empty/missing, non-string elements).
- `500 Internal Server Error` body `{ error: '<message>' }` on AWS SDK failure during CloudFront invalidation.

## Behaviour

1. Validate `Authorization` header (constant-time compare). Failure → 401, no further work.
2. Parse JSON body. Validate shape. Failure → 400.
3. For each tag in `tags`: call `revalidateTag(tag)`.
4. If `paths` non-empty: issue a single `CreateInvalidation` to the CloudFront distribution ID at `process.env.CLOUDFRONT_DISTRIBUTION_ID` via `src/lib/cloudfront/invalidate.ts`. AWS credentials are picked from the EC2 instance profile (default credential chain).
5. Return 200 with timing + counts.

## Test contract

- `tests/int/api/revalidate.test.ts`:
  - Missing `Authorization` → 401, no work done.
  - Wrong secret → 401.
  - Valid secret + valid body → 200; mocked `revalidateTag` called once per tag; mocked CloudFront client called once with the deduplicated path list.
  - Malformed JSON → 400.
  - Both arrays empty → 400.

## Internal callers

The same logic is reused by the `revalidateOnChange` `afterChange` hook directly (no HTTP round-trip — Payload runs in-process). The route handler exists for external callers (e.g., deploy-time invalidation from CI, post-migration revalidation).

## Stability

- `REVALIDATION_SECRET` is a runtime env var (Parameter Store in prod, `.env.local` in dev). Never committed.
- `CLOUDFRONT_DISTRIBUTION_ID` is per-environment (Parameter Store).
- Absent in local dev → CloudFront call is a no-op (logged, not failed) so `npm run dev` doesn't require AWS access.
