/**
 * Turns a `SweepReport` into the two things a person wants: a readable console
 * summary, and a verdict per category so `--fail-on` can gate CI later without
 * the reporting shape changing.
 */

import type { SweepReport } from './crawl'

export type Category = 'links' | 'images' | 'placeholders' | 'alt' | 'external' | 'redirects'

export interface CategorisedFindings {
  links: { route: string; status: number | null; referrers: string[]; error?: string }[]
  images: { route: string; viewport: string; src: string }[]
  alt: { route: string; viewport: string; src: string }[]
  placeholders: { route: string; label: string; excerpt: string }[]
  external: { url: string; status: number | null }[]
  /**
   * Outbound links whose status says the SERVER refused this client rather
   * than that the page is gone — 401/403/429, and LinkedIn's 999. Reported so
   * they are visible, kept out of `external` so they cannot fail a build.
   * Measured: `facebook.com/seqtek/` answers 400 to one user-agent and 200 to
   * another. A checker cannot tell that apart from a dead page, so it must not
   * claim to.
   */
  unverifiable: { url: string; status: number | null }[]
  redirects: { route: string; to: string; referrers: string[] }[]
}

export const categorise = (report: SweepReport): CategorisedFindings => {
  const out: CategorisedFindings = {
    links: [],
    images: [],
    alt: [],
    placeholders: [],
    external: [],
    unverifiable: [],
    redirects: [],
  }

  for (const page of report.pages) {
    // `page.error` matters even on a 200: `crawl.ts` sets it when a page came
    // back but rendered nothing, which would otherwise be reported as clean.
    if (page.status === null || page.status >= 400 || page.error) {
      out.links.push({
        route: page.route,
        status: page.status,
        referrers: page.referrers,
        error: page.error,
      })
    }
    if (page.redirectedTo) {
      out.redirects.push({ route: page.route, to: page.redirectedTo, referrers: page.referrers })
    }
    for (const [viewport, findings] of Object.entries(page.imageFindings)) {
      for (const finding of findings) {
        const bucket = finding.reason === 'not painting' ? out.images : out.alt
        bucket.push({ route: page.route, viewport, src: finding.src })
      }
    }
    for (const finding of page.textFindings) {
      out.placeholders.push({ route: page.route, label: finding.label, excerpt: finding.excerpt })
    }
  }

  // Only when they were actually requested — see `SweepReport.externalChecked`.
  // And `null` is a FINDING, not a non-result: `crawl.ts` sets it when the
  // request threw, which is what a dead domain, a DNS failure or a refused
  // connection look like. Dropping it made the likeliest broken outbound link
  // on an old site the one shape this could not see, and disagreed with the
  // internal `links` category above, which treats a null status as dead.
  if (report.externalChecked) {
    for (const [url, status] of Object.entries(report.externalStatuses)) {
      // Gone, or unreachable at all. `null` is the request having thrown —
      // dead domain, DNS failure, refused connection.
      // 500-599, not `>= 500`: LinkedIn's bot challenge is status 999, which
      // an open-ended comparison files as a server error.
      if (status === null || status === 404 || status === 410 || (status >= 500 && status < 600)) {
        out.external.push({ url, status })
      } else if (status >= 400) {
        out.unverifiable.push({ url, status })
      }
    }
  }

  return out
}

const heading = (title: string, count: number): string =>
  `\n${count === 0 ? '✓' : '✗'} ${title} — ${count === 0 ? 'none' : count}`

export const format = (report: SweepReport, found: CategorisedFindings): string => {
  const lines: string[] = []
  const ok = report.pages.filter((p) => p.status === 200).length

  lines.push(`swept ${report.pages.length} routes on ${report.baseUrl} — ${ok} returned 200`)
  if (report.notVisited.length > 0) {
    lines.push(
      `✗ crawl stopped at --max-pages: ${report.notVisited.length} routes never visited, ` +
        `starting with ${report.notVisited.slice(0, 3).join(', ')}`,
    )
  }

  lines.push(heading('dead or unreachable routes', found.links.length))
  for (const item of found.links) {
    const from =
      item.referrers.length > 0
        ? ` — linked from ${item.referrers.join(', ')}`
        : ' — orphan (sitemap only)'
    lines.push(`  ${item.status ?? 'ERR'} ${item.route}${from}`)
    if (item.error) lines.push(`      ${item.error}`)
  }

  lines.push(heading('images that do not paint', found.images.length))
  for (const item of found.images) lines.push(`  ${item.route} [${item.viewport}] ${item.src}`)

  lines.push(heading('placeholder or internal copy in rendered text', found.placeholders.length))
  for (const item of found.placeholders) {
    lines.push(`  ${item.route} — ${item.label}`)
    lines.push(`      ${item.excerpt}`)
  }

  lines.push(heading('links that land somewhere else (redirects)', found.redirects.length))
  for (const item of found.redirects) {
    const from = item.referrers.length > 0 ? ` — linked from ${item.referrers.join(', ')}` : ''
    lines.push(`  ${item.route} → ${item.to}${from}`)
  }

  lines.push(heading('images with no alt attribute', found.alt.length))
  for (const item of found.alt) lines.push(`  ${item.route} [${item.viewport}] ${item.src}`)

  const externalSeen = Object.keys(report.externalStatuses).length
  if (report.externalChecked) {
    lines.push(heading('broken external links', found.external.length))
    for (const item of found.external) {
      lines.push(`  ${item.status ?? 'ERR'} ${item.url}`)
    }
    if (found.unverifiable.length > 0) {
      lines.push(
        `\n– ${found.unverifiable.length} external links could not be verified (bot protection)`,
      )
      for (const item of found.unverifiable) lines.push(`  ${item.status} ${item.url}`)
    }
  } else if (externalSeen > 0) {
    // NOT a tick. `externalStatuses` is filled in for every outbound link the
    // crawl sees, so gating the tick on its size printed "✓ none" after zero
    // requests — a check that did not run, reporting clean, in the tool whose
    // whole purpose is to stop that.
    lines.push(`\n– ${externalSeen} external links not checked (pass --external)`)
  }

  return lines.join('\n')
}

export const countsByCategory = (found: CategorisedFindings): Record<Category, number> => ({
  links: found.links.length,
  images: found.images.length,
  placeholders: found.placeholders.length,
  alt: found.alt.length,
  external: found.external.length,
  redirects: found.redirects.length,
})
