import type { CollectionConfig } from 'payload'

import { CaseStudies } from './CaseStudies'
import { Categories } from './Categories'
import { Industries } from './Industries'
import { Locations } from './Locations'
import { Media } from './Media'
import { Pages } from './Pages'
import { Partners } from './Partners'
import { Posts } from './Posts'
import { Services } from './Services'
import { TeamMembers } from './TeamMembers'
import { Testimonials } from './Testimonials'
import { Users } from './Users'
import { Workshops } from './Workshops'

/**
 * Every collection, in the order Payload draws them in the admin sidebar.
 *
 * This is the config's `collections` array, lifted out so the admin-metadata
 * contract tests (contracts/admin-metadata.md C3) can assert over the whole
 * set rather than a hand-maintained list — a collection added later is
 * covered the moment it is registered, which is the point of a contract test.
 * Importing `payload.config.ts` instead would drag the Postgres adapter, the
 * S3 plugin and sharp into a pure config assertion.
 *
 * Spec 011 US6: the ORDER here now decides the order of the sidebar HEADINGS
 * too, not just the entries. `groupNavItems` emits each `admin.group` at the
 * position it is first seen, so leading with `Users` put **Admin** above
 * everything an editor opens. Content first, then the things that feed it,
 * then the panel's own plumbing.
 */
export const collections: CollectionConfig[] = [
  // Content
  Pages,
  Posts,
  CaseStudies,
  Services,
  Industries,
  Workshops,
  TeamMembers,
  Partners,
  Media,
  // Reference data
  Testimonials,
  Categories,
  Locations,
  // Admin
  Users,
]
