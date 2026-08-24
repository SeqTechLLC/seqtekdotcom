// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'

import payloadConfig from '../../src/payload.config'
import { registry } from '../../src/components/sections/registry'
import { flattenConfig, type FlatField } from './helpers/flattenFields'
import { CONSUMED_FIELDS, EXEMPT_PREFIXES } from '../../src/payload/admin/consumedFields'

/**
 * Spec 011 T008 (FR-008, contract C5) — nothing editable may be inert.
 *
 * Four specs added fields; none removed them when their consumers went away.
 * The result was a `Pages.hero` group, two globals and a Services body that an
 * editor could fill in and publish with no effect on any rendered page. This
 * test makes that failure mode loud: every leaf field in the Payload config
 * must be claimed, in writing, by `CONSUMED_FIELDS`.
 *
 * Two tiers, because two different things are true:
 *
 *   - **Block fields** are consumed structurally. A layout block's fields are
 *     passed wholesale to the React component `registry` maps its slug to, and
 *     `registryCoverage.int.spec.ts` already proves every block has one. So the
 *     claim "this field reaches the site" is mechanically verifiable, and this
 *     test verifies it rather than asking a human to retype it 299 times.
 *   - **Entity-own fields** — a collection's or global's own columns — are
 *     where the rot happened, and their consumers are reached through
 *     application code a static pass cannot follow. Those need an explicit,
 *     human-written claim naming where the value surfaces.
 *
 * Adding a field without registering it fails here. Registering it is a
 * one-line assertion someone signed their name to in review.
 */

/**
 * Block fields are identical wherever a block is mounted, so `pages.layout.hero.headline`
 * and `caseStudies.layout.hero.headline` collapse to one key.
 */
const dedupeKey = (path: string): string => {
  const match = path.match(/\.layout\.(.+)$/)
  return match ? `block:${match[1]}` : path
}

const isExempt = (path: string): boolean =>
  EXEMPT_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}.`))

describe('field-consumer registry (FR-008)', () => {
  let flat: FlatField[]
  let keys: string[]

  beforeAll(async () => {
    const resolved = await payloadConfig
    flat = flattenConfig(resolved as never)
    keys = [...new Set(flat.map((f) => dedupeKey(f.path)))].filter((k) => !isExempt(k)).sort()
  })

  it('every block field belongs to a block with a registered renderer', () => {
    const blockKeys = keys.filter((k) => k.startsWith('block:'))
    expect(blockKeys.length).toBeGreaterThan(0)

    const unrendered = [
      ...new Set(
        blockKeys
          .map((k) => k.slice('block:'.length).split('.')[0])
          .filter((slug) => !registry[slug]),
      ),
    ]

    expect(
      unrendered,
      `these blocks have editable fields but no renderer in src/components/sections/registry.ts:\n` +
        unrendered.map((s) => `  - ${s}`).join('\n'),
    ).toEqual([])
  })

  it('every entity-own field carries a written consumer claim', () => {
    const ownKeys = keys.filter((k) => !k.startsWith('block:'))
    const unregistered = ownKeys.filter((k) => !(k in CONSUMED_FIELDS))

    expect(
      unregistered,
      `${unregistered.length} field(s) have no entry in src/payload/admin/consumedFields.ts.\n` +
        `Either add a one-line claim naming where the value surfaces, or delete the field.\n\n` +
        unregistered.map((k) => `  '${k}': '',`).join('\n'),
    ).toEqual([])
  })

  it('no registry entry names a field that no longer exists', () => {
    const live = new Set(keys)
    const orphans = Object.keys(CONSUMED_FIELDS).filter((k) => !live.has(k))

    expect(
      orphans,
      `these registry entries name fields that are no longer in the config — delete them:\n` +
        orphans.map((k) => `  - ${k}`).join('\n'),
    ).toEqual([])
  })

  it('no claim is left blank', () => {
    const blank = Object.entries(CONSUMED_FIELDS)
      .filter(([, claim]) => !claim.trim())
      .map(([path]) => path)

    expect(
      blank,
      `a blank claim is not a claim. Say where the value surfaces, or delete the field:\n` +
        blank.map((k) => `  - ${k}`).join('\n'),
    ).toEqual([])
  })
})
