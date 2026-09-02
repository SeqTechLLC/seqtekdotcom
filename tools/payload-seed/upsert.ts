/**
 * Write engine: upsert a single resolved spec over the Payload REST API.
 *
 * Collection specs are idempotent by `data[identity]` (find → update | create),
 * mirroring the flow proven by the case-study importer (retired in spec 011). Globals are
 * a straight `updateGlobal`. Data is assumed already directive-resolved.
 */

import type { PayloadRestClient } from '../payload-rest/client'

import { isGlobalSpec, type SeedSpec, type SeedStatus } from './spec'

type DocId = string | number

export interface UpsertOptions {
  /** Resolved publish state for this spec. */
  status: SeedStatus
  /** Report intended op without any write. */
  dryRun: boolean
}

export interface UpsertResult {
  target: string
  operation: 'create' | 'update' | 'global' | 'dry-run'
  id?: DocId
  /** Dry-run only: what the real run would do. `unknown` without a token. */
  wouldBe?: 'create' | 'update' | 'unknown'
}

export async function upsertSpec(
  client: PayloadRestClient,
  spec: SeedSpec,
  data: Record<string, unknown>,
  opts: UpsertOptions,
): Promise<UpsertResult> {
  // Two independent knobs, and conflating them into one boolean is what made
  // the seeder unable to UNPUBLISH (P5-29):
  //
  //   status        ?draft=true   _status written   effect
  //   published     no            'published'       publish
  //   draft         YES           (untouched)       stage a draft version; a
  //                                                 live document stays live
  //   unpublished   no            'draft'           take a live document down
  //
  // `draft` writes through Payload's draft system, which by design does not
  // disturb the published version — so it can stage an edit but can never
  // retire a document. `unpublished` writes `_status` on the document itself,
  // which is what actually flips it out of the published read.
  //
  // This MUST be computed before the global branch below. It used to live after
  // it, so a drafts-enabled GLOBAL (homepage, siteSettings, navigation — all
  // `versions: { drafts: true }`) was written with no `_status` and Payload
  // defaulted it to draft, while the log still printed `[published]` (that
  // label reads `opts.draft`, not what was written). On a fresh-environment
  // rebuild the homepage therefore seeded unpublished and rendered as an empty
  // body, with the seeder reporting success — caught by runbook §2.3 on the
  // preview.seqtek.com rebuild, 2026-08-11.
  const writeData: Record<string, unknown> = { ...data }
  if (opts.status === 'published') writeData._status = 'published'
  else if (opts.status === 'unpublished') writeData._status = 'draft'
  const asDraft = opts.status === 'draft'

  if (isGlobalSpec(spec)) {
    const target = `global:${spec.global}`
    if (opts.dryRun) return { target, operation: 'dry-run' }
    await client.updateGlobal(spec.global, writeData, { draft: asDraft })
    return { target, operation: 'global' }
  }

  const identityValue = String(data[spec.identity])
  const target = `${spec.collection}:${identityValue}`

  // The find runs in dry-run too, when there is a token to run it with. It is
  // a read, it changes nothing, and without it a dry-run could not say whether
  // a spec would CREATE or UPDATE — which is most of what a rehearsal is for.
  const existingId =
    opts.dryRun && !client.hasToken
      ? null
      : await client.findIdByField(spec.collection, spec.identity, identityValue, { draft: true })

  if (opts.dryRun) {
    return {
      target,
      operation: 'dry-run',
      wouldBe: client.hasToken ? (existingId !== null ? 'update' : 'create') : 'unknown',
    }
  }
  if (existingId !== null) {
    const id = await client.updateDoc(spec.collection, existingId, writeData, { draft: asDraft })
    return { target, operation: 'update', id }
  }
  const id = await client.createDoc(spec.collection, writeData, { draft: asDraft })
  return { target, operation: 'create', id }
}
