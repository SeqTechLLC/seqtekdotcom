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
  /** Write even when the document changed after the spec's `basedOn`. */
  force?: boolean
}

export interface UpsertResult {
  target: string
  operation: 'create' | 'update' | 'global' | 'dry-run'
  id?: DocId
  /** Dry-run only: what the real run would do. `unknown` without a token. */
  wouldBe?: 'create' | 'update' | 'unknown'
  /** The written document's new `updatedAt`, the next `basedOn`. */
  updatedAt?: string | null
}

/** The document changed after the spec was exported (ADR 0014). */
export class StaleSpecError extends Error {
  constructor(target: string, basedOn: string, current: string | null) {
    super(
      `${target} changed after this file was exported (based on ${basedOn}, now ${current ?? 'unknown'}; ` +
        `a pending draft counts). Export it again, or pass --force to overwrite.`,
    )
    this.name = 'StaleSpecError'
  }
}

/**
 * Throws when the live document moved on from `basedOn`. The read uses
 * `draft: true`, whose `updatedAt` is the latest version's, so an unpublished
 * draft saved since the export is caught too.
 */
function assertNotStale(
  target: string,
  basedOn: string | undefined,
  current: string | null,
  force: boolean | undefined,
): void {
  if (basedOn === undefined || force) return
  if (current !== null && Date.parse(current) === Date.parse(basedOn)) return
  throw new StaleSpecError(target, basedOn, current)
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
    if (spec.basedOn !== undefined && !opts.force && client.hasToken) {
      const live = await client.getGlobal(spec.global, { draft: true })
      assertNotStale(
        target,
        spec.basedOn,
        typeof live.updatedAt === 'string' ? live.updatedAt : null,
        opts.force,
      )
    }
    if (opts.dryRun) return { target, operation: 'dry-run' }
    const { updatedAt } = await client.updateGlobal(spec.global, writeData, { draft: asDraft })
    return { target, operation: 'global', updatedAt }
  }

  const identityValue = String(data[spec.identity])
  const target = `${spec.collection}:${identityValue}`

  // The find runs in dry-run too, when there is a token to run it with. It is
  // a read, it changes nothing, and without it a dry-run could not say whether
  // a spec would CREATE or UPDATE — which is most of what a rehearsal is for.
  const existing =
    opts.dryRun && !client.hasToken
      ? null
      : await client.findDocByField(spec.collection, spec.identity, identityValue, { draft: true })
  // A document that does not exist yet is a create, whatever the file was based on.
  if (existing !== null) assertNotStale(target, spec.basedOn, existing.updatedAt, opts.force)

  if (opts.dryRun) {
    return {
      target,
      operation: 'dry-run',
      wouldBe: client.hasToken ? (existing !== null ? 'update' : 'create') : 'unknown',
    }
  }
  if (existing !== null) {
    const { id, updatedAt } = await client.updateDoc(spec.collection, existing.id, writeData, {
      draft: asDraft,
    })
    return { target, operation: 'update', id, updatedAt }
  }
  // A new document that is not going live is created as a draft, so it skips
  // the validation a publish runs. That lets a restore's first pass create every
  // document while the references a later pass fills in are still missing.
  const { id, updatedAt } = await client.createDoc(spec.collection, writeData, {
    draft: asDraft || opts.status === 'unpublished',
  })
  return { target, operation: 'create', id, updatedAt }
}
