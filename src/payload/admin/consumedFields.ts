/**
 * Spec 011 (FR-008) — the field-consumer registry.
 *
 * Every entity-own leaf field in the Payload config must appear here with a
 * one-line claim of where its value surfaces on the rendered site, in page
 * metadata, or in an editorial workflow. A field with no honest answer gets
 * deleted, not an entry.
 *
 * Enforced by `tests/int/fieldConsumerRegistry.int.spec.ts`. Block fields are
 * not listed: they are consumed structurally through `RenderBlocks` and the
 * section registry, which that test verifies mechanically.
 */

/**
 * Payload-managed field trees no author declares and no reviewer should have to
 * claim. These are entire internal collections.
 */
export const EXEMPT_PREFIXES: string[] = [
  'payload-locked-documents',
  'payload-preferences',
  'payload-migrations',
  'payload-kv',
]

/**
 * Field names Payload *injects* rather than an author declaring them.
 *
 * The registry's question is "can an editor type into this and have it do
 * nothing?" Generated upload metadata and auth machinery are not editable
 * controls — an editor never sets `filesize` or `salt` — so demanding a
 * written consumer claim for each would be 100+ entries of ceremony that
 * teaches a reviewer to skim. Exempting them keeps every remaining entry a
 * real assertion someone had to think about.
 *
 * Scoped deliberately: these apply only inside an upload-enabled or
 * auth-enabled collection, so a hand-declared `width` on a normal collection
 * still needs its claim.
 */
const UPLOAD_GENERATED = new Set([
  'filename',
  'filesize',
  'mimeType',
  'width',
  'height',
  'focalX',
  'focalY',
  'url',
  'thumbnailURL',
  'prefix',
])

const AUTH_GENERATED = new Set([
  'salt',
  'hash',
  'resetPasswordToken',
  'resetPasswordExpiration',
  'loginAttempts',
  'lockUntil',
  'sessions',
  'password',
  'confirmPassword',
])

/** Payload stamps these on every collection and global. */
const TIMESTAMPS = new Set(['createdAt', 'updatedAt', 'deletedAt'])

/**
 * True when `path` names a field Payload generated rather than one an author
 * wrote in a collection config.
 *
 * @param uploadEntities slugs of collections with `upload` enabled
 * @param authEntities   slugs of collections with `auth` enabled
 */
export function isGeneratedField(
  path: string,
  uploadEntities: ReadonlySet<string>,
  authEntities: ReadonlySet<string>,
): boolean {
  const [entity, ...rest] = path.split('.')
  if (rest.length === 0) return false
  const leaf = rest[rest.length - 1]

  if (TIMESTAMPS.has(leaf)) return true

  if (uploadEntities.has(entity)) {
    // Every derivative under `sizes` is generated at upload time.
    if (rest[0] === 'sizes') return true
    if (rest.length === 1 && UPLOAD_GENERATED.has(leaf)) return true
  }

  if (authEntities.has(entity)) {
    if (rest[0] === 'sessions') return true
    if (rest.length === 1 && AUTH_GENERATED.has(leaf)) return true
  }

  return false
}

/**
 * Every entity-own leaf field, with a written claim of where its value
 * surfaces. Enforced by `tests/int/fieldConsumerRegistry.int.spec.ts`.
 *
 * Conventions used in the claims:
 *   - "detail route" means the collection's own `/x/[slug]` page.
 *   - "listing block" means a layout block that takes a relationship to this
 *     collection and renders the named field.
 *   - `_status` is Payload's draft/publish flag: it decides whether a document
 *     is visible to the public reader at all, which is an editorial-workflow
 *     effect and therefore a real consumer.
 */
