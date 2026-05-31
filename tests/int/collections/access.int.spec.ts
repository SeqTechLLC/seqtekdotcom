// @vitest-environment node
//
// Payload's upload pipeline calls `file-type`'s `fileTypeFromBuffer`,
// which throws under jsdom (`globalThis.Blob` shape mismatch). The
// default project env is jsdom (vitest.config.mts) for the rendering
// tests, so override it here for this single file.
import { Forbidden, getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { Users } from '../../../src/collections/Users'
import config from '../../../src/payload.config.js'
import type { User } from '../../../src/payload-types'

/**
 * T108 + T112 / SC-005 / FR-015–FR-018 / R-17.
 *
 * Data-driven access matrix iterating 13 collections × 3 roles
 * (public/editor/admin) × 5 ops (read-published, read-draft, create,
 * update, delete) against the Payload Local API. The expected outcome
 * per cell is sourced from `docs/ARCHITECTURE.md` §6 (re-stated in
 * `specs/003-phase-2-content-models/data-model.md` §4). A failure here
 * means either the implementation drifted from the doc or vice versa —
 * either way, the same PR fixes both per Constitution III.
 *
 * Cell semantics:
 *   - `read-published` queries the canonical "visible to anon" fixture
 *     (`_status: 'published'` for draftables, `isActive: true` for
 *     testimonials, the only fixture for collections with no draft/active
 *     concept).
 *   - `read-draft` queries the "hidden from anon" fixture (`_status:
 *     'draft'` for draftables, `isActive: false` for testimonials).
 *     Skipped on collections with neither.
 *   - `create`/`update`/`delete` exercise the Local API with
 *     `overrideAccess: false` and a `req.user` shaped for the role. A
 *     `Forbidden` throw means denied; anything else (success, validation
 *     error, etc.) means the access check passed and the failure
 *     happened downstream.
 *
 * T112 regression guard for FR-017 lives at the bottom of the file —
 * the `users` collection must keep Payload's local email/password
 * strategy disabled so `/admin` only accepts the Google SSO path.
 */

type Role = 'public' | 'editor' | 'admin'
type Op = 'read-published' | 'read-draft' | 'create' | 'update' | 'delete'

interface Outcome {
  public: boolean
  editor: boolean
  admin: boolean
}

// Outcome shapes — re-used across tiers. Sourced from
// `docs/ARCHITECTURE.md` §6 (re-stated in `data-model.md` §4).
const PUBLIC: Outcome = { public: true, editor: true, admin: true }
const HIDDEN_FROM_PUBLIC: Outcome = { public: false, editor: true, admin: true }
const EDITORIAL_MUTATION: Outcome = { public: false, editor: true, admin: true }
const ADMIN_ONLY: Outcome = { public: false, editor: false, admin: true }
const NONE: Outcome = { public: false, editor: false, admin: false }
const AUTHED_READ: Outcome = { public: false, editor: true, admin: true }

type TierExpectations = Record<Op, Outcome | null>

// Every collection maps to exactly one tier. `null` for `read-draft`
// means the collection has no "hidden from public" state (no drafts,
// no isActive gating) so that cell is omitted from the run.
const TIERS: Record<string, TierExpectations> = {
  'editorial-draftable': {
    'read-published': PUBLIC,
    'read-draft': HIDDEN_FROM_PUBLIC,
    create: EDITORIAL_MUTATION,
    update: EDITORIAL_MUTATION,
    delete: ADMIN_ONLY,
  },
  'public-read-editorial-mutate': {
    'read-published': PUBLIC,
    'read-draft': null,
    create: EDITORIAL_MUTATION,
    update: EDITORIAL_MUTATION,
    delete: ADMIN_ONLY,
  },
  'public-read-admin-mutate': {
    'read-published': PUBLIC,
    'read-draft': null,
    create: ADMIN_ONLY,
    update: ADMIN_ONLY,
    delete: ADMIN_ONLY,
  },
  'active-gated': {
    'read-published': PUBLIC,
    'read-draft': HIDDEN_FROM_PUBLIC,
    create: EDITORIAL_MUTATION,
    update: EDITORIAL_MUTATION,
    delete: ADMIN_ONLY,
  },
  users: {
    'read-published': AUTHED_READ,
    'read-draft': null,
    create: NONE,
    update: ADMIN_ONLY,
    delete: ADMIN_ONLY,
  },
}

interface CollectionSpec {
  slug: string
  tier: keyof typeof TIERS
  // Returns the fixture body for creating a "visible to anon" doc.
  // For draftable collections this gets stamped with `_status:
  // 'published'` before insert; for active-gated this should include
  // `isActive: true`.
  visibleData: (suffix: string) => Record<string, unknown>
  // Returns the fixture body for creating a "hidden from anon" doc.
  // `undefined` when the collection has no hidden state. For draftable
  // collections the seeder additionally passes `draft: true` so
  // required-relation validation is skipped (we only need the row to
  // exist as a draft; field completeness isn't part of the access
  // contract).
  hiddenData?: (suffix: string) => Record<string, unknown>
  // Bag of fields to PATCH on update attempts. Distinct from the
  // create body so the update reliably touches a non-required field.
  updateData: Record<string, unknown>
}

let payload: Payload
let editorUser: User
let adminUser: User
let sharedMediaId: string | number
let sharedTeamMemberId: string | number
let sharedIndustryId: string | number
let sharedServicePillarId: string | number

// SVG→PNG (sharp's `create` API produces a buffer that `file-type`
// can't identify as a real PNG, which `checkFileRestrictions`
// rejects). Mirrors `src/payload/seed/showcase/placeholders.ts` so
// fixtures here use the same known-good encode path.
async function fixturePng(): Promise<Buffer> {
  return sharp(
    Buffer.from(
      '<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" fill="#888"/></svg>',
    ),
  )
    .png()
    .toBuffer()
}

// Stable, unique sub IDs so cleanup is precise and other test files'
// users-table churn cannot accidentally delete these fixtures.
const ADMIN_SUB = 'fixture-access-matrix-admin-sub'
const EDITOR_SUB = 'fixture-access-matrix-editor-sub'
const ADMIN_EMAIL = 'access-matrix-admin@seqtechllc.com'
const EDITOR_EMAIL = 'access-matrix-editor@seqtechllc.com'

beforeAll(async () => {
  payload = await getPayload({ config: await config })

  // Recreate from scratch so the test is order-independent — the
  // upstream `auth-provisioning` suite clobbers all users in
  // beforeEach, and these specifically-named rows may already be
  // present from a prior run in the same vitest process.
  for (const sub of [ADMIN_SUB, EDITOR_SUB]) {
    await payload.delete({
      collection: 'users',
      where: { googleSub: { equals: sub } },
      overrideAccess: true,
    })
  }

  adminUser = (await payload.create({
    collection: 'users',
    data: {
      email: ADMIN_EMAIL,
      name: 'Access Matrix Admin',
      roles: ['admin'],
      googleSub: ADMIN_SUB,
    },
    overrideAccess: true,
  })) as User

  editorUser = (await payload.create({
    collection: 'users',
    data: {
      email: EDITOR_EMAIL,
      name: 'Access Matrix Editor',
      roles: ['editor'],
      googleSub: EDITOR_SUB,
    },
    overrideAccess: true,
  })) as User

  // Shared support fixtures so posts (featuredImage + author),
  // caseStudies (heroImage + industry), services (pillar), and
  // teamMembers (photo) can all be created as fully-validated
  // published rows for the read-published cells.
  const pngBuffer = await fixturePng()
  const media = await payload.create({
    collection: 'media',
    data: { alt: 'access-matrix shared media fixture' },
    file: {
      data: pngBuffer,
      mimetype: 'image/png',
      name: 'access-matrix-fixture.png',
      size: pngBuffer.length,
    },
    overrideAccess: true,
  })
  sharedMediaId = media.id

  const teamMember = await payload.create({
    collection: 'teamMembers',
    data: {
      name: 'Access Matrix Author',
      slug: 'access-matrix-shared-author',
      photo: sharedMediaId as number,
    },
    overrideAccess: true,
  })
  sharedTeamMemberId = teamMember.id

  const industry = await payload.create({
    collection: 'industries',
    data: {
      title: 'Access Matrix Industry',
      slug: 'access-matrix-shared-industry',
      _status: 'published',
    },
    overrideAccess: true,
  })
  sharedIndustryId = industry.id

  const servicePillar = await payload.create({
    collection: 'servicePillars',
    data: {
      title: 'Access Matrix Pillar',
      slug: 'access-matrix-shared-pillar',
      _status: 'published',
    },
    overrideAccess: true,
  })
  sharedServicePillarId = servicePillar.id
})

afterAll(async () => {
  // Cleanup keyed by the `access-matrix-` slug prefix every fixture
  // stamps. `like` matches both the shared-* fixtures and the
  // per-cell fixtures.
  for (const collection of FIXTURE_COLLECTIONS) {
    await payload.delete({
      collection: collection as 'pages',
      where: { slug: { like: 'access-matrix-%' } },
      overrideAccess: true,
    })
  }
  await payload.delete({
    collection: 'teamMembers',
    where: { slug: { like: 'access-matrix-%' } },
    overrideAccess: true,
  })
  await payload.delete({
    collection: 'testimonials',
    where: { personName: { like: 'AccessMatrix%' } },
    overrideAccess: true,
  })
  await payload.delete({
    collection: 'media',
    where: { filename: { like: 'access-matrix-%' } },
    overrideAccess: true,
  })
  await payload.delete({
    collection: 'media',
    where: { filename: { like: 'am-%' } },
    overrideAccess: true,
  })
  for (const sub of [ADMIN_SUB, EDITOR_SUB]) {
    await payload.delete({
      collection: 'users',
      where: { googleSub: { equals: sub } },
      overrideAccess: true,
    })
  }
  await payload.delete({
    collection: 'users',
    where: { email: { like: 'access-matrix-%' } },
    overrideAccess: true,
  })
})

// Per-collection specs. `visibleData` includes every required
// relationship so the row really can publish; `hiddenData` is minimal
// because draft creates skip required-field validation.
const COLLECTION_SPECS: CollectionSpec[] = [
  {
    slug: 'pages',
    tier: 'editorial-draftable',
    visibleData: (s) => ({ title: `AM Page ${s}`, slug: `access-matrix-page-${s}` }),
    hiddenData: (s) => ({ title: `AM Page ${s}`, slug: `access-matrix-page-${s}` }),
    updateData: { title: 'AM Page updated' },
  },
  {
    slug: 'posts',
    tier: 'editorial-draftable',
    visibleData: (s) => ({
      title: `AM Post ${s}`,
      slug: `access-matrix-post-${s}`,
      featuredImage: sharedMediaId,
      author: sharedTeamMemberId,
    }),
    hiddenData: (s) => ({ title: `AM Post ${s}`, slug: `access-matrix-post-${s}` }),
    updateData: { excerpt: 'AM Post updated excerpt' },
  },
  {
    slug: 'caseStudies',
    tier: 'editorial-draftable',
    visibleData: (s) => ({
      title: `AM Case ${s}`,
      slug: `access-matrix-case-${s}`,
      heroImage: sharedMediaId,
      industry: sharedIndustryId,
    }),
    hiddenData: (s) => ({ title: `AM Case ${s}`, slug: `access-matrix-case-${s}` }),
    updateData: { subtitle: 'AM Case updated subtitle' },
  },
  {
    slug: 'services',
    tier: 'editorial-draftable',
    visibleData: (s) => ({
      title: `AM Service ${s}`,
      slug: `access-matrix-service-${s}`,
      pillar: sharedServicePillarId,
    }),
    hiddenData: (s) => ({ title: `AM Service ${s}`, slug: `access-matrix-service-${s}` }),
    updateData: { excerpt: undefined },
  },
  {
    slug: 'servicePillars',
    tier: 'editorial-draftable',
    visibleData: (s) => ({ title: `AM Pillar ${s}`, slug: `access-matrix-pillar-${s}` }),
    hiddenData: (s) => ({ title: `AM Pillar ${s}`, slug: `access-matrix-pillar-${s}` }),
    updateData: { title: 'AM Pillar updated' },
  },
  {
    slug: 'workshops',
    tier: 'editorial-draftable',
    visibleData: (s) => ({ title: `AM Workshop ${s}`, slug: `access-matrix-workshop-${s}` }),
    hiddenData: (s) => ({ title: `AM Workshop ${s}`, slug: `access-matrix-workshop-${s}` }),
    updateData: { title: 'AM Workshop updated' },
  },
  {
    slug: 'industries',
    tier: 'editorial-draftable',
    visibleData: (s) => ({ title: `AM Industry ${s}`, slug: `access-matrix-industry-${s}` }),
    hiddenData: (s) => ({ title: `AM Industry ${s}`, slug: `access-matrix-industry-${s}` }),
    updateData: { title: 'AM Industry updated' },
  },
  {
    slug: 'locations',
    tier: 'editorial-draftable',
    visibleData: (s) => ({ city: `AM City ${s}`, slug: `access-matrix-location-${s}` }),
    hiddenData: (s) => ({ city: `AM City ${s}`, slug: `access-matrix-location-${s}` }),
    updateData: { city: 'AM City updated' },
  },
  {
    slug: 'teamMembers',
    tier: 'public-read-editorial-mutate',
    visibleData: (s) => ({
      name: `AM Member ${s}`,
      slug: `access-matrix-member-${s}`,
      photo: sharedMediaId,
    }),
    updateData: { title: 'Updated job title' },
  },
  {
    slug: 'media',
    // Media's create/update path runs through the upload pipeline. The
    // helpers below override `visibleData` for media because Payload
    // needs the `file` argument too.
    tier: 'public-read-editorial-mutate',
    visibleData: (s) => ({ alt: `AM Media ${s}` }),
    updateData: { caption: 'AM updated caption' },
  },
  {
    slug: 'categories',
    tier: 'public-read-admin-mutate',
    visibleData: (s) => ({ title: `AM Category ${s}`, slug: `access-matrix-category-${s}` }),
    updateData: { title: 'AM Category updated' },
  },
  {
    slug: 'testimonials',
    tier: 'active-gated',
    visibleData: (s) => ({
      quote: `AM testimonial quote ${s}`,
      personName: `AccessMatrix Person ${s}`,
      isActive: true,
    }),
    hiddenData: (s) => ({
      quote: `AM testimonial quote ${s}`,
      personName: `AccessMatrix Person ${s}`,
      isActive: false,
    }),
    updateData: { personTitle: 'Updated title' },
  },
  {
    slug: 'users',
    tier: 'users',
    visibleData: (s) => ({
      email: `access-matrix-target-${s}@seqtechllc.com`,
      name: `AM Target ${s}`,
      roles: ['editor'],
      googleSub: `fixture-access-matrix-target-${s}-sub`,
    }),
    updateData: { name: 'AM Target updated' },
  },
]

// Slug allowlist for the `slug: { like: ... }` cleanup pass. Only
// collections whose primary access-matrix fixtures use a `slug` field
// belong here.
const FIXTURE_COLLECTIONS = [
  'pages',
  'posts',
  'caseStudies',
  'services',
  'servicePillars',
  'workshops',
  'industries',
  'locations',
  'categories',
] as const

const ROLES: Role[] = ['public', 'editor', 'admin']
const OPS: Op[] = ['read-published', 'read-draft', 'create', 'update', 'delete']

function userFor(role: Role): User | null {
  if (role === 'public') return null
  if (role === 'editor') return editorUser
  return adminUser
}

function reqFor(role: Role): { user: unknown } {
  const user = userFor(role)
  return { user: user ? { ...user, collection: 'users' } : null }
}

function isForbidden(err: unknown): boolean {
  return err instanceof Forbidden
}

// One unique suffix per cell so fixtures never collide.
function suffix(parts: string[]): string {
  return parts
    .join('-')
    .replace(/[^a-z0-9-]/gi, '')
    .toLowerCase()
}

async function seedVisible(
  spec: CollectionSpec,
  cellSuffix: string,
): Promise<{ id: string | number }> {
  if (spec.slug === 'media') {
    const pngBuffer = await fixturePng()
    const args = {
      collection: 'media',
      data: { alt: `AM media fixture ${cellSuffix}` },
      file: {
        data: pngBuffer,
        mimetype: 'image/png',
        name: `am-${cellSuffix}.png`,
        size: pngBuffer.length,
      },
      overrideAccess: true,
    } as unknown as Parameters<typeof payload.create>[0]
    const doc = await payload.create(args)
    return { id: doc.id }
  }

  const data = spec.visibleData(cellSuffix)
  // For draftables, stamp `_status: 'published'` so the row shows up in
  // public reads. (Pages/posts/etc. default to draft when no status is
  // set.) Active-gated and other tiers don't need this.
  const stampedData = spec.tier === 'editorial-draftable' ? { ...data, _status: 'published' } : data
  const args = {
    collection: spec.slug,
    data: stampedData,
    overrideAccess: true,
  } as unknown as Parameters<typeof payload.create>[0]
  const doc = await payload.create(args)
  return { id: doc.id }
}

async function seedHidden(
  spec: CollectionSpec,
  cellSuffix: string,
): Promise<{ id: string | number }> {
  if (!spec.hiddenData) {
    throw new Error(`seedHidden called for ${spec.slug} without hiddenData`)
  }
  const data = spec.hiddenData(cellSuffix)
  if (spec.tier === 'editorial-draftable') {
    // `draft: true` lets us skip required-relation validation for
    // posts/caseStudies/services. The contract we're asserting is that
    // draft rows do not surface to anon — full schema correctness
    // isn't part of that.
    const args = {
      collection: spec.slug,
      data,
      overrideAccess: true,
      draft: true,
    } as unknown as Parameters<typeof payload.create>[0]
    const doc = await payload.create(args)
    return { id: doc.id }
  }
  // active-gated → testimonials with isActive: false.
  const args = {
    collection: spec.slug,
    data,
    overrideAccess: true,
  } as unknown as Parameters<typeof payload.create>[0]
  const doc = await payload.create(args)
  return { id: doc.id }
}

async function attemptRead(
  spec: CollectionSpec,
  doc: { id: string | number },
  role: Role,
  variant: 'visible' | 'hidden',
): Promise<boolean> {
  const req = reqFor(role)
  try {
    const args = {
      collection: spec.slug,
      where: { id: { equals: doc.id } },
      overrideAccess: false,
      // `draft: true` returns the latest version (draft or published).
      // On hidden-variant reads against draftable collections, the
      // editor/admin paths need this to see the draft row. Anon paths
      // never see drafts regardless because the Where clause from
      // `publishedOrAuthed` excludes them upstream.
      ...(variant === 'hidden' && spec.tier === 'editorial-draftable' ? { draft: true } : {}),
      req,
    } as unknown as Parameters<typeof payload.find>[0]
    const result = await payload.find(args)
    return result.docs.length > 0
  } catch (err) {
    if (isForbidden(err)) return false
    throw err
  }
}

async function attemptCreate(
  spec: CollectionSpec,
  role: Role,
  cellSuffix: string,
): Promise<'allowed' | 'denied'> {
  const req = reqFor(role)
  try {
    if (spec.slug === 'media') {
      const pngBuffer = await fixturePng()
      const args = {
        collection: 'media',
        data: { alt: `AM create ${cellSuffix}` },
        file: {
          data: pngBuffer,
          mimetype: 'image/png',
          name: `am-create-${cellSuffix}.png`,
          size: pngBuffer.length,
        },
        overrideAccess: false,
        req,
      } as unknown as Parameters<typeof payload.create>[0]
      await payload.create(args)
      return 'allowed'
    }
    const data = spec.visibleData(cellSuffix)
    const args = {
      collection: spec.slug,
      data,
      overrideAccess: false,
      // Drafts skip required-field validation. Some create attempts
      // would otherwise hit ValidationError before the access check
      // can fail; passing `draft: true` keeps the test focused on
      // access-or-not.
      ...(spec.tier === 'editorial-draftable' ? { draft: true } : {}),
      req,
    } as unknown as Parameters<typeof payload.create>[0]
    await payload.create(args)
    return 'allowed'
  } catch (err) {
    if (isForbidden(err)) return 'denied'
    return 'allowed'
  }
}

async function attemptUpdate(
  spec: CollectionSpec,
  doc: { id: string | number },
  role: Role,
): Promise<'allowed' | 'denied'> {
  const req = reqFor(role)
  try {
    const args = {
      collection: spec.slug,
      id: doc.id,
      data: spec.updateData,
      overrideAccess: false,
      req,
    } as unknown as Parameters<typeof payload.update>[0]
    await payload.update(args)
    return 'allowed'
  } catch (err) {
    if (isForbidden(err)) return 'denied'
    return 'allowed'
  }
}

async function attemptDelete(
  spec: CollectionSpec,
  doc: { id: string | number },
  role: Role,
): Promise<'allowed' | 'denied'> {
  const req = reqFor(role)
  try {
    const args = {
      collection: spec.slug,
      id: doc.id,
      overrideAccess: false,
      req,
    } as unknown as Parameters<typeof payload.delete>[0]
    await payload.delete(args)
    return 'allowed'
  } catch (err) {
    if (isForbidden(err)) return 'denied'
    return 'allowed'
  }
}

// Flatten the matrix into one cell per row. Cells where the tier has
// no expectation for the op (read-draft on tiers without a hidden
// concept) are filtered out.
interface Cell {
  collection: string
  spec: CollectionSpec
  op: Op
  role: Role
  expected: boolean
}

const CELLS: Cell[] = (() => {
  const out: Cell[] = []
  for (const spec of COLLECTION_SPECS) {
    const tier = TIERS[spec.tier]
    for (const op of OPS) {
      const outcomes = tier[op]
      if (!outcomes) continue
      if (op === 'read-draft' && !spec.hiddenData) continue
      for (const role of ROLES) {
        out.push({ collection: spec.slug, spec, op, role, expected: outcomes[role] })
      }
    }
  }
  return out
})()

describe('Access matrix (T108 / SC-005 / R-17 / ARCHITECTURE.md §6)', () => {
  it.each(CELLS)('$collection × $op × $role → $expected', async ({ spec, op, role, expected }) => {
    switch (op) {
      case 'read-published': {
        const cellSuffix = suffix(['read-pub', spec.slug, role])
        const doc = await seedVisible(spec, cellSuffix)
        const visible = await attemptRead(spec, doc, role, 'visible')
        expect(visible).toBe(expected)
        return
      }
      case 'read-draft': {
        const cellSuffix = suffix(['read-hidden', spec.slug, role])
        const doc = await seedHidden(spec, cellSuffix)
        const visible = await attemptRead(spec, doc, role, 'hidden')
        expect(visible).toBe(expected)
        return
      }
      case 'create': {
        const cellSuffix = suffix(['create', spec.slug, role, String(Date.now())])
        const outcome = await attemptCreate(spec, role, cellSuffix)
        expect(outcome).toBe(expected ? 'allowed' : 'denied')
        return
      }
      case 'update': {
        const cellSuffix = suffix(['update', spec.slug, role])
        const doc = await seedVisible(spec, cellSuffix)
        const outcome = await attemptUpdate(spec, doc, role)
        expect(outcome).toBe(expected ? 'allowed' : 'denied')
        return
      }
      case 'delete': {
        const cellSuffix = suffix(['delete', spec.slug, role])
        const doc = await seedVisible(spec, cellSuffix)
        const outcome = await attemptDelete(spec, doc, role)
        expect(outcome).toBe(expected ? 'allowed' : 'denied')
        return
      }
    }
  })
})

/**
 * T112 / FR-017 / FR-018 — regression guard.
 *
 * The `users` collection MUST keep Payload's local email/password
 * strategy disabled per spec 001. If this flips back to default,
 * `/admin` would silently re-enable the password form and bypass the
 * Google SSO domain restriction. The Payload `disableLocalStrategy:
 * { enableFields: true }` shape (rather than the bare `true`) is also
 * required so Payload still materializes its base auth fields — see
 * `src/collections/Users.ts` for the inline rationale.
 */
describe('Users local strategy disabled (T112 / FR-017 / FR-018)', () => {
  type AuthObject = Exclude<typeof Users.auth, boolean | undefined>
  const isAuthObject = (auth: typeof Users.auth): auth is AuthObject =>
    typeof auth === 'object' && auth !== null

  it('Users.auth.disableLocalStrategy keeps base auth fields enabled', () => {
    expect(isAuthObject(Users.auth)).toBe(true)
    const auth = Users.auth as AuthObject
    expect(auth.disableLocalStrategy).toEqual({ enableFields: true })
  })

  it('Users.auth.strategies registers only the JWT strategy (no local)', () => {
    expect(isAuthObject(Users.auth)).toBe(true)
    const auth = Users.auth as AuthObject
    expect(Array.isArray(auth.strategies)).toBe(true)
    const names = (auth.strategies ?? []).map((s) => s.name)
    expect(names).toContain('local-jwt')
    // Sanity: no other strategy is registered here. The Google OAuth
    // path is a custom integration outside the collection config.
    expect(names).toHaveLength(1)
  })
})
