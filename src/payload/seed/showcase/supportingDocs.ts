/**
 * Showcase supporting docs — minimal seeded records in collections that
 * showcase blocks reference (testimonials, caseStudies, services, posts,
 * industries, locations, workshops, servicePillars, categories, teamMembers).
 *
 * Records are tagged with a `[Showcase]` prefix on their useAsTitle field so
 * they can be cleared idempotently. The prefix lives in the title/name so
 * editors can spot showcase records in the admin and ignore them.
 */
import type { getPayload as GetPayload } from 'payload'

type Payload = Awaited<ReturnType<typeof GetPayload>>

const SHOWCASE_TAG = '[Showcase] '

export interface SupportingIds {
  testimonialIds: Array<string | number>
  caseStudyIds: Array<string | number>
  serviceIds: Array<string | number>
  postIds: Array<string | number>
  industryIds: Array<string | number>
  locationIds: Array<string | number>
  workshopIds: Array<string | number>
  servicePillarIds: Array<string | number>
  categoryIds: Array<string | number>
  teamMemberIds: Array<string | number>
}

type CollectionWithStringTitleField =
  | 'testimonials'
  | 'caseStudies'
  | 'services'
  | 'posts'
  | 'industries'
  | 'locations'
  | 'workshops'
  | 'servicePillars'
  | 'categories'
  | 'teamMembers'

async function clearTagged(
  payload: Payload,
  collection: CollectionWithStringTitleField,
  field: string,
) {
  await payload.delete({
    collection,
    where: { [field]: { like: `${SHOWCASE_TAG}%` } },
    overrideAccess: true,
  })
}

/**
 * Clear ALL showcase-tagged supporting docs in FK-dependency order so the
 * surrounding media delete doesn't trip foreign-key constraints. Posts and
 * caseStudies reference media (featuredImage, heroImage) and other docs
 * (author=teamMembers, industry=industries), so order from leaf to root.
 */
export async function clearSupportingDocs(payload: Payload): Promise<void> {
  await clearTagged(payload, 'posts', 'title')
  await clearTagged(payload, 'caseStudies', 'title')
  await clearTagged(payload, 'services', 'title')
  await clearTagged(payload, 'testimonials', 'personName')
  await clearTagged(payload, 'teamMembers', 'name')
  await clearTagged(payload, 'workshops', 'title')
  await clearTagged(payload, 'industries', 'title')
  await clearTagged(payload, 'locations', 'city')
  await clearTagged(payload, 'servicePillars', 'title')
  await clearTagged(payload, 'categories', 'title')
}

async function seedTestimonials(payload: Payload, photoId: string | number) {
  await clearTagged(payload, 'testimonials', 'personName')
  const records = [
    {
      quote:
        'They embedded with us during the worst week of the quarter and walked out two weeks later with a working pipeline. That is the difference.',
      personName: `${SHOWCASE_TAG}Maria Hernandez`,
      personTitle: 'VP, Operations',
      company: 'Regional Manufacturer',
      photo: photoId,
      isActive: true,
    },
    {
      quote:
        'No theatre, no decks that hide what they meant. We knew where the work stood at every check-in.',
      personName: `${SHOWCASE_TAG}David Park`,
      personTitle: 'CTO',
      company: 'Mid-Market Healthcare',
      photo: photoId,
      isActive: true,
    },
    {
      quote:
        'Localshoring sounded like a marketing word until I saw the calendar overlap and the standup quality. It is a real model.',
      personName: `${SHOWCASE_TAG}Anita Rao`,
      personTitle: 'Director of Engineering',
      company: 'Regional FinTech',
      photo: photoId,
      isActive: true,
    },
  ]
  return createBatch(payload, 'testimonials', records)
}

async function seedCategories(payload: Payload) {
  await clearTagged(payload, 'categories', 'title')
  return createBatch(payload, 'categories', [
    { title: `${SHOWCASE_TAG}Engineering` },
    { title: `${SHOWCASE_TAG}Strategy` },
    { title: `${SHOWCASE_TAG}Industry insights` },
  ])
}

async function seedServicePillars(payload: Payload) {
  await clearTagged(payload, 'servicePillars', 'title')
  return createBatch(payload, 'servicePillars', [
    { title: `${SHOWCASE_TAG}Organizational Strategy`, _status: 'published' },
    { title: `${SHOWCASE_TAG}Technology & Data`, _status: 'published' },
    { title: `${SHOWCASE_TAG}AI & Automation`, _status: 'published' },
  ])
}

async function seedIndustries(payload: Payload) {
  await clearTagged(payload, 'industries', 'title')
  return createBatch(payload, 'industries', [
    { title: `${SHOWCASE_TAG}Manufacturing`, _status: 'published' },
    { title: `${SHOWCASE_TAG}Healthcare`, _status: 'published' },
    { title: `${SHOWCASE_TAG}Energy`, _status: 'published' },
    { title: `${SHOWCASE_TAG}Financial Services`, _status: 'published' },
  ])
}

