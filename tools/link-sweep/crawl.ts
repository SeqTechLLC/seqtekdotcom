/**
 * The browser half. Drives one Chromium context per viewport over a BFS of the
 * site's own internal links, and records what each page claims and what it
 * actually renders.
 *
 * Why a browser and not a fetch loop: an <img> that 404s still parses, so the
 * only reliable "did this image paint" signal is `naturalWidth` after load.
 * Same for links a client component renders.
 */

// `@playwright/test` rather than `playwright`: the latter is only a transitive
// dependency here, and importing it directly would break the day the test
// runner stops hoisting it.
import { chromium, type Browser, type BrowserContext, type Cookie } from '@playwright/test'

import { classifyHref, normaliseRoute, scanText, type TextFinding } from './checks'

export interface Viewport {
  name: string
  width: number
  height: number
}

/**
 * Sent on external requests only. Social platforms answer an unadorned client
 * with a challenge rather than the page, so checking outbound links without
 * this reports a working profile as dead.
 */
const BROWSER_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'

export const DEFAULT_VIEWPORTS: readonly Viewport[] = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]

export interface ImageFinding {
  src: string
  alt: string | null
  reason: 'not painting' | 'missing alt' | 'still loading'
}

export interface PageResult {
  route: string
  status: number | null
  /**
   * Set when the browser ended up somewhere else. `goto` follows redirects and
   * reports the FINAL status, so without this a nav item pointing at a 301
   * looks identical to one pointing at the page — and "everything has to go
   * somewhere" is not the same bar as "everything goes where it says".
   */
  redirectedTo?: string
  /** Routes that linked here. Empty for the seeds. */
  referrers: string[]
  title: string
  textFindings: TextFinding[]
  imageFindings: Record<string, ImageFinding[]>
  internalLinks: string[]
  externalLinks: string[]
  error?: string
}

export interface SweepOptions {
  baseUrl: string
  viewports: readonly Viewport[]
  cookieHeader?: string
  maxPages: number
  checkExternal: boolean
  onProgress?: (route: string, index: number, total: number) => void
}

export interface SweepReport {
  baseUrl: string
  startedAt: string
  finishedAt: string
  pages: PageResult[]
  externalStatuses: Record<string, number | null>
  /**
   * Whether outbound links were actually requested. `externalStatuses` is
   * populated for every external link the crawl *sees*, regardless — so
   * without this the report cannot tell "checked, all fine" from "never
   * checked", and printed the former for the latter.
   */
  externalChecked: boolean
  /** Routes left unvisited because `--max-pages` was reached. */
  notVisited: string[]
}

/** `name=value; name2=value2` → Playwright cookies scoped to the target host. */
const parseCookieHeader = (header: string, baseUrl: string): Cookie[] => {
  const { hostname } = new URL(baseUrl)
  return header
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const eq = part.indexOf('=')
      return {
        name: part.slice(0, eq),
        value: part.slice(eq + 1),
        domain: hostname,
        path: '/',
        expires: -1,
        httpOnly: false,
        secure: baseUrl.startsWith('https'),
        sameSite: 'Lax',
      } satisfies Cookie
    })
}

/**
 * The site's own claim about what exists. Seeding from it as well as from `/`
 * is what turns a link crawl into a sweep: a document nothing links to is
 * exactly the kind of orphan this is supposed to surface, and following links
 * alone would never reach it.
 */
const sitemapRoutes = async (baseUrl: string, cookieHeader?: string): Promise<string[]> => {
  try {
    const res = await fetch(new URL('/sitemap.xml', baseUrl), {
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
    })
    if (!res.ok) return []
    const xml = await res.text()
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => m[1].trim())
      .flatMap((loc) => {
        try {
          const url = new URL(loc)
          // The sitemap is generated with NEXT_PUBLIC_SITE_URL, which need not
          // match the host we are sweeping. Keep the path, drop their origin.
          return [normaliseRoute(url.pathname, url.search)]
        } catch {
          return []
        }
      })
  } catch {
    return []
  }
}

