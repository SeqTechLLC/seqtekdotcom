/**
 * Seed the pages Lighthouse CI visits (npm `lhci:seed`, run by CI before `test:lhci`).
 *
 * The listing and legal routes are `pages` docs, so they 404 against the empty
 * database Lighthouse otherwise runs on. This creates the listing and legal `pages`
 * docs the e2e suite uses, replacing any pages that already have those slugs.
 */
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })

async function main(): Promise<void> {
  const { getPayloadClient, seedListingPages } =
    await import('../../tests/e2e/helpers/seedInScopeRoutes')
  await seedListingPages(await getPayloadClient())
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err)
    process.exit(1)
  },
)
