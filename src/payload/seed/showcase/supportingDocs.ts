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
  serviceGroupIds: Array<string | number>
  serviceIds: Array<string | number>
  postIds: Array<string | number>
  industryIds: Array<string | number>
  locationIds: Array<string | number>
  workshopIds: Array<string | number>
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

// SVC-2: a group is a `services` row with `tier: 'group'`, not its own
// collection. Seeded before the leaves so the leaves exist to be listed — the
// ordered `items` list is written back after, since the relation lives on the
// group.
async function seedServiceGroups(payload: Payload) {
  return createBatch(payload, 'services', [
    { title: `${SHOWCASE_TAG}Organizational Strategy`, tier: 'group', _status: 'published' },
    { title: `${SHOWCASE_TAG}Technology & Data`, tier: 'group', _status: 'published' },
    { title: `${SHOWCASE_TAG}AI & Automation`, tier: 'group', _status: 'published' },
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
  // ROADMAP INERT-2: `locations-list` renders a second line from the state,
  // which lives at `address.state` — the renderer used to read a top-level
  // `state` the collection does not have. These fixtures carried no address at
  // all, so the showcase looked identical either way and the dead branch had
  // nowhere to show up.
  return createBatch(payload, 'locations', [
    { city: `${SHOWCASE_TAG}Tulsa`, address: { state: 'OK' }, _status: 'published' },
    { city: `${SHOWCASE_TAG}Oklahoma City`, address: { state: 'OK' }, _status: 'published' },
    { city: `${SHOWCASE_TAG}Northwest Arkansas`, address: { state: 'AR' }, _status: 'published' },
    { city: `${SHOWCASE_TAG}Kansas City`, address: { state: 'MO' }, _status: 'published' },
  ])
}

async function seedTeamMembers(payload: Payload, photoId: string | number) {
  await clearTagged(payload, 'teamMembers', 'name')
  // ROADMAP UI-1: `title` is the job title the cards render; `role` is the
  // one-sentence description the /team/[slug] header renders under it. These
  // fixtures used to put the job title in `role`, which is the same confusion
  // that had the grid rendering the wrong field. One member carries both so the
  // showcase exercises each, one carries the title alone.
  return createBatch(payload, 'teamMembers', [
    // `_status: 'published'` matters: the `team-grid` manual variant points at
    // these two, and an anon read drops unpublished relations — so without it
    // the showcase's manual card grid captured as an empty section.
    {
      name: `${SHOWCASE_TAG}Alex Kim`,
      title: 'Pillar Lead',
      role: 'Leads the platform pillar and owns how the delivery teams are staffed.',
      photo: photoId,
      _status: 'published',
    },
    {
      name: `${SHOWCASE_TAG}Sam Chen`,
      title: 'Principal Engineer',
      photo: photoId,
      _status: 'published',
    },
  ])
}

async function seedServices(payload: Payload) {
  return createBatch(payload, 'services', [
    { title: `${SHOWCASE_TAG}Org Maturity Assessment`, tier: 'leaf', _status: 'published' },
    {
      title: `${SHOWCASE_TAG}Platform Engineering`,
      tier: 'leaf',
      _status: 'published',
    },
    {
      title: `${SHOWCASE_TAG}LLM Workflow Integration`,
      tier: 'leaf',
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
  // One `clearTagged` for the whole collection: groups and leaves share it now.
  await clearTagged(payload, 'services', 'title')
  const servicePillarIds = await seedServiceGroups(payload)
  const industryIds = await seedIndustries(payload)
  const locationIds = await seedLocations(payload)
  const teamMemberIds = await seedTeamMembers(payload, photoId)
  const serviceIds = await seedServices(payload)
  // The relation lives on the GROUP. Give each group one leaf so the
  // `service-cards` `by-pillar` source has something to resolve.
  await Promise.all(
    servicePillarIds.map((id, i) =>
      serviceIds[i] === undefined
        ? Promise.resolve(null)
        : payload.update({
            collection: 'services',
            id,
            data: { items: [serviceIds[i]!] } as never,
            overrideAccess: true,
          }),
    ),
  )
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
    serviceGroupIds: servicePillarIds,
    categoryIds,
    teamMemberIds,
  }
}
