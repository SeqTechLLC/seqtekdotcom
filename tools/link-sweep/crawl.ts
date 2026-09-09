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

export const DEFAULT_VIEWPORTS: readonly Viewport[] = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]

export interface ImageFinding {
  src: string
  alt: string | null
  reason: 'not painting' | 'missing alt'
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
    const origin = new URL(baseUrl).origin
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
      .filter((route) => new URL(route, origin).origin === origin)
  } catch {
    return []
  }
}

interface ScrapedPage {
  title: string
  text: string
  hrefs: string[]
  images: { src: string; alt: string | null; painted: boolean; displayed: boolean }[]
}

/**
 * Runs in the page. Must be a real function, not a string: `page.evaluate` with
 * a string evaluates it as an expression and hands back the *function object*,
 * which serialises to `{}` — the first run of this tool reported "7 routes, no
 * findings" for exactly that reason, because every field came back empty and
 * empty reads as clean.
 */
const scrape = (): ScrapedPage => {
  const main = document.querySelector('main') ?? document.body
  const isDisplayed = (el: Element): boolean => {
    const rect = el.getBoundingClientRect()
    const style = window.getComputedStyle(el)
    return (
      style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
    )
  }
  return {
    title: document.title,
    text: (main as HTMLElement).innerText,
    hrefs: Array.from(document.querySelectorAll('a[href]')).map(
      (a) => a.getAttribute('href') ?? '',
    ),
    images: Array.from(document.querySelectorAll('img')).map((img) => ({
      src: img.currentSrc || img.getAttribute('src') || '',
      alt: img.getAttribute('alt'),
      painted: img.naturalWidth > 0 && img.naturalHeight > 0,
      displayed: isDisplayed(img),
    })),
  }
}

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
    const scraped = await page.evaluate(scrape)
    return { status: response?.status() ?? null, finalUrl: page.url(), scraped }
  } catch (error) {
    return { status: null, finalUrl: null, scraped: null, error: (error as Error).message }
  } finally {
    await page.close()
  }
}

export const sweep = async (options: SweepOptions): Promise<SweepReport> => {
  const { baseUrl, viewports, cookieHeader, maxPages, checkExternal, onProgress } = options
  const origin = new URL(baseUrl).origin
  const startedAt = new Date().toISOString()

  let browser: Browser | null = null
  const contexts: { viewport: Viewport; context: BrowserContext }[] = []
  const pages = new Map<string, PageResult>()
  const externalStatuses: Record<string, number | null> = {}

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

    for (let i = 0; i < queue.length && pages.size < maxPages; i += 1) {
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

      for (const { viewport, context } of contexts) {
        const { status, finalUrl, scraped, error } = await visit(context, baseUrl, route)
        // Status is viewport-independent; first one wins, and a later failure
        // must not overwrite a good status with null.
        if (result.status === null) result.status = status
        if (error && !result.error) result.error = error
        if (finalUrl && !result.redirectedTo) {
          const landed = normaliseRoute(new URL(finalUrl).pathname, new URL(finalUrl).search)
          if (landed !== route) result.redirectedTo = landed
        }
        if (!scraped) continue

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
          if (!img.painted) findings.push({ src: img.src, alt: img.alt, reason: 'not painting' })
          else if (img.alt === null)
            findings.push({ src: img.src, alt: null, reason: 'missing alt' })
        }
        if (findings.length > 0) result.imageFindings[viewport.name] = findings
      }

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
          const res = await context.request.get(url, { timeout: 15_000, maxRedirects: 5 })
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
  }
}
