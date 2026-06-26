/**
 * Write engine: upsert a single resolved spec over the Payload REST API.
 *
 * Collection specs are idempotent by `data[identity]` (find → update | create),
 * mirroring the proven flow in tools/import-case-study/importer.ts. Globals are
 * a straight `updateGlobal`. Data is assumed already directive-resolved.
 */

import type { PayloadRestClient } from '../payload-rest/client'

import { isGlobalSpec, type SeedSpec } from './spec'

type DocId = string | number

export interface UpsertOptions {
  /** Write as a draft (`?draft=true`). When false, publish. */
  draft: boolean
  /** Report intended op without any write. */
  dryRun: boolean
}

export interface UpsertResult {
  target: string
  operation: 'create' | 'update' | 'global' | 'dry-run'
  id?: DocId
}

export async function upsertSpec(
  client: PayloadRestClient,
  spec: SeedSpec,
  data: Record<string, unknown>,
  opts: UpsertOptions,
): Promise<UpsertResult> {
  if (isGlobalSpec(spec)) {
    const target = `global:${spec.global}`
    if (opts.dryRun) return { target, operation: 'dry-run' }
    await client.updateGlobal(spec.global, data, { draft: opts.draft })
    return { target, operation: 'global' }
  }

  const identityValue = String(data[spec.identity])
  const target = `${spec.collection}:${identityValue}`
  if (opts.dryRun) return { target, operation: 'dry-run' }

  // When publishing, flip `_status` and write without `?draft=true`; a draft
  // run keeps the record unpublished and leaves `_status` to Payload.
  const writeData: Record<string, unknown> = { ...data }
  if (!opts.draft) writeData._status = 'published'

  const existingId = await client.findIdByField(spec.collection, spec.identity, identityValue, {
    draft: true,
  })
  if (existingId !== null) {
    const id = await client.updateDoc(spec.collection, existingId, writeData, { draft: opts.draft })
    return { target, operation: 'update', id }
  }
  const id = await client.createDoc(spec.collection, writeData, { draft: opts.draft })
  return { target, operation: 'create', id }
}