export const CONSUMED_FIELDS: Record<string, string> = {
  // ---- Pages: the generic block-composed primitive, routed at /[slug] ----
  'pages._status': 'Draft/publish gate — cached readers query published only.',
  'pages.title': 'Rendered heading and the metadata title fallback on /[slug].',
  'pages.slug': 'URL segment for /[slug]; also the seeder identity key.',
  'pages.publishedAt': 'Publish scheduling and listing sort order.',
  'pages.seo.metaTitle': 'buildMetadata on /[slug] → <title>.',
  'pages.seo.metaDescription': 'buildMetadata on /[slug] → meta description.',
  'pages.seo.ogImage': 'buildMetadata on /[slug] → og:image.',

  // ---- Posts: the rich-text article primitive, routed at /insights/[slug] ----
  'posts._status': 'Draft/publish gate — cached readers query published only.',
  'posts.title': 'Rendered heading, listing card title, metadata title fallback.',
  'posts.slug': 'URL segment for /insights/[slug].',
  'posts.content': 'The article body, rendered by RichText on the detail route.',
  'posts.excerpt': 'Listing card summary in PostList and RelatedPosts.',
  'posts.author': 'Byline on the detail route and Person in the Article JSON-LD.',
  'posts.categories': 'Category labels on the listing and detail routes.',
  'posts.featuredImage': 'Listing card image and the detail-route hero.',
  'posts.publishedAt': 'Displayed date, listing sort order, Article JSON-LD.',
  'posts.relatedPosts': 'Feeds the related-posts block at the foot of the article.',
  'posts.relatedServices': 'Feeds service cross-links rendered under the article.',
  'posts.seo.metaTitle': 'buildMetadata on /insights/[slug] → <title>.',
  'posts.seo.metaDescription': 'buildMetadata on /insights/[slug] → meta description.',
  'posts.seo.ogImage': 'buildMetadata on /insights/[slug] → og:image.',

  // ---- Case studies: routed at /case-studies/[slug] ----
  'caseStudies._status': 'Draft/publish gate — cached readers query published only.',
  'caseStudies.title': 'Rendered heading, listing card title, metadata title fallback.',
  'caseStudies.slug': 'URL segment for /case-studies/[slug].',
  'caseStudies.subtitle': 'Sub-heading under the hero and on the listing card.',
  'caseStudies.heroImage': 'Detail-route hero image and listing card image.',
  'caseStudies.industry': 'Industry label on the card and the detail header.',
  'caseStudies.services': 'Resolves which services a study is filed under.',
  'caseStudies.testimonial': 'Renders the quote attached to this study.',
  'caseStudies.relatedCaseStudies': 'Feeds the related-studies section on the detail route.',
  'caseStudies.publishedAt': 'Displayed date and listing sort order.',
  'caseStudies.client.name': 'Named client attribution in the detail header.',
  'caseStudies.client.logo': 'Client logo beside the attribution.',
  'caseStudies.client.isAnonymized':
    'Suppresses client name and logo when the client has not cleared naming.',
  'caseStudies.seo.metaTitle': 'buildMetadata on /case-studies/[slug] → <title>.',
  'caseStudies.seo.metaDescription': 'buildMetadata on /case-studies/[slug] → meta description.',
  'caseStudies.seo.ogImage': 'buildMetadata on /case-studies/[slug] → og:image.',

  // ---- Workshops: routed at /workshops/[slug] ----
  'workshops._status': 'Draft/publish gate — cached readers query published only.',
  'workshops.title': 'Rendered heading, listing card title, metadata title fallback.',
  'workshops.slug': 'URL segment for /workshops/[slug].',
  'workshops.facilitator': 'Facilitator credit rendered on the workshop page.',
  'workshops.testimonial': 'Renders the quote attached to this workshop.',
  'workshops.order': 'Sort order in the /workshops listing.',
  'workshops.publishedAt': 'Publish scheduling and listing sort order.',
  'workshops.seo.metaTitle': 'buildMetadata on /workshops/[slug] → <title>.',
  'workshops.seo.metaDescription': 'buildMetadata on /workshops/[slug] → meta description.',
  'workshops.seo.ogImage': 'buildMetadata on /workshops/[slug] → og:image.',

  // ---- Team members: routed at /team/[slug] ----
  'teamMembers._status': 'Draft/publish gate — cached readers query published only.',
  'teamMembers.name': 'Card and detail heading; Person JSON-LD name.',
  'teamMembers.slug': 'URL segment for /team/[slug].',
  'teamMembers.title':
    'Job title under the name on the detail route and in the metadata title. NOTE: TeamGrid renders `role` here instead — tracked as ROADMAP UI-1.',
  'teamMembers.role': 'Descriptive sentence under the name on the detail route and in TeamGrid.',
  'teamMembers.photo': 'Card and detail-route portrait.',
  'teamMembers.email': 'Contact link on the detail route.',
  'teamMembers.linkedinUrl': 'Profile link on the detail route; sameAs in Person JSON-LD.',
  'teamMembers.isLeadership': 'Splits the leadership grid from the wider team grid.',
  'teamMembers.order': 'Sort order within the team grids.',
  'teamMembers.expertise.label': 'knowsAbout in the Person JSON-LD (structured-data.ts).',
  'teamMembers.expertise.id': 'Array row key for the expertise list.',
  'teamMembers.seo.metaTitle': 'buildMetadata on /team/[slug] → <title>.',
  'teamMembers.seo.metaDescription': 'buildMetadata on /team/[slug] → meta description.',
  'teamMembers.seo.ogImage': 'buildMetadata on /team/[slug] → og:image.',

  // ---- Partners: routed at /partners and /partners/[slug] (ADR 0009 Option C) ----
  'partners._status': 'Draft/publish gate — cached readers query published only.',
  'partners.name': 'Card and detail heading; metadata title fallback.',
  'partners.slug': 'URL segment for /partners/[slug].',
  'partners.logo': 'Partner logo on the index grid and detail header.',
  'partners.summary': 'Card summary text in PartnerGrid.',
  'partners.url': 'Outbound partner link; emits cta_click through the shared emitter.',
  'partners.order': 'Sort order in the /partners index.',
  'partners.publishedAt': 'Publish scheduling and index sort order.',
  'partners.seo.metaTitle': 'buildMetadata on /partners/[slug] → <title>.',
  'partners.seo.metaDescription': 'buildMetadata on /partners/[slug] → meta description.',
  'partners.seo.ogImage': 'buildMetadata on /partners/[slug] → og:image.',

  // ---- Testimonials: reference data, surfaced through blocks ----
  'testimonials.quote': 'The quote text rendered by testimonial blocks.',
  'testimonials.personName': 'Attribution name under the quote.',
  'testimonials.personTitle': 'Attribution job title under the quote.',
  'testimonials.company': 'Attribution company under the quote.',
  'testimonials.photo': 'Portrait beside the quote where the block renders one.',
  'testimonials.caseStudy': 'Links a quote back to the study it came from.',
  'testimonials.isActive': 'Excludes a quote from selection without deleting it.',

  // ---- Categories: reference data for post filing ----
  'categories.title': 'Category label rendered on posts and the insights listing.',
  'categories.slug': 'Category key used for filing and filtering posts.',

  // ---- Media: the upload library ----
  'media.alt': 'Alt text on every rendered image (a11y gate).',
  'media.caption': 'Caption rendered by figure and gallery blocks.',

  // ---- Users: admin accounts, not public content ----
  'users.email': 'Sign-in identity and the Google Workspace domain check.',
  'users.name': 'Displayed author name and admin account label.',
  'users.roles': 'The access matrix — admin vs editor permissions.',
  'users.googleSub': 'Stable Google subject id linking an account to its SSO identity.',

  // ---- Homepage global ----
  'homepage._status': 'Draft/publish gate for the homepage global.',

  // ---- Services: no public route; surfaced through relationship blocks ----
  'services._status': 'Draft/publish gate — filters which services blocks may show.',
  'services.title': 'Card title in the service-cards block.',
  'services.slug': 'Card link target and the seeder identity key.',
  'services.icon': 'Card icon in the service-cards block.',
  'services.pillar': 'Groups services under a pillar for the pillar-cards block.',
  'services.order': 'Sort order within a pillar in the cards blocks.',
  'services.relatedCaseStudies': 'Resolves case studies filed under this service.',
  'services.publishedAt': 'Publish scheduling for the cards blocks.',

  // ---- Service pillars: no public route; surfaced through relationship blocks ----
  'servicePillars._status': 'Draft/publish gate — filters which pillar blocks may show.',
  'servicePillars.title': 'Card title in the service-pillar-cards block.',
  'servicePillars.slug': 'Card link target and the seeder identity key.',
  'servicePillars.order': 'Sort order in the service-pillar-cards block.',

  // ---- Industries: no public route; surfaced through relationship blocks ----
  'industries._status': 'Draft/publish gate — filters which industry blocks may show.',
  'industries.title': 'Card title in the industry-grid block; label on case-study cards.',
  'industries.slug': 'Card link target and the seeder identity key.',

  // ---- Locations: no public route; surfaced through relationship blocks ----
  'locations._status': 'Draft/publish gate — filters which location blocks may show.',
  'locations.city': 'Card heading in the locations-list block.',
  'locations.slug': 'Card link target and the seeder identity key.',
}

