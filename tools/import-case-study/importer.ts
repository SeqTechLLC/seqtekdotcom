/**
 * Core import flow: resolve relations by slug, upload images, convert prose to
 * Lexical, then idempotently upsert the case study by slug. Kept free of
 * process/argv/env concerns so it is unit-testable with an injected client.
 */

import { textToLexical } from '../../src/payload/seed/htmlToLexical'

import { PayloadRestClient } from './client'
import type { CaseStudyInput, ImageRef } from './types'

type DocId = string | number

export interface ImportOptions {
  /** Publish on import (sets `_status: published` + publishedAt). Default: draft. */
  publish: boolean
  /** Resolve + assemble but perform no writes. */
  dryRun: boolean
  log: (msg: string) => void
  warn: (msg: string) => void
  /** Override "now" for deterministic publishedAt in tests. */
  now?: () => Date
}

export interface ImportResult {
  operation: 'create' | 'update' | 'dry-run'
  id: DocId | null
  slug: string
  status: 'draft' | 'published'
}

async function uploadOrPreview(
  client: PayloadRestClient,
  ref: ImageRef,
  label: string,
  dryRun: boolean,
  log: (msg: string) => void,
): Promise<DocId> {
  const src = ref.file ?? ref.url ?? '(none)'
  if (dryRun) {
    log(`would upload ${label}: ${src} (alt: "${ref.alt}")`)
    return `<upload:${src}>`
  }
  const resolved = await client.resolveImage(ref)
  const id = await client.uploadMedia(resolved)
  log(`uploaded ${label}: ${resolved.filename} → media ${id}`)
  return id
}

export async function importCaseStudy(
  client: PayloadRestClient,
  input: CaseStudyInput,
  opts: ImportOptions,
): Promise<ImportResult> {
  const { publish, dryRun, log, warn } = opts
  // Find drafts too when authenticated; a token-less dry-run can only see
  // published docs, which is acceptable for a preview.
  const lookupDraft = client.hasToken

  // 1. Required relation: industry.
  const industryId = await client.findIdByField('industries', 'slug', input.industry, {
    draft: lookupDraft,
  })
  if (industryId === null) {
    throw new Error(
      `industry "${input.industry}" not found — create it in the industries collection first, or fix the slug`,
    )
  }
  log(`resolved industry "${input.industry}" → ${industryId}`)

  // 2. Optional relations: services (warn + drop unknown).
  const serviceIds: DocId[] = []
  for (const slug of input.services ?? []) {
    const id = await client.findIdByField('services', 'slug', slug, { draft: lookupDraft })
    if (id === null) warn(`service "${slug}" not found — skipping`)
    else serviceIds.push(id)
  }

  // 3. Optional self-relation: related case studies (warn + drop, cap 3).
  const relatedIds: DocId[] = []
  for (const slug of input.relatedCaseStudies ?? []) {
    if (relatedIds.length >= 3) {
      warn(`relatedCaseStudies capped at 3 — dropping "${slug}"`)
      continue
    }
    const id = await client.findIdByField('caseStudies', 'slug', slug, { draft: lookupDraft })
    if (id === null) warn(`related case study "${slug}" not found — skipping`)
    else relatedIds.push(id)
  }

  // 4. Images (hero required; client logo + ogImage optional).
  const heroId = await uploadOrPreview(client, input.heroImage, 'heroImage', dryRun, log)
  const logoId = input.client?.logo
    ? await uploadOrPreview(client, input.client.logo, 'client.logo', dryRun, log)
    : undefined
  const ogId = input.seo?.ogImage
    ? await uploadOrPreview(client, input.seo.ogImage, 'seo.ogImage', dryRun, log)
    : undefined

  // 5. Assemble the document (omit empty optionals).
  const data: Record<string, unknown> = {
    title: input.title,
    slug: input.slug,
    industry: industryId,
    heroImage: heroId,
  }
  if (input.subtitle) data.subtitle = input.subtitle
  if (serviceIds.length > 0) data.services = serviceIds
  if (input.problem) data.problem = textToLexical(input.problem)
  if (input.solution) data.solution = textToLexical(input.solution)
  if (input.impact) data.impact = textToLexical(input.impact)
  if (input.metrics && input.metrics.length > 0) {
    data.metrics = input.metrics.map((m) => ({
      number: m.number,
      label: m.label,
      ...(m.context ? { context: m.context } : {}),
    }))
  }
  if (input.technologies && input.technologies.length > 0) {
    data.technologies = input.technologies.map((label) => ({ label }))
  }
  if (input.testimonial !== undefined) data.testimonial = input.testimonial
  if (relatedIds.length > 0) data.relatedCaseStudies = relatedIds

  if (input.client) {
    const group: Record<string, unknown> = { isAnonymized: input.client.isAnonymized ?? false }
    if (input.client.name) group.name = input.client.name
    if (logoId !== undefined) group.logo = logoId
    data.client = group
  }

  if (input.seo) {
    const seo: Record<string, unknown> = {}
    if (input.seo.metaTitle) seo.metaTitle = input.seo.metaTitle
    if (input.seo.metaDescription) seo.metaDescription = input.seo.metaDescription
    if (ogId !== undefined) seo.ogImage = ogId
    if (Object.keys(seo).length > 0) data.seo = seo
  }

  const status: 'draft' | 'published' = publish ? 'published' : 'draft'
  if (publish) {
    data._status = 'published'
    const now = opts.now ?? (() => new Date())
    data.publishedAt = input.publishedAt ?? now().toISOString()
  } else if (input.publishedAt) {
    data.publishedAt = input.publishedAt
  }

  if (dryRun) {
    log('dry-run — no writes performed. Resolved payload:')
    log(JSON.stringify(data, null, 2))
    return { operation: 'dry-run', id: null, slug: input.slug, status }
  }

  // 6. Idempotent upsert by slug. `?draft=true` only when not publishing, so a
  // publish run actually flips _status; a draft run keeps the record unpublished.
  const writeAsDraft = !publish
  const existingId = await client.findIdByField('caseStudies', 'slug', input.slug, { draft: true })
  if (existingId !== null) {
    const id = await client.updateDoc('caseStudies', existingId, data, { draft: writeAsDraft })
    log(`updated case study "${input.slug}" → ${id}`)
    return { operation: 'update', id, slug: input.slug, status }
  }
  const id = await client.createDoc('caseStudies', data, { draft: writeAsDraft })
  log(`created case study "${input.slug}" → ${id}`)
  return { operation: 'create', id, slug: input.slug, status }
}
