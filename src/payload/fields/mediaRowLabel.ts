import type { ArrayField } from 'payload'

import type { MediaRowLabelProps } from '../../components/admin/MediaRowLabel'

/**
 * Spec 011 US3 / FR-017 — declare a media array's row label in one line.
 *
 * Mirrors `blockAdmin()` (US2): the component path and export name are stated
 * once here rather than at six call sites, so a rename is one edit and
 * `generate:importmap` has a single entry to resolve.
 *
 * Every array in `src/` whose rows carry an `upload` field should use this —
 * `tests/int/adminMetadata.int.spec.ts` fails the build if one does not.
 */
export const mediaRowLabel = (
  props: MediaRowLabelProps,
): NonNullable<NonNullable<ArrayField['admin']>['components']>['RowLabel'] => ({
  clientProps: props,
  exportName: 'MediaRowLabel',
  path: '/components/admin/MediaRowLabel',
})
