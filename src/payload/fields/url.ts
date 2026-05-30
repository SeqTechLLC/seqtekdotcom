/**
 * Shared URL validators for text fields. The renderers also apply protocol
 * and host checks defense-in-depth (see Hero.tsx, Map.tsx, Embed.tsx), but
 * validating at the schema gives editors immediate save-time feedback and
 * prevents a `javascript:` URI from ever landing in the DB.
 */

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])

const isRelativePath = (value: string): boolean =>
  value.startsWith('/') || value.startsWith('#') || value.startsWith('?')

const tryParse = (value: string): URL | null => {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

/**
 * Allow http(s) / mailto / tel absolute URLs, or relative paths/anchors.
 * Rejects javascript:, data:, vbscript:, file:, about:, and other foot-guns.
 * Empty / null / undefined pass through (use `required` for presence).
 */
export const safeUrlValidate = (value: unknown): true | string => {
  if (value === null || value === undefined || value === '') return true
  if (typeof value !== 'string') return 'URL must be a string'
  const trimmed = value.trim()
  if (trimmed.length === 0) return true
  if (isRelativePath(trimmed)) return true
  const parsed = tryParse(trimmed)
  if (!parsed) return 'Must be a valid URL or absolute path starting with "/" or "#"'
  if (!SAFE_PROTOCOLS.has(parsed.protocol)) {
    return `Unsupported protocol "${parsed.protocol}" — use http(s), mailto, tel, or a relative path`
  }
  return true
}

/**
 * Stricter validator: requires https:// (or an http://localhost dev URL).
 * For iframe-bound URLs and any third-party asset reference.
 */
export const httpsUrlValidate = (value: unknown): true | string => {
  if (value === null || value === undefined || value === '') return true
  if (typeof value !== 'string') return 'URL must be a string'
  const trimmed = value.trim()
  if (trimmed.length === 0) return true
  const parsed = tryParse(trimmed)
  if (!parsed) return 'Must be a valid absolute URL'
  if (parsed.protocol === 'https:') return true
  if (parsed.protocol === 'http:' && parsed.hostname === 'localhost') return true
  return 'Must use https://'
}

/**
 * HubSpot form GUID: 36-char UUID-shaped (the format HubSpot embeds use).
 * Catches pasted full URLs and typos at save time.
 */
export const hubspotFormIdValidate = (value: unknown): true | string => {
  if (value === null || value === undefined || value === '') return true
  if (typeof value !== 'string') return 'formId must be a string'
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim())
    ? true
    : 'Must be a HubSpot form GUID (e.g. 12345678-90ab-cdef-1234-567890abcdef)'
}
