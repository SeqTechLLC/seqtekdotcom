# Contract — Public Route Template

The shape every public render route in spec 004 conforms to. Tests assert this contract; tasks implement against it.

## Module-level exports (per `page.tsx`)

```ts
export const revalidate = 3600 // ARCHITECTURE.md §3 ISR fallback (seconds)
export const dynamicParams = true // newly-published slugs render on-demand, not 404 (research §D6)

// detail routes only:
export async function generateStaticParams(): Promise<Params[]> // published slugs only
export async function generateMetadata(props): Promise<Metadata> // from doc.seo, siteSettings fallback (§D7)
export default async function Page(props): Promise<ReactElement>
```

Listing routes and `/` omit `generateStaticParams` (no dynamic segment).

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

| #   | Invariant                                                                                                    | Test                            |
| --- | ------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| R1  | Published route returns 200 with expected sections                                                           | E2E + `data-testid` assertions  |
| R2  | Unknown slug → `notFound()` → HTTP 404                                                                       | integration                     |
| R3  | `generateStaticParams` returns published slugs only (no draft leak into manifest)                            | integration                     |
| R4  | Draft route (via `/preview`) shows unpublished edits + `PreviewBanner`; anon public URL shows published only | E2E round-trip                  |
| R5  | `revalidate === 3600` and route is statically cacheable (not `force-dynamic`)                                | static assertion / build output |
| R6  | `generateMetadata` emits title/description/OG from `doc.seo` with siteSettings fallback                      | integration                     |

## Notes

- `params` and `searchParams` are Promises in Next 16 — always `await`.
- `draftMode()` is async — `await draftMode()`.
- Do **not** set `export const dynamic = 'force-dynamic'` (the spike pattern this spec retires).
- `teamMembers` route has no `seo` group → static metadata (R6 N/A; assert static title instead).
