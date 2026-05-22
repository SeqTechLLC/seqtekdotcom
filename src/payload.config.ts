import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { authPlugin } from 'payload-auth-plugin'
import { GoogleAuthProvider } from 'payload-auth-plugin/providers'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Accounts } from './collections/Accounts'
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
      // The default Payload LoginView auto-hides the email/password form when
      // `auth.disableLocalStrategy: true` is set on the users collection
      // (which we do — see Users.ts). All we need is the SSO CTA + an error
      // display injected above the (now empty) form area.
      beforeLogin: [
        '/components/admin/LoginError#default',
        '/components/admin/BeforeLoginGoogle#default',
      ],
    },
  },
  collections: [Users, Accounts, Media, Pages],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [
    authPlugin({
      name: 'auth',
      usersCollectionSlug: 'users',
      accountsCollectionSlug: 'accounts',
      allowOAuthAutoSignUp: true,
      successRedirectPath: '/admin',
      errorRedirectPath: '/admin/login',
      providers: [
        GoogleAuthProvider({
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          params: {
            hd: 'seqtechllc.com',
            prompt: 'select_account',
          },
        }),
      ],
    }),
  ],
})
