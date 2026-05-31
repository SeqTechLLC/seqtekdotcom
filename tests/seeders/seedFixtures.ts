import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

/**
 * Synthetic audit fixtures for the seed integration tests. Mirrors the
 * shape of the real Wix audit JSON (one URL key → newline-delimited body
 * text) but keeps the records small so the suite stays fast and the
 * fixture is grep-able when a test fails.
 *
 * Real audit content stays out of this public repo (see CLAUDE.md and
 * `project_audit_dir`). Tests that need the production dataset run
 * separately under the staging verification path.
 */

const NAV =
  'Skip to Main Content\nHome\nOur Services\nWorkshops\nAbout Us\nBlog\nContact\nContact Us\nAssessment'
const FOOTER =
  'Talk With Us\nContact\n\nHeadquarters\n\n12 N Cheyenne Ave.\n\nTulsa, OK 74103\n\n918-493-7200\n\ncontact@seqtek.com\n\nNAVIGATION\n\nServices\n\nAbout us\n\nContact\n\nBlogs\n\nPrivacy Statement\n\nFOLLOW US\n\nFacebook\n\nLinkedin\n\nYouTube'

function wrap(inner: string): string {
  return `${NAV}\n${inner}\n${FOOTER}`
}

const CASE_STUDY_3 = wrap(
  [
    'How Mobile Apps Make Working In Remote Areas Easier And More Accurate',
    '',
    'Empowering on-site teams with real-time tools for accuracy and speed.',
    '',
    'The Problem',
    '',
    'In the remote desert of Midland, Texas, engineers struggled to record data without Wi-Fi.',
    '',
    'The Solution',
    '',
    'SEQTEK built a Progressive Web App so engineers could record data offline.',
    '',
    'The Impact',
    '',
    'Engineers can now complete tasks at the rig site and trust that data lands at headquarters.',
  ].join('\n'),
)

const DRIVING_INNOVATION = wrap(
  [
    'Enhancing performance and precision through data-driven engineering solutions.',
    'Driving Innovation in Drill Bit Technology',
    'The Problem',
    '',
    'Our client offers data curation and enrichment services for healthcare.',
    '',
    'The Solution',
    '',
    'SEQTEK worked with their business analysts to evaluate the situation and design UX/UI.',
    '',
    'The Impact',
    '',
    'SEQTEK developed an application that exceeded the user’s satisfaction.',
  ].join('\n'),
)

const ABOUT_PAGE = wrap(
  [
    'Localshoring since 1999',
    'Who We Are',
    '',
    'Since 1999 we have served as a strategic consulting partner.',
    '',
    '​25+',
    'years of experience',
    '500+',
    'successful projects delivered',
    '10,000+',
    'lives changed',
  ].join('\n'),
)

const PRIVACY_PAGE = wrap(
  [
    'Privacy Policy',
    '',
    'Effective Date: June 2024',
    '',
    'SEQTEK LLC, 201 E Hobson Ave, Sapulpa, OK collects personal information when you submit forms.',
  ].join('\n'),
)

const WORKSHOPS_PAGE = wrap(
  ['Touchstone Workshops', '', 'Our workshops align teams around shared outcomes.'].join('\n'),
)

const CONTACT_PAGE = wrap(
  ['Contact', '', 'Reach out via the form below or visit our Tulsa office.'].join('\n'),
)

const HOMEPAGE = wrap(
  [
    'Your Local Partner for Business Consulting Services',
    '',
    'Helping organizations innovate, implement, and deliver a better tomorrow with expert Tulsa business consulting.',
    '',
    '20 +',
    '',
    'Years of experience',
    '',
    '411 +',
    '',
    'Successful projects delivered',
    '',
    '8221 +',
    '',
    'Lives changed',
    '',
    'Purpose-Driven Business Consulting',
    'Our purpose is to help people and organizations innovate, implement, and deliver a better tomorrow.',
  ].join('\n'),
)

const BLOG_PAGE = wrap(
  [
    'Our Blogs',
    'Digital Transformation Consulting Oklahoma: Integrating Cloud, AI, and Automation',
    'Digital change used to feel optional. Now it is survival. Businesses across Oklahoma are feeling the pressure to move faster.',
    'Jan 20',
    'Why People Resist Change and How Change Management Adds Velocity to Every Project',
    'Every organization wants progress. Every exec aligns on goals. But execution stalls when change management slips.',
    'Dec 2, 2025',
  ].join('\n'),
)

const CASE_STUDIES_CONTENT_JSON: Record<string, string> = {
  'https://www.seqtek.com/case-study-3': CASE_STUDY_3,
  'https://www.seqtek.com/driving-innovation-case-study': DRIVING_INNOVATION,
}

const CASE_STUDIES_JSON: Record<string, string> = {
  'https://www.seqtek.com/about-us-1': ABOUT_PAGE,
  'https://www.seqtek.com/workshops': WORKSHOPS_PAGE,
  'https://www.seqtek.com/contact': CONTACT_PAGE,
  'https://www.seqtek.com/privacy-policy': PRIVACY_PAGE,
}

const PAGE_CONTENT_JSON: Record<string, string> = {
  '/': HOMEPAGE,
  '/blog-old': BLOG_PAGE,
}

const RETRY_CONTENT_JSON: Record<string, string> = {
  'https://seqtek.com/about-us-1': ABOUT_PAGE,
}

export interface AuditFixtureDirs {
  /** Absolute path to the tmp audit directory. */
  auditDir: string
  /** Absolute path to the tmp migration-errors.log file. */
  logPath: string
  cleanup(): void
}

export function writeAuditFixture(): AuditFixtureDirs {
  const dir = mkdtempSync(join(tmpdir(), 'seqtek-seed-'))
  writeFileSync(
    `${dir}/case-studies-content.json`,
    JSON.stringify(CASE_STUDIES_CONTENT_JSON),
    'utf8',
  )
  writeFileSync(`${dir}/case-studies.json`, JSON.stringify(CASE_STUDIES_JSON), 'utf8')
  writeFileSync(`${dir}/page-content.json`, JSON.stringify(PAGE_CONTENT_JSON), 'utf8')
  writeFileSync(`${dir}/retry-content.json`, JSON.stringify(RETRY_CONTENT_JSON), 'utf8')

  return {
    auditDir: dir,
    logPath: resolve(dir, 'migration-errors.log'),
    cleanup() {
      try {
        rmSync(dir, { recursive: true, force: true })
      } catch {
        // ignore — tmp dirs are best-effort
      }
    },
  }
}

export const FIXTURE_EXPECTED_CASE_SLUGS = [
  'mobile-apps-remote-operations',
  'healthcare-ux-redesign',
] as const
export const FIXTURE_EXPECTED_PAGE_SLUGS = [
  'about',
  'touchstone-workshops',
  'contact',
  'privacy-policy',
] as const
export const FIXTURE_EXPECTED_POST_SLUG_PREFIXES = [
  'digital-transformation-consulting-oklahoma',
  'why-people-resist-change',
] as const

/**
 * Full post slugs produced by the seed against the BLOG_PAGE fixture. The
 * post parser's slugify caps titles at 80 chars; if BLOG_PAGE titles change,
 * regenerate these by running the seed and reading the resulting docs.
 */
export const FIXTURE_EXPECTED_POST_SLUGS = [
  'digital-transformation-consulting-oklahoma-integrating-cloud-ai-and-automation',
  'why-people-resist-change-and-how-change-management-adds-velocity-to-every-projec',
] as const
