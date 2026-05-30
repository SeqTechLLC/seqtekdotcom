import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Forces `_status: 'draft'` whenever `publishedAt` is in the future.
 * Phase 2 doesn't ship the cron flip — this hook is the invariant
 * (FR-028, R-11) that keeps an editor from accidentally publishing
 * a scheduled draft.
 */
export const enforceDraftWhenScheduled: CollectionBeforeChangeHook = ({ data }) => {
  const publishedAt = data?.publishedAt
  if (!publishedAt) return data
  const cutover = new Date(publishedAt)
  if (Number.isNaN(cutover.getTime())) return data
  if (cutover.getTime() <= Date.now()) return data
  return { ...data, _status: 'draft' }
}
