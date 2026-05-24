/**
 * CSP violation report sink. Accepts both legacy `application/csp-report`
 * payloads and the modern Reporting API (`application/reports+json`) shape.
 *
 * Logs a single JSON line per accepted report to stdout so the awslogs Docker
 * log driver ships them to CloudWatch Logs (INTEGRATIONS.md §8 Rollout
 * mechanism). Metric filter + alarm live in the CDK stack.
 */

import { NextResponse } from 'next/server'

type LegacyReport = {
  'csp-report'?: {
    'document-uri'?: string
    'violated-directive'?: string
    'effective-directive'?: string
    'original-policy'?: string
    'blocked-uri'?: string
    'source-file'?: string
    'line-number'?: number
    'column-number'?: number
    disposition?: string
  }
}

type ModernReport = {
  type?: string
  age?: number
  url?: string
  user_agent?: string
  body?: {
    documentURL?: string
    referrer?: string
    blockedURL?: string
    effectiveDirective?: string
    originalPolicy?: string
    sourceFile?: string
    lineNumber?: number
    columnNumber?: number
    disposition?: string
    statusCode?: number
  }
}

type Normalized = {
  documentUri: string | null
  violatedDirective: string | null
  blockedUri: string | null
  sourceFile: string | null
  disposition: string | null
}

function normalizeLegacy(report: LegacyReport): Normalized | null {
  const r = report['csp-report']
  if (!r) return null
  const directive = r['effective-directive'] || r['violated-directive'] || null
  if (!directive && !r['blocked-uri']) return null
  return {
    documentUri: r['document-uri'] ?? null,
    violatedDirective: directive,
    blockedUri: r['blocked-uri'] ?? null,
    sourceFile: r['source-file'] ?? null,
    disposition: r.disposition ?? null,
  }
}

function normalizeModern(reports: ModernReport[]): Normalized[] {
  const out: Normalized[] = []
  for (const report of reports) {
    if (report.type !== 'csp-violation') continue
    const b = report.body
    if (!b) continue
    const directive = b.effectiveDirective ?? null
    if (!directive && !b.blockedURL) continue
    out.push({
      documentUri: b.documentURL ?? report.url ?? null,
      violatedDirective: directive,
      blockedUri: b.blockedURL ?? null,
      sourceFile: b.sourceFile ?? null,
      disposition: b.disposition ?? null,
    })
  }
  return out
}

export async function POST(request: Request): Promise<Response> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? ''

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  let normalized: Normalized[] = []

  if (contentType.includes('application/csp-report')) {
    const n = normalizeLegacy(raw as LegacyReport)
    if (n) normalized = [n]
  } else if (contentType.includes('application/reports+json')) {
    if (Array.isArray(raw)) normalized = normalizeModern(raw as ModernReport[])
  } else {
    // Browsers occasionally send application/json without the spec-mandated subtype.
    // Be lenient: try modern shape first (array), fall back to legacy.
    if (Array.isArray(raw)) normalized = normalizeModern(raw as ModernReport[])
    else {
      const n = normalizeLegacy(raw as LegacyReport)
      if (n) normalized = [n]
    }
  }

  if (normalized.length === 0) {
    return NextResponse.json({ error: 'invalid_report' }, { status: 400 })
  }

  for (const entry of normalized) {
    console.log(
      JSON.stringify({
        type: 'csp_violation',
        ts: new Date().toISOString(),
        userAgent: request.headers.get('user-agent') ?? null,
        ...entry,
      }),
    )
  }

  return new NextResponse(null, { status: 204 })
}

export async function GET(): Promise<Response> {
  return new NextResponse(null, { status: 405, headers: { Allow: 'POST' } })
}
