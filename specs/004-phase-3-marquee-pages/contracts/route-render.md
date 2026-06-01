# Contract — Public Route Template

The shape every public render route in spec 004 conforms to. Tests assert this contract; tasks implement against it.

## Module-level exports (per `page.tsx`)

```ts
export const revalidate = 3600 // ISR DATA cache TTL via the unstable_cache readers (ARCH §3)

// detail routes only:
export async function generateMetadata(props): Promise<Metadata> // from doc.seo, siteSettings fallback (§D7)
export default async function Page(props): Promise<ReactElement>
```

**Implementation note (2026-06-01 — ADR 0005 / research §D6 addendum):** `generateStaticParams` / `dynamicParams` were **dropped**. The shared `(frontend)` layout reads the per-request CSP nonce via `headers()` (`ConsentDefault`), which forces dynamic rendering — incompatible with static prerendering (`generateStaticParams` → `DYNAMIC_SERVER_USAGE` 500 on on-demand / not-found slugs). The routes render dynamically (`ƒ`) with `revalidate = 3600` + the `unstable_cache` readers, so the ISR data cache + tag invalidation hold. Published slugs are enumerated for the sitemap via `publishedSlugsFor`.

## Detail-route render algorithm

```ts
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { isEnabled: isDraft } = await draftMode()

  const doc = isDraft
    ? await readDraft(slug)          // direct Payload read, draft: true (auth via /preview route)
    : await getXBySlug(slug)         // unstable_cache reader, published filter, tagged (see cached-readers.md)

  if (!doc) notFound()               // → 404 (not-found.tsx)

  return (
    <>
      {isDraft && <PreviewBanner />}
      {/* Shape A: <RenderBlocks blocks={doc.layout} />
          Shape B: <Section {...doc.field} /> composition
          Shape C: <RichText data={doc.content} /> */}
    </>
  )
}
```

## Invariants (testable)

| #   | Invariant                                                                                                                  | Test                            |
| --- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| R1  | Published route returns 200 with expected sections                                                                         | E2E + `data-testid` assertions  |
| R2  | Unknown slug → `notFound()` → HTTP 404                                                                                     | integration                     |
| R3  | `publishedSlugsFor` / list readers return published slugs only (no draft leak into the sitemap / listings)                 | integration                     |
| R4  | Draft route (via `/preview`) shows unpublished edits + `PreviewBanner`; anon public URL shows published only               | E2E round-trip                  |
| R5  | `revalidate === 3600`; route DATA is ISR-cached via `unstable_cache` (not `force-dynamic`; render is dynamic per ADR 0005) | static assertion / build output |
| R6  | `generateMetadata` emits title/description/OG from `doc.seo` with siteSettings fallback                                    | integration                     |

## Notes

- `params` and `searchParams` are Promises in Next 16 — always `await`.
- `draftMode()` is async — `await draftMode()`.
- Do **not** set `export const dynamic = 'force-dynamic'` (the spike pattern this spec retires).
- `teamMembers` route has no `seo` group → static metadata (R6 N/A; assert static title instead).
