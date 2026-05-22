import type { CollectionBeforeChangeHook } from 'payload'

export const applyAutoProvisionRole: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (operation !== 'create') return data
  return data
}
