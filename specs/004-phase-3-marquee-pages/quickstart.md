# Quickstart — Public Render Foundation + Marquee Pages

How to run and verify the spec 004 render layer locally. Assumes the spec 003 stack is up (Payload admin + Postgres). See `docs/LOCAL_DEVELOPMENT.md` for first-time setup.

## Prerequisites

- Local Postgres on the project port (`5433+`, per the local-ports convention) with the spec 003 schema.
- `.env.local` with `PAYLOAD_SECRET`, `DATABASE_URI`, `REVALIDATION_SECRET`. S3 vars optional — media renders from whatever exists; bulk team-photo ingest needs US6 (S3 plugin).
- At least one **published** doc per collection you want to view (seed, or author in `/admin`). The homepage global needs its `hero` populated.

## Run

```bash
npm run dev            # Next dev (Payload embedded) — :3100 per local-ports convention
```

Build-parity check (ISR behaves differently in dev vs. prod — verify the real thing before pushing):

```bash
npm run build && npm run start   # production build; ISR + generateStaticParams active
```

## Verify each route

| URL                                                            | Expect                                                                                |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `/`                                                            | Homepage global renders (hero, stats, featured case study, …) — **not** "No page yet" |
| `/<page-slug>`                                                 | A `pages` doc renders via `RenderBlocks`                                              |
| `/case-studies` and `/case-studies/<slug>`                     | Listing + structured detail                                                           |
| `/insights` and `/insights/<slug>`                             | Post listing + richText article                                                       |
| `/services`, `/services/<pillar>`, `/services/<pillar>/<slug>` | Overview → pillar → service detail (nested)                                           |
| `/touchstone-workshops/<slug>`                                 | Workshop detail + HubSpot form mounts                                                 |
| `/team`                                                        | `TeamGrid` with real members                                                          |
| `/<unknown>`                                                   | 404 page (full chrome)                                                                |
| `/about-us-1`                                                  | 301 → `/about`                                                                        |

## Preview flow (draft round-trip)

1. In `/admin`, edit a draft (don't publish) of e.g. a case study.
2. Use the admin **live preview** (or hit `/preview/caseStudies/<slug>`) — you should be authenticated, draft mode enabled, redirected to `/case-studies/<slug>` showing the **draft** content with the amber `PreviewBanner`.
3. Open the same public URL in an incognito window — you should see only the **published** version (or 404 if never published). This is the draft-leak invariant from spec 003 US5, held on the public side.

## Verify on-demand revalidation (the keystone behavior)

1. Publish a change to a case study in `/admin`.
2. The `revalidateOnChange` afterChange hook fires `revalidateTag('caseStudies_<slug>')` + `caseStudies_list`.
3. Reload `/case-studies/<slug>` (prod build) — the change is live without waiting for the 3600s fallback.

If the change does **not** appear until the fallback window, the reader's tags don't match `buildRevalidatePlan` — run the tag-parity test (below); it should be red.

## Tests

```bash
npm run test:int -- payload-cache-tags       # keystone: reader tags == buildRevalidatePlan
npm run test:int -- redirects                # redirect map shape + permanence
npm run test:e2e -- marquee-pages            # each marquee page 200 + axe
npm run test:e2e -- preview-roundtrip        # draft → public visibility
npm run test:lhci                            # a11y/best-practices/SEO ≥ 0.95 on new URLs
```

## Gotchas

- Don't add `export const dynamic = 'force-dynamic'` — that's the spike pattern this spec retires. The public routes ARE dynamically rendered (the layout's per-request CSP nonce forces it — ADR 0005), but via the layout nonce, not a forced override; the route DATA stays ISR-cached through the `unstable_cache` readers (`revalidate = 3600` + on-demand tag invalidation). `generateStaticParams` is intentionally absent (it 500s under the nonce layout — ADR 0005).
- `params`/`searchParams`/`draftMode()` are all async in Next 16 — `await` them.
- New richText/client-component fields → regenerate `src/app/(payload)/admin/importMap.js` (payload importMap gotcha).
- After editing the redirect map, restart `next start` — `redirects()` is read at server start, not per-request.
