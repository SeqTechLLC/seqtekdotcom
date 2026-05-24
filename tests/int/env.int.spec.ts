import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ENV_EXAMPLE_PATH = resolve(import.meta.dirname, '..', '..', '.env.example')

function readEnvExample(): string {
  return readFileSync(ENV_EXAMPLE_PATH, 'utf8')
}

describe('.env.example contract (spec 001)', () => {
  it('lists GOOGLE_CLIENT_ID as a key', () => {
    expect(readEnvExample()).toMatch(/^GOOGLE_CLIENT_ID=/m)
  })

  it('lists GOOGLE_CLIENT_SECRET as a key', () => {
    expect(readEnvExample()).toMatch(/^GOOGLE_CLIENT_SECRET=/m)
  })

  it('does not commit non-empty values for GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET', () => {
    const body = readEnvExample()
    expect(body).toMatch(/^GOOGLE_CLIENT_ID=\s*$/m)
    expect(body).toMatch(/^GOOGLE_CLIENT_SECRET=\s*$/m)
  })

  it('does not declare OAUTH_STUB_ENABLED (deferred per FR-012 note in tasks.md)', () => {
    expect(readEnvExample()).not.toMatch(/^OAUTH_STUB_ENABLED=/m)
  })
})
