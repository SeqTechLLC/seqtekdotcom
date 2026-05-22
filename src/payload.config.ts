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
      views: {
        login: {
          Component: '/components/admin/AdminLogin#default',
          path: '/login',
        },
      },
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
      name: 'seqtek',
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
