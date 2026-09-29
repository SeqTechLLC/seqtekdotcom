# AI Crawl Optimization (AICO) — plan

Not built. Tracked as ROADMAP F-6. The content side (citations, schema, bylines) is CONTENT-REQUIREMENTS §8;
this is the rendering and infrastructure side. Today the site serves no `robots.txt`, no `.md` routes and no
`llms.txt`.

## 1. Per-crawler `robots.txt`

Serve `robots.txt` from `src/app/robots.ts` so it is generated and tested, with a policy per crawler:

- **Allow:** `Googlebot`, `Bingbot`, `DuckDuckBot`, and crawlers that cite with attribution (`ClaudeBot`,
  `PerplexityBot`, `OAI-SearchBot`).
- **Allow with `Crawl-delay: 10`:** training crawlers (`GPTBot`, `Google-Extended`, `CCBot`, `Bytespider`).
- **Disallow:** crawlers with no citation surface for this audience.

A unit test asserts each entry produces its directive.

## 2. Markdown alternatives

Each content route (`/[slug]`, `/insights/[slug]`, `/case-studies/[slug]`, `/services/[slug]`,
`/workshops/[slug]`, `/team/[slug]`) also serves `text/markdown` at the same path with a `.md` suffix. The
Markdown is projected from the same content that renders the HTML, so the two cannot drift, with
frontmatter for title, author, dates and the canonical URL. The `.md` URLs go in `sitemap.xml`.

## 3. `llms.txt` and `llms-full.txt`

- `/llms.txt`: a curated Markdown index of the highest-signal pages with one-line summaries, grouped by
  intent (services, case studies, localshoring, how to engage).
- `/llms-full.txt`: the same index with each page's Markdown body concatenated.

Both regenerate on publish through the existing revalidation hook.

## 4. Edge caching

The `.md` routes, `llms.txt`, `llms-full.txt` and `sitemap.xml` get long edge TTLs with
`stale-while-revalidate`, so crawlers hit CloudFront rather than the origin. This depends on a
host-aware cache policy, because the shared distribution caches nothing while the env is gated
(ARCHITECTURE §3).

## 5. Abuse

If a crawler ignores `Crawl-delay`, add a WAF rate-based rule (none is attached today), and move repeat
offenders to `Disallow`.

## 6. Limits

The HTML and Markdown are the same content in two shapes. No crawler gets different copy.
