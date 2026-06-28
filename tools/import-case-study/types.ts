/**
 * Input schema + validation for the case-study importer.
 *
 * The shape mirrors the `caseStudies` collection (src/collections/CaseStudies.ts)
 * but references relations by slug and images by file path / URL, so one case
 * study can be authored as a single self-contained JSON file. Validation is
 * hand-rolled (no zod in the dependency tree) and reports every problem at once
 * rather than throwing on the first.
 */

import type { ImageRef } from '../payload-rest/client'

// `ImageRef` now lives with the shared REST client (it's part of that client's
// surface); re-export it so existing `./types` importers keep resolving.
export type { ImageRef }

// Mirrors `validateSlug` in src/payload/hooks/slugFromTitle.ts so the importer
// rejects bad slugs before a round-trip rather than surfacing a 400 from the API.
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export interface MetricInput {
  number: string
  label: string
  context?: string
}

export interface CaseStudyInput {
  slug: string
  title: string
  subtitle?: string
  /** `industries` collection slug (required relation). */
  industry: string
  /** `services` collection slugs (optional, many). */
  services?: string[]
  client?: {
    name?: string
    logo?: ImageRef
    isAnonymized?: boolean
  }
  /** Hero image — required by the collection. */
  heroImage: ImageRef
  /** Prose sections — plain text / light markdown, converted to Lexical. */
  problem?: string
  solution?: string
  impact?: string
  metrics?: MetricInput[]
  /** Technology labels; stored as `{ label }[]`. */
  technologies?: string[]
  /**
   * Testimonial to link. Testimonials have no slug, so this is the document
   * ID — or omit it and link the testimonial in /admin afterward (the seed
   * pipeline leaves this for editors too).
   */
  testimonial?: string | number
  /** `caseStudies` slugs to cross-link (max 3). */
  relatedCaseStudies?: string[]
  seo?: {
    metaTitle?: string
    metaDescription?: string
    ogImage?: ImageRef
  }
  /** ISO date (or any Date-parseable string). */
  publishedAt?: string
}

export type ValidationResult = { ok: true; value: CaseStudyInput } | { ok: false; errors: string[] }

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseImageRef(value: unknown, path: string, errors: string[]): ImageRef {
  if (!isObject(value)) {
    errors.push(`${path} must be an object: { file | url, alt }`)
    return { alt: '' }
  }
  const file = typeof value.file === 'string' && value.file.length > 0 ? value.file : undefined
  const url = typeof value.url === 'string' && value.url.length > 0 ? value.url : undefined
  if ((file === undefined) === (url === undefined)) {
    errors.push(`${path} must set exactly one of "file" or "url"`)
  }
  let alt = ''
  if (typeof value.alt === 'string' && value.alt.trim().length > 0) {
    alt = value.alt
  } else {
    errors.push(`${path}.alt is required (media alt text is mandatory)`)
  }
  return { file, url, alt }
}

/**
 * Validate an untrusted parsed-JSON value into a `CaseStudyInput`. Collects all
 * problems so the caller can print them in one pass.
 */