async function seedLocations(payload: Payload) {
  await clearTagged(payload, 'locations', 'city')
  return createBatch(payload, 'locations', [
    { city: `${SHOWCASE_TAG}Tulsa`, _status: 'published' },
    { city: `${SHOWCASE_TAG}Oklahoma City`, _status: 'published' },
    { city: `${SHOWCASE_TAG}Northwest Arkansas`, _status: 'published' },
    { city: `${SHOWCASE_TAG}Kansas City`, _status: 'published' },
  ])
}

async function seedTeamMembers(payload: Payload, photoId: string | number) {
  await clearTagged(payload, 'teamMembers', 'name')
  return createBatch(payload, 'teamMembers', [
    { name: `${SHOWCASE_TAG}Alex Kim`, role: 'Pillar Lead', photo: photoId },
    { name: `${SHOWCASE_TAG}Sam Chen`, role: 'Principal Engineer', photo: photoId },
  ])
}

async function seedServices(payload: Payload, servicePillarIds: Array<string | number>) {
  await clearTagged(payload, 'services', 'title')
  const pillar = servicePillarIds[0]
  return createBatch(payload, 'services', [
    { title: `${SHOWCASE_TAG}Org Maturity Assessment`, pillar, _status: 'published' },
    {
      title: `${SHOWCASE_TAG}Platform Engineering`,
      pillar: servicePillarIds[1] ?? pillar,
      _status: 'published',
    },
    {
      title: `${SHOWCASE_TAG}LLM Workflow Integration`,
      pillar: servicePillarIds[2] ?? pillar,
      _status: 'published',
    },
  ])
}

async function seedCaseStudies(
  payload: Payload,
  industryIds: Array<string | number>,
  heroImageId: string | number,
) {
  await clearTagged(payload, 'caseStudies', 'title')
  return createBatch(payload, 'caseStudies', [
    {
      title: `${SHOWCASE_TAG}Cut downtime in half`,
      industry: industryIds[0],
      heroImage: heroImageId,
      _status: 'published',
    },
    {
      title: `${SHOWCASE_TAG}EHR rollout in 90 days`,
      industry: industryIds[1] ?? industryIds[0],
      heroImage: heroImageId,
      _status: 'published',
    },
    {
      title: `${SHOWCASE_TAG}Forecast accuracy +30%`,
      industry: industryIds[2] ?? industryIds[0],
      heroImage: heroImageId,
      _status: 'published',
    },
  ])
}

async function seedPosts(
  payload: Payload,
  authorId: string | number,
  featuredImageId: string | number,
) {
  await clearTagged(payload, 'posts', 'title')
  return createBatch(payload, 'posts', [
    {
      title: `${SHOWCASE_TAG}What localshoring actually changes`,
      author: authorId,
      featuredImage: featuredImageId,
      _status: 'published',
    },
    {
      title: `${SHOWCASE_TAG}Discovery weeks that find the real problem`,
      author: authorId,
      featuredImage: featuredImageId,
      _status: 'published',
    },
    {
      title: `${SHOWCASE_TAG}Mid-market AI without the theatre`,
      author: authorId,
      featuredImage: featuredImageId,
      _status: 'published',
    },
  ])
}

async function seedWorkshops(payload: Payload) {
  await clearTagged(payload, 'workshops', 'title')
  return createBatch(payload, 'workshops', [
    { title: `${SHOWCASE_TAG}Touchstone: Discovery`, _status: 'published' },
    { title: `${SHOWCASE_TAG}Touchstone: Alignment`, _status: 'published' },
    { title: `${SHOWCASE_TAG}Touchstone: Decision`, _status: 'published' },
  ])
}

async function createBatch(
  payload: Payload,
  collection: CollectionWithStringTitleField,
  records: Array<Record<string, unknown>>,
): Promise<Array<string | number>> {
  const ids: Array<string | number> = []
  for (const data of records) {
    const created = await payload.create({
      collection,
      data: data as never,
      overrideAccess: true,
    })
    ids.push(created.id)
  }
  return ids
}

export async function seedSupportingDocs(
  payload: Payload,
  photoId: string | number,
): Promise<SupportingIds> {
  const testimonialIds = await seedTestimonials(payload, photoId)
  const categoryIds = await seedCategories(payload)
  const servicePillarIds = await seedServicePillars(payload)
  const industryIds = await seedIndustries(payload)
  const locationIds = await seedLocations(payload)
  const teamMemberIds = await seedTeamMembers(payload, photoId)
  const serviceIds = await seedServices(payload, servicePillarIds)
  const caseStudyIds = await seedCaseStudies(payload, industryIds, photoId)
  const postIds = await seedPosts(payload, teamMemberIds[0]!, photoId)
  const workshopIds = await seedWorkshops(payload)

  return {
    testimonialIds,
    caseStudyIds,
    serviceIds,
    postIds,
    industryIds,
    locationIds,
    workshopIds,
    servicePillarIds,
    categoryIds,
    teamMemberIds,
  }
}
