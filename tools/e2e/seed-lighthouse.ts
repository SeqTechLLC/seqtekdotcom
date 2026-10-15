/**
 * Seed the pages Lighthouse CI visits (npm `lhci:seed`, run by CI before `test:lhci`).
 *
 * The listing and legal routes are `pages` docs, so they 404 against the empty
 * database Lighthouse otherwise runs on. This creates the same seven docs the e2e
 * suite uses; the listings stay empty grids, as they were when they were route files.
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