interface ScrapedPage {
  title: string
  text: string
  hrefs: string[]
  images: {
    src: string
    alt: string | null
    painted: boolean
    settled: boolean
    displayed: boolean
  }[]
}

/**
 * Runs in the page.
 *
 * TEXT COMES FROM `<main>` ONLY (falling back to `<body>`), while links and
 * images come from the whole document. Chrome repeats on all 60 routes, so
 * scanning it would multiply one nav typo into sixty findings — but the
 * consequence is that placeholder copy in the header or footer is invisible
 * here. `site-content.ts` is code-owned and covered by
 * `noPlaceholderCopy.int.spec.ts`, which is the other half of that trade.
 *
 * Deliberately free of inner named functions, and shipped as SOURCE rather than
 * as a function reference. Both constraints come from bugs this tool hit on its
 * own first two runs:
 *
 *   1. `page.evaluate(fn)` with a bare `() => {…}` STRING evaluates to the
 *      function object, which serialises to `{}` — every field came back empty,
 *      and empty read as clean: "7 routes, no findings" against a 59-route site.
 *   2. Passing the function reference instead does not work either. `tsx`
 *      transpiles with esbuild's keepNames, which wraps every named function in
 *      a `__name` helper. That helper does not exist in the browser, so the
 *      inner `const isDisplayed = …` became `ReferenceError: __name is not
 *      defined` on all 59 routes.
 *
 * An IIFE built from `.toString()` avoids both: it evaluates to the object, and
 * `.toString()` of the outer arrow carries no `__name` as long as nothing
 * inside it is a named function. Keep it that way — inline callbacks are
 * anonymous and safe, a `const helper = () => …` is not.
 */
const scrapeFn = (): ScrapedPage => {
  const main = document.querySelector('main') ?? document.body
  return {
    title: document.title,
    text: (main as HTMLElement).innerText,
    hrefs: Array.from(document.querySelectorAll('a[href]')).map(
      (a) => a.getAttribute('href') ?? '',
    ),
    images: Array.from(document.querySelectorAll('img')).map((img) => {
      const style = window.getComputedStyle(img)
      return {
        src: img.currentSrc || img.getAttribute('src') || '',
        alt: img.getAttribute('alt'),
        painted: img.naturalWidth > 0 && img.naturalHeight > 0,
        // `complete` is true once the load finished, successfully or not. A
        // lazy image that has not been requested yet is false — without this,
        // every below-the-fold `loading="lazy"` image reports as broken, which
        // is what the first working run did to the footer logo on 20 pages.
        settled: img.complete,
        // CSS visibility only, deliberately NOT a non-zero box. An <img> that
        // fails to load and carries no width/height collapses to 0x0 — so
        // requiring a box skipped exactly the images this check exists to
        // find.
        //
        // Note this reads the IMAGE's own computed style, which an ancestor's
        // `display: none` does not change. An <img> inside a `hidden md:block`
        // wrapper is therefore still checked. Nothing in `src/` renders one
        // that way today, and the failure direction is extra lines in the
        // non-failable "still loading" note rather than silence.
        displayed: style.display !== 'none' && style.visibility !== 'hidden',
      }
    }),
  }
}

export const SCRAPE_SOURCE = `(${scrapeFn.toString()})()`

/**
 * Walk the page so `loading="lazy"` images below the fold are actually
 * requested. Without this the sweep judges an image that was never asked for,
 * and `settled` alone would just hide it rather than check it.
 *
 * A plain string, not a transpiled function — see SCRAPE_SOURCE above.
 */
export const SCROLL_SOURCE = `(async () => {
  const step = Math.max(200, window.innerHeight)
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y)
    await new Promise((resolve) => setTimeout(resolve, 80))
  }
  window.scrollTo(0, 0)
  await new Promise((resolve) => setTimeout(resolve, 200))
})()`

