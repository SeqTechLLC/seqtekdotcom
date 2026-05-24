import { writeFileSync, mkdirSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'

const TEST_ENV_FILE = resolve(tmpdir(), 'seqtek-vitest-env.json')

let container: StartedPostgreSqlContainer | undefined

export async function setup(): Promise<void> {
  container = await new PostgreSqlContainer('postgres:16')
    .withDatabase('seqtek_test')
    .withUsername('seqtek')
    .withPassword('seqtek')
    .start()

  mkdirSync(resolve(TEST_ENV_FILE, '..'), { recursive: true })
  writeFileSync(
    TEST_ENV_FILE,
    JSON.stringify({
      DATABASE_URL: container.getConnectionUri(),
    }),
  )
}

export async function teardown(): Promise<void> {
  try {
    unlinkSync(TEST_ENV_FILE)
  } catch {
    // ignore — already gone is fine
  }
  if (container) {
    await container.stop()
  }
}
