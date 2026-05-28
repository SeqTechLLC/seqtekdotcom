import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

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
  collections: [Users, Media, Pages],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // TEMPORARY: hardcoded true to bootstrap the fresh staging DB.
    // Once initial schema is in place + Phase 5.5 introduces real
    // migrations via `payload migrate:create`, switch back to env-gated.
    push: true,
  }),
  sharp,
  plugins: [],
})
