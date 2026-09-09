/**
 * Shared by `noPlaceholderCopy.int.spec.ts` and
 * `skeletonDefaultValue.int.spec.ts`. Lives here rather than being imported
 * from one spec by the other: importing a spec re-runs it, which had the second
 * file silently re-collecting all seven of the first's tests (18 reported where
 * 11 exist) and dragging a `@vitest-environment node` file into a jsdom one.
 *
 * The list itself moved to `src/payload/seed/skeletons/placeholderCopy.ts` when
 * `tools/link-sweep` became its second consumer — a tool must not import from
 * `tests/`. Re-exported here so both specs keep their existing import path.
 */
export { SKELETON_PLACEHOLDER_COPY } from '../../../src/payload/seed/skeletons/placeholderCopy'
