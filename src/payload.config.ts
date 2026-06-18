import { postgresAdapter } from '@payloadcms/db-postgres'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Categories } from './collections/Categories'
import { CaseStudies } from './collections/CaseStudies'
import { Industries } from './collections/Industries'
import { Locations } from './collections/Locations'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { ServicePillars } from './collections/ServicePillars'
import { Services } from './collections/Services'
import { TeamMembers } from './collections/TeamMembers'
import { Testimonials } from './collections/Testimonials'
import { Users } from './collections/Users'
import { Workshops } from './collections/Workshops'
import { Homepage } from './globals/Homepage'
import { Navigation } from './globals/Navigation'
import { SiteSettings } from './globals/SiteSettings'
import { editorConfig } from './payload/editor/editorConfig'
import { s3StoragePlugin } from './payload/storage/s3'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Always registered; activated by env inside the plugin. See storage/s3.ts.
const s3Plugin = s3StoragePlugin()

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100',
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      // Payload's default LoginView short-circuits <LoginForm /> when
      // auth.disableLocalStrategy === true on the users collection
      // (see @payloadcms/next/dist/views/Login/index.js). We only need
      // to inject the SSO CTA + error display ahead of the (now empty)
      // form body — no custom view component required.
      beforeLogin: [
        '/components/admin/LoginError#default',
        '/components/admin/BeforeLoginGoogle#default',
      ],
    },
  },
  collections: [
    Users,
    Media,
    Pages,
    Posts,
    CaseStudies,
    Services,
    ServicePillars,
    TeamMembers,
    Testimonials,
    Workshops,
    Industries,
    Locations,
    Categories,
  ],
  globals: [SiteSettings, Navigation, Homepage],
  editor: editorConfig,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // Drizzle push (auto-sync schema on init) only in development. In
    // production the `payload migrate` step in the container CMD is the
    // single source of schema truth — push must be off, otherwise schema
    // drift can sneak into a deployed image without a corresponding
    // migration file (this is exactly the failure mode that caused PR #17's
    // migration collapse). Local dev keeps push for fast iteration.
    //
    // E2E/CI also opts out via PAYLOAD_DISABLE_PUSH=true and provisions the
    // schema once with `payload migrate` (see pretest:e2e). Otherwise the dev
    // webServer AND every Playwright worker each push the (spec-010 enlarged)
    // schema concurrently on init, contending on Drizzle's introspection until
    // getPayload blows the 30s beforeAll budget — the failure that kept the
    // block-composition E2E suite red. Mirrors production: migrate, don't push.
    push: process.env.NODE_ENV !== 'production' && process.env.PAYLOAD_DISABLE_PUSH !== 'true',
  }),
  sharp,
  plugins: [s3Plugin],
})