/**
 * Fields with **no consumer today**, declared rather than hidden.
 *
 * FR-001's rule is that nothing editable may be inert. The blunt application is
 * to delete these. That is wrong here: they are not rot left behind by a
 * retired consumer, they are metadata sitting *ahead of* a route the roadmap
 * intends to build. `industries.seo.*` deleted today is `industries.seo.*`
 * re-added by IND-1 next month.
 *
 * So they get the other honest treatment: an explicit entry naming what is
 * missing and which tracked item would resolve it. The registry test requires
 * every one to cite a tracker, so this list cannot become a dumping ground —
 * an entry with no tracker fails CI exactly like an unregistered field.
 *
 * Every collection below has **no detail route**, so nothing calls
 * `buildMetadata` with its `seo` group and nothing renders its longer prose.
 * Verified 2026-08-24 by enumerating all 16 `buildMetadata` call sites.
 *
 * **These fields should be hidden from the admin** (`admin.hidden`) until their
 * route exists, so an editor is never shown a control that does nothing. That
 * is a US4 form-legibility task, not a schema change — tracked below.
 */
export const KNOWN_INERT_FIELDS: Record<string, string> = {
  // Industries — no /industries route. ROADMAP IND-1 ("Industry pages, Energy
  // first") builds it; the Hinge research ranks industry expertise the #1
  // buyer evaluation criterion, so this is planned, not abandoned.
  'industries.description': 'No /industries/[slug] route renders it — ROADMAP IND-1.',
  'industries.relevantServices': 'No /industries/[slug] route renders it — ROADMAP IND-1.',
  'industries.clientLogos.logo': 'No /industries/[slug] route renders it — ROADMAP IND-1.',
  'industries.clientLogos.id': 'Array row key for an unrendered list — ROADMAP IND-1.',
  'industries.seo.metaTitle': 'No route calls buildMetadata for industries — ROADMAP IND-1.',
  'industries.seo.metaDescription': 'No route calls buildMetadata for industries — ROADMAP IND-1.',
  'industries.seo.ogImage': 'No route calls buildMetadata for industries — ROADMAP IND-1.',

  // Locations — no /locations route. The four per-market landing pages
  // (Tulsa, OKC, NW Arkansas, Kansas City) are tracked in CONTENT_NEEDS §9.
  'locations.description': 'No /locations/[slug] route renders it — CONTENT_NEEDS §9.',
  'locations.hasOffice': 'No /locations/[slug] route renders it — CONTENT_NEEDS §9.',
  'locations.address.street': 'No /locations/[slug] route renders it — CONTENT_NEEDS §9.',
  'locations.address.city': 'No /locations/[slug] route renders it — CONTENT_NEEDS §9.',
  'locations.address.state': 'No /locations/[slug] route renders it — CONTENT_NEEDS §9.',
  'locations.address.zip': 'No /locations/[slug] route renders it — CONTENT_NEEDS §9.',
  'locations.seo.metaTitle': 'No route calls buildMetadata for locations — CONTENT_NEEDS §9.',
  'locations.seo.metaDescription': 'No route calls buildMetadata for locations — CONTENT_NEEDS §9.',
  'locations.seo.ogImage': 'No route calls buildMetadata for locations — CONTENT_NEEDS §9.',

  // Service pillars — unrouted since PR #79 folded /services into four
  // block-composed offering Pages. ROADMAP SVC-2 decides their fate.
  'servicePillars.description': 'Pillar cards render title and slug only — ROADMAP SVC-2.',
  'servicePillars.heroImage': 'No pillar detail route to render a hero — ROADMAP SVC-2.',
  'servicePillars.seo.metaTitle': 'No route calls buildMetadata for pillars — ROADMAP SVC-2.',
  'servicePillars.seo.metaDescription': 'No route calls buildMetadata for pillars — ROADMAP SVC-2.',
  'servicePillars.seo.ogImage': 'No route calls buildMetadata for pillars — ROADMAP SVC-2.',

  // Services — same restructure. SVC-2 would put services back on a metadata
  // collection with real routing, which is exactly what would consume these.
  'services.seo.metaTitle': 'No route calls buildMetadata for services — ROADMAP SVC-2.',
  'services.seo.metaDescription': 'No route calls buildMetadata for services — ROADMAP SVC-2.',
  'services.seo.ogImage': 'No route calls buildMetadata for services — ROADMAP SVC-2.',
}