export function validateInput(raw: unknown): ValidationResult {
  if (!isObject(raw)) {
    return { ok: false, errors: ['top-level value must be a JSON object'] }
  }
  const errors: string[] = []

  const reqStr = (key: string): string => {
    const v = raw[key]
    if (typeof v !== 'string' || v.trim().length === 0) {
      errors.push(`"${key}" is required and must be a non-empty string`)
      return ''
    }
    return v
  }
  const optStr = (key: string): string | undefined => {
    const v = raw[key]
    if (v === undefined || v === null) return undefined
    if (typeof v !== 'string') {
      errors.push(`"${key}" must be a string`)
      return undefined
    }
    return v
  }
  const optStrArray = (key: string): string[] | undefined => {
    const v = raw[key]
    if (v === undefined || v === null) return undefined
    if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) {
      errors.push(`"${key}" must be an array of strings`)
      return undefined
    }
    return v as string[]
  }

  const slug = reqStr('slug')
  if (slug && !SLUG_RE.test(slug)) {
    errors.push('"slug" must be lowercase letters, numbers, and dashes only')
  }
  const title = reqStr('title')
  const industry = reqStr('industry')

  let heroImage: ImageRef = { alt: '' }
  if (raw.heroImage === undefined || raw.heroImage === null) {
    errors.push('"heroImage" is required: { file | url, alt }')
  } else {
    heroImage = parseImageRef(raw.heroImage, 'heroImage', errors)
  }

  const services = optStrArray('services')
  const technologies = optStrArray('technologies')
  const relatedCaseStudies = optStrArray('relatedCaseStudies')
  if (relatedCaseStudies && relatedCaseStudies.length > 3) {
    errors.push('"relatedCaseStudies" allows at most 3 entries')
  }

  let client: CaseStudyInput['client']
  if (raw.client !== undefined && raw.client !== null) {
    if (!isObject(raw.client)) {
      errors.push('"client" must be an object')
    } else {
      const c = raw.client
      const name = typeof c.name === 'string' ? c.name : undefined
      if (c.name !== undefined && typeof c.name !== 'string')
        errors.push('"client.name" must be a string')
      let isAnonymized: boolean | undefined
      if (c.isAnonymized !== undefined) {
        if (typeof c.isAnonymized === 'boolean') isAnonymized = c.isAnonymized
        else errors.push('"client.isAnonymized" must be a boolean')
      }
      const logo =
        c.logo === undefined || c.logo === null
          ? undefined
          : parseImageRef(c.logo, 'client.logo', errors)
      client = { name, logo, isAnonymized }
    }
  }

  let metrics: MetricInput[] | undefined
  if (raw.metrics !== undefined && raw.metrics !== null) {
    if (!Array.isArray(raw.metrics)) {
      errors.push('"metrics" must be an array')
    } else {
      const collected: MetricInput[] = []
      raw.metrics.forEach((m, i) => {
        if (!isObject(m)) {
          errors.push(`metrics[${i}] must be an object`)
          return
        }
        const number = typeof m.number === 'string' ? m.number : ''
        const label = typeof m.label === 'string' ? m.label : ''
        if (!number) errors.push(`metrics[${i}].number is required`)
        if (!label) errors.push(`metrics[${i}].label is required`)
        const context = typeof m.context === 'string' ? m.context : undefined
        if (m.context !== undefined && typeof m.context !== 'string') {
          errors.push(`metrics[${i}].context must be a string`)
        }
        collected.push({ number, label, context })
      })
      metrics = collected
    }
  }

  let testimonial: string | number | undefined
  if (raw.testimonial !== undefined && raw.testimonial !== null) {
    if (typeof raw.testimonial === 'string' || typeof raw.testimonial === 'number') {
      testimonial = raw.testimonial
    } else {
      errors.push('"testimonial" must be a string or number (document id)')
    }
  }

  let seo: CaseStudyInput['seo']
  if (raw.seo !== undefined && raw.seo !== null) {
    if (!isObject(raw.seo)) {
      errors.push('"seo" must be an object')
    } else {
      const s = raw.seo
      const metaTitle = typeof s.metaTitle === 'string' ? s.metaTitle : undefined
      if (s.metaTitle !== undefined && typeof s.metaTitle !== 'string')
        errors.push('"seo.metaTitle" must be a string')
      const metaDescription = typeof s.metaDescription === 'string' ? s.metaDescription : undefined
      if (s.metaDescription !== undefined && typeof s.metaDescription !== 'string') {
        errors.push('"seo.metaDescription" must be a string')
      }
      const ogImage =
        s.ogImage === undefined || s.ogImage === null
          ? undefined
          : parseImageRef(s.ogImage, 'seo.ogImage', errors)
      seo = { metaTitle, metaDescription, ogImage }
    }
  }

  if (errors.length > 0) return { ok: false, errors }

  return {
    ok: true,
    value: {
      slug,
      title,
      industry,
      subtitle: optStr('subtitle'),
      heroImage,
      services,
      technologies,
      relatedCaseStudies,
      client,
      problem: optStr('problem'),
      solution: optStr('solution'),
      impact: optStr('impact'),
      metrics,
      testimonial,
      seo,
      publishedAt: optStr('publishedAt'),
    },
  }
}
