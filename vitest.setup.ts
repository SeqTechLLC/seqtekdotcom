// Load env vars in Next.js convention: .env.local takes precedence over .env.
// dotenv-style {override:false} on the second pass means values already loaded
// from .env.local are not clobbered by .env defaults.
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })
