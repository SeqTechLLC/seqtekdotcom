# Contract — 301 Redirect Map (`next.config.ts`)

Old Wix URLs → canonical routes, as permanent (301) redirects. Source of truth: **INTEGRATIONS.md §9**. The `next.config.ts` `redirects()` array is generated to match it and reconciled in the same PR (Constitution §III). Distinct from `src/payload/seed/slugRewrites.ts`, which maps bare slugs for the seed (no route prefix).

## Shape

```ts
// next.config.ts
async redirects() {
  return [
    { source: '/about-us-1',     destination: '/about',                 permanent: true },
    { source: '/our-services',   destination: '/services',              permanent: true },
    { source: '/workshops',      destination: '/touchstone-workshops',  permanent: true },
    { source: '/blog-old/:path*', destination: '/insights/:path*',      permanent: true },
    // …full set from INTEGRATIONS.md §9
  ]
}
```

## Rules

- Every entry `permanent: true` (308/301 — preserves SEO link equity from the Wix domain).
- Case-study Wix slugs that were renamed (see `slugRewrites.ts`, e.g. `driving-innovation-case-study` → `healthcare-ux-redesign`) redirect at the **path** level: `/<old> → /case-studies/<new>`.
- Wildcard children use `:path*`.
- No secrets, no auth — pure path mapping.

## Invariants (testable — `config/redirects.int.spec.ts`)

| #   | Invariant                                                             | Test                      |
| --- | --------------------------------------------------------------------- | ------------------------- |
| RM1 | Every entry has `permanent: true`                                     | integration               |
| RM2 | Every `source` and `destination` is a root-relative path (starts `/`) | integration               |
| RM3 | No `destination` 404s against the route inventory (data-model §1)     | integration cross-check   |
| RM4 | The map covers every old slug in INTEGRATIONS.md §9 (parity)          | integration vs. doc table |
| RM5 | (optional) one representative old slug returns a real 301             | E2E                       |