/**
 * One transport-level retry. A `net::ERR_NETWORK_CHANGED` on the operator's
 * laptop is not a finding about the site, and without this it lands in the
 * report as a dead route — which is worse than a miss, because it teaches the
 * reader to skim the dead-route list.
 */
const isTransient = (message: string): boolean =>
  /net::ERR_|ECONNRESET|socket hang up|Timeout .* exceeded/i.test(message)

const visit = async (
  context: BrowserContext,
  baseUrl: string,
  route: string,
): Promise<{
  status: number | null
  finalUrl: string | null
  scraped: ScrapedPage | null
  error?: string
}> => {
  const page = await context.newPage()
  try {
    const response = await page.goto(new URL(route, baseUrl).toString(), {
      waitUntil: 'load',
      timeout: 30_000,
    })
    // `load` fires before lazy images settle; give the network a moment but do
    // not fail the page over a long-poll or an analytics beacon that never idles.
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {})
    await page.evaluate(SCROLL_SOURCE).catch(() => {})
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {})
    const scraped = (await page.evaluate(SCRAPE_SOURCE)) as ScrapedPage
    return { status: response?.status() ?? null, finalUrl: page.url(), scraped }
  } catch (error) {
    return { status: null, finalUrl: null, scraped: null, error: (error as Error).message }
  } finally {
    await page.close()
  }
}

const visitWithRetry = async (
  context: BrowserContext,
  baseUrl: string,
  route: string,
): Promise<Awaited<ReturnType<typeof visit>>> => {
  const first = await visit(context, baseUrl, route)
  if (!first.error || !isTransient(first.error)) return first
  return visit(context, baseUrl, route)
}

