/**
 * Placeholder alt-text generation for the bulk photo ingest (ROADMAP C-8).
 *
 * The Media collection requires non-empty `alt` (FR-023), and we can't
 * hand-write 900+ strings up front. These are deliberately generic, context-
 * derived placeholders — good enough to satisfy the validator and give an
 * editor a starting point. Every ingested doc is also tagged with
 * `REVIEW_MARKER` in `caption` so the alt-text pass (C-7) can filter them.
 */

/** Stamped into `caption` on every ingested doc so editors can find them. */
export const REVIEW_MARKER =
  'Auto-ingested from photo library — alt text pending editorial review (C-7/C-8)'

/** Top-level source folder → human-ish alt template. */
const FOLDER_ALT: Record<string, string> = {
  Headshots: 'SEQTEK team member headshot',
  'Actor Photos': 'SEQTEK promotional portrait',
  'Employee Fun': 'SEQTEK team at a company event',
  Favs: 'SEQTEK team photo',
  General: 'SEQTEK office and team photo',
  'Kenn Workshop': 'SEQTEK AI workshop session',
  'Meet Up at the Max': 'SEQTEK team gathering at The Max',
  'Oaks Meetings': 'SEQTEK team meeting',
  'Office Photographer 2023': 'SEQTEK office candid',
  'Office Pitcures': 'SEQTEK office photo',
  'Partner Pictures': 'SEQTEK leadership and partners',
  'POWERBI Meeting 11-17': 'SEQTEK Power BI working session',
}

const YEAR = /^(19|20)\d{2}$/

function titleCase(segment: string): string {
  return segment
    .replace(/[-_]+/g, ' ')
    .replace(/\.[^.]+$/, '')
    .trim()
    .replace(/\s+/g, ' ')
}

/**
 * Build a placeholder alt from the file's location. Uses the first path
 * segment (the folder) as the primary signal; for year-named folders it falls
 * back to "SEQTEK team event (<year>)" and folds in the next segment as
 * context when present (e.g. `2023/Trade Show/...`).
 */
export function generateAlt(relPath: string): string {
  const segments = relPath.split(/[/\\]+/).filter(Boolean)
  const folder = segments[0] ?? ''

  if (folder in FOLDER_ALT) return FOLDER_ALT[folder]

  if (YEAR.test(folder)) {
    const context = segments[1] && segments.length > 2 ? titleCase(segments[1]) : ''
    return context ? `SEQTEK team event — ${context} (${folder})` : `SEQTEK team event (${folder})`
  }

  // Unknown folder — best-effort from the folder name.
  return folder ? `SEQTEK — ${titleCase(folder)}` : 'SEQTEK photo'
}