export const sweep = async (options: SweepOptions): Promise<SweepReport> => {
  const { baseUrl, viewports, cookieHeader, maxPages, checkExternal, onProgress } = options
  const origin = new URL(baseUrl).origin
  const startedAt = new Date().toISOString()

  let browser: Browser | null = null
  const contexts: { viewport: Viewport; context: BrowserContext }[] = []
  const pages = new Map<string, PageResult>()
  const externalStatuses: Record<string, number | null> = {}
  let notVisited: string[] = []

  try {
    browser = await chromium.launch()
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        ignoreHTTPSErrors: true,
      })
      if (cookieHeader) await context.addCookies(parseCookieHeader(cookieHeader, baseUrl))
      contexts.push({ viewport, context })
    }

    // Deduped as it is built: the sitemap lists `/` too, and seeding the queue
    // before the seen-set meant the homepage was crawled twice.
    const queued = new Set<string>()
    const queue: string[] = []
    for (const route of ['/', ...(await sitemapRoutes(baseUrl, cookieHeader))]) {
      if (!queued.has(route)) {
        queued.add(route)
        queue.push(route)
      }
    }

    for (let i = 0; i < queue.length; i += 1) {
      if (pages.size >= maxPages) break
      const route = queue[i]
      onProgress?.(route, i + 1, queue.length)

      const result: PageResult = {
        route,
        status: null,
        referrers: [],
        title: '',
        textFindings: [],
        imageFindings: {},
        internalLinks: [],
        externalLinks: [],
      }
      const internal = new Set<string>()
      const external = new Set<string>()

      // A route is only broken if EVERY viewport failed. Recording the first
      // error unconditionally filed routes that rendered fine at one width
      // under "dead or unreachable" — a false entry in the list that matters
      // most, which is the thing the retry below exists to prevent.
      let anyScraped = false
      let firstError: string | undefined

      for (const { viewport, context } of contexts) {
        const { status, finalUrl, scraped, error } = await visitWithRetry(context, baseUrl, route)
        // Status is viewport-independent; first one wins, and a later failure
        // must not overwrite a good status with null.
        if (result.status === null) result.status = status
        if (error && !firstError) firstError = error
        if (finalUrl && !result.redirectedTo) {
          const landed = normaliseRoute(new URL(finalUrl).pathname, new URL(finalUrl).search)
          if (landed !== route) result.redirectedTo = landed
        }
        if (!scraped) continue
        anyScraped = true

        result.title ||= scraped.title
        // Text is the same at both viewports for a server-rendered page, so
        // scan once — but scan the viewport that actually returned content.
        if (result.textFindings.length === 0) result.textFindings = scanText(scraped.text)

        for (const href of scraped.hrefs) {
          const link = classifyHref(href ?? '', origin)
          if (link.kind === 'internal' && link.route) internal.add(link.route)
          if (link.kind === 'external') external.add(link.href)
        }

        // Images DO differ by viewport — `srcset` picks a different file and
        // responsive utilities hide whole blocks — so this check runs per
        // viewport and reports which one broke.
        const findings: ImageFinding[] = []
        for (const img of scraped.images) {
          if (!img.displayed) continue
          if (!img.settled) {
            // Judged by neither branch when this was an if/else: an image
            // still in flight silently left the set the tick is printed over.
            // The scrape runs after the scroll pass and two networkidle waits,
            // so this means the network never idled — reported, not failed.
            findings.push({ src: img.src, alt: img.alt, reason: 'still loading' })
          } else if (!img.painted) {
            findings.push({ src: img.src, alt: img.alt, reason: 'not painting' })
          }
          // Independent of the above: a broken image with no `alt` is two
          // findings, not one, and chaining them hid the second.
          if (img.alt === null) {
            findings.push({ src: img.src, alt: null, reason: 'missing alt' })
          }
        }
        if (findings.length > 0) result.imageFindings[viewport.name] = findings
      }

      if (!anyScraped && firstError) result.error = firstError

      result.internalLinks = [...internal].sort()
      result.externalLinks = [...external].sort()

      // A 200 that scraped nothing is a broken sweep reporting itself as a
      // clean site — the failure mode this tool is least able to notice, and
      // the one its first run actually hit. Every page here renders the shared
      // chrome, so zero links is never a real page.
      if (result.status === 200 && internal.size === 0 && !result.error) {
        result.error =
          'returned 200 but no links were scraped — the page did not render, or the scrape broke'
      }

      pages.set(route, result)

      for (const next of internal) {
        if (!queued.has(next)) {
          queued.add(next)
          queue.push(next)
        }
      }
      for (const ext of external) externalStatuses[ext] ??= null
    }

    // What the ceiling cut off. Reporting `swept N routes` after silently
    // dropping the rest is the same "a check that did not run looks clean"
    // failure this tool exists to catch.
    //
    // Derived from what was actually visited, NOT from where the loop stopped:
    // the queue grows during iteration, so slicing at a pre-loop length
    // reported every link-discovered route as unvisited. It found one — the
    // tool's truncation reporter caught the tool's truncation reporter.
    notVisited = queue.filter((route) => !pages.has(route))

    // Referrers, so a dead link names the page that has to be edited rather
    // than only the URL that 404s.
    for (const page of pages.values()) {
      for (const target of page.internalLinks) {
        pages.get(target)?.referrers.push(page.route)
      }
    }

    if (checkExternal) {
      const context = contexts[0].context
      for (const url of Object.keys(externalStatuses)) {
        try {
          const res = await context.request.get(url, {
            timeout: 15_000,
            maxRedirects: 5,
            // Without this LinkedIn answers 999 to every request and the
            // company page reports as broken. Measured: bare client 999,
            // this UA 200.
            headers: { 'user-agent': BROWSER_UA },
          })
          externalStatuses[url] = res.status()
        } catch {
          externalStatuses[url] = null
        }
      }
    }
  } finally {
    for (const { context } of contexts) await context.close().catch(() => {})
    await browser?.close().catch(() => {})
  }

  return {
    baseUrl,
    startedAt,
    finishedAt: new Date().toISOString(),
    pages: [...pages.values()],
    externalStatuses,
    externalChecked: checkExternal,
    notVisited,
  }
}
